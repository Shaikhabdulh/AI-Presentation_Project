# Inventory Management System - Complete Setup Guide

## Project Overview

A modern, scalable inventory management platform with:
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Shadcn/ui (Radix-based)
- **State Management**: Zustand (lightweight, performant)
- **Notifications**: Real-time WebSocket support
- **Backend Services**: Node.js/NestJS microservices
- **Database**: MySQL 8.0+
- **Containerization**: Docker & Docker Compose
- **Architecture**: SOLID principles, microservices pattern

## Project Structure

```
inventory-management-system/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Zustand stores
│   │   ├── services/           # API services
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── auth-service/           # User authentication
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── inventory-service/      # Stock management
│   ├── notification-service/   # Alerts & notifications
│   ├── vendor-service/         # Vendor management
│   └── api-gateway/            # Central routing
│
├── database/
│   ├── init.sql                # Database schema
│   ├── seeders.js              # Dummy data generation
│   └── docker-compose.yml
│
├── docker-compose.yml          # Full stack orchestration
└── README.md
```

## Technology Decisions & Rationale

### Frontend

#### React 18 + TypeScript
- **Why**: Industry standard, huge ecosystem, excellent DevTools
- **Better than alternatives?**: Yes - Vue good for simple apps, but React dominates enterprise. Next.js overkill for this scope.

#### Tailwind CSS + Shadcn/ui
- **Why**: Utility-first CSS with pre-built accessible components (built on Radix UI)
- **Better than alternatives?**: Yes - Material UI is heavier, Bootstrap less modern. Shadcn offers best balance.

#### Zustand for State Management
- **Why**: Minimal boilerplate, tiny bundle (2KB), perfect for medium apps
- **Better than Redux?**: Yes for this project - Redux adds ~12KB+ overhead. Zustand ideal for notifications + auth state.

#### Vite as Build Tool
- **Why**: 10x faster than CRA, modern ES modules, built-in SSR support
- **Better than alternatives?**: Yes - CRA outdated, slow. Vite = modern standard.

### Backend

#### NestJS for Microservices
- **Why**: TypeScript-first, dependency injection, built-in validation, scalable
- **Better than Express?**: Yes for this project - architectural guidance, testing, validation built-in

#### Socket.io for Real-time Notifications
- **Why**: Fallback-friendly, works through firewalls, perfect for alerts
- **Better than alternatives?**: Yes - WebSockets alone fragile, Server-Sent Events unidirectional

#### JWT Authentication
- **Why**: Stateless, scalable across services, standard in microservices
- **Better than Sessions?**: Yes - sessions don't scale in microservices

### Database

#### MySQL 8.0
- **Why**: ACID compliance, proven reliability, good for relational inventory data
- **Better than PostgreSQL?**: PostgreSQL slightly better, but MySQL perfect here

### Infrastructure

#### Docker + Docker Compose
- **Why**: Containerization for consistency, easy local development
- **Better than Kubernetes for MVP?**: Yes - Compose simpler for development, can scale to K8s later

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MySQL client (for CLI access)
- Git

### Step 1: Clone & Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend services (for each)
cd ../backend/auth-service
npm install
# Repeat for other services
```

### Step 2: Environment Configuration

#### `.env.frontend`
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3001
```

#### `.env.backend`
```
DATABASE_HOST=mysql
DATABASE_USER=inventory_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=inventory_db
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Step 3: Database Setup

```bash
# Start MySQL
docker-compose up -d mysql

# Initialize schema
docker exec inventory-mysql mysql -u root -p < database/init.sql

# Seed dummy data
node database/seeders.js
```

### Step 4: Start All Services

```bash
# Option A: Docker Compose (recommended)
docker-compose up -d

# Option B: Manual (development)
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Auth service
cd backend/auth-service && npm run start:dev

# Terminal 3: Inventory service
cd backend/inventory-service && npm run start:dev

# Terminal 4: Notification service
cd backend/notification-service && npm run start:dev

# Terminal 5: API Gateway
cd backend/api-gateway && npm run start:dev
```

---

## API Endpoints Reference

### Authentication Service (Port 3100)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT
- `GET /auth/verify` - Verify token

### Inventory Service (Port 3101)
- `GET /inventory` - Get all items
- `POST /inventory` - Add item
- `PATCH /inventory/:id` - Update quantity
- `GET /inventory/low-stock` - Get low stock items

### Notification Service (Port 3102)
- `GET /notifications` - Get user notifications
- `POST /notifications/mark-read` - Mark as read
- `WebSocket /notifications/subscribe` - Real-time updates

### Vendor Service (Port 3103)
- `POST /vendors/register` - Vendor registration
- `GET /vendors` - List all vendors
- `GET /vendors/:id/requests` - Contact requests for vendor

### API Gateway (Port 3000)
- Routes all `/api/*` requests to appropriate services

---

## Design Patterns & SOLID Principles

### Single Responsibility Principle (SRP)
- **Auth Service**: Only handles user authentication & JWT
- **Inventory Service**: Only manages stock & calculations
- **Notification Service**: Only broadcasts alerts & stores notification history
- **Vendor Service**: Only manages vendor profiles & contact requests

### Dependency Injection
```typescript
// Example: NestJS constructor injection
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly notificationClient: NotificationClient
  ) {}
}
```

### Repository Pattern
- Database operations abstracted in repository layer
- Services never touch database directly
- Easy to swap databases or add caching

### Observer Pattern (for Notifications)
- Services emit events when inventory drops below threshold
- Notification service listens and broadcasts to connected clients

---

## Development Workflow

### For Features
1. Create feature branch
2. Implement in appropriate service
3. Write unit tests (`*.spec.ts`)
4. Create/update API endpoint
5. Frontend consumes via service layer
6. Test in Docker environment

### For Database Changes
1. Update `database/init.sql`
2. Create migration script if needed
3. Re-seed dummy data
4. Update TypeScript types

### Testing
```bash
# Backend unit tests
npm test

# Integration tests
npm run test:e2e

# Frontend tests
npm run test:ui
```

---

## Deployment Checklist

- [ ] All services have `.env.production`
- [ ] Database backups enabled
- [ ] HTTPS/TLS configured
- [ ] CORS properly configured per service
- [ ] Logging centralized (consider ELK stack)
- [ ] Rate limiting enabled on API Gateway
- [ ] Secrets managed via environment variables or secret manager
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Health check endpoints on all services
- [ ] Database connection pooling configured

---

## Performance Considerations

### Frontend
- Code splitting with React.lazy()
- Image optimization with next-gen formats
- Lazy loading lists with Virtualization
- State updates batched with Zustand

### Backend
- Database query optimization with indexes
- Caching layer (Redis) for frequently accessed data
- Connection pooling for database
- Rate limiting per user

### Database
- Indexes on `user_id`, `vendor_id`, `inventory_id`
- Partitioning inventory logs by date
- Archive old notifications

---

## Security Best Practices

1. **Authentication**: JWT with 1-hour expiry, refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Data Validation**: Input validation on all APIs
4. **Password Hashing**: bcrypt with salt rounds 10+
5. **CORS**: Whitelist only frontend origin
6. **Rate Limiting**: 100 requests per minute per IP
7. **SQL Injection Prevention**: Parameterized queries/ORMs
8. **Secrets Management**: Never commit `.env` files

---

## Monitoring & Logging

### What to Monitor
- API response times
- Error rates per service
- Database query performance
- WebSocket connection count
- JWT validation failures

### Recommended Tools
- **Logging**: Winston (backend), Console (frontend)
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry
- **APM**: New Relic or DataDog

---

## Next Steps for Production

1. **Add Redis**: Caching for inventory, session store
2. **Message Queue**: RabbitMQ/Kafka for async notifications
3. **Kubernetes**: Scale beyond Docker Compose
4. **CI/CD**: GitHub Actions for automated testing & deployment
5. **Load Balancing**: Nginx reverse proxy
6. **Database Replication**: Master-slave setup for high availability
7. **API Documentation**: Swagger/OpenAPI
8. **Feature Flags**: For gradual rollouts

---

## Support & Troubleshooting

### Common Issues

**Services can't communicate?**
- Check Docker network: `docker network ls`
- Ensure service names match in docker-compose.yml

**Database connection refused?**
- Wait 10 seconds for MySQL startup
- Check credentials in .env

**Port already in use?**
- Change ports in docker-compose.yml
- Or kill process: `lsof -i :3000` then `kill -9 <PID>`

**JWT token invalid?**
- Check JWT_SECRET consistency across services
- Verify token expiry time

---

## Contact & Contributors

For issues or improvements, please open an issue on the repository.

---

**Last Updated**: December 12, 2025
**Version**: 1.0.0-beta
