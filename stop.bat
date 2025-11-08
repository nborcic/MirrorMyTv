@echo off
echo ========================================
echo    MirrorMyTV - Stop Script
echo ========================================
echo.

echo [INFO] Stopping MirrorMyTV...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] MirrorMyTV has been stopped
    echo.
) else (
    echo.
    echo [ERROR] Failed to stop MirrorMyTV
    echo.
)

pause

