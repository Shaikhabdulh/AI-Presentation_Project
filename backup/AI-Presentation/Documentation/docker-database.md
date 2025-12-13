# Docker & Database Configuration
# Partialy Done
## Docker Compose (`docker-compose.yml`)

```yaml
version: '3.9'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: inventory-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_password}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-inventory_db}
      MYSQL_USER: ${MYSQL_USER:-inventory_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-secure_password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - inventory-network

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: inventory-frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://api-gateway:3000/api
      VITE_SOCKET_URL: http://localhost:3001
    depends_on:
      - api-gateway
    networks:
      - inventory-network

  # Auth Service
  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile
    container_name: inventory-auth-service
    restart: unless-stopped
    ports:
      - "3100:3100"
    environment:
      DATABASE_HOST: mysql
      DATABASE_USER: ${MYSQL_USER:-inventory_user}
      DATABASE_PASSWORD: ${MYSQL_PASSWORD:-secure_password}
      DATABASE_NAME: ${MYSQL_DATABASE:-inventory_db}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      NODE_ENV: development
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - inventory-network

  # Inventory Service
  inventory-service:
    build:
      context: ./backend/inventory-service
      dockerfile: Dockerfile
    container_name: inventory-service
    restart: unless-stopped
    ports:
      - "3101:3101"
    environment:
      DATABASE_HOST: mysql
      DATABASE_USER: ${MYSQL_USER:-inventory_user}
      DATABASE_PASSWORD: ${MYSQL_PASSWORD:-secure_password}
      DATABASE_NAME: ${MYSQL_DATABASE:-inventory_db}
      NODE_ENV: development
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - inventory-network

  # Notification Service
  notification-service:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    container_name: inventory-notification-service
    restart: unless-stopped
    ports:
      - "3102:3102"
    environment:
      DATABASE_HOST: mysql
      DATABASE_USER: ${MYSQL_USER:-inventory_user}
      DATABASE_PASSWORD: ${MYSQL_PASSWORD:-secure_password}
      DATABASE_NAME: ${MYSQL_DATABASE:-inventory_db}
      NODE_ENV: development
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - inventory-network

  # Vendor Service
  vendor-service:
    build:
      context: ./backend/vendor-service
      dockerfile: Dockerfile
    container_name: inventory-vendor-service
    restart: unless-stopped
    ports:
      - "3103:3103"
    environment:
      DATABASE_HOST: mysql
      DATABASE_USER: ${MYSQL_USER:-inventory_user}
      DATABASE_PASSWORD: ${MYSQL_PASSWORD:-secure_password}
      DATABASE_NAME: ${MYSQL_DATABASE:-inventory_db}
      NODE_ENV: development
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - inventory-network

  # API Gateway
  api-gateway:
    build:
      context: ./backend/api-gateway
      dockerfile: Dockerfile
    container_name: inventory-api-gateway
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      AUTH_SERVICE_URL: http://auth-service:3100
      INVENTORY_SERVICE_URL: http://inventory-service:3101
      VENDOR_SERVICE_URL: http://vendor-service:3103
      NOTIFICATION_SERVICE_URL: http://notification-service:3102
      NODE_ENV: development
    depends_on:
      - auth-service
      - inventory-service
      - vendor-service
      - notification-service
    networks:
      - inventory-network

volumes:
  mysql_data:
    driver: local

networks:
  inventory-network:
    driver: bridge
```

## Environment File (`.env`)

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=root_password
MYSQL_USER=inventory_user
MYSQL_PASSWORD=secure_password
MYSQL_DATABASE=inventory_db

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-min-32-chars-for-prod

# API Configuration
API_PORT=3000
NODE_ENV=development

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3001
```

## Database Schema (`database/init.sql`)

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'vendor') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  minThreshold INT NOT NULL DEFAULT 10,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_category (category),
  INDEX idx_quantity (quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory logs table (audit trail)
CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(36) PRIMARY KEY,
  itemId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  previousQuantity INT NOT NULL,
  newQuantity INT NOT NULL,
  reason VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_itemId (itemId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  isActive BOOLEAN DEFAULT TRUE,
  registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_category (category),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor contact requests table
CREATE TABLE IF NOT EXISTS vendor_contact_requests (
  id VARCHAR(36) PRIMARY KEY,
  vendorId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  itemId VARCHAR(36),
  quantity INT NOT NULL,
  message TEXT,
  status ENUM('pending', 'responded', 'fulfilled') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES inventory_items(id),
  INDEX idx_vendorId (vendorId),
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type ENUM('low_stock', 'vendor_response', 'order_update') NOT NULL,
  message VARCHAR(255) NOT NULL,
  itemId VARCHAR(36),
  vendorId VARCHAR(36),
  read BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES inventory_items(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  INDEX idx_read (read),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_inventory_lowstock ON inventory_items(quantity, minThreshold);
CREATE INDEX idx_notifications_unread ON notifications(userId, read);
```

## Dockerfile Templates

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["serve", "-s", "dist", "-l", "5173"]
```

### Backend Service Dockerfile (`backend/auth-service/Dockerfile`)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

---

## Running the Application

### Using Docker Compose (Recommended)

```bash
# 1. Navigate to project root
cd inventory-management-system

# 2. Create .env file
cp .env.example .env

# 3. Build all services
docker-compose build

# 4. Start all services
docker-compose up -d

# 5. Check service health
docker-compose ps

# 6. View logs
docker-compose logs -f

# 7. Stop services
docker-compose down
```

### Manual Setup (Development)

```bash
# Terminal 1: MySQL
docker run --name inventory-mysql -e MYSQL_ROOT_PASSWORD=root_password -p 3306:3306 mysql:8.0

# Terminal 2: Frontend
cd frontend && npm install && npm run dev

# Terminal 3: Auth Service
cd backend/auth-service && npm install && npm run start:dev

# Terminal 4: Inventory Service
cd backend/inventory-service && npm install && npm run start:dev

# Terminal 5: Notification Service
cd backend/notification-service && npm install && npm run start:dev

# Terminal 6: Vendor Service
cd backend/vendor-service && npm install && npm run start:dev

# Terminal 7: API Gateway
cd backend/api-gateway && npm install && npm run start:dev
```

## Database Backups

```bash
# Backup database
docker exec inventory-mysql mysqldump -u inventory_user -psecure_password inventory_db > backup.sql

# Restore database
docker exec -i inventory-mysql mysql -u inventory_user -psecure_password inventory_db < backup.sql
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Services can't communicate | Check `inventory-network` exists: `docker network ls` |
| MySQL connection refused | Wait 10s for MySQL startup, check logs: `docker logs inventory-mysql` |
| Port already in use | Change port in `docker-compose.yml` or kill process |
| Permission denied | Run with `sudo` or add user to docker group |

