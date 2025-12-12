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
const PORT = process.env.PORT || 3004;

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

app.use("/api/vendors", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "vendor-service",
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

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
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

// Vendor validation
const vendorValidation = [
  body("company_name")
    .isLength({ min: 1, max: 100 })
    .withMessage("Company name must be between 1 and 100 characters"),
  body("contact_person")
    .isLength({ min: 1, max: 100 })
    .withMessage("Contact person must be between 1 and 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Phone number must not exceed 20 characters"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),
  body("specialty")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Specialty must not exceed 100 characters"),
];

// Contact validation
const contactValidation = [
  body("vendor_id")
    .isInt({ min: 1 })
    .withMessage("Vendor ID must be a positive integer"),
  body("inventory_ids")
    .isArray({ min: 1 })
    .withMessage("Inventory IDs must be a non-empty array"),
  body("inventory_ids.*")
    .isInt({ min: 1 })
    .withMessage("Each inventory ID must be a positive integer"),
  body("message")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("contact_type")
    .isIn(["email", "phone", "in_person"])
    .withMessage("Contact type must be one of: email, phone, in_person"),
];

// Routes

// Get all vendors
app.get("/api/vendors", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM vendors ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    logger.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Get single vendor
app.get("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute("SELECT * FROM vendors WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// Get vendor's inventory items
app.get("/api/vendors/:id/inventory", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT i.*, vi.is_primary
       FROM inventory i
       JOIN vendor_inventory vi ON i.id = vi.inventory_id
       WHERE vi.vendor_id = ?
       ORDER BY i.name`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error fetching vendor inventory:", error);
    res.status(500).json({ error: "Failed to fetch vendor inventory" });
  }
});

// Create vendor
app.post(
  "/api/vendors",
  authenticateToken,
  vendorValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { company_name, contact_person, email, phone, address, specialty } =
        req.body;

      // Check if vendor with this email already exists
      const [existing] = await pool.execute(
        "SELECT id FROM vendors WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          error: "Vendor with this email already exists",
        });
      }

      const [result] = await pool.execute(
        "INSERT INTO vendors (company_name, contact_person, email, phone, address, specialty) VALUES (?, ?, ?, ?, ?, ?)",
        [company_name, contact_person, email, phone, address, specialty]
      );

      const vendorId = result.insertId;

      // Fetch the created vendor
      const [newVendor] = await pool.execute(
        "SELECT * FROM vendors WHERE id = ?",
        [vendorId]
      );

      logger.info(`Vendor created: ${company_name} (${email})`);

      res.status(201).json({
        message: "Vendor created successfully",
        vendor: newVendor[0],
      });
    } catch (error) {
      logger.error("Error creating vendor:", error);
      res.status(500).json({ error: "Failed to create vendor" });
    }
  }
);

// Update vendor
app.put(
  "/api/vendors/:id",
  authenticateToken,
  vendorValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { company_name, contact_person, email, phone, address, specialty } =
        req.body;

      // Check if vendor exists
      const [existing] = await pool.execute(
        "SELECT * FROM vendors WHERE id = ?",
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Check if email is already taken by another vendor
      const [emailCheck] = await pool.execute(
        "SELECT id FROM vendors WHERE email = ? AND id != ?",
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res
          .status(400)
          .json({ error: "Email is already taken by another vendor" });
      }

      // Update vendor
      await pool.execute(
        "UPDATE vendors SET company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, specialty = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [company_name, contact_person, email, phone, address, specialty, id]
      );

      // Fetch updated vendor
      const [updatedVendor] = await pool.execute(
        "SELECT * FROM vendors WHERE id = ?",
        [id]
      );

      logger.info(`Vendor updated: ${company_name} (${email})`);

      res.json({
        message: "Vendor updated successfully",
        vendor: updatedVendor[0],
      });
    } catch (error) {
      logger.error("Error updating vendor:", error);
      res.status(500).json({ error: "Failed to update vendor" });
    }
  }
);

// Delete vendor
app.delete("/api/vendors/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vendor exists
    const [existing] = await pool.execute(
      "SELECT company_name FROM vendors WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const companyName = existing[0].company_name;

    // Start transaction to ensure data consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete vendor-inventory relationships
      await connection.execute(
        "DELETE FROM vendor_inventory WHERE vendor_id = ?",
        [id]
      );

      // Delete contact history related to this vendor
      await connection.execute(
        "DELETE FROM contact_history WHERE vendor_id = ?",
        [id]
      );

      // Delete notifications related to this vendor
      await connection.execute(
        "DELETE FROM notifications WHERE vendor_id = ?",
        [id]
      );

      // Delete vendor
      await connection.execute("DELETE FROM vendors WHERE id = ?", [id]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    logger.info(`Vendor deleted: ${companyName}`);

    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    logger.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

// Contact vendor
app.post(
  "/api/vendors/contact",
  authenticateToken,
  contactValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { vendor_id, inventory_ids, message, contact_type } = req.body;
      const userId = req.user.userId;

      // Verify vendor exists
      const [vendor] = await pool.execute(
        "SELECT company_name, email, contact_person FROM vendors WHERE id = ?",
        [vendor_id]
      );

      if (vendor.length === 0) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Verify inventory items exist
      const [inventoryItems] = await pool.execute(
        "SELECT id, name FROM inventory WHERE id IN (?)",
        [inventory_ids]
      );

      if (inventoryItems.length !== inventory_ids.length) {
        return res
          .status(400)
          .json({ error: "Some inventory items not found" });
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Create contact history entries
        for (const inventoryId of inventory_ids) {
          await connection.execute(
            "INSERT INTO contact_history (user_id, vendor_id, inventory_id, message, contact_type) VALUES (?, ?, ?, ?, ?)",
            [userId, vendor_id, inventoryId, message, contact_type]
          );
        }

        // Create notification for the user
        const vendorName = vendor[0].company_name;
        const itemNames = inventoryItems.map((item) => item.name).join(", ");
        const notificationMessage = `You contacted ${vendorName} about: ${itemNames}`;

        await connection.execute(
          'INSERT INTO notifications (type, message, user_id, vendor_id) VALUES ("vendor_contact", ?, ?, ?)',
          [notificationMessage, userId, vendor_id]
        );

        // Send notification to notification service
        try {
          await axios.post(
            `${
              process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003"
            }/api/notifications`,
            {
              type: "vendor_contact",
              message: `Contact initiated by user ${userId} regarding items: ${itemNames}`,
              user_id: userId,
              vendor_id: vendor_id,
            }
          );
        } catch (error) {
          logger.error(
            "Failed to send notification to notification service:",
            error
          );
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      logger.info(
        `Vendor contacted: ${vendor[0].company_name} by user ${userId}`
      );

      res.json({
        message: "Vendor contacted successfully",
        vendor: vendor[0],
        items: inventoryItems,
      });
    } catch (error) {
      logger.error("Error contacting vendor:", error);
      res.status(500).json({ error: "Failed to contact vendor" });
    }
  }
);

// Search vendors
app.get("/api/vendors/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM vendors WHERE company_name LIKE ? OR specialty LIKE ? OR contact_person LIKE ? ORDER BY company_name",
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error searching vendors:", error);
    res.status(500).json({ error: "Failed to search vendors" });
  }
});

// Get vendors by specialty
app.get(
  "/api/vendors/specialty/:specialty",
  authenticateToken,
  async (req, res) => {
    try {
      const { specialty } = req.params;

      const [rows] = await pool.execute(
        "SELECT * FROM vendors WHERE specialty = ? ORDER BY company_name",
        [specialty]
      );

      res.json(rows);
    } catch (error) {
      logger.error("Error fetching vendors by specialty:", error);
      res.status(500).json({ error: "Failed to fetch vendors by specialty" });
    }
  }
);

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
  logger.info(`Vendor service running on port ${PORT}`);
  console.log(`Vendor service running on port ${PORT}`);
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
