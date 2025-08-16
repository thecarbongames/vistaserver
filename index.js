const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

console.log('Starting server application');

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Store all connected clients with their IDs
const clients = new Map();

// Handle new connections
wss.on('connection', function connection(ws) {
    // Generate unique ID for this connection
    const sessionId = uuidv4();
    
    // Store the client with its ID
    clients.set(sessionId, ws);
    ws.sessionId = sessionId;
    
    // Log that a new connection was opened
    console.log('Connection opened with: ' + sessionId);
    
    // Handle incoming messages
    ws.on('message', function message(data) {
        const messageData = data.toString();
        console.log('Received message: ' + messageData);
        
        // Send the received message to all clients except the sender
        clients.forEach((client, clientId) => {
            if (clientId !== sessionId && client.readyState === WebSocket.OPEN) {
                client.send(messageData);
            }
        });
    });
    
    // Handle connection close
    ws.on('close', function close() {
        console.log('Connection closed with: ' + sessionId);
        clients.delete(sessionId);
    });
    
    // Handle errors
    ws.on('error', function error(err) {
        console.log('WebSocket error for ' + sessionId + ':', err);
        clients.delete(sessionId);
    });
});

console.log('WebSocket Server Running on port 8080');

// Stop the server when Ctrl+C is pressed
process.on('SIGINT', function() {
    console.log('\nStopping server...');
    wss.close(() => {
        console.log('WebSocket server stopped');
        process.exit(0);
    });
});

console.log('Press Ctrl+C to stop the server...');