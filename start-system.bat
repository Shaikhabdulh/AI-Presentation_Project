@echo off
echo ========================================
echo Starting Inventory Management System
echo ========================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo.
echo Step 1: Starting MySQL and Redis...
echo.

REM Start MySQL and Redis
docker-compose -f docker-compose.yml up -d mysql redis

REM Wait for MySQL to be ready
echo Waiting for MySQL to be ready...
:wait_mysql
docker exec inventory-mysql mysql -u inventory_user -psecure_password -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo MySQL not ready yet, waiting...
    timeout /t 5 /nobreak >nul
    goto wait_mysql
)
echo MySQL is ready!

echo.
echo Step 2: Seeding database...
echo.

REM Run database seeder
cd database
if not exist node_modules (
    echo Installing database dependencies...
    npm install
)

REM Try seeding with retry
echo Seeding database...
:retry_seed
node seed.js
if errorlevel 1 (
    echo Seeding failed, retrying in 5 seconds...
    timeout /t 5 /nobreak >nul
    goto retry_seed
)
echo Database seeded successfully!

echo.
echo Step 3: Starting all services...
echo.

REM Start all services
cd ..
docker-compose -f docker-compose.yml up -d

echo.
echo Waiting for all services to start...
echo This may take 2-3 minutes...

REM Wait for all services to be ready
timeout /t 30 /nobreak >nul

echo.
echo ========================================
echo System Status Check
echo ========================================

echo Checking service health...
docker-compose -f docker-compose.yml ps

echo.
echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Access your application at:
echo   http://localhost:3000
echo.
echo Default login:
echo   Email: admin@inventory.com
echo   Password: password123
echo.
echo To view logs:
echo   docker-compose -f docker-compose.yml logs -f
echo.
echo To stop all services:
echo   docker-compose -f docker-compose.yml down
echo.
echo ========================================
pause