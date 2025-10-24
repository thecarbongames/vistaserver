import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console colors and logging utilities
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

const log = {
  info: (msg, data = "") =>
    console.log(`${colors.cyan}ℹ ${colors.white}${msg}${colors.reset}`, data),
  success: (msg, data = "") =>
    console.log(`${colors.green}✓ ${colors.white}${msg}${colors.reset}`, data),
  warning: (msg, data = "") =>
    console.log(`${colors.yellow}⚠ ${colors.white}${msg}${colors.reset}`, data),
  error: (msg, data = "") =>
    console.log(`${colors.red}✗ ${colors.white}${msg}${colors.reset}`, data),
  server: (msg, data = "") =>
    console.log(
      `${colors.bgBlue}${colors.white} SERVER ${colors.reset} ${colors.blue}${msg}${colors.reset}`,
      data
    ),
  client: (msg, data = "") =>
    console.log(
      `${colors.bgGreen}${colors.white} CLIENT ${colors.reset} ${colors.green}${msg}${colors.reset}`,
      data
    ),
  dashboard: (msg, data = "") =>
    console.log(
      `${colors.bgMagenta}${colors.white} DASHBOARD ${colors.reset} ${colors.magenta}${msg}${colors.reset}`,
      data
    ),
  ws: (msg, data = "") =>
    console.log(
      `${colors.bgCyan}${colors.white} WEBSOCKET ${colors.reset} ${colors.cyan}${msg}${colors.reset}`,
      data
    ),
  message: (msg, data = "") =>
    console.log(
      `${colors.yellow}📨 ${colors.white}${msg}${colors.reset}`,
      data
    ),
};

log.server("🚀 Starting Vista Server Application...");

const Purposes = {
  None: "None",
  UserInfoUpdate: "UserInfoUpdate",
  UserWSID: "UserWSID",
  AvailableClients: "AvailableClients",
  NewClientConnect: "NewClientConnect",
  CreateWebRTCPeer: "CreateWebRTCPeer",
  WebRTCPeerCreated: "WebRTCPeerCreated",
  WebRTCCommunication: "WebRTCCommunication",
  ClientDisconnected: "ClientDisconnected",
};
const Targets = {
  Server: "Server",
  AllWSUsers: "AllWSUsers",
  AllSenders: "AllSenders",
  AllClients: "AllClients",
  SpecificWSUser: "SpecificWSUser",
};
// Create Express app
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the dashboard page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/activeClients", (req, res) => {
  const activeClients = getActiveClients();
  res.json({ activeClients });
});
// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server using the HTTP server
const wss = new WebSocketServer({ server });

// Store all connected clients with their IDs
const clients = new Map();
function getActiveClients() {
  const activeClients = [];
  clients.forEach((client) => {
    if (!client.isDashboard && client.readyState === WebSocket.OPEN) {
      activeClients.push(client.userInfo);
    }
  });
  return activeClients;
}
// Function to broadcast status updates to monitoring clients
function broadcastStatus(message) {
  const statusUpdate = {
    type: "status",
    connectedUsers: Array.from(clients.values()).filter(
      (client) => !client.isDashboard
    ).length,
    message: message,
    timestamp: new Date().toISOString(),
  };

  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN && client.isDashboard) {
      try {
        client.send(JSON.stringify(statusUpdate));
      } catch (e) {
        log.error(
          `Failed to send status update to dashboard ${clientId}: ${e.message}`
        );
      }
    }
  });
}

// Function to notify all other connected clients about new client connection
function notifyNewClientConnection(newSessionId) {
  const newClientMessage = `NewClientConnect#${newSessionId}`;

  clients.forEach((client, clientId) => {
    // Send to all non-dashboard clients except the newly connected one
    if (
      clientId !== newSessionId &&
      client.readyState === WebSocket.OPEN &&
      !client.isDashboard
    ) {
      try {
        client.send(newClientMessage);
      } catch (e) {
        log.error(
          `Failed to notify client ${clientId} about new connection: ${e.message}`
        );
      }
    }
  });
}

// Handle new connections
wss.on("connection", function connection(ws, req) {
  // Check if this is a dashboard monitoring connection
  const userAgent = req.headers["user-agent"] || "";
  const isDashboard = userAgent.includes("Mozilla") && req.headers.origin;

  // Generate unique ID for this connection
  const sessionId = uuidv4();

  // Store the client with its ID
  clients.set(sessionId, ws);
  ws.sessionId = sessionId;
  ws.isDashboard = isDashboard;

  // Send the client ID immediately upon connection
  ws.send(
    JSON.stringify({
      senderWsid: "Server",
      purpose: Purposes.UserWSID,
      message: sessionId,
    })
  );

  // Log that a new connection was opened
  const connectionType = isDashboard ? "Dashboard" : "Client";
  if (isDashboard) {
    log.dashboard(`Connected: ${sessionId}`);
  } else {
    log.client(`Connected: ${sessionId}`);
  }
  broadcastStatus(`${connectionType} connection opened with: ${sessionId}`);

  // If this is a new client (not dashboard), notify all other connected clients
  if (!isDashboard) {
    notifyNewClientConnection(sessionId);
    log.info(`Notified all clients about new connection: ${sessionId}`);
  }

  // region [Income MSG]
  // Handle incoming messages
  ws.on("message", function message(data) {
    try {
      const messageData = data.toString();
      log.message(
        `Received from ${sessionId}`,
        messageData.slice(0, 100) + (messageData.length > 100 ? "..." : "")
      );
      const WSMessage = JSON.parse(messageData);
      log.info(
        "Parsed message structure:",
        WSMessage.purpose || "unknown purpose"
      );
      const { target, purpose, message: messageContent } = WSMessage;
      switch (target) {
        case Targets.Server:
          log.server(`Processing server-targeted message: ${purpose}`);
          if (purpose === Purposes.UserInfoUpdate) {
            const userInfo = JSON.parse(messageContent);
            log.success(
              `User info updated for ${sessionId}`,
              userInfo.activityType
            );
            clients.get(sessionId).userInfo = userInfo;

            if (userInfo.activityType === "Sender") {
              const allAvailableClients = getActiveClients()
                .filter(
                  (client) =>
                    client.wsid !== sessionId &&
                    client.activityType === "Client"
                )
                .map((client) => client.wsid);
              // Send available clients to the sender
              const availableClientsMessage = {
                senderWsid: "Server",
                purpose: Purposes.AvailableClients,
                message: JSON.stringify(allAvailableClients),
              };
              ws.send(JSON.stringify(availableClientsMessage));
              log.info(
                `Sent ${allAvailableClients.length} available clients to sender`
              );
              // The User Is Sender
            } else {
              // Notify All Senders About New Client
              const newClientWsidMessage = {
                senderWsid: "Server",
                purpose: Purposes.NewClientConnect,
                message: sessionId,
              };
              const allSenders = Array.from(clients.values()).filter(
                (client) =>
                  client.readyState === WebSocket.OPEN &&
                  client.userInfo &&
                  client.userInfo.activityType === "Sender"
              );
              allSenders.forEach((sender) => {
                sender.send(JSON.stringify(newClientWsidMessage));
              });
              log.info(
                `Notified all senders about new connection: ${sessionId}`
              );
            }
          }
          break;

        case Targets.SpecificWSUser: {
          log.ws("Routing message to specific user");
          const targetWsid = WSMessage.targetWsid;
          const targetClient = clients.get(targetWsid);
          if (!targetClient) {
            log.warning(`Target client not found: ${targetWsid}`);
            return;
          }
          targetClient?.send(JSON.stringify(WSMessage));
          log.success;
          break;
        }

        case Targets.AllWSUsers:
          log.info("Broadcasting message to all WebSocket users");
          break;

        case Targets.AllSenders:
          log.info("Broadcasting message to all senders");
          break;

        case Targets.AllClients:
          log.info("Broadcasting message to all clients");
          break;

        default:
          log.warning("Invalid message target, ignoring");
          return;
      }
    } catch (e) {
      log.error("Failed to process message:", e.message);
    }
    return; // Exit after processing structured message
  });
  // endregion
  // Handle connection close
  ws.on("close", function close() {
    const connectionType = isDashboard ? "Dashboard" : "Client";
    if (isDashboard) {
      log.dashboard(`Disconnected: ${sessionId}`);
    } else {
      log.client(`Disconnected: ${sessionId}`);
    }
    clients.delete(sessionId);
    broadcastStatus(`${connectionType} connection closed with: ${sessionId}`);
  });

  // Handle errors
  ws.on("error", function error(err) {
    const connectionType = isDashboard ? "Dashboard" : "Client";
    log.error(
      `WebSocket error for ${connectionType} ${sessionId}`,
      err.message
    );
    clients.delete(sessionId);
    broadcastStatus(
      `WebSocket error for ${connectionType} ${sessionId}: ${err.message}`
    );
  });
});

// Start the HTTP server
server.listen(8080, () => {
  log.success("🌐 WebSocket Server Running on port 8080");
  log.info("📊 Visit http://localhost:8080 to view the dashboard");
  log.info(`👥 Current connections: ${clients.size}`);
});

log.info("⏹️  Press Ctrl+C to stop the server...");
