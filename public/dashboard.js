let ws;
let reconnectInterval;
let isManualDisconnect = false;

// UI Elements
let connectBtn, disconnectBtn, statusElement;

function initializeUI() {
    connectBtn = document.getElementById('connectBtn');
    disconnectBtn = document.getElementById('disconnectBtn');
    statusElement = document.getElementById('connectionStatus');
    
    // Add event listeners
    connectBtn.addEventListener('click', handleConnect);
    disconnectBtn.addEventListener('click', handleDisconnect);
}

function handleConnect() {
    isManualDisconnect = false;
    connectWebSocket();
}

function handleDisconnect() {
    isManualDisconnect = true;
    if (ws) {
        ws.close();
    }
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
}

function updateConnectionStatus(status) {
    statusElement.className = `status ${status}`;
    
    switch (status) {
        case 'connecting':
            statusElement.textContent = 'Connecting...';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            break;
        case 'connected':
            statusElement.textContent = 'Connected';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            break;
        case 'disconnected':
            statusElement.textContent = 'Disconnected';
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            break;
    }
}

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return; // Already connected
    }
    
    updateConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('Connected to WebSocket for monitoring');
        addLogEntry('Dashboard connected to server');
        updateConnectionStatus('connected');
        
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
        updateConnectionStatus('disconnected');
        
        if (isManualDisconnect) {
            addLogEntry('Manually disconnected from server');
        } else {
            addLogEntry('Connection lost, attempting to reconnect...');
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    if (!isManualDisconnect) {
                        connectWebSocket();
                    }
                }, 3000);
            }
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        addLogEntry('WebSocket error occurred');
        updateConnectionStatus('disconnected');
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
    // Initialize UI elements
    initializeUI();
    
    // Set initial connection status
    updateConnectionStatus('disconnected');
    
    // Initial log entry
    addLogEntry('Server monitoring dashboard loaded');
});

// Handle page visibility change to reconnect when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && (!ws || ws.readyState !== WebSocket.OPEN) && !isManualDisconnect) {
        connectWebSocket();
    }
});