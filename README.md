# 📺 MirrorMyTV

High-quality screen mirroring solution with audio for your local network. Stream any Windows application window to any device on your home network with 60 FPS and crystal-clear audio.

## ✨ Features

- 🎯 **Window Selection**: Choose specific applications to mirror
- 🎬 **60 FPS Streaming**: Smooth, high-quality video output
- 🔊 **System Audio**: Captures desktop audio automatically
- 🌐 **Local Network**: Accessible from any device on your home network
- 🐳 **Docker Ready**: Easy deployment with Docker
- 💎 **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- ⚡ **Low Latency**: Optimized for real-time streaming

## 🚀 Quick Start

### Prerequisites

- Windows 10/11
- Docker Desktop for Windows
- FFmpeg (will be installed via Docker)
- Node.js 18+ (for local development)

### Installation

1. **Clone or download this repository**

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the web interface**
   - Open your browser and go to: `http://localhost:3000`
   - Or access from any device on your network: `http://YOUR_COMPUTER_IP:3000`

### Usage

1. **Refresh Windows**: Click "Refresh Windows" to see all running applications
2. **Select Window**: Click on the application you want to mirror
3. **Start Streaming**: Click "Start Streaming" button
4. **View Stream**: The stream will appear in the video player
5. **Stop Streaming**: Click "Stop Streaming" when done

## 🛠️ Development

### Run without Docker

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install FFmpeg on Windows**
   - Download from: https://ffmpeg.org/download.html
   - Add to PATH environment variable

3. **Start the server**
   ```bash
   npm start
   ```

### Development mode with auto-reload
```bash
npm run dev
```

## 📡 Streaming Modes

### RTMP Mode (Current - Low Latency)
- Uses RTMP protocol
- Lower latency (~500ms)
- Requires RTMP server (nginx-rtmp)
- Best for: Real-time interaction

### HLS Mode (Maximum Quality)
To enable HLS mode for maximum quality:

1. Edit `server.js`
2. Uncomment the HLS ffmpeg configuration
3. Comment out the RTMP configuration
4. Restart the server

HLS provides:
- Higher quality (12-15 Mbps)
- Better compression
- ~2-3 second latency
- Best for: Maximum quality streaming

## 🔧 Configuration

### Environment Variables

Create a `.env` file to customize:

```env
PORT=3000
NODE_ENV=production
```

### FFmpeg Settings

Edit `server.js` to adjust:

- **Bitrate**: Change `-b:v` value (default: 8000k)
- **Frame Rate**: Change `-framerate` value (default: 60)
- **Audio Quality**: Change `-b:a` value (default: 256k)
- **Preset**: Change `-preset` value (ultrafast, fast, medium, slow)

## 📱 Access from Other Devices

1. **Find your computer's IP address**
   - Open Command Prompt
   - Run: `ipconfig`
   - Look for "IPv4 Address"

2. **Access from any device**
   - Open browser on phone/tablet/laptop
   - Go to: `http://YOUR_IP:3000`
   - Make sure you're on the same WiFi network

## 🐳 Docker Commands

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View running containers
docker ps
```

## 🔍 Troubleshooting

### FFmpeg not found
- Ensure FFmpeg is installed and in PATH
- Docker image includes FFmpeg automatically

### Can't capture audio
- Check Windows audio settings
- Ensure desktop audio is enabled
- Try running as administrator

### Stream not starting
- Check if window title matches exactly
- Verify FFmpeg is working: `ffmpeg -version`
- Check server logs: `docker-compose logs -f`

### Can't access from other devices
- Check Windows Firewall settings
- Ensure port 3000 is open
- Verify you're on the same network
- Try using your computer's IP instead of localhost

### High CPU usage
- Reduce bitrate in `server.js`
- Lower frame rate to 30 FPS
- Use HLS mode instead of RTMP

## 🎨 Customization

### Change UI Theme
Edit `public/index.html` and modify the Tailwind CSS classes.

### Add Authentication
Add middleware in `server.js`:
```javascript
app.use((req, res, next) => {
  // Add your auth logic here
  next();
});
```

### Customize Video Player
Edit `public/app.js` and modify the video player configuration.

## 📊 Performance Tips

1. **For best quality**: Use HLS mode with medium preset
2. **For low latency**: Use RTMP mode with ultrafast preset
3. **Reduce CPU**: Lower bitrate or frame rate
4. **Better audio**: Increase audio bitrate to 320k

## 🔒 Security Notes

- This application is designed for **local network use only**
- No authentication is included by default
- Do not expose to the internet without proper security
- Consider adding authentication for production use

## 📝 License

MIT License - feel free to use and modify as needed

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 💡 Tips

- **For gaming**: Use RTMP mode with 60 FPS
- **For presentations**: Use HLS mode for better quality
- **Multiple monitors**: Select specific windows to avoid mirroring everything
- **Bandwidth**: Adjust bitrate based on your network speed

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify FFmpeg installation
3. Check Windows audio permissions
4. Ensure port 3000 is not blocked

---

**Enjoy your screen mirroring!** 🎉

