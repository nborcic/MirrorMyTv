# MirrorMyTV - Multi-Stream Guide

## 🎉 New Features

### Multi-Stream Architecture
- **Multiple clients** can now watch different windows simultaneously
- Each client gets their own unique stream ID
- Up to **10 concurrent streams** supported
- GPU hardware encoding (NVIDIA NVENC) for efficient streaming

## 🚀 How It Works

### For Server (Your PC):
1. Run the server with `run-native.bat` or `start.bat`
2. Access at `http://localhost:3000` or `http://10.0.0.15:3000`
3. Use the **Server Admin** panel to:
   - View all active streams
   - See which clients are watching what
   - Stop all streams at once

### For Clients (Phones/Tablets):
1. Connect to `http://10.0.0.15:3000` (your server IP)
2. Each device gets a unique **Client ID**
3. Select a window to watch
4. Start your own independent stream
5. Watch your chosen window without affecting others

## 📋 Key Features

### ✅ Multi-Stream Support
- Each client can watch a different window
- Independent stream control per client
- No interference between streams

### ✅ GPU Hardware Encoding
- Uses NVIDIA NVENC (3080 Ti)
- Much more efficient than CPU encoding
- Can handle 5-10 concurrent streams easily

### ✅ Window-Specific Capture
- Captures only the selected window
- More efficient than full desktop capture
- Better performance per stream

### ✅ Server Admin Panel
- View all active streams
- See client IDs and stream durations
- Stop all streams with one click
- Monitor system usage

## 🎮 Usage Examples

### Scenario 1: Multiple Viewers
- **Server PC**: Shows all windows
- **Phone 1**: Watches Chrome browser
- **Phone 2**: Watches VLC player
- **Tablet**: Watches Notepad
- All watching **different windows simultaneously**!

### Scenario 2: Server Control
- Server can see all 3 active streams
- Server can stop all streams at once
- Each client controls only their own stream

## 🔧 Technical Details

### Stream Management
- Unique directory per client: `/stream/{clientId}/`
- Separate HLS playlists per stream
- Automatic cleanup when streams stop
- Session tracking with Map data structure

### API Endpoints
- `GET /api/client-id` - Get unique client ID
- `POST /api/stream/start` - Start client's stream
- `POST /api/stream/stop` - Stop client's stream
- `GET /api/streams/all` - Get all active streams (admin)
- `POST /api/streams/stop-all` - Stop all streams (admin)

### Performance
- **CPU**: ~10-15% per stream (7800X3D)
- **GPU**: Hardware encoding (3080 Ti)
- **RAM**: ~200-500MB per stream
- **Bandwidth**: ~8-10 Mbps per stream
- **Capacity**: 5-10 concurrent streams easily

## 🛠️ Requirements

### Hardware
- NVIDIA GPU with NVENC support (for hardware encoding)
- 8GB+ RAM recommended
- Good network bandwidth for multiple streams

### Software
- Node.js 18+
- FFmpeg with NVENC support
- Windows (for gdigrab capture)

## 📱 Access from Phone

1. Make sure phone is on same WiFi network
2. Open browser on phone
3. Go to: `http://10.0.0.15:3000` (replace with your PC's IP)
4. You'll see your unique Client ID
5. Select a window and start watching!

## 🎯 Tips

- **Server PC**: Use for monitoring and control
- **Clients**: Each gets independent control
- **Admin Panel**: Refresh to see latest stream status
- **Stop All**: Use when you need to restart everything

## 🔍 Troubleshooting

### "Maximum number of streams reached"
- Limit is 10 concurrent streams
- Stop unused streams first
- Or increase MAX_STREAMS in server.js

### Stream not starting
- Check FFmpeg is installed
- Verify GPU supports NVENC
- Check window title matches exactly

### Can't connect from phone
- Verify same WiFi network
- Check firewall allows port 3000
- Try server's local IP address

## 🎨 UI Features

- **Client ID Display**: Shows your unique ID
- **Window Selection**: Click to choose what to watch
- **Stream Status**: Real-time status indicator
- **Admin Panel**: Monitor all streams
- **Video Player**: HLS streaming with controls

---

**Enjoy your multi-stream MirrorMyTV setup!** 🎉

