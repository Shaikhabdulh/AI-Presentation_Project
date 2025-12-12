# Inventory Management System

A modern, scalable inventory management system built with microservices architecture, featuring real-time notifications, vendor management, and a responsive React frontend.

## 🚀 Features

### Core Functionality
- **Real-time Inventory Tracking**: Monitor stock levels, track movements, and get instant updates
- **Smart Notifications**: Get alerts for low stock, expiring items, and vendor communications
- **Vendor Management**: Manage vendor relationships, track communications, and streamline procurement
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Dashboard Analytics**: Visual insights with charts, trends, and key metrics

### Technical Features
- **Microservices Architecture**: Scalable, maintainable, and independently deployable services
- **Real-time WebSocket**: Live notifications and updates using Socket.io
- **Containerized Deployment**: Docker support with orchestration
- **API Gateway**: Centralized routing and load balancing with Nginx
- **Database**: MySQL with optimized schema and relationships
- **Caching**: Redis for session management and performance

## 🏗️ Architecture

### Services
1. **Frontend Service** (Port 3000)
   - React + TypeScript + Tailwind CSS
   - Material-UI components
   - Real-time WebSocket client

2. **Auth Service** (Port 3001)
   - User registration and login
   - JWT token generation and validation
   - Password hashing with bcrypt

3. **Inventory Service** (Port 3002)
   - CRUD operations for inventory items
   - Stock level tracking and management
   - Low stock detection

4. **Notification Service** (Port 3003)
   - WebSocket server for real-time notifications
   - Email notifications
   - Scheduled tasks for periodic checks

5. **Vendor Service** (Port 3004)
   - Vendor registration and management
   - Contact history tracking
   - Vendor-inventory relationships

### Infrastructure
- **API Gateway**: Nginx for routing and load balancing
- **Database**: MySQL 8.0 for data persistence
- **Caching**: Redis for session and data caching
- **Containerization**: Docker with Docker Compose

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- MySQL 8.0 (or use Docker setup)
- Redis (or use Docker setup)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd inventory-management-system

# Install dependencies
npm run setup
```

### 2. Environment Configuration

Create `.env` files in each service directory:

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3003
```

**Backend Services (.env)**
```env
NODE_ENV=development
PORT=3001 # (3002, 3003, 3004 for other services)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=inventory_user
DB_PASSWORD=secure_password
JWT_SECRET=T0WDLjJUMPL9p4NeLLzA8zvm0zybReMB
REDIS_HOST=localhost
REDIS_PORT=6379
NOTIFICATION_SERVICE_URL=http://localhost:3003
```

### 3. Database Setup

**Option A: Docker Setup (Recommended)**
```bash
# Start MySQL and Redis with Docker
docker-compose up -d mysql redis

# Initialize database
cd database
npm install
npm run seed
```

**Option B: Local MySQL**
1. Create database and user:
```sql
CREATE DATABASE inventory_db;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'inventory_user'@'localhost';
```

2. Run initialization script:
```bash
cd database
mysql -u root -p < init.sql
npm install
npm run seed
```

### 4. Start Services

**Development Mode:**
```bash
# Start all services with hot reload
npm run dev
```

**Production Mode:**
```bash
# Build and start with Docker
docker-compose up --build
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:80
- **Individual Services**: Ports 3001-3004

## 📊 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Inventory Endpoints

```http
GET /api/inventory
Authorization: Bearer <token>

POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop",
  "quantity": 15,
  "min_threshold": 5,
  "unit": "units",
  "category": "Electronics"
}
```

### Vendor Endpoints

```http
GET /api/vendors
Authorization: Bearer <token>

POST /api/vendors/contact
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendor_id": 1,
  "inventory_ids": [1, 2],
  "message": "Need to order 10 more units",
  "contact_type": "email"
}
```

## 🗄️ Database Schema

### Core Tables

**users**: User authentication and profiles
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user'
);
```

**inventory**: Inventory items and stock tracking
```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 10,
  unit VARCHAR(20) NOT NULL,
  category VARCHAR(50)
);
```

**vendors**: Vendor information and contacts
```sql
CREATE TABLE vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  specialty VARCHAR(100)
);
```

**notifications**: Real-time notifications and alerts
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('low_stock', 'vendor_contact', 'system') NOT NULL,
  message TEXT NOT NULL,
  user_id INT,
  is_read BOOLEAN DEFAULT FALSE
);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Test individual services
cd backend/auth-service && npm test
cd backend/inventory-service && npm test
cd backend/notification-service && npm test
cd backend/vendor-service && npm test
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Start with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Monitoring & Logging

### Logging
- **Application Logs**: Each service writes to `logs/` directory
- **Docker Logs**: Use `docker-compose logs -f [service]`
- **Nginx Logs**: Access and error logs in `/var/log/nginx/`

### Health Checks
- Individual services: `GET /health`
- Overall system: `GET /health` on API gateway

## 🔧 Configuration

### Environment Variables

**Core Configuration:**
- `NODE_ENV`: Environment (development/production)
- `PORT`: Service port number
- `JWT_SECRET`: Secret key for JWT tokens

**Database Configuration:**
- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password

**Redis Configuration:**
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port

**Service URLs:**
- `NOTIFICATION_SERVICE_URL`: URL for notification service
- `FRONTEND_URL`: Frontend application URL

## 🚀 Scaling & Production

### Horizontal Scaling
1. **Load Balancing**: Use Nginx upstream configuration
2. **Database Scaling**: Implement read replicas
3. **Caching**: Use Redis cluster
4. **Service Scaling**: Deploy multiple instances

### Security Best Practices
1. **HTTPS**: Configure SSL/TLS certificates
2. **Environment Variables**: Never commit secrets
3. **Database Security**: Use connection pooling and prepared statements
4. **Rate Limiting**: Implement API rate limiting
5. **CORS**: Configure proper CORS policies

### Performance Optimization
1. **Database Indexing**: Optimize queries with indexes
2. **Caching**: Implement Redis caching
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MySQL
- **DevOps**: Docker + Nginx + Docker Compose

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

---

**Built with ❤️ using modern web technologies**# AI-Presentation_Project
