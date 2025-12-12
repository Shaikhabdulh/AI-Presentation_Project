const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, param, validationResult } = require("express-validator");
const mysql = require("mysql2/promise");
const winston = require("winston");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "inventory_user",
  password: process.env.DB_PASSWORD || "secure_password",
  database: process.env.DB_NAME || "inventory_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

app.use("/api/inventory", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "inventory-service",
  });
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Authentication middleware (simplified - in production, verify JWT)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // In production, verify JWT token here
    // For now, we'll extract user info from the token payload
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB"
    );
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Token verification failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Inventory validation
const inventoryValidation = [
  body("name")
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
  body("min_threshold")
    .isInt({ min: 0 })
    .withMessage("Minimum threshold must be a non-negative integer"),
  body("unit")
    .isLength({ min: 1, max: 20 })
    .withMessage("Unit must be between 1 and 20 characters"),
  body("category")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Category must not exceed 50 characters"),
];

// Routes

// Get all inventory items
app.get("/api/inventory", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT i.*, u.username as created_by_username 
       FROM inventory i 
       LEFT JOIN users u ON i.created_by = u.id 
       ORDER BY i.updated_at DESC`
    );
    res.json(rows);
  } catch (error) {
    logger.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get dashboard summary
app.get(
  "/api/inventory/dashboard-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const [summary] = await pool.execute("SELECT * FROM dashboard_summary");
      res.json(
        summary[0] || {
          total_items: 0,
          low_stock_items: 0,
          total_vendors: 0,
          unread_notifications: 0,
        }
      );
    } catch (error) {
      logger.error("Error fetching dashboard summary:", error);
      res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
  }
);

// Get low stock items
app.get("/api/inventory/low-stock", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM inventory WHERE quantity <= min_threshold ORDER BY quantity ASC"
    );
    res.json(rows);
  } catch (error) {
    logger.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// Get single inventory item
app.get("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT i.*, u.username as created_by_username 
       FROM inventory i 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
});

// Create inventory item
app.post(
  "/api/inventory",
  authenticateToken,
  inventoryValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, quantity, min_threshold, unit, category } =
        req.body;
      const createdBy = req.user.userId;

      const [result] = await pool.execute(
        "INSERT INTO inventory (name, description, quantity, min_threshold, unit, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, description, quantity, min_threshold, unit, category, createdBy]
      );

      const newItemId = result.insertId;

      // Check if quantity is below threshold and send notification
      if (quantity <= min_threshold) {
        try {
          await axios.post(
            `${
              process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003"
            }/api/notifications`,
            {
              type: "low_stock",
              message: `${name} is running low (${quantity} units remaining)`,
              user_id: createdBy,
              inventory_id: newItemId,
            }
          );
        } catch (error) {
          logger.error("Failed to send low stock notification:", error);
        }
      }

      // Fetch the created item with creator info
      const [newItem] = await pool.execute(
        `SELECT i.*, u.username as created_by_username 
       FROM inventory i 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.id = ?`,
        [newItemId]
      );

      logger.info(`Inventory item created: ${name} by user ${createdBy}`);

      res.status(201).json({
        message: "Inventory item created successfully",
        item: newItem[0],
      });
    } catch (error) {
      logger.error("Error creating inventory item:", error);
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  }
);

// Update inventory item
app.put(
  "/api/inventory/:id",
  authenticateToken,
  inventoryValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, quantity, min_threshold, unit, category } =
        req.body;
      const userId = req.user.userId;

      // Check if item exists
      const [existing] = await pool.execute(
        "SELECT * FROM inventory WHERE id = ?",
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      // Update item
      await pool.execute(
        "UPDATE inventory SET name = ?, description = ?, quantity = ?, min_threshold = ?, unit = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name, description, quantity, min_threshold, unit, category, id]
      );

      // Check if quantity is below threshold and send notification
      if (quantity <= min_threshold) {
        try {
          await axios.post(
            `${
              process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003"
            }/api/notifications`,
            {
              type: "low_stock",
              message: `${name} is running low (${quantity} units remaining)`,
              user_id: userId,
              inventory_id: id,
            }
          );
        } catch (error) {
          logger.error("Failed to send low stock notification:", error);
        }
      }

      // Fetch updated item
      const [updatedItem] = await pool.execute(
        `SELECT i.*, u.username as created_by_username 
       FROM inventory i 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.id = ?`,
        [id]
      );

      logger.info(`Inventory item updated: ${name} by user ${userId}`);

      res.json({
        message: "Inventory item updated successfully",
        item: updatedItem[0],
      });
    } catch (error) {
      logger.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  }
);

// Delete inventory item
app.delete("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if item exists
    const [existing] = await pool.execute(
      "SELECT name FROM inventory WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const itemName = existing[0].name;

    // Delete item
    await pool.execute("DELETE FROM inventory WHERE id = ?", [id]);

    logger.info(`Inventory item deleted: ${itemName} by user ${userId}`);

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    logger.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

// Search inventory items
app.get("/api/inventory/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const [rows] = await pool.execute(
      `SELECT i.*, u.username as created_by_username 
       FROM inventory i 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.name LIKE ? OR i.category LIKE ? OR i.description LIKE ?
       ORDER BY i.updated_at DESC`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error searching inventory:", error);
    res.status(500).json({ error: "Failed to search inventory" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Inventory service running on port ${PORT}`);
  console.log(`Inventory service running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  pool.end().then(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  pool.end().then(() => {
    process.exit(0);
  });
});

module.exports = app;
