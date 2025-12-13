# Dummy Data Seeding Script
# Done
## `database/seeders.js` - Node.js Seeder

```javascript
/**
 * Inventory Management System - Dummy Data Seeder
 * 
 * This script generates realistic dummy data for development and testing
 * 
 * Features:
 * - Creates 5 test users with different roles
 * - Creates 20 inventory items with various categories
 * - Creates 10 vendors in different categories
 * - Creates contact requests between users and vendors
 * - Creates sample notifications
 * 
 * Run: node database/seeders.js
 */

const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

// Configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'inventory_user',
  password: process.env.MYSQL_PASSWORD || 'secure_password',
  database: process.env.MYSQL_DATABASE || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Dummy data generators
const CATEGORIES = [
  'Electronics',
  'Raw Materials',
  'Office Supplies',
  'Packaging',
  'Tools',
  'Safety Equipment',
]

const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
]

// Generate random number
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Generate users
const generateUsers = () => {
  const users = [
    {
      id: uuidv4(),
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123',
      role: 'admin',
    },
    {
      id: uuidv4(),
      email: 'user1@example.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
    },
    {
      id: uuidv4(),
      email: 'user2@example.com',
      name: 'Jane Smith',
      password: 'password123',
      role: 'user',
    },
    {
      id: uuidv4(),
      email: 'user3@example.com',
      name: 'Michael Johnson',
      password: 'password123',
      role: 'user',
    },
    {
      id: uuidv4(),
      email: 'vendor@example.com',
      name: 'Vendor User',
      password: 'vendor123',
      role: 'vendor',
    },
  ]

  return users
}

// Generate inventory items
const generateInventoryItems = (userId) => {
  const items = [
    { name: 'Laptop Dell', category: 'Electronics', unit: 'pcs' },
    { name: 'USB Cable', category: 'Electronics', unit: 'pcs' },
    { name: 'Monitor 27"', category: 'Electronics', unit: 'pcs' },
    { name: 'Office Chair', category: 'Office Supplies', unit: 'pcs' },
    { name: 'Desk Lamp', category: 'Office Supplies', unit: 'pcs' },
    { name: 'Paper Ream A4', category: 'Office Supplies', unit: 'reams' },
    { name: 'Cardboard Box', category: 'Packaging', unit: 'boxes' },
    { name: 'Plastic Wrap', category: 'Packaging', unit: 'rolls' },
    { name: 'Steel Rod', category: 'Raw Materials', unit: 'kg' },
    { name: 'Plastic Granules', category: 'Raw Materials', unit: 'kg' },
    { name: 'Safety Helmet', category: 'Safety Equipment', unit: 'pcs' },
    { name: 'Safety Gloves', category: 'Safety Equipment', unit: 'pairs' },
    { name: 'Wrench Set', category: 'Tools', unit: 'sets' },
    { name: 'Screwdriver Set', category: 'Tools', unit: 'sets' },
    { name: 'Impact Drill', category: 'Tools', unit: 'pcs' },
  ]

  return items.map((item) => ({
    id: uuidv4(),
    userId,
    ...item,
    quantity: getRandomInt(5, 500),
    minThreshold: getRandomInt(5, 50),
  }))
}

// Generate vendors
const generateVendors = () => {
  const vendorNames = [
    'Tech Solutions Inc',
    'Office Depot',
    'Raw Materials Co',
    'Packaging Plus',
    'Safety First',
    'Tools & Equipment',
    'Electronics Hub',
    'Industrial Supplies',
    'Premium Materials',
    'Global Vendors Ltd',
  ]

  return vendorNames.map((name, idx) => ({
    id: uuidv4(),
    name,
    email: `vendor${idx + 1}@example.com`,
    phone: `+1-555-${String(idx).padStart(4, '0')}`,
    category: CATEGORIES[idx % CATEGORIES.length],
    address: `${getRandomInt(1, 999)} Main Street`,
    city: CITIES[idx % CITIES.length],
    rating: (Math.random() * 5).toFixed(2),
  }))
}

// Generate contact requests
const generateContactRequests = (users, vendors, inventoryItems) => {
  const requests = []
  const vendorUsers = users.filter((u) => u.role === 'vendor')
  const normalUsers = users.filter((u) => u.role !== 'vendor')

  for (let i = 0; i < 15; i++) {
    const vendor = vendors[getRandomInt(0, vendors.length - 1)]
    const user = normalUsers[getRandomInt(0, normalUsers.length - 1)]
    const item = inventoryItems.filter((it) => it.userId === user.id)[
      getRandomInt(0, Math.min(5, inventoryItems.filter((it) => it.userId === user.id).length - 1))
    ]

    requests.push({
      id: uuidv4(),
      vendorId: vendor.id,
      userId: user.id,
      itemId: item ? item.id : null,
      quantity: getRandomInt(10, 500),
      message: `Need ${getRandomInt(10, 500)} units urgently`,
      status: ['pending', 'responded', 'fulfilled'][getRandomInt(0, 2)],
    })
  }

  return requests
}

// Generate notifications
const generateNotifications = (users, inventoryItems) => {
  const notifications = []
  const normalUsers = users.filter((u) => u.role !== 'vendor')

  inventoryItems.forEach((item) => {
    if (item.quantity <= item.minThreshold) {
      notifications.push({
        id: uuidv4(),
        userId: item.userId,
        type: 'low_stock',
        message: `Low stock alert: ${item.name} (${item.quantity} remaining)`,
        itemId: item.id,
        vendorId: null,
        read: false,
      })
    }
  })

  // Add some random notifications
  for (let i = 0; i < 10; i++) {
    const user = normalUsers[getRandomInt(0, normalUsers.length - 1)]
    notifications.push({
      id: uuidv4(),
      userId: user.id,
      type: ['low_stock', 'vendor_response', 'order_update'][getRandomInt(0, 2)],
      message: 'Sample notification message',
      itemId: null,
      vendorId: null,
      read: getRandomInt(0, 1) === 0,
    })
  }

  return notifications
}

// Main seeding function
async function seedDatabase() {
  let connection

  try {
    console.log('🌱 Starting database seeding...')

    // Create connection
    connection = await mysql.createConnection(DB_CONFIG)
    console.log('✅ Connected to database')

    // Clear existing data (careful in production!)
    console.log('🗑️  Clearing existing data...')
    const tables = [
      'notifications',
      'vendor_contact_requests',
      'inventory_logs',
      'inventory_items',
      'vendors',
      'users',
    ]

    for (const table of tables) {
      await connection.execute(`TRUNCATE TABLE ${table}`)
    }
    console.log('✅ Tables cleared')

    // Generate data
    console.log('📝 Generating data...')
    const users = generateUsers()
    const vendors = generateVendors()

    // Generate inventory for each user
    const allInventoryItems = []
    users.forEach((user) => {
      const userItems = generateInventoryItems(user.id)
      allInventoryItems.push(...userItems)
    })

    const contactRequests = generateContactRequests(users, vendors, allInventoryItems)
    const notifications = generateNotifications(users, allInventoryItems)

    console.log('✅ Data generated')

    // Insert users
    console.log('👤 Inserting users...')
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await connection.execute(
        'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.email, user.name, hashedPassword, user.role]
      )
    }
    console.log(`✅ ${users.length} users inserted`)

    // Insert vendors
    console.log('🤝 Inserting vendors...')
    for (const vendor of vendors) {
      await connection.execute(
        'INSERT INTO vendors (id, name, email, phone, category, address, city, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [vendor.id, vendor.name, vendor.email, vendor.phone, vendor.category, vendor.address, vendor.city, vendor.rating]
      )
    }
    console.log(`✅ ${vendors.length} vendors inserted`)

    // Insert inventory items
    console.log('📦 Inserting inventory items...')
    for (const item of allInventoryItems) {
      await connection.execute(
        'INSERT INTO inventory_items (id, userId, name, category, quantity, minThreshold, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.userId, item.name, item.category, item.quantity, item.minThreshold, item.unit]
      )
    }
    console.log(`✅ ${allInventoryItems.length} inventory items inserted`)

    // Insert contact requests
    console.log('📧 Inserting contact requests...')
    for (const request of contactRequests) {
      await connection.execute(
        'INSERT INTO vendor_contact_requests (id, vendorId, userId, itemId, quantity, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [request.id, request.vendorId, request.userId, request.itemId, request.quantity, request.message, request.status]
      )
    }
    console.log(`✅ ${contactRequests.length} contact requests inserted`)

    // Insert notifications
    console.log('🔔 Inserting notifications...')
    for (const notif of notifications) {
      await connection.execute(
        'INSERT INTO notifications (id, userId, type, message, itemId, vendorId, read) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notif.id, notif.userId, notif.type, notif.message, notif.itemId, notif.vendorId, notif.read]
      )
    }
    console.log(`✅ ${notifications.length} notifications inserted`)

    console.log('\n✅ Database seeding completed successfully!\n')

    // Print login credentials
    console.log('📋 Test Credentials:')
    console.log('─'.repeat(50))
    users.forEach((user) => {
      console.log(`📧 ${user.email}`)
      console.log(`🔐 Password: ${user.password}`)
      console.log(`👥 Role: ${user.role}`)
      console.log('─'.repeat(50))
    })

    console.log('\n📊 Data Summary:')
    console.log(`   Users: ${users.length}`)
    console.log(`   Vendors: ${vendors.length}`)
    console.log(`   Inventory Items: ${allInventoryItems.length}`)
    console.log(`   Contact Requests: ${contactRequests.length}`)
    console.log(`   Notifications: ${notifications.length}`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Run seeder
seedDatabase()

module.exports = {
  generateUsers,
  generateInventoryItems,
  generateVendors,
  generateContactRequests,
  generateNotifications,
}
```

## `package.json` - For Seeder

```json
{
  "name": "inventory-seeders",
  "version": "1.0.0",
  "description": "Database seeders for inventory management system",
  "main": "seeders.js",
  "scripts": {
    "seed": "node seeders.js"
  },
  "dependencies": {
    "mysql2": "^3.6.0",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0"
  }
}
```

## Running the Seeder

```bash
# Install dependencies
cd database
npm install

# Run seeder (requires MySQL running)
npm run seed

# Or with environment variables
DATABASE_HOST=localhost MYSQL_USER=inventory_user MYSQL_PASSWORD=secure_password npm run seed
```

## Seeded Test Data

### Users Created:
```
1. admin@example.com (Admin) - admin123
2. user1@example.com (User) - password123
3. user2@example.com (User) - password123
4. user3@example.com (User) - password123
5. vendor@example.com (Vendor) - vendor123
```

### Sample Vendors:
- Tech Solutions Inc (Electronics)
- Office Depot (Office Supplies)
- Raw Materials Co (Raw Materials)
- Packaging Plus (Packaging)
- Safety First (Safety Equipment)

### Sample Inventory:
Each user gets 15 items with:
- Random quantities (5-500 units)
- Random min thresholds (5-50 units)
- Different categories
- Mix of low and well-stocked items

### Contact Requests:
- 15 contact requests between users and vendors
- Various statuses (pending, responded, fulfilled)

### Notifications:
- Auto-generated low stock alerts for items below threshold
- Random notifications of different types
- Mix of read/unread

---

**Key Points**:
✅ Realistic dummy data for development
✅ All relationships properly created
✅ Password hashing with bcrypt
✅ UUIDs for all IDs
✅ Easy to run with `npm run seed`
✅ Clear console output with login credentials
✅ Idempotent (clears data before seeding)

