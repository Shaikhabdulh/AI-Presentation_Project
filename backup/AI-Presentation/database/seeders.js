/**
 * Inventory Management System - Dummy Data Seeder (fixed)
 *
 * Changes made:
 * - Added safe truncate logic with FOREIGN_KEY_CHECKS toggle and per-table fallback.
 * - Renamed notification field `read` -> `is_read` for safety.
 * - Used quoted identifiers when truncating to avoid syntax/word issues.
 * - Per-table try/catch so missing tables don't abort the whole seeding run.
 *
 * Run: node database/seeders.js
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

// Configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.MYSQL_USER || "inventory_user",
  password: process.env.MYSQL_PASSWORD || "secure_password",
  database: process.env.MYSQL_DATABASE || "inventory_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Dummy data generators
const CATEGORIES = [
  "Electronics",
  "Raw Materials",
  "Office Supplies",
  "Packaging",
  "Tools",
  "Safety Equipment",
];

const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
];

// Generate random number
const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate users
const generateUsers = () => {
  const users = [
    {
      id: uuidv4(),
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123",
      role: "admin",
    },
    {
      id: uuidv4(),
      email: "user1@example.com",
      name: "John Doe",
      password: "password123",
      role: "user",
    },
    {
      id: uuidv4(),
      email: "user2@example.com",
      name: "Jane Smith",
      password: "password123",
      role: "user",
    },
    {
      id: uuidv4(),
      email: "user3@example.com",
      name: "Michael Johnson",
      password: "password123",
      role: "user",
    },
    {
      id: uuidv4(),
      email: "vendor@example.com",
      name: "Vendor User",
      password: "vendor123",
      role: "vendor",
    },
  ];

  return users;
};

// Generate inventory items
const generateInventoryItems = (userId) => {
  const items = [
    { name: "Laptop Dell", category: "Electronics", unit: "pcs" },
    { name: "USB Cable", category: "Electronics", unit: "pcs" },
    { name: 'Monitor 27"', category: "Electronics", unit: "pcs" },
    { name: "Office Chair", category: "Office Supplies", unit: "pcs" },
    { name: "Desk Lamp", category: "Office Supplies", unit: "pcs" },
    { name: "Paper Ream A4", category: "Office Supplies", unit: "reams" },
    { name: "Cardboard Box", category: "Packaging", unit: "boxes" },
    { name: "Plastic Wrap", category: "Packaging", unit: "rolls" },
    { name: "Steel Rod", category: "Raw Materials", unit: "kg" },
    { name: "Plastic Granules", category: "Raw Materials", unit: "kg" },
    { name: "Safety Helmet", category: "Safety Equipment", unit: "pcs" },
    { name: "Safety Gloves", category: "Safety Equipment", unit: "pairs" },
    { name: "Wrench Set", category: "Tools", unit: "sets" },
    { name: "Screwdriver Set", category: "Tools", unit: "sets" },
    { name: "Impact Drill", category: "Tools", unit: "pcs" },
  ];

  return items.map((item) => ({
    id: uuidv4(),
    userId,
    ...item,
    quantity: getRandomInt(5, 500),
    minThreshold: getRandomInt(5, 50),
  }));
};

// Generate vendors
const generateVendors = () => {
  const vendorNames = [
    "Tech Solutions Inc",
    "Office Depot",
    "Raw Materials Co",
    "Packaging Plus",
    "Safety First",
    "Tools & Equipment",
    "Electronics Hub",
    "Industrial Supplies",
    "Premium Materials",
    "Global Vendors Ltd",
  ];

  return vendorNames.map((name, idx) => ({
    id: uuidv4(),
    name,
    email: `vendor${idx + 1}@example.com`,
    phone: `+1-555-${String(idx).padStart(4, "0")}`,
    category: CATEGORIES[idx % CATEGORIES.length],
    address: `${getRandomInt(1, 999)} Main Street`,
    city: CITIES[idx % CITIES.length],
    rating: (Math.random() * 5).toFixed(2),
  }));
};

// Generate contact requests
const generateContactRequests = (users, vendors, inventoryItems) => {
  const requests = [];
  const vendorUsers = users.filter((u) => u.role === "vendor");
  const normalUsers = users.filter((u) => u.role !== "vendor");

  for (let i = 0; i < 15; i++) {
    const vendor = vendors[getRandomInt(0, vendors.length - 1)];
    const user = normalUsers[getRandomInt(0, normalUsers.length - 1)];
    const userItems = inventoryItems.filter((it) => it.userId === user.id);
    const item =
      userItems.length > 0
        ? userItems[getRandomInt(0, Math.min(5, userItems.length) - 1)]
        : null;

    requests.push({
      id: uuidv4(),
      vendorId: vendor.id,
      userId: user.id,
      itemId: item ? item.id : null,
      quantity: getRandomInt(10, 500),
      message: `Need ${getRandomInt(10, 500)} units urgently`,
      status: ["pending", "responded", "fulfilled"][getRandomInt(0, 2)],
    });
  }

  return requests;
};

// Generate notifications (uses is_read now)
const generateNotifications = (users, inventoryItems) => {
  const notifications = [];
  const normalUsers = users.filter((u) => u.role !== "vendor");

  inventoryItems.forEach((item) => {
    if (item.quantity <= item.minThreshold) {
      notifications.push({
        id: uuidv4(),
        userId: item.userId,
        type: "low_stock",
        message: `Low stock alert: ${item.name} (${item.quantity} remaining)`,
        itemId: item.id,
        vendorId: null,
        is_read: false,
      });
    }
  });

  // Add some random notifications
  for (let i = 0; i < 10; i++) {
    const user = normalUsers[getRandomInt(0, normalUsers.length - 1)];
    notifications.push({
      id: uuidv4(),
      userId: user.id,
      type: ["low_stock", "vendor_response", "order_update"][
        getRandomInt(0, 2)
      ],
      message: "Sample notification message",
      itemId: null,
      vendorId: null,
      is_read: getRandomInt(0, 1) === 0,
    });
  }

  return notifications;
};

// Main seeding function
async function seedDatabase() {
  let connection;

  try {
    console.log("🌱 Starting database seeding...");

    // Create connection
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to database");

    // Clear existing data (careful in production!)
    console.log("🗑️  Clearing existing data...");
    const tables = [
      "notifications",
      "vendor_contact_requests",
      "inventory_logs",
      "inventory_items",
      "vendors",
      "users",
    ];

    try {
      // Disable FK checks for truncate operations (dev only)
      await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
      for (const table of tables) {
        // Use quoted identifiers to avoid reserved word issues
        try {
          await connection.execute(`TRUNCATE TABLE \`${table}\``);
          console.log(`  ✅ Truncated ${table}`);
        } catch (e) {
          // Table might not exist or TRUNCATE prevented by FK - try DELETE fallback
          if (e && (e.code === "ER_NO_SUCH_TABLE" || e.errno === 1146)) {
            console.log(`  ⚠️ Table ${table} does not exist, skipping.`);
            continue;
          }
          try {
            await connection.execute(`DELETE FROM \`${table}\``);
            console.log(`  ✅ Deleted rows from ${table} (fallback)`);
            // Also reset AUTO_INCREMENT for safety (if table exists)
            try {
              await connection.execute(
                `ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`
              );
            } catch (_) {
              // ignore auto_increment errors for tables without it
            }
          } catch (err2) {
            console.log(
              `  ❌ Could not clear ${table}:`,
              err2.code || err2.message
            );
            throw err2;
          }
        }
      }
    } finally {
      // Re-enable FK checks
      await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    console.log("✅ Tables cleared");

    // Generate data
    console.log("📝 Generating data...");
    const users = generateUsers();
    const vendors = generateVendors();

    // Generate inventory for each user
    const allInventoryItems = [];
    users.forEach((user) => {
      const userItems = generateInventoryItems(user.id);
      allInventoryItems.push(...userItems);
    });

    const contactRequests = generateContactRequests(
      users,
      vendors,
      allInventoryItems
    );
    const notifications = generateNotifications(users, allInventoryItems);

    console.log("✅ Data generated");

    // Insert users
    console.log("👤 Inserting users...");
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        "INSERT INTO `users` (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)",
        [user.id, user.email, user.name, hashedPassword, user.role]
      );
    }
    console.log(`✅ ${users.length} users inserted`);

    // Insert vendors
    console.log("🤝 Inserting vendors...");
    for (const vendor of vendors) {
      await connection.execute(
        "INSERT INTO `vendors` (id, name, email, phone, category, address, city, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          vendor.id,
          vendor.name,
          vendor.email,
          vendor.phone,
          vendor.category,
          vendor.address,
          vendor.city,
          vendor.rating,
        ]
      );
    }
    console.log(`✅ ${vendors.length} vendors inserted`);

    // Insert inventory items
    console.log("📦 Inserting inventory items...");
    for (const item of allInventoryItems) {
      await connection.execute(
        "INSERT INTO `inventory_items` (id, userId, name, category, quantity, minThreshold, unit) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          item.id,
          item.userId,
          item.name,
          item.category,
          item.quantity,
          item.minThreshold,
          item.unit,
        ]
      );
    }
    console.log(`✅ ${allInventoryItems.length} inventory items inserted`);

    // Insert contact requests
    console.log("📧 Inserting contact requests...");
    for (const request of contactRequests) {
      await connection.execute(
        "INSERT INTO `vendor_contact_requests` (id, vendorId, userId, itemId, quantity, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          request.id,
          request.vendorId,
          request.userId,
          request.itemId,
          request.quantity,
          request.message,
          request.status,
        ]
      );
    }
    console.log(`✅ ${contactRequests.length} contact requests inserted`);

    // Insert notifications (uses is_read column)
    console.log("🔔 Inserting notifications...");
    for (const notif of notifications) {
      await connection.execute(
        "INSERT INTO `notifications` (id, userId, type, message, itemId, vendorId, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          notif.id,
          notif.userId,
          notif.type,
          notif.message,
          notif.itemId,
          notif.vendorId,
          notif.is_read,
        ]
      );
    }
    console.log(`✅ ${notifications.length} notifications inserted`);

    console.log("\n✅ Database seeding completed successfully!\n");

    // Print login credentials (plain-text dev only)
    console.log("📋 Test Credentials:");
    console.log("─".repeat(50));
    users.forEach((user) => {
      console.log(`📧 ${user.email}`);
      console.log(`🔐 Password: ${user.password}`);
      console.log(`👥 Role: ${user.role}`);
      console.log("─".repeat(50));
    });

    console.log("\n📊 Data Summary:");
    console.log(`   Users: ${users.length}`);
    console.log(`   Vendors: ${vendors.length}`);
    console.log(`   Inventory Items: ${allInventoryItems.length}`);
    console.log(`   Contact Requests: ${contactRequests.length}`);
    console.log(`   Notifications: ${notifications.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seeder
seedDatabase();

module.exports = {
  generateUsers,
  generateInventoryItems,
  generateVendors,
  generateContactRequests,
  generateNotifications,
};
