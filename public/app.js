// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const windowList = document.getElementById('windowList');
const refreshWindowsBtn = document.getElementById('refreshWindows');
const startStreamBtn = document.getElementById('startStream');
const stopStreamBtn = document.getElementById('stopStream');
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const noStream = document.getElementById('noStream');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const refreshStreamsBtn = document.getElementById('refreshStreams');
const stopAllStreamsBtn = document.getElementById('stopAllStreams');
const activeStreamsCount = document.getElementById('activeStreamsCount');
const streamsList = document.getElementById('streamsList');

// State
let clientId = null;
let selectedWindowId = null;
let selectedWindowTitle = null;
let isStreaming = false;
let hls = null;

// Initialize: Get unique client ID
async function init() {
  try {
    // Detect device type
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isAndroidTV = /Android.*TV|AFT[A-Z]|AFTM/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)|Tablet/i.test(userAgent);
    const isPhone = isMobile && !isTablet && !isAndroidTV;
    
    // Log device info for debugging
    console.log('Device Info:', {
      userAgent: userAgent,
      deviceType: isAndroidTV ? 'Android TV' : isTablet ? 'Tablet' : isPhone ? 'Phone' : 'Desktop',
      isMobile: isMobile,
      isAndroidTV: isAndroidTV,
      isTablet: isTablet,
      isPhone: isPhone,
      hlsSupported: typeof Hls !== 'undefined' && Hls.isSupported(),
      nativeHLS: videoPlayer.canPlayType('application/vnd.apple.mpegurl')
    });
    
    // Add device-specific class for styling
    if (isAndroidTV) {
      document.body.classList.add('android-tv');
      console.log('📺 Android TV detected - optimized for TV viewing');
    } else if (isTablet) {
      document.body.classList.add('tablet');
      console.log('📱 Tablet detected');
    } else if (isPhone) {
      document.body.classList.add('phone');
      console.log('📱 Phone detected');
    }
    
    const response = await fetch('/api/client-id');
    const data = await response.json();
    clientId = data.clientId;
    console.log('Client ID:', clientId);
    
    // Update UI with client ID
    const clientIdDisplay = document.getElementById('clientIdDisplay');
    if (clientIdDisplay) {
      clientIdDisplay.textContent = `Client: ${clientId.substring(0, 8)}...`;
    }
    
    // Fetch windows and set up UI
    await fetchWindows();
    updateStreamStatus(false);
    
    // Ensure video player is initially hidden
    videoPlayer.style.display = 'none';
    noStream.style.display = 'flex';
  } catch (error) {
    console.error('Failed to initialize:', error);
    alert('Failed to connect to server');
  }
}

// Fetch available windows
async function fetchWindows() {
  try {
    windowList.innerHTML = '<p class="text-purple-200 text-center py-4">Loading...</p>';
    
    const response = await fetch('/api/windows');
    const windows = await response.json();
    
    if (windows.length === 0) {
      windowList.innerHTML = '<p class="text-purple-200 text-center py-4">No windows found</p>';
      return;
    }
    
    windowList.innerHTML = '';
    windows.forEach(window => {
      const fullTitle = window.MainWindowTitle || 'Untitled';
      // Extract first meaningful part of title (before first dash or special char) for display
      const simpleTitle = fullTitle.split(' - ')[0].split(' (')[0].trim();
      
      const item = document.createElement('div');
      item.className = 'window-list-item bg-white/5 hover:bg-white/10 p-3 rounded-lg cursor-pointer border border-white/10';
      item.innerHTML = `
        <div class="font-medium text-white">${simpleTitle}</div>
        <div class="text-xs text-purple-300">PID: ${window.Id}</div>
      `;
      
      item.addEventListener('click', () => {
        // Remove previous selection
        document.querySelectorAll('.window-list-item').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selection to clicked item
        item.classList.add('selected');
        selectedWindowId = fullTitle; // Use full title for FFmpeg
        selectedWindowTitle = simpleTitle; // Use simplified title for display
        
        startStreamBtn.disabled = false;
      });
      
      windowList.appendChild(item);
    });
  } catch (error) {
    console.error('Error fetching windows:', error);
    windowList.innerHTML = '<p class="text-red-400 text-center py-4">Error loading windows</p>';
  }
}

// Start streaming
async function startStream() {
  if (!selectedWindowId) {
    alert('Please select a window first');
    return;
  }
  
  if (!clientId) {
    alert('Client ID not initialized');
    return;
  }
  
  try {
    startStreamBtn.disabled = true;
    
    const response = await fetch('/api/stream/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        windowId: selectedWindowId,
        windowTitle: selectedWindowTitle,
        clientId: clientId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      isStreaming = true;
      updateStreamStatus(true);
      
      // Keep noStream overlay visible until video actually plays
      noStream.style.display = 'flex';
      noStream.innerHTML = `
        <div class="text-center">
          <div class="text-6xl mb-4 animate-pulse">⏳</div>
          <p class="text-xl font-semibold">Starting Stream...</p>
          <p class="text-purple-200 mt-2">Initializing video player</p>
          <p class="text-purple-300 text-sm mt-2">Please wait...</p>
        </div>
      `;
      videoPlayer.style.display = 'none';
      
      // Wait for HLS segments to be created with retry logic
      const streamUrl = `/stream/${clientId}/playlist.m3u8`;
      let retryCount = 0;
      const maxRetries = 10;
      
      const tryLoadStream = () => {
        fetch(streamUrl)
          .then(response => {
            if (response.ok) {
              console.log('HLS playlist ready, loading video...');
              
              // Show video player
              videoPlayer.style.display = 'block';
              noStream.style.display = 'none';
              
              if (Hls.isSupported()) {
                if (hls) hls.destroy();
                hls = new Hls({
                  enableWorker: true,
                  lowLatencyMode: false,
                  backBufferLength: 90,
                  maxBufferLength: 10, // Reduced for faster buffering
                  maxMaxBufferLength: 20, // Reduced max buffer
                  maxBufferSize: 30 * 1000 * 1000, // 30MB buffer
                  maxBufferHole: 0.3, // Smaller hole tolerance
                  highBufferWatchdogPeriod: 1, // Check more frequently
                  nudgeOffset: 0.05, // Smaller nudge
                  nudgeMaxRetry: 5, // More retry attempts
                  maxFragLoadingTimeMs: 10000, // Faster timeout
                  fragLoadingTimeOut: 10000,
                  manifestLoadingTimeOut: 5000,
                  levelLoadingTimeOut: 5000,
                  maxLoadingDelay: 2, // Max delay before loading
                  minAutoBitrate: 0, // Auto-select lowest bitrate
                  startLevel: -1, // Auto-start level
                  capLevelToPlayerSize: false // Don't cap level
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(videoPlayer);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  console.log('HLS manifest parsed, buffering before playback...');
                  
                  // Update overlay to show buffering
                  noStream.innerHTML = `
                    <div class="text-center">
                      <div class="text-6xl mb-4 animate-pulse">⏳</div>
                      <p class="text-xl font-semibold">Buffering Video...</p>
                      <p class="text-purple-200 mt-2" id="bufferStatus">Loading segments...</p>
                      <p class="text-purple-300 text-sm mt-2">Please wait</p>
                    </div>
                  `;
                  
                  // Wait for buffer to fill before starting playback
                  const checkBuffer = setInterval(() => {
                    if (videoPlayer.buffered.length > 0) {
                      const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
                      console.log(`Buffer: ${bufferedEnd.toFixed(2)} seconds`);
                      
                      // Update buffer status on overlay
                      const bufferStatusEl = document.getElementById('bufferStatus');
                      if (bufferStatusEl) {
                        bufferStatusEl.textContent = `Buffered: ${bufferedEnd.toFixed(1)}s / 2.0s`;
                      }
                      
                      // Start playback when we have at least 2 seconds buffered
                      if (bufferedEnd >= 2.0) {
                        clearInterval(checkBuffer);
                        console.log('Buffer ready, starting playback');
                        videoPlayer.play()
                          .then(() => {
                            console.log('Video playback started successfully');
                            // Hide overlay once video is playing
                            noStream.style.display = 'none';
                          })
                          .catch(err => {
                            console.error('Play error:', err);
                            // Show error overlay
                            noStream.style.display = 'flex';
                            noStream.innerHTML = `
                              <div class="text-center">
                                <div class="text-6xl mb-4">❌</div>
                                <p class="text-xl font-semibold">Playback Error</p>
                                <p class="text-purple-200 mt-2">${err.message}</p>
                                <p class="text-purple-300 text-sm mt-2">Try clicking play manually</p>
                              </div>
                            `;
                          });
                      }
                    }
                  }, 100);
                  
                  // Timeout after 15 seconds
                  setTimeout(() => {
                    clearInterval(checkBuffer);
                    console.log('Buffer timeout, starting playback anyway');
                    videoPlayer.play()
                      .then(() => {
                        console.log('Video playback started (timeout)');
                        noStream.style.display = 'none';
                      })
                      .catch(err => {
                        console.error('Play error:', err);
                        noStream.style.display = 'flex';
                        noStream.innerHTML = `
                          <div class="text-center">
                            <div class="text-6xl mb-4">❌</div>
                            <p class="text-xl font-semibold">Playback Error</p>
                            <p class="text-purple-200 mt-2">${err.message}</p>
                            <p class="text-purple-300 text-sm mt-2">Try refreshing the page</p>
                          </div>
                        `;
                      });
                  }, 15000);
                });
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                  console.error('HLS error:', data);
                  
                  // Handle non-fatal buffer stalling
                  if (!data.fatal && data.details === 'bufferStalledError') {
                    console.log('Buffer stalling detected, attempting recovery...');
                    // HLS.js will auto-recover, just log it
                    return;
                  }
                  
                  if (data.fatal) {
                    switch(data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Network error, trying to recover...');
                        hls.startLoad();
                        break;
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Media error, trying to recover...');
                        hls.recoverMediaError();
                        break;
                      default:
                        console.log('Fatal error, cannot recover');
                        hls.destroy();
                        noStream.style.display = 'flex';
                        noStream.innerHTML = `
                          <div class="text-center">
                            <div class="text-6xl mb-4">❌</div>
                            <p class="text-xl font-semibold">Stream Error</p>
                            <p class="text-purple-200 mt-2">Failed to load stream</p>
                          </div>
                        `;
                        break;
                    }
                  }
                });
              } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari/iOS)
                console.log('Using native HLS support');
                
                // Update overlay to show buffering
                noStream.innerHTML = `
                  <div class="text-center">
                    <div class="text-6xl mb-4 animate-pulse">⏳</div>
                    <p class="text-xl font-semibold">Buffering Video...</p>
                    <p class="text-purple-200 mt-2">Loading stream...</p>
                    <p class="text-purple-300 text-sm mt-2">Please wait</p>
                  </div>
                `;
                
                videoPlayer.src = streamUrl;
                
                // Wait for buffer to fill (native HLS)
                const checkNativeBuffer = setInterval(() => {
                  if (videoPlayer.buffered.length > 0) {
                    const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
                    console.log(`Native HLS Buffer: ${bufferedEnd.toFixed(2)} seconds`);
                    
                    // Start playback when we have at least 2 seconds buffered
                    if (bufferedEnd >= 2.0) {
                      clearInterval(checkNativeBuffer);
                      console.log('Native buffer ready, starting playback');
                      videoPlayer.play()
                        .then(() => {
                          console.log('Video playback started successfully');
                          noStream.style.display = 'none';
                        })
                        .catch(err => {
                          console.error('Play error:', err);
                          noStream.style.display = 'flex';
                          noStream.innerHTML = `
                            <div class="text-center">
                              <div class="text-6xl mb-4">❌</div>
                              <p class="text-xl font-semibold">Playback Error</p>
                              <p class="text-purple-200 mt-2">${err.message}</p>
                            </div>
                          `;
                        });
                    }
                  }
                }, 100);
                
                // Timeout after 15 seconds
                setTimeout(() => {
                  clearInterval(checkNativeBuffer);
                  console.log('Native buffer timeout, starting playback anyway');
                  videoPlayer.play()
                    .then(() => {
                      console.log('Video playback started (timeout)');
                      noStream.style.display = 'none';
                    })
                    .catch(err => {
                      console.error('Play error:', err);
                      noStream.style.display = 'flex';
                      noStream.innerHTML = `
                        <div class="text-center">
                          <div class="text-6xl mb-4">❌</div>
                          <p class="text-xl font-semibold">Playback Error</p>
                          <p class="text-purple-200 mt-2">${err.message}</p>
                        </div>
                      `;
                    });
                }, 15000);
              } else {
                // No HLS support
                console.error('HLS not supported on this device');
                noStream.style.display = 'flex';
                noStream.innerHTML = `
                  <div class="text-center">
                    <div class="text-6xl mb-4">❌</div>
                    <p class="text-xl font-semibold">Not Supported</p>
                    <p class="text-purple-200 mt-2">Your browser doesn't support HLS streaming</p>
                    <p class="text-purple-300 text-sm mt-2">Try Chrome, Firefox, or Safari</p>
                  </div>
                `;
              }
            } else {
              throw new Error('Playlist not ready');
            }
          })
          .catch(error => {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Waiting for HLS playlist... (attempt ${retryCount}/${maxRetries})`);
              noStream.innerHTML = `
                <div class="text-center">
                  <div class="text-6xl mb-4 animate-pulse">⏳</div>
                  <p class="text-xl font-semibold">Starting Stream...</p>
                  <p class="text-purple-200 mt-2">Waiting for video (${retryCount}/${maxRetries})</p>
                </div>
              `;
              setTimeout(tryLoadStream, 1000);
            } else {
              console.error('Failed to load HLS stream after max retries');
              noStream.style.display = 'flex';
              noStream.innerHTML = `
                <div class="text-center">
                  <div class="text-6xl mb-4">❌</div>
                  <p class="text-xl font-semibold">Stream Timeout</p>
                  <p class="text-purple-200 mt-2">Video didn't start in time</p>
                  <p class="text-purple-300 text-sm mt-2">Please try again</p>
                </div>
              `;
              alert('Stream started but video is not loading. Please try again.');
            }
          });
      };
      
      // Start trying to load after a short delay
      setTimeout(tryLoadStream, 2000);
      
      console.log('Stream started successfully');
    } else {
      alert('Failed to start stream: ' + data.error);
    }
  } catch (error) {
    console.error('Error starting stream:', error);
    alert('Error starting stream');
  } finally {
    startStreamBtn.disabled = false;
  }
}

// Stop streaming
async function stopStream() {
  if (!clientId) {
    alert('Client ID not initialized');
    return;
  }
  
  try {
    stopStreamBtn.disabled = true;
    
    const response = await fetch('/api/stream/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId: clientId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      isStreaming = false;
      updateStreamStatus(false);
      
      // Stop HLS
      if (hls) {
        hls.destroy();
        hls = null;
      }
      
      // Reset video player
      videoPlayer.src = '';
      videoPlayer.style.display = 'none';
      noStream.style.display = 'flex';
      noStream.innerHTML = `
        <div class="text-center">
          <div class="text-6xl mb-4">📺</div>
          <p class="text-xl font-semibold">No Active Stream</p>
          <p class="text-purple-200 mt-2">Select a window and click "Start Streaming"</p>
        </div>
      `;
      
      console.log('Stream stopped successfully');
    } else {
      alert('Failed to stop stream: ' + data.error);
    }
  } catch (error) {
    console.error('Error stopping stream:', error);
    alert('Error stopping stream');
  } finally {
    stopStreamBtn.disabled = false;
  }
}

// Update stream status UI
function updateStreamStatus(active) {
  if (active) {
    statusIndicator.classList.remove('inactive');
    statusIndicator.classList.add('active');
    statusText.textContent = `Streaming: ${selectedWindowTitle}`;
    startStreamBtn.disabled = true;
    stopStreamBtn.disabled = false;
  } else {
    statusIndicator.classList.remove('active');
    statusIndicator.classList.add('inactive');
    statusText.textContent = 'Inactive';
    startStreamBtn.disabled = false;
    stopStreamBtn.disabled = true;
  }
}

// Event Listeners
refreshWindowsBtn.addEventListener('click', fetchWindows);
startStreamBtn.addEventListener('click', startStream);
stopStreamBtn.addEventListener('click', stopStream);

// Admin: Fetch all active streams
async function fetchAllStreams() {
  try {
    const response = await fetch('/api/streams/all');
    const data = await response.json();
    
    activeStreamsCount.textContent = `${data.total}/${data.max}`;
    
    if (data.streams.length === 0) {
      streamsList.innerHTML = '<p class="text-purple-200 text-center text-sm py-2">No active streams</p>';
      return;
    }
    
    streamsList.innerHTML = '';
    data.streams.forEach(stream => {
      const isMine = stream.clientId === clientId;
      const duration = Math.floor(stream.duration / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      const item = document.createElement('div');
      item.className = `bg-white/5 p-2 rounded text-sm ${isMine ? 'border-2 border-purple-500' : ''}`;
      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="text-white font-medium">${stream.windowTitle}</div>
            <div class="text-purple-300 text-xs">${stream.clientId.substring(0, 8)}... • ${minutes}m ${seconds}s</div>
          </div>
          ${isMine ? '<span class="text-purple-400 text-xs">(You)</span>' : ''}
        </div>
      `;
      streamsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
  }
}

// Admin: Stop all streams
async function stopAllStreams() {
  if (!confirm('Are you sure you want to stop all streams?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/streams/stop-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    alert(data.message);
    await fetchAllStreams();
  } catch (error) {
    console.error('Error stopping all streams:', error);
    alert('Error stopping all streams');
  }
}

// Event Listeners
refreshWindowsBtn.addEventListener('click', fetchWindows);
startStreamBtn.addEventListener('click', startStream);
stopStreamBtn.addEventListener('click', stopStream);
refreshStreamsBtn.addEventListener('click', fetchAllStreams);
stopAllStreamsBtn.addEventListener('click', stopAllStreams);

// Socket.IO event listeners
socket.on('all-streams', (data) => {
  console.log('All streams:', data);
  fetchAllStreams(); // Update admin panel
});

socket.on('stream-stopped', (data) => {
  // Only react if this is our stream
  if (data.clientId === clientId) {
    isStreaming = false;
    updateStreamStatus(false);
    
    // Stop HLS
    if (hls) {
      hls.destroy();
      hls = null;
    }
    
    // Reset video player
    videoPlayer.src = '';
    videoPlayer.style.display = 'none';
    noStream.style.display = 'flex';
    noStream.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">📺</div>
        <p class="text-xl font-semibold">No Active Stream</p>
        <p class="text-purple-200 mt-2">Select a window and click "Start Streaming"</p>
      </div>
    `;
    
    console.log('Stream stopped by server');
  }
  
  // Update admin panel
  fetchAllStreams();
});

socket.on('stream-error', (data) => {
  // Only react if this is our stream
  if (data.clientId === clientId) {
    console.error('Stream error:', data.error);
    
    // Show detailed error message with helpful suggestions
    let errorMsg = 'Stream Error:\n\n' + data.error;
    if (data.error.includes('window') || data.error.includes('Window')) {
      errorMsg += '\n\nPossible Solutions:\n';
      errorMsg += '1. Click "Refresh Windows" button\n';
      errorMsg += '2. Select the window again\n';
      errorMsg += '3. Make sure the window is visible\n';
      errorMsg += '4. Try a different window';
      
      // Automatically refresh window list after showing error
      setTimeout(() => {
        fetchWindows();
      }, 1000);
    }
    
    alert(errorMsg);
    isStreaming = false;
    updateStreamStatus(false);
    
    // Reset video player
    if (hls) {
      hls.destroy();
      hls = null;
    }
    videoPlayer.src = '';
    videoPlayer.style.display = 'none';
    noStream.style.display = 'flex';
    noStream.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">❌</div>
        <p class="text-xl font-semibold">Stream Error</p>
        <p class="text-purple-200 mt-2">${data.error}</p>
        <p class="text-purple-300 text-sm mt-2">Please try again</p>
      </div>
    `;
  }
  
  // Update admin panel
  fetchAllStreams();
});

// Initialize on load
init();
fetchAllStreams(); // Initial load of admin panel
