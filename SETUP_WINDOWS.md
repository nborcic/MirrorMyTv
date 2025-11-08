# Windows Setup Guide for MirrorMyTV

This guide will help you set up MirrorMyTV on Windows 10/11.

## Method 1: Docker (Recommended - Easiest)

### Step 1: Install Docker Desktop

1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Open Docker Desktop and ensure it's running

### Step 2: Run MirrorMyTV

1. Open PowerShell or Command Prompt in the project directory
2. Run:
   ```bash
   docker-compose up -d
   ```
3. Wait for the container to build and start
4. Open browser: http://localhost:3000

### Step 3: Find Your Network IP

1. Open PowerShell
2. Run: `ipconfig`
3. Find your IPv4 address (e.g., 192.168.1.100)
4. Access from other devices: `http://192.168.1.100:3000`

## Method 2: Native Installation (No Docker)

### Step 1: Install Node.js

1. Download Node.js 18+: https://nodejs.org/
2. Install with default settings
3. Verify: Open PowerShell and run `node --version`

### Step 2: Install FFmpeg

1. Download FFmpeg: https://www.gyan.dev/ffmpeg/builds/
2. Choose "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path" under System variables
   - Add: `C:\ffmpeg\bin`
   - Click OK and restart PowerShell
5. Verify: Run `ffmpeg -version` in PowerShell

### Step 3: Install Project Dependencies

1. Open PowerShell in project directory
2. Run:
   ```bash
   npm install
   ```

### Step 4: Start the Server

```bash
npm start
```

### Step 5: Access the Web Interface

Open browser: http://localhost:3000

## Windows Firewall Configuration

### Allow Port 3000

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "3000"
6. Select "Allow the connection"
7. Apply to all profiles
8. Name it "MirrorMyTV"

Or run this in PowerShell as Administrator:
```powershell
New-NetFirewallRule -DisplayName "MirrorMyTV" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Audio Configuration

### Enable Desktop Audio Capture

1. Open Windows Settings → System → Sound
2. Scroll to "Advanced sound options"
3. Enable "Allow applications to take exclusive control of this device"
4. Ensure your audio device is set as default

### Test Audio Capture

Run this in PowerShell:
```powershell
ffmpeg -list_devices true -f dshow -i dummy
```

You should see "desktop" listed under audio devices.

## Network Access from Other Devices

### Find Your IP Address

1. Open PowerShell
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter
4. Example: `192.168.1.100`

### Access from Phone/Tablet

1. Connect phone to same WiFi network
2. Open browser
3. Go to: `http://192.168.1.100:3000`

### Access from Another Computer

1. Connect to same network
2. Open browser
3. Go to: `http://YOUR_IP:3000`

## Troubleshooting

### "FFmpeg not found" Error

1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check PATH environment variable
3. Restart PowerShell/Command Prompt
4. Restart your computer if needed

### "Cannot capture audio" Error

1. Run PowerShell as Administrator
2. Run: `ffmpeg -list_devices true -f dshow -i dummy`
3. Check if "desktop" is listed
4. If not, update Windows audio drivers
5. Try running the server as Administrator

### "Port 3000 already in use" Error

1. Find what's using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Kill the process or change port in `server.js`

### Can't Access from Other Devices

1. Check Windows Firewall settings
2. Verify you're on the same network
3. Try pinging your computer from another device
4. Check if antivirus is blocking the connection

### High CPU Usage

1. Reduce bitrate in `server.js` (change `-b:v 8000k` to `-b:v 4000k`)
2. Lower frame rate (change `-framerate 60` to `-framerate 30`)
3. Use HLS mode instead of RTMP

### Stream Quality Issues

1. Check your WiFi speed: https://fast.com
2. Increase bitrate in `server.js`
3. Ensure no other heavy network usage
4. Try wired connection instead of WiFi

## Performance Optimization

### For Best Quality (HLS Mode)

1. Edit `server.js`
2. Uncomment HLS configuration (lines 67-86)
3. Comment out RTMP configuration (lines 50-65)
4. Restart server

### For Lowest Latency (RTMP Mode)

1. Install nginx-rtmp:
   ```bash
   docker run -d -p 1935:1935 -p 8080:8080 tiangolo/nginx-rtmp
   ```
2. Edit `server.js` to use RTMP output
3. Access stream at: `http://localhost:8080/live/stream`

### Custom FFmpeg Settings

Edit these values in `server.js`:

```javascript
'-b:v', '8000k',      // Video bitrate (higher = better quality)
'-framerate', '60',   // Frame rate (30 or 60)
'-b:a', '256k',       // Audio bitrate (128k, 192k, 256k, 320k)
'-preset', 'fast',    // Encoding speed (ultrafast, fast, medium, slow)
```

## Advanced: Running as Windows Service

### Using NSSM (Non-Sucking Service Manager)

1. Download NSSM: https://nssm.cc/download
2. Extract to `C:\nssm`
3. Run PowerShell as Administrator:
   ```powershell
   cd C:\nssm\win64
   .\nssm.exe install MirrorMyTV
   ```
4. Configure:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\path\to\MirrorMyTV\server.js`
   - Working directory: `C:\path\to\MirrorMyTV`
5. Start service: `.\nssm.exe start MirrorMyTV`

## Quick Commands Reference

```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Start without Docker
npm start

# Development mode
npm run dev

# Check FFmpeg
ffmpeg -version

# List audio devices
ffmpeg -list_devices true -f dshow -i dummy

# Find IP address
ipconfig

# Check port
netstat -ano | findstr :3000
```

## Need Help?

1. Check the main README.md
2. Review server logs
3. Verify all prerequisites are installed
4. Test FFmpeg independently
5. Check Windows Event Viewer for errors

---

**Happy Streaming!** 🎬📺

