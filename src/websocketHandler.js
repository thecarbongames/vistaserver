import { v4 as uuidv4 } from "uuid";
import { log } from "./logger.js";
import { Purposes } from "./constants.js";
import {
  addClient,
  removeClient,
  broadcastStatus,
  notifyNewClientConnection,
  notifyUserDisconnected,
} from "./clientManager.js";
import { handleMessage } from "./messageHandler.js";

// Handle new WebSocket connection
export function handleConnection(ws, req) {
  // Check if this is a dashboard monitoring connection
  const userAgent = req.headers["user-agent"] || "";
  const isDashboard = userAgent.includes("Mozilla") && req.headers.origin;

  // Generate unique ID for this connection
  const sessionId = uuidv4();

  // Store the client with its ID
  addClient(sessionId, ws);
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

  // Handle incoming messages
  ws.on("message", function message(data) {
    handleMessage(ws, data);
  });

  // Handle connection close
  ws.on("close", function close() {
    const connectionType = isDashboard ? "Dashboard" : "Client";
    if (isDashboard) {
      log.dashboard(`Disconnected: ${sessionId}`);
    } else {
      log.client(`Disconnected: ${sessionId}`);
    }
    removeClient(sessionId);
    // Notify all WS users about the disconnection
    notifyUserDisconnected(sessionId);
    broadcastStatus(`${connectionType} connection closed with: ${sessionId}`);
  });

  // Handle errors
  ws.on("error", function error(err) {
    const connectionType = isDashboard ? "Dashboard" : "Client";
    log.error(
      `WebSocket error for ${connectionType} ${sessionId}`,
      err.message
    );
    removeClient(sessionId);
    // Also notify on error-triggered disconnects
    notifyUserDisconnected(sessionId);
    broadcastStatus(
      `WebSocket error for ${connectionType} ${sessionId}: ${err.message}`
    );
  });
}
