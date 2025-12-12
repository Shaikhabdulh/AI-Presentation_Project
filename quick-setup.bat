services:
  mysql:
    image: mysql:8.0
    container_name: inventory-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: inventory_db
      MYSQL_USER: inventory_user
      MYSQL_PASSWORD: secure_password
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

  redis:
    image: redis:7-alpine
    container_name: inventory-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - inventory-network

  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile
    container_name: auth-service
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=inventory_db
      - DB_USER=inventory_user
      - DB_PASSWORD=secure_password
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - inventory-network

  inventory-service:
    build:
      context: ./backend/inventory-service
      dockerfile: Dockerfile
    container_name: inventory-service
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=inventory_db
      - DB_USER=inventory_user
      - DB_PASSWORD=secure_password
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - NOTIFICATION_SERVICE_URL=http://notification-service:3003
    ports:
      - "3002:3002"
    depends_on:
      mysql:
        condition: service_healthy
      auth-service:
        condition: service_started
    networks:
      - inventory-network

  notification-service:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    container_name: notification-service
    environment:
      - NODE_ENV=development
      - PORT=3003
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=inventory_db
      - DB_USER=inventory_user
      - DB_PASSWORD=secure_password
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "3003:3003"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - inventory-network

  vendor-service:
    build:
      context: ./backend/vendor-service
      dockerfile: Dockerfile
    container_name: vendor-service
    environment:
      - NODE_ENV=development
      - PORT=3004
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=inventory_db
      - DB_USER=inventory_user
      - DB_PASSWORD=secure_password
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - NOTIFICATION_SERVICE_URL=http://notification-service:3003
    ports:
      - "3004:3004"
    depends_on:
      mysql:
        condition: service_healthy
      auth-service:
        condition: service_started
    networks:
      - inventory-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: inventory-frontend
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=http://localhost:3001
      - REACT_APP_WS_URL=ws://localhost:3003
    ports:
      - "3000:3000"
    depends_on:
      - auth-service
      - inventory-service
      - notification-service
      - vendor-service
    networks:
      - inventory-network

volumes:
  mysql_data:
  redis_data:

networks:
  inventory-network:
    driver: bridge