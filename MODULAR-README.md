# Vista Server - Modular Structure

This document explains the modularized version of the Vista Server application.

## 📁 Project Structure

```
vistaserver/
├── index.js                    # Original monolithic file
├── index-modular.js           # New modular main entry point
├── src/                       # Modular components
│   ├── logger.js             # Logging utilities and colors
│   ├── constants.js          # WebSocket purposes and targets
│   ├── clientManager.js      # Client management functions
│   ├── messageHandler.js     # WebSocket message processing
│   ├── websocketHandler.js   # WebSocket connection handling
│   └── routes.js             # Express routes
├── public/                    # Static files
└── package.json
```

## 🧩 Module Breakdown

### 1. **logger.js** - Logging System

- **Purpose**: Centralized logging with colors and categories
- **Exports**: `log`, `colors`
- **Features**:
  - Color-coded log types (info, success, warning, error)
  - Category-specific logs (server, client, dashboard, websocket)
  - Emoji icons for visual clarity

### 2. **constants.js** - Application Constants

- **Purpose**: WebSocket message purposes and targets
- **Exports**: `Purposes`, `Targets`
- **Contents**:
  - Message purposes (UserInfoUpdate, WebRTCCommunication, etc.)
  - Message targets (Server, AllWSUsers, SpecificWSUser, etc.)

### 3. **clientManager.js** - Client Management

- **Purpose**: Manage WebSocket client connections and state
- **Exports**:
  - `clients` - Map of connected clients
  - `getActiveClients()` - Get non-dashboard active clients
  - `broadcastStatus()` - Send status updates to dashboards
  - `notifyNewClientConnection()` - Notify about new connections
  - `addClient()`, `removeClient()` - Client lifecycle management
  - `getClientCount()` - Get total client count

### 4. **messageHandler.js** - Message Processing

- **Purpose**: Handle incoming WebSocket messages
- **Exports**: `handleMessage()`
- **Features**:
  - Parse and route messages based on target
  - Handle server-targeted messages
  - Process user info updates
  - Route messages to specific users
  - Separate handling for senders vs clients

### 5. **websocketHandler.js** - Connection Management

- **Purpose**: Handle WebSocket connection lifecycle
- **Exports**: `handleConnection()`
- **Features**:
  - Detect dashboard vs client connections
  - Generate unique session IDs
  - Set up message, close, and error handlers
  - Coordinate with client manager

### 6. **routes.js** - Express Routes

- **Purpose**: Define HTTP endpoints
- **Exports**: Express router
- **Routes**:
  - `GET /` - Serve dashboard page
  - `GET /activeClients` - API endpoint for active clients

## 🚀 Usage

### Running the Modular Version

```bash
# Use the modular version
node index-modular.js

# Or update package.json to point to index-modular.js
npm start
```

### Switching Between Versions

- **Original**: `node index.js`
- **Modular**: `node index-modular.js`

## ✅ Benefits of Modular Structure

1. **Separation of Concerns**: Each module has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Individual modules can be unit tested
4. **Reusability**: Modules can be reused in other projects
5. **Readability**: Smaller, focused files are easier to understand
6. **Scalability**: Easy to add new features without touching core logic

## 🔧 Migration Notes

- All functionality remains identical to the original
- Same logging output and behavior
- Same WebSocket protocol and message handling
- No breaking changes to client-side code
- Can gradually migrate by updating one module at a time

## 🧪 Testing Individual Modules

Each module can be imported and tested independently:

```javascript
import { log } from "./src/logger.js";
import { Purposes, Targets } from "./src/constants.js";
import { getActiveClients } from "./src/clientManager.js";
```

## 🔄 Future Enhancements

With this modular structure, you can easily:

- Add new message types in `constants.js`
- Implement new logging levels in `logger.js`
- Add client filtering in `clientManager.js`
- Create new API endpoints in `routes.js`
- Add middleware for authentication/authorization
