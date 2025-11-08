@echo off
echo ========================================
echo    MirrorMyTV - View Logs
echo ========================================
echo.

echo [INFO] Showing MirrorMyTV logs...
echo Press Ctrl+C to exit
echo.

docker-compose logs -f

