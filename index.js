const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const path = require('path');

console.log('Starting server application');

// Create Express app
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the dashboard page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });

// Store all connected clients with their IDs
const clients = new Map();

// Function to broadcast status updates to monitoring clients
function broadcastStatus(message) {
    const statusUpdate = {
        type: 'status',
        connectedUsers: Array.from(clients.values()).filter(client => !client.isDashboard).length,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN && client.isDashboard) {
            try {
                client.send(JSON.stringify(statusUpdate));
            } catch (e) {
                console.log('Error sending status update to client:', clientId);
            }
        }
    });
}

// Handle new connections
wss.on('connection', function connection(ws, req) {
    // Check if this is a dashboard monitoring connection
    const userAgent = req.headers['user-agent'] || '';
    const isDashboard = userAgent.includes('Mozilla') && req.headers.origin;
    
    // Generate unique ID for this connection
    const sessionId = uuidv4();
    
    // Store the client with its ID
    clients.set(sessionId, ws);
    ws.sessionId = sessionId;
    ws.isDashboard = isDashboard;
    
    // Log that a new connection was opened
    const connectionType = isDashboard ? 'Dashboard' : 'Client';
    const connectionMessage = `${connectionType} connection opened with: ${sessionId}`;
    console.log(connectionMessage);
    broadcastStatus(connectionMessage);
    
    // Handle incoming messages
    ws.on('message', function message(data) {
        const messageData = data.toString();
        console.log('Received message: ' + messageData);
        
        // Don't broadcast status messages, only regular signaling messages
        try {
            const parsed = JSON.parse(messageData);
            if (parsed.type === 'status') {
                return; // Skip status messages
            }
        } catch (e) {
            // Not JSON, treat as regular message
        }
        
        // Send the received message to all non-dashboard clients except the sender
        clients.forEach((client, clientId) => {
            if (clientId !== sessionId && client.readyState === WebSocket.OPEN && !client.isDashboard) {
                client.send(messageData);
            }
        });
    });
    
    // Handle connection close
    ws.on('close', function close() {
        const connectionType = isDashboard ? 'Dashboard' : 'Client';
        const disconnectionMessage = `${connectionType} connection closed with: ${sessionId}`;
        console.log(disconnectionMessage);
        clients.delete(sessionId);
        broadcastStatus(disconnectionMessage);
    });
    
    // Handle errors
    ws.on('error', function error(err) {
        const connectionType = isDashboard ? 'Dashboard' : 'Client';
        const errorMessage = `WebSocket error for ${connectionType} ${sessionId}: ${err.message}`;
        console.log(errorMessage);
        clients.delete(sessionId);
        broadcastStatus(errorMessage);
    });
});

// Start the HTTP server
server.listen(8080, () => {
    console.log('WebSocket Server Running on port 8080');
    console.log('Visit http://localhost:8080 to view the dashboard');
});

// Stop the server when Ctrl+C is pressed
process.on('SIGINT', function() {
    console.log('\nStopping server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});

console.log('Press Ctrl+C to stop the server...');