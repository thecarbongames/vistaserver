# WebSocket Broadcast Server

A simple WebSocket server built with Node.js that receives messages from connected clients and broadcasts them to all other connected clients (excluding the sender). This creates a real-time communication system where all clients can receive messages sent by any other client.

## Features

- **Real-time Broadcasting**: Messages sent by one client are instantly forwarded to all other connected clients
- **Connection Management**: Automatic handling of client connections and disconnections
- **Unique Session IDs**: Each connected client receives a unique identifier for tracking
- **Error Handling**: Graceful handling of connection errors and cleanup
- **Console Logging**: Detailed logging of connections, messages, and disconnections

## Prerequisites

- Node.js (version 12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or download this project to your local machine

2. Navigate to the project directory:
   ```bash
   cd websocket-broadcast-server
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Server

Run the server using one of these commands:

```bash
npm start
```

or

```bash
node index.js
```

The server will start on port 8080 and display:
```
Starting server application
WebSocket Server Running on port 8080
Press Ctrl+C to stop the server...
```

### Stopping the Server

Press `Ctrl+C` to gracefully stop the server.

### Connecting Clients

Clients can connect to the WebSocket server using the URL:
```
ws://localhost:8080
```

## How It Works

1. **Client Connection**: When a client connects, the server generates a unique session ID and logs the connection
2. **Message Handling**: When a client sends a message, the server receives it and forwards it to all other connected clients
3. **Broadcasting Logic**: The sender does not receive their own message back - it's only sent to other clients
4. **Connection Cleanup**: When a client disconnects, their session is removed from the active clients list

## Example Client Code

Here's a simple HTML/JavaScript client to test the server:

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Client</title>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = function() {
            console.log('Connected to WebSocket server');
        };
        
        ws.onmessage = function(event) {
            const messages = document.getElementById('messages');
            messages.innerHTML += '<div>Received: ' + event.data + '</div>';
        };
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            ws.send(input.value);
            input.value = '';
        }
        
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## Dependencies

- **ws**: WebSocket library for Node.js
- **uuid**: For generating unique session identifiers

## File Structure

```
├── index.js          # Main server file
├── package.json       # Project configuration and dependencies
└── README.md         # This file
```

## Console Output

The server provides detailed logging:

```
Starting server application
WebSocket Server Running on port 8080
Press Ctrl+C to stop the server...
Connection opened with: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Received message: Hello everyone!
Connection closed with: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Use Cases

This WebSocket broadcast server is perfect for:

- **Chat Applications**: Real-time messaging between multiple users
- **Live Updates**: Broadcasting status updates or notifications
- **Collaborative Tools**: Sharing real-time changes between users
- **Gaming**: Multiplayer game state synchronization
- **IoT Dashboards**: Broadcasting sensor data to multiple clients

## License

MIT License

## Contributing

Feel free to submit issues and enhancement requests!