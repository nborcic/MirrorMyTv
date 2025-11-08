@echo off
echo ========================================
echo    MirrorMyTV - Native Mode (Windows)
echo ========================================
echo.

echo [INFO] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js is installed
echo.

echo [INFO] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] FFmpeg is not installed!
    echo.
    echo Please install FFmpeg:
    echo 1. Download from: https://www.gyan.dev/ffmpeg/builds/
    echo 2. Extract to C:\ffmpeg
    echo 3. Add C:\ffmpeg\bin to PATH
    echo.
    pause
    exit /b 1
)

echo [INFO] FFmpeg is installed
echo.

echo [INFO] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Starting MirrorMyTV...
echo.
echo ========================================
echo    MirrorMyTV is now running!
echo ========================================
echo.
echo Access the web interface at:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

