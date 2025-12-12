const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "inventory_user",
  password: process.env.DB_PASSWORD || "secure_password",
  database: process.env.DB_NAME || "inventory_db",
};

// Sample data categories and units
const categories = [
  "Electronics",
  "Accessories",
  "Furniture",
  "Consumables",
  "Tools",
  "Software",
];
const units = ["units", "boxes", "kg", "liters", "meters", "pieces"];
const contactTypes = ["email", "phone", "in_person"];

// Generate random inventory items
function generateInventoryItem(userId) {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    quantity: faker.number.int({ min: 0, max: 100 }),
    min_threshold: faker.number.int({ min: 5, max: 20 }),
    unit: faker.helpers.arrayElement(units),
    category: faker.helpers.arrayElement(categories),
    created_by: userId,
  };
}

// Generate random vendor
function generateVendor() {
  return {
    company_name: faker.company.name(),
    contact_person: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number("+1-555-####"),
    address:
      faker.location.streetAddress() +
      ", " +
      faker.location.city() +
      ", " +
      faker.location.state(),
    specialty: faker.helpers.arrayElement(categories),
  };
}

// Generate random notification
function generateNotification(userIds, inventoryIds) {
  const types = ["low_stock", "vendor_contact", "system"];
  return {
    type: faker.helpers.arrayElement(types),
    message: faker.lorem.sentence(),
    user_id: faker.helpers.arrayElement(userIds),
    inventory_id: faker.helpers.arrayElement(inventoryIds),
    is_read: faker.datatype.boolean(),
  };
}

// Generate contact history
function generateContactHistory(userIds, vendorIds, inventoryIds) {
  return {
    user_id: faker.helpers.arrayElement(userIds),
    vendor_id: faker.helpers.arrayElement(vendorIds),
    inventory_id: faker.helpers.arrayElement(inventoryIds),
    message: faker.lorem.paragraph(),
    contact_type: faker.helpers.arrayElement(contactTypes),
  };
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    // Clear existing data (except admin user)
    console.log("🧹 Clearing existing data...");
    await connection.execute("DELETE FROM contact_history");
    await connection.execute("DELETE FROM notifications");
    await connection.execute("DELETE FROM vendor_inventory");
    await connection.execute("DELETE FROM inventory WHERE created_by != 1");
    await connection.execute("DELETE FROM vendors");
    await connection.execute("DELETE FROM users WHERE id != 1");

    // Create additional users
    console.log("👥 Creating users...");
    const users = [];
    for (let i = 0; i < 5; i++) {
      const username = faker.internet.userName();
      const email = faker.internet.email();
      const passwordHash = await bcrypt.hash("password123", 10);
      const role = faker.helpers.arrayElement(["admin", "user"]);

      const [result] = await connection.execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [username, email, passwordHash, role]
      );
      users.push(result.insertId);
    }
    users.push(1); // Include admin user

    // Create inventory items
    console.log("📦 Creating inventory items...");
    const inventoryItems = [];
    for (let i = 0; i < 20; i++) {
      const item = generateInventoryItem(faker.helpers.arrayElement(users));
      const [result] = await connection.execute(
        "INSERT INTO inventory (name, description, quantity, min_threshold, unit, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          item.name,
          item.description,
          item.quantity,
          item.min_threshold,
          item.unit,
          item.category,
          item.created_by,
        ]
      );
      inventoryItems.push(result.insertId);
    }

    // Create vendors
    console.log("🏢 Creating vendors...");
    const vendors = [];
    for (let i = 0; i < 8; i++) {
      const vendor = generateVendor();
      const [result] = await connection.execute(
        "INSERT INTO vendors (company_name, contact_person, email, phone, address, specialty) VALUES (?, ?, ?, ?, ?, ?)",
        [
          vendor.company_name,
          vendor.contact_person,
          vendor.email,
          vendor.phone,
          vendor.address,
          vendor.specialty,
        ]
      );
      vendors.push(result.insertId);
    }

    // Create vendor-inventory relationships
    console.log("🔗 Creating vendor-inventory relationships...");
    for (let i = 0; i < 15; i++) {
      const vendorId = faker.helpers.arrayElement(vendors);
      const inventoryId = faker.helpers.arrayElement(inventoryItems);
      const isPrimary = faker.datatype.boolean();

      try {
        await connection.execute(
          "INSERT INTO vendor_inventory (vendor_id, inventory_id, is_primary) VALUES (?, ?, ?)",
          [vendorId, inventoryId, isPrimary]
        );
      } catch (error) {
        // Skip duplicate relationships
        if (!error.message.includes("Duplicate entry")) {
          throw error;
        }
      }
    }

    // Create notifications
    console.log("🔔 Creating notifications...");
    for (let i = 0; i < 10; i++) {
      const notification = generateNotification(users, inventoryItems);
      await connection.execute(
        "INSERT INTO notifications (type, message, user_id, inventory_id, is_read) VALUES (?, ?, ?, ?, ?)",
        [
          notification.type,
          notification.message,
          notification.user_id,
          notification.inventory_id,
          notification.is_read,
        ]
      );
    }

    // Create contact history
    console.log("📞 Creating contact history...");
    for (let i = 0; i < 12; i++) {
      const contact = generateContactHistory(users, vendors, inventoryItems);
      await connection.execute(
        "INSERT INTO contact_history (user_id, vendor_id, inventory_id, message, contact_type) VALUES (?, ?, ?, ?, ?)",
        [
          contact.user_id,
          contact.vendor_id,
          contact.inventory_id,
          contact.message,
          contact.contact_type,
        ]
      );
    }

    // Create some low stock items for demonstration
    console.log("⚠️ Creating low stock items...");
    const lowStockItems = [
      { name: "Critical Component A", threshold: 5 },
      { name: "Essential Part B", threshold: 8 },
      { name: "Important Item C", threshold: 3 },
    ];

    for (const item of lowStockItems) {
      const [result] = await connection.execute(
        "INSERT INTO inventory (name, description, quantity, min_threshold, unit, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          item.name,
          "Critical inventory item",
          item.threshold - 1,
          item.threshold,
          "units",
          "Critical",
          1,
        ]
      );

      // Create low stock notification
      await connection.execute(
        "INSERT INTO notifications (type, message, user_id, inventory_id, is_read) VALUES (?, ?, ?, ?, ?)",
        [
          "low_stock",
          `${item.name} is running low (${item.threshold - 1} units remaining)`,
          1,
          result.insertId,
          false,
        ]
      );
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${users.length} users created`);
    console.log(`   - ${inventoryItems.length + 3} inventory items created`);
    console.log(`   - ${vendors.length} vendors created`);
    console.log(`   - 10 notifications created`);
    console.log(`   - 12 contact history records created`);

    // Show dashboard summary
    const [summary] = await connection.execute(
      "SELECT * FROM dashboard_summary"
    );
    console.log(`📈 Dashboard Summary:`, summary[0]);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedDatabase();
