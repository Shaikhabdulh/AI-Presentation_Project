# Inventory Management System - Architecture Design

## Microservices Architecture

### Core Services

1. **Authentication Service** (Port: 3001)
   - User registration and login
   - JWT token generation and validation
   - Password hashing and security
   - User profile management

2. **Inventory Service** (Port: 3002)
   - CRUD operations for inventory items
   - Stock level tracking
   - Low stock detection
   - Inventory history/logs

3. **Notification Service** (Port: 3003)
   - WebSocket server for real-time notifications
   - Email notifications
   - Low inventory alerts
   - Vendor contact notifications

4. **Vendor Service** (Port: 3004)
   - Vendor registration
   - Vendor profile management
   - Contact information handling
   - Vendor-inventory associations

### Frontend Application (Port: 3000)
- React + TypeScript + Tailwind CSS
- Material-UI components
- Real-time notifications via WebSocket
- Responsive design

## Database Schema (MySQL)

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Inventory Table
```sql
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL DEFAULT 10,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Vendors Table
```sql
CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Vendor_Inventory Table (Many-to-Many)
```sql
CREATE TABLE vendor_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    inventory_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    UNIQUE KEY unique_vendor_item (vendor_id, inventory_id)
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('low_stock', 'vendor_contact', 'system') NOT NULL,
    message TEXT NOT NULL,
    user_id INT,
    vendor_id INT,
    inventory_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);
```

### Contact_History Table
```sql
CREATE TABLE contact_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    inventory_id INT NOT NULL,
    message TEXT NOT NULL,
    contact_type ENUM('email', 'phone', 'in_person') DEFAULT 'email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);
```

## API Gateway Configuration

### Routes
- `/api/auth/*` → Authentication Service
- `/api/inventory/*` → Inventory Service
- `/api/notifications/*` → Notification Service
- `/api/vendors/*` → Vendor Service
- `/ws/*` → WebSocket connections to Notification Service

## Technology Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + Material-UI
- React Router v6
- Axios for HTTP requests
- Socket.io-client for WebSocket

### Backend Services
- Node.js + Express
- JWT for authentication
- Socket.io for WebSocket
- MySQL for database
- Docker for containerization

### Development Tools
- ESLint + Prettier
- Nodemon for development
- Concurrently for running multiple services
- Faker.js for dummy data

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Password hashing with bcrypt
   - Input validation and sanitization

2. **Authorization**
   - Role-based access control
   - API endpoint protection

3. **Data Security**
   - Environment variables for sensitive data
   - SQL injection prevention
   - HTTPS in production

## Scalability Features

1. **Horizontal Scaling**
   - Stateless services
   - Load balancing support
   - Database connection pooling

2. **Caching**
   - Redis for session management
   - API response caching

3. **Monitoring**
   - Health check endpoints
   - Logging with Winston
   - Error tracking

## Development Workflow

1. **Setup**
   - Docker Compose for local development
   - Hot reload for all services
   - Database migrations

2. **Testing**
   - Unit tests for each service
   - Integration tests
   - API testing with Postman

3. **Deployment**
   - CI/CD pipeline ready
   - Kubernetes manifests
   - Environment-specific configurations