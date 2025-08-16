let ws;
let reconnectInterval;
let isManualDisconnect = false;

// Auto-connect when page loads since controls are removed
function autoConnect() {
    isManualDisconnect = false;
    connectWebSocket();
}

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return; // Already connected
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('Connected to WebSocket for monitoring');
        addLogEntry('Dashboard connected to server');
        
        // Request current status when dashboard connects
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'request_status' }));
        }
        
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
                updateStats(data.connectedUsers);
                addLogEntry(data.message);
            }
        } catch (e) {
            // Regular message, not status update
            addLogEntry(`Received: ${event.data}`);
        }
    };
    
    ws.onclose = function() {
        console.log('WebSocket connection closed');
        
        addLogEntry('Connection lost, attempting to reconnect...');
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                connectWebSocket();
            }, 3000);
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        addLogEntry('WebSocket error occurred');
    };
}

function updateStats(count) {
    const element = document.getElementById('connectedUsers');
    element.textContent = count;
    
    // Add animation effect
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function addLogEntry(message) {
    const logEntries = document.getElementById('logEntries');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    logEntries.appendChild(entry);
    logEntries.scrollTop = logEntries.scrollHeight;
    
    // Keep only last 50 entries
    while (logEntries.children.length > 50) {
        logEntries.removeChild(logEntries.firstChild);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Auto-connect since manual controls are removed
    autoConnect();
    
    // Initial log entry
    addLogEntry('Server monitoring dashboard loaded');
});

// Handle page visibility change to reconnect when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && (!ws || ws.readyState !== WebSocket.OPEN)) {
        connectWebSocket();
    }
});