const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Error logging system
const ERRORS_FILE = 'errors.json';

function logError(errorType, details, clientId = null) {
  try {
    let errors = { errors: [], lastUpdated: null };
    
    // Read existing errors if file exists
    if (fs.existsSync(ERRORS_FILE)) {
      const data = fs.readFileSync(ERRORS_FILE, 'utf8');
      errors = JSON.parse(data);
    }
    
    // Add new error
    const errorEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: errorType,
      details: details,
      clientId: clientId
    };
    
    errors.errors.push(errorEntry);
    errors.lastUpdated = new Date().toISOString();
    
    // Keep only last 100 errors to prevent file from growing too large
    if (errors.errors.length > 100) {
      errors.errors = errors.errors.slice(-100);
    }
    
    // Write back to file
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2));
    console.log(`[ERROR LOG] ${errorType}: ${details.substring(0, 100)}...`);
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Session management for multiple streams
const activeStreams = new Map(); // clientId -> { process, windowId, windowTitle, startTime }
const MAX_STREAMS = 10; // Maximum concurrent streams

// Get list of available windows (Windows-specific)
app.get('/api/windows', async (req, res) => {
  try {
    const windows = await getAllWindows();
    res.json(windows);
  } catch (error) {
    console.error('Error fetching windows:', error);
    logError('Window Fetch API Error', `Failed to fetch windows: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch windows' });
  }
});

// Generate unique client ID
app.get('/api/client-id', (req, res) => {
  res.json({ clientId: uuidv4() });
});

// Start streaming for a specific client
app.post('/api/stream/start', async (req, res) => {
  const { windowId, windowTitle, clientId } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }
  
  // Check if client already has a stream
  if (activeStreams.has(clientId)) {
    return res.status(400).json({ error: 'Stream already running for this client' });
  }
  
  // Check stream limit
  if (activeStreams.size >= MAX_STREAMS) {
    return res.status(429).json({ error: 'Maximum number of streams reached' });
  }
  
  try {
    await startStream(clientId, windowId, windowTitle);
    res.json({ success: true, message: 'Stream started', clientId });
  } catch (error) {
    console.error('Error starting stream:', error);
    logError('Stream Start Error', `Failed to start stream for client ${clientId}: ${error.message}`, clientId);
    res.status(500).json({ error: error.message || 'Failed to start stream' });
  }
});

// Stop streaming for a specific client
app.post('/api/stream/stop', (req, res) => {
  const { clientId } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }
  
  const stream = activeStreams.get(clientId);
  if (!stream) {
    return res.status(404).json({ error: 'No active stream found for this client' });
  }
  
  stopStream(clientId);
  res.json({ success: true, message: 'Stream stopped' });
});

// Get status of a specific client's stream
app.get('/api/stream/status/:clientId', (req, res) => {
  const { clientId } = req.params;
  const stream = activeStreams.get(clientId);
  
  res.json({
    isActive: stream !== undefined,
    windowId: stream?.windowId || null,
    windowTitle: stream?.windowTitle || null,
    startTime: stream?.startTime || null
  });
});

// Get all active streams (admin endpoint)
app.get('/api/streams/all', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([clientId, stream]) => ({
    clientId,
    windowId: stream.windowId,
    windowTitle: stream.windowTitle,
    startTime: stream.startTime,
    duration: Date.now() - stream.startTime
  }));
  
  res.json({ streams, total: streams.length, max: MAX_STREAMS });
});

// Stop all streams (admin endpoint)
app.post('/api/streams/stop-all', (req, res) => {
  const clientIds = Array.from(activeStreams.keys());
  clientIds.forEach(clientId => stopStream(clientId));
  
  res.json({ success: true, message: `Stopped ${clientIds.length} stream(s)` });
});

// Get error log (admin endpoint)
app.get('/api/errors', (req, res) => {
  try {
    if (!fs.existsSync(ERRORS_FILE)) {
      return res.json({ errors: [], lastUpdated: null });
    }
    
    const data = fs.readFileSync(ERRORS_FILE, 'utf8');
    const errors = JSON.parse(data);
    res.json(errors);
  } catch (error) {
    console.error('Error reading error log:', error);
    res.status(500).json({ error: 'Failed to read error log' });
  }
});

// Clear error log (admin endpoint)
app.post('/api/errors/clear', (req, res) => {
  try {
    const emptyLog = { errors: [], lastUpdated: new Date().toISOString() };
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(emptyLog, null, 2));
    res.json({ success: true, message: 'Error log cleared' });
  } catch (error) {
    console.error('Error clearing error log:', error);
    res.status(500).json({ error: 'Failed to clear error log' });
  }
});

// Cache for window titles to reduce API calls
const windowTitleCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

// Get all available windows with caching
async function getAllWindows() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const command = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object Id, MainWindowTitle | ConvertTo-Json"`;
    const { stdout } = await execAsync(command);
    const windows = JSON.parse(stdout);
    
    return Array.isArray(windows) ? windows : [windows];
  } catch (error) {
    console.error('Error fetching windows:', error);
    return [];
  }
}

// Find window with multiple fallback strategies
async function findWindow(targetTitle) {
  const windows = await getAllWindows();
  
  if (windows.length === 0) {
    return null;
  }
  
  // Strategy 1: Exact match
  let match = windows.find(w => w.MainWindowTitle === targetTitle);
  if (match) {
    console.log(`[Window Match] Exact match found: ${targetTitle}`);
    return match;
  }
  
  // Strategy 2: Case-insensitive match
  match = windows.find(w => w.MainWindowTitle.toLowerCase() === targetTitle.toLowerCase());
  if (match) {
    console.log(`[Window Match] Case-insensitive match found: ${match.MainWindowTitle}`);
    return match;
  }
  
  // Strategy 3: Partial match (window title contains target)
  match = windows.find(w => w.MainWindowTitle.includes(targetTitle));
  if (match) {
    console.log(`[Window Match] Partial match found: ${match.MainWindowTitle}`);
    return match;
  }
  
  // Strategy 4: Reverse partial match (target contains window title)
  match = windows.find(w => targetTitle.includes(w.MainWindowTitle));
  if (match) {
    console.log(`[Window Match] Reverse partial match found: ${match.MainWindowTitle}`);
    return match;
  }
  
  // Strategy 5: Fuzzy match - find window with most common words
  const targetWords = targetTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const window of windows) {
    const windowWords = window.MainWindowTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const commonWords = targetWords.filter(word => windowWords.includes(word));
    const score = commonWords.length / Math.max(targetWords.length, windowWords.length);
    
    if (score > bestScore && score >= 0.5) { // At least 50% match
      bestScore = score;
      bestMatch = window;
    }
  }
  
  if (bestMatch) {
    console.log(`[Window Match] Fuzzy match found (${(bestScore * 100).toFixed(0)}%): ${bestMatch.MainWindowTitle}`);
    return bestMatch;
  }
  
  console.log(`[Window Match] No match found for: ${targetTitle}`);
  return null;
}

// Get suggestions for similar window titles
async function getWindowSuggestions(targetTitle, limit = 3) {
  const windows = await getAllWindows();
  const targetWords = targetTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const suggestions = windows.map(window => {
    const windowWords = window.MainWindowTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const commonWords = targetWords.filter(word => windowWords.includes(word));
    const score = commonWords.length / Math.max(targetWords.length, windowWords.length);
    
    return {
      title: window.MainWindowTitle,
      id: window.Id,
      score: score,
      commonWords: commonWords
    };
  })
  .filter(s => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);
  
  return suggestions;
}

// Verify window exists before capturing with fallback strategies
async function verifyWindowExists(windowTitle) {
  try {
    const match = await findWindow(windowTitle);
    return match;
  } catch (error) {
    console.error('Error verifying window:', error);
    return null;
  }
}

// Start ffmpeg stream for a specific client
async function startStream(clientId, windowId, windowTitleDisplay) {
  // Create unique directory for this client's stream
  const streamDir = path.join('public', 'stream', clientId);
  const segmentPath = path.join(streamDir, 'segment_%03d.ts');
  const playlistPath = path.join(streamDir, 'playlist.m3u8');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(streamDir)) {
    fs.mkdirSync(streamDir, { recursive: true });
  }
  
  // FFmpeg command with NVIDIA GPU encoding (NVENC)
  // Using desktop capture to capture video content properly
  // Optimized for high quality streaming with GPU acceleration
  const ffmpegArgs = [
    '-f', 'gdigrab',
    '-framerate', '30',
    '-i', 'desktop',
    '-vf', 'scale=1920:1080', // Scale to 1080p for better quality
    '-c:v', 'h264_nvenc', // NVIDIA GPU encoder
    '-preset', 'p4', // Balanced preset (p1=fastest, p7=slowest)
    '-tune', 'll', // Low latency tuning
    '-rc', 'vbr', // Variable bitrate for better quality
    '-pix_fmt', 'yuv420p',
    '-b:v', '8000k', // Higher bitrate for better quality
    '-maxrate', '10000k',
    '-bufsize', '12000k',
    '-g', '30', // GOP size for 30fps
    '-f', 'hls',
    '-hls_time', '1',
    '-hls_list_size', '10',
    '-hls_flags', 'delete_segments+program_date_time',
    '-hls_segment_filename', segmentPath,
    '-hls_segment_type', 'mpegts',
    '-hls_start_number_source', 'generic',
    '-hls_allow_cache', '0',
    playlistPath
  ];
  
  // Optional: Add audio if available
  // Uncomment and modify the device name after running find-audio-device.bat
  /*
  ffmpegArgs.splice(5, 0, '-f', 'dshow');
  ffmpegArgs.splice(6, 0, '-i', 'audio="YOUR_AUDIO_DEVICE_NAME"');
  ffmpegArgs.splice(11, 0, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
  */
  
  console.log(`[${clientId}] Starting FFmpeg for desktop capture`);
  console.log(`[${clientId}] Stream directory: ${streamDir}`);
  console.log(`[${clientId}] FFmpeg command:`, ffmpegArgs.join(' '));
  
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
  
  // Store stream information
  activeStreams.set(clientId, {
    process: ffmpegProcess,
    windowId: windowId,
    windowTitle: windowTitleDisplay,
    startTime: Date.now()
  });
  
  // Track if FFmpeg started successfully
  let ffmpegStarted = false;
  let ffmpegError = null;
  
  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`[${clientId}] FFmpeg stdout: ${data}`);
    ffmpegStarted = true;
  });
  
  // Monitor first segment creation with more detailed logging
  let segmentCheckCount = 0;
  const segmentCheckInterval = setInterval(() => {
    segmentCheckCount++;
    const playlistPath = path.join(streamDir, 'playlist.m3u8');
    
    console.log(`[${clientId}] Checking for playlist (attempt ${segmentCheckCount})...`);
    
    if (fs.existsSync(playlistPath)) {
      console.log(`[${clientId}] ✅ HLS playlist created at: ${playlistPath}`);
      clearInterval(segmentCheckInterval);
    } else if (segmentCheckCount >= 20) {
      console.error(`[${clientId}] ❌ Playlist not created after 10 seconds`);
      console.error(`[${clientId}] FFmpeg started: ${ffmpegStarted}`);
      console.error(`[${clientId}] FFmpeg error: ${ffmpegError || 'None'}`);
      console.error(`[${clientId}] Stream directory exists: ${fs.existsSync(streamDir)}`);
      clearInterval(segmentCheckInterval);
    }
  }, 500);
  
  // Clear interval after 10 seconds
  setTimeout(() => clearInterval(segmentCheckInterval), 10000);
  
  ffmpegProcess.stderr.on('data', (data) => {
    const errorStr = data.toString();
    console.error(`[${clientId}] FFmpeg stderr: ${errorStr}`);
    
    // Store error for debugging
    if (errorStr.trim().length > 0) {
      ffmpegError = errorStr;
    }
    
    // Log FFmpeg errors to file
    if (errorStr.includes('Error') || errorStr.includes('error') || errorStr.includes('Can\'t find window')) {
      let errorDetails = `Client: ${clientId}, Desktop Capture\n${errorStr}\n\n`;
      
      // Add helpful suggestions based on error type
      if (errorStr.includes('Can\'t find window')) {
        errorDetails += 'SUGGESTED FIX:\n';
        errorDetails += '1. The window title may have changed (common with YouTube videos)\n';
        errorDetails += '2. The window may be closed or minimized\n';
        errorDetails += '3. Refresh the window list in the UI and select the window again\n';
        errorDetails += '4. Make sure the window is visible and not minimized';
      } else if (errorStr.includes('desktop')) {
        errorDetails += 'SUGGESTED FIX:\n';
        errorDetails += '1. Desktop capture may not be supported on this system\n';
        errorDetails += '2. Try running as administrator\n';
        errorDetails += '3. Check if gdigrab is working: ffmpeg -f gdigrab -list_devices true -i dummy\n';
      }
      
      logError('FFmpeg Error', errorDetails, clientId);
    }
  });
  
  ffmpegProcess.on('close', (code) => {
    console.log(`[${clientId}] FFmpeg process exited with code ${code}`);
    
    // Log non-zero exit codes as errors
    if (code !== 0 && code !== null) {
      logError('FFmpeg Exit Error', `FFmpeg process exited with code ${code} for client ${clientId}, window: ${windowTitleDisplay}`, clientId);
    }
    
    activeStreams.delete(clientId);
    
    // Clean up stream directory
    if (fs.existsSync(streamDir)) {
      fs.rmSync(streamDir, { recursive: true, force: true });
    }
    
    io.emit('stream-stopped', { clientId });
  });
  
  ffmpegProcess.on('error', (error) => {
    console.error(`[${clientId}] FFmpeg process error:`, error);
    
    let errorMsg = `Failed to spawn FFmpeg process: ${error.message}`;
    
    if (error.code === 'ENOENT') {
      errorMsg += '\n\nFFmpeg is not installed or not found in PATH.';
      errorMsg += '\nPlease install FFmpeg: https://ffmpeg.org/download.html';
    }
    
    logError('FFmpeg Process Error', errorMsg, clientId);
    activeStreams.delete(clientId);
    io.emit('stream-error', { clientId, error: errorMsg });
  });
}

// Stop a specific stream
function stopStream(clientId) {
  const stream = activeStreams.get(clientId);
  if (!stream) {
    console.log(`[${clientId}] No active stream found`);
    return;
  }
  
  console.log(`[${clientId}] Stopping stream`);
  stream.process.kill('SIGTERM');
  activeStreams.delete(clientId);
  
  // Clean up stream directory
  const streamDir = path.join('public', 'stream', clientId);
  if (fs.existsSync(streamDir)) {
    fs.rmSync(streamDir, { recursive: true, force: true });
  }
  
  io.emit('stream-stopped', { clientId });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send all active streams to the new client
  const streams = Array.from(activeStreams.entries()).map(([clientId, stream]) => ({
    clientId,
    windowId: stream.windowId,
    windowTitle: stream.windowTitle,
    startTime: stream.startTime
  }));
  
  socket.emit('all-streams', { streams, total: streams.length, max: MAX_STREAMS });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MirrorMyTV Server running on http://0.0.0.0:${PORT}`);
  console.log(`📺 Access from your network: http://YOUR_IP:${PORT}`);
  console.log(`🎮 Multi-Stream Mode: Up to ${MAX_STREAMS} concurrent streams`);
  console.log(`💻 Encoding: NVIDIA GPU (NVENC) - High Quality`);
  console.log(`🎬 Quality: 1080p @ 30fps, 8Mbps bitrate`);
});

