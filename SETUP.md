# Setup Guide - Inventory Management System

This guide will walk you through setting up the Inventory Management System from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

### Required Software

1. **Node.js 18+ and npm 9+**
   ```bash
   # Check versions
   node --version
   npm --version
   
   # Install Node.js (if not installed)
   # Visit: https://nodejs.org/
   ```

2. **Docker and Docker Compose**
   ```bash
   # Check versions
   docker --version
   docker-compose --version
   
   # Install Docker (if not installed)
   # Visit: https://docs.docker.com/get-docker/
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   
   # Install Git (if not installed)
   # Visit: https://git-scm.com/
   ```

### Optional Software

- **MySQL Workbench** or **DBeaver** (for database management)
- **Postman** or **Insomnia** (for API testing)
- **VS Code** with recommended extensions:
  - ES Lint
  - Prettier
  - Docker
  - Tailwind CSS IntelliSense

## 🚀 Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd inventory-management-system

# Navigate to the project directory
cd /mnt/okcomputer/output/inventory-management-system
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run setup

# Or install individually:
cd frontend && npm install && cd ..
cd backend/auth-service && npm install && cd ../..
cd backend/inventory-service && npm install && cd ../..
cd backend/notification-service && npm install && cd ../..
cd backend/vendor-service && npm install && cd ../..
cd database && npm install && cd ..
```

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` files in each service directory:

#### Frontend Configuration
Create `frontend/.env`:
```env
# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3003
NODE_ENV=development
```

#### Backend Services Configuration
Create `.env` files in each backend service directory:

**auth-service/.env**:
```env
# Auth Service Environment Variables
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=inventory_user
DB_PASSWORD=secure_password
JWT_SECRET=T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

**inventory-service/.env**:
```env
# Inventory Service Environment Variables
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=inventory_user
DB_PASSWORD=secure_password
JWT_SECRET=T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB
NOTIFICATION_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
```

**notification-service/.env**:
```env
# Notification Service Environment Variables
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=inventory_user
DB_PASSWORD=secure_password
JWT_SECRET=T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

**vendor-service/.env**:
```env
# Vendor Service Environment Variables
NODE_ENV=development
PORT=3004
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=inventory_user
DB_PASSWORD=secure_password
JWT_SECRET=T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB
NOTIFICATION_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
```

### 2. Security Configuration

**Important Security Notes:**
- Change the `JWT_SECRET` to a strong, random string
- Use strong database passwords
- In production, use environment-specific secrets management
- Configure proper CORS origins

## 🗄️ Database Setup

### Option A: Docker Setup (Recommended)

#### 1. Start MySQL and Redis

```bash
# Start MySQL and Redis containers
docker-compose up -d mysql redis

# Verify containers are running
docker ps

# Check logs
docker-compose logs mysql
docker-compose logs redis
```

#### 2. Initialize Database

```bash
# Navigate to database directory
cd database

# Install dependencies
npm install

# Run database initialization and seeding
npm run seed
```

### Option B: Local MySQL Setup

#### 1. Install MySQL 8.0

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
- Download from: https://dev.mysql.com/downloads/installer/
- Run the installer and follow the setup wizard

#### 2. Create Database and User

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL prompt, run:
CREATE DATABASE inventory_db;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Initialize Database Schema

```bash
# Navigate to database directory
cd database

# Run initialization script
mysql -u inventory_user -p inventory_db < init.sql

# Install dependencies and run seeder
npm install
npm run seed
```

#### 4. Install and Start Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
- Download from: https://github.com/tporadowski/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis:7-alpine`

## 🏃‍♂️ Running the Application

### Development Mode

#### Option 1: Using npm scripts (Recommended for development)

```bash
# Start all services with hot reload
npm run dev

# Or start services individually:
npm run dev:frontend  # In a separate terminal
npm run dev:backend   # In a separate terminal
```

#### Option 2: Using Docker Compose (Recommended for consistency)

```bash
# Start all services with Docker
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Option 3: Manual startup

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Auth Service:**
```bash
cd backend/auth-service
npm run dev
```

**Terminal 3 - Inventory Service:**
```bash
cd backend/inventory-service
npm run dev
```

**Terminal 4 - Notification Service:**
```bash
cd backend/notification-service
npm run dev
```

**Terminal 5 - Vendor Service:**
```bash
cd backend/vendor-service
npm run dev
```

### Production Mode

#### Using Docker Compose

```bash
# Build and start with production configuration
docker-compose -f docker-compose.prod.yml up --build

# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d
```

#### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Stop all processes
pm2 stop all
```

## 🧪 Testing

### Run All Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Individual Services

```bash
# Auth Service
cd backend/auth-service && npm test

# Inventory Service
cd backend/inventory-service && npm test

# Notification Service
cd backend/notification-service && npm test

# Vendor Service
cd backend/vendor-service && npm test
```

### API Testing with Postman

1. **Import Postman Collection** (if available):
   ```bash
   # Collection file should be in docs/postman/
   ```

2. **Test Authentication:**
   ```http
   POST http://localhost:3001/api/auth/register
   Content-Type: application/json

   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "TestPass123"
   }
   ```

3. **Test Login:**
   ```http
   POST http://localhost:3001/api/auth/login
   Content-Type: application/json

   {
     "email": "test@example.com",
     "password": "TestPass123"
   }
   ```

## 🚀 Production Deployment

### 1. Environment Preparation

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Use production environment file
cp .env.prod .env
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

### 3. Docker Production Deployment

```bash
# Build and start with production configuration
docker-compose -f docker-compose.prod.yml up --build -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Nginx Configuration

**Production Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... rest of configuration
}
```

### 5. SSL/TLS Setup

**Using Let's Encrypt:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem:** "Can't connect to MySQL server"
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

**Problem:** "Access denied for user"
```bash
# Reset MySQL root password
sudo mysql_secure_installation

# Grant privileges
mysql -u root -p
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Port Conflicts

**Problem:** "Port already in use"
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :3306

# Kill process using port
sudo kill -9 <PID>

# Or change port in .env file
PORT=3005
```

#### 3. Redis Connection Issues

**Problem:** "Redis connection refused"
```bash
# Check if Redis is running
sudo systemctl status redis

# Start Redis
sudo systemctl start redis

# Test Redis connection
redis-cli ping
```

#### 4. Docker Issues

**Problem:** "Cannot connect to Docker daemon"
```bash
# Start Docker service
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 5. Frontend Build Issues

**Problem:** "Module not found" or build errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear React cache
rm -rf build/
npm run build
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Set debug environment variable
export DEBUG=*

# Run with debug mode
npm run dev
```

**Check Service Logs:**
```bash
# Docker logs
docker-compose logs -f [service-name]

# PM2 logs
pm2 logs [service-name]

# Application logs
tail -f backend/[service-name]/logs/combined.log
```

## 📊 Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost/health

# Check individual services
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Inventory Service
curl http://localhost:3003/health  # Notification Service
curl http://localhost:3004/health  # Vendor Service
```

### Performance Monitoring

**Using PM2:**
```bash
# Monitor processes
pm2 monit

# Show process list
pm2 list

# Show resource usage
pm2 show [process-name]
```

**Using Docker Stats:**
```bash
# Show container resource usage
docker stats

# Show container processes
docker top [container-name]
```

## 🔄 Updates & Maintenance

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update package-name

# Check for outdated packages
npm outdated
```

### Database Migrations

```bash
# Backup database
mysqldump -u inventory_user -p inventory_db > backup.sql

# Apply migrations
mysql -u inventory_user -p inventory_db < migration.sql
```

### Log Rotation

```bash
# Setup logrotate for application logs
echo "/path/to/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 app app
    postrotate
        pm2 reload all > /dev/null 2>&1 || true
    endscript
}" | sudo tee /etc/logrotate.d/inventory-app
```

## 📞 Support

If you encounter issues not covered in this guide:

1. **Check the logs** for error messages
2. **Review the documentation** in the `docs/` directory
3. **Create an issue** in the repository with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

## 🎉 Success!

Once you have completed all the steps above, you should have a fully functional Inventory Management System running. You can access the application at:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:80

**Default Login Credentials:**
- **Admin**: admin@inventory.com / password123
- **User**: Use the registration form to create new users

Happy inventory managing! 📦✨