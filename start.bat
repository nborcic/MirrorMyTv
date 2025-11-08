@echo off
echo ========================================
echo    MirrorMyTV - Quick Start Script
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo.
    echo Please install Docker Desktop for Windows:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker is installed
echo [INFO] Starting MirrorMyTV...
echo.

REM Start Docker Compose
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    MirrorMyTV is now running!
    echo ========================================
    echo.
    echo Access the web interface at:
    echo   http://localhost:3000
    echo.
    echo To view logs, run:
    echo   docker-compose logs -f
    echo.
    echo To stop, run:
    echo   docker-compose down
    echo.
) else (
    echo.
    echo [ERROR] Failed to start MirrorMyTV
    echo Please check the logs: docker-compose logs
    echo.
)

pause

