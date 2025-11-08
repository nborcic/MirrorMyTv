// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const activeStreamsCount = document.getElementById('activeStreamsCount');
const totalErrors = document.getElementById('totalErrors');
const streamsList = document.getElementById('streamsList');
const errorLog = document.getElementById('errorLog');
const refreshStreamsBtn = document.getElementById('refreshStreams');
const stopAllStreamsBtn = document.getElementById('stopAllStreams');
const clearErrorsBtn = document.getElementById('clearErrors');
const viewLogsBtn = document.getElementById('viewLogs');

// Fetch all active streams
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
      const duration = Math.floor(stream.duration / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      const item = document.createElement('div');
      item.className = 'bg-white/5 p-3 rounded text-sm';
      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-white font-medium">${stream.windowTitle}</div>
            <div class="text-purple-300 text-xs">${stream.clientId.substring(0, 8)}... • ${minutes}m ${seconds}s</div>
          </div>
          <button class="stop-stream-btn bg-red-500/20 hover:bg-red-500/30 text-white py-1 px-3 rounded text-xs" data-client-id="${stream.clientId}">
            Stop
          </button>
        </div>
      `;
      
      // Add stop button listener
      item.querySelector('.stop-stream-btn').addEventListener('click', async () => {
        await stopStream(stream.clientId);
      });
      
      streamsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
  }
}

// Stop a specific stream
async function stopStream(clientId) {
  try {
    const response = await fetch('/api/stream/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Stream stopped successfully');
      await fetchAllStreams();
    } else {
      alert('Failed to stop stream: ' + data.error);
    }
  } catch (error) {
    console.error('Error stopping stream:', error);
    alert('Error stopping stream');
  }
}

// Stop all streams
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

// Fetch error log
async function fetchErrorLog() {
  try {
    const response = await fetch('/api/errors');
    const data = await response.json();
    
    totalErrors.textContent = data.errors.length;
    
    if (data.errors.length === 0) {
      errorLog.innerHTML = '<p class="text-purple-200 text-center text-sm py-2">No errors</p>';
      return;
    }
    
    errorLog.innerHTML = '';
    
    // Show last 20 errors
    const recentErrors = data.errors.slice(-20).reverse();
    
    recentErrors.forEach(error => {
      const item = document.createElement('div');
      item.className = 'bg-white/5 p-3 rounded text-sm mb-2';
      item.innerHTML = `
        <div class="text-red-400 font-medium text-xs mb-1">${error.type}</div>
        <div class="text-purple-300 text-xs mb-2">${new Date(error.timestamp).toLocaleString()}</div>
        <div class="text-white text-xs whitespace-pre-wrap">${error.details.substring(0, 200)}...</div>
      `;
      errorLog.appendChild(item);
    });
  } catch (error) {
    console.error('Error fetching error log:', error);
  }
}

// Clear error log
async function clearErrorLog() {
  if (!confirm('Are you sure you want to clear the error log?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/errors/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    alert(data.message);
    await fetchErrorLog();
  } catch (error) {
    console.error('Error clearing error log:', error);
    alert('Error clearing error log');
  }
}

// Event Listeners
refreshStreamsBtn.addEventListener('click', fetchAllStreams);
stopAllStreamsBtn.addEventListener('click', stopAllStreams);
clearErrorsBtn.addEventListener('click', clearErrorLog);
viewLogsBtn.addEventListener('click', () => {
  alert('Server logs are displayed in the terminal where the server is running.');
});

// Socket.IO event listeners
socket.on('all-streams', (data) => {
  console.log('All streams:', data);
  fetchAllStreams();
});

socket.on('stream-stopped', (data) => {
  console.log('Stream stopped:', data);
  fetchAllStreams();
});

socket.on('stream-error', (data) => {
  console.log('Stream error:', data);
  fetchAllStreams();
  fetchErrorLog();
});

// Initialize on load
fetchAllStreams();
fetchErrorLog();

// Auto-refresh every 5 seconds
setInterval(() => {
  fetchAllStreams();
  fetchErrorLog();
}, 5000);

