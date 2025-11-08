@echo off
echo ========================================
echo    Finding Audio Devices
echo ========================================
echo.

echo Listing all audio input devices...
echo.

ffmpeg -list_devices true -f dshow -i dummy 2>&1 | findstr /C:"audio"

echo.
echo ========================================
echo.
echo Copy the device name and update server.js
echo Look for the line with: -i 'audio="DEVICE_NAME"'
echo.
pause

