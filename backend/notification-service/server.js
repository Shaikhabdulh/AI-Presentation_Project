const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const mysql = require("mysql2/promise");
const redis = require("redis");
const cron = require("node-cron");
const winston = require("winston");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3003;

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

// Redis client for caching and session management
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
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

app.use("/api/notifications", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "notification-service",
    websocket: io.engine.readyState === "open",
  });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    // Verify JWT token
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB"
    );

    // Verify user exists
    const [rows] = await pool.execute(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (rows.length === 0) {
      return next(new Error("User not found"));
    }

    socket.user = rows[0];
    next();
  } catch (error) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`User ${socket.user.username} connected via WebSocket`);

  // Join user-specific room for targeted notifications
  socket.join(`user_${socket.user.id}`);

  // Broadcast user online status
  socket.broadcast.emit("user_online", {
    userId: socket.user.id,
    username: socket.user.username,
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    logger.info(`User ${socket.user.username} disconnected from WebSocket`);

    // Broadcast user offline status
    socket.broadcast.emit("user_offline", {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  // Handle marking notifications as read
  socket.on("mark_notification_read", async (data) => {
    try {
      const { notificationId } = data;

      await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
        [notificationId, socket.user.id]
      );

      // Emit confirmation
      socket.emit("notification_marked_read", { notificationId });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      socket.emit("error", { message: "Failed to mark notification as read" });
    }
  });

  // Handle joining inventory-specific rooms
  socket.on("join_inventory_room", (data) => {
    const { inventoryId } = data;
    socket.join(`inventory_${inventoryId}`);
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

// Notification validation
const notificationValidation = [
  body("type")
    .isIn(["low_stock", "vendor_contact", "system"])
    .withMessage("Type must be one of: low_stock, vendor_contact, system"),
  body("message")
    .isLength({ min: 1, max: 500 })
    .withMessage("Message must be between 1 and 500 characters"),
  body("user_id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
];

// Routes

// Get all notifications for authenticated user
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.execute(
      `SELECT n.*, 
              v.company_name as vendor_name,
              i.name as inventory_name
       FROM notifications n
       LEFT JOIN vendors v ON n.vendor_id = v.id
       LEFT JOIN inventory i ON n.inventory_id = i.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get recent notifications
app.get("/api/notifications/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await pool.execute(
      `SELECT n.*, 
              v.company_name as vendor_name,
              i.name as inventory_name
       FROM notifications n
       LEFT JOIN vendors v ON n.vendor_id = v.id
       LEFT JOIN inventory i ON n.inventory_id = i.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error fetching recent notifications:", error);
    res.status(500).json({ error: "Failed to fetch recent notifications" });
  }
});

// Create notification
app.post(
  "/api/notifications",
  authenticateToken,
  notificationValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, message, user_id, vendor_id, inventory_id } = req.body;

      const [result] = await pool.execute(
        "INSERT INTO notifications (type, message, user_id, vendor_id, inventory_id) VALUES (?, ?, ?, ?, ?)",
        [type, message, user_id, vendor_id, inventory_id]
      );

      const notificationId = result.insertId;

      // Fetch the created notification with related data
      const [notification] = await pool.execute(
        `SELECT n.*, 
              v.company_name as vendor_name,
              i.name as inventory_name
       FROM notifications n
       LEFT JOIN vendors v ON n.vendor_id = v.id
       LEFT JOIN inventory i ON n.inventory_id = i.id
       WHERE n.id = ?`,
        [notificationId]
      );

      // Emit real-time notification to the specific user
      io.to(`user_${user_id}`).emit("notification", notification[0]);

      // Also emit specific event types
      if (type === "low_stock") {
        io.to(`user_${user_id}`).emit("low-stock-alert", {
          message,
          inventory_id: inventory_id,
          timestamp: new Date().toISOString(),
        });

        // If inventory_id is provided, emit to inventory-specific room
        if (inventory_id) {
          io.to(`inventory_${inventory_id}`).emit("low-stock-alert", {
            message,
            inventory_id: inventory_id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      logger.info(`Notification created: ${type} for user ${user_id}`);

      res.status(201).json({
        message: "Notification created successfully",
        notification: notification[0],
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  }
);

// Mark notification as read
app.patch(
  "/api/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // Emit real-time update
      io.to(`user_${userId}`).emit("notification_marked_read", {
        notificationId: id,
      });

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }
);

// Mark all notifications as read
app.patch(
  "/api/notifications/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      await pool.execute(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
        [userId]
      );

      // Emit real-time update
      io.to(`user_${userId}`).emit("all_notifications_marked_read");

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  }
);

// Delete notification
app.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Get unread notification count
app.get(
  "/api/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      const [rows] = await pool.execute(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
        [userId]
      );

      res.json({ count: rows[0].count });
    } catch (error) {
      logger.error("Error fetching unread notification count:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch unread notification count" });
    }
  }
);

// Scheduled tasks for periodic notifications
cron.schedule("0 */6 * * *", async () => {
  try {
    logger.info("Running periodic low stock check...");

    // Get all low stock items
    const [lowStockItems] = await pool.execute(
      `SELECT i.*, u.id as user_id, u.username 
       FROM inventory i 
       JOIN users u ON i.created_by = u.id 
       WHERE i.quantity <= i.min_threshold`
    );

    // Send notifications for low stock items
    for (const item of lowStockItems) {
      const message = `${item.name} is running low (${item.quantity} units remaining)`;

      // Check if notification already exists for this item
      const [existing] = await pool.execute(
        'SELECT id FROM notifications WHERE type = "low_stock" AND inventory_id = ? AND user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)',
        [item.id, item.user_id]
      );

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO notifications (type, message, user_id, inventory_id) VALUES ("low_stock", ?, ?, ?)',
          [message, item.user_id, item.id]
        );

        // Emit real-time notification
        io.to(`user_${item.user_id}`).emit("low-stock-alert", {
          message,
          inventory_id: item.id,
          timestamp: new Date().toISOString(),
        });

        logger.info(
          `Sent low stock notification for item: ${item.name} to user: ${item.username}`
        );
      }
    }
  } catch (error) {
    logger.error("Error running periodic low stock check:", error);
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
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
  console.log(`Notification service running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  pool.end().then(() => {
    redisClient.quit().then(() => {
      server.close(() => {
        process.exit(0);
      });
    });
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  pool.end().then(() => {
    redisClient.quit().then(() => {
      server.close(() => {
        process.exit(0);
      });
    });
  });
});

module.exports = { app, server, io };
