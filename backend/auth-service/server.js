const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const winston = require("winston");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

app.use("/api/auth", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "auth-service",
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

// Register validation
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

// Login validation
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB"
    );

    // Verify user still exists
    const [rows] = await pool.execute(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    logger.error("Token verification failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Routes

// Register endpoint
app.post(
  "/api/auth/register",
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          error: "User with this username or email already exists",
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [username, email, passwordHash, "user"]
      );

      const userId = result.insertId;

      // Generate JWT token
      const token = jwt.sign(
        { userId, username, email, role: "user" },
        process.env.JWT_SECRET || "T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB",
        { expiresIn: "7d" }
      );

      logger.info(`New user registered: ${username} (${email})`);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: userId,
          username,
          email,
          role: "user",
        },
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Login endpoint
app.post(
  "/api/auth/login",
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const [rows] = await pool.execute(
        "SELECT id, username, email, password_hash, role FROM users WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB",
        { expiresIn: "7d" }
      );

      logger.info(`User logged in: ${user.username} (${email})`);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Get current user endpoint
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
});

// Update user profile endpoint
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    // Check if email is already taken by another user
    const [emailCheck] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    // Update user profile
    await pool.execute(
      "UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [username, email, userId]
    );

    logger.info(`User profile updated: ${username} (${email})`);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: userId,
        username,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    logger.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password endpoint
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    // Get current password hash
    const [rows] = await pool.execute(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentPasswordHash = rows[0].password_hash;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      currentPasswordHash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newPasswordHash, userId]
    );

    logger.info(`Password changed for user: ${req.user.username}`);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    logger.error("Password change error:", error);
    res.status(500).json({ error: "Failed to change password" });
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
  logger.info(`Auth service running on port ${PORT}`);
  console.log(`Auth service running on port ${PORT}`);
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
