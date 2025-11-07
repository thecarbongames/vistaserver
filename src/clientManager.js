import WebSocket from "ws";
import { log } from "./logger.js";
import { Purposes } from "./constants.js";

// Store all connected clients with their IDs
export const wsUsers = new Map();

export function getReadySenders() {
  return Array.from(getNonDashboardUsers()).filter(
    (wsUser) =>
      wsUser.userInfo &&
      wsUser.userInfo.isReadyToConnect &&
      wsUser.readyState === WebSocket.OPEN &&
      wsUser.userInfo.activityType === "Sender"
  );
}

export function getReadyClients() {
  return Array.from(getNonDashboardUsers())
    .filter(
      (wsUser) =>
        wsUser.userInfo &&
        wsUser.userInfo.isReadyToConnect &&
        wsUser.userInfo.activityType === "Client"
    )
    .map((wsUser) => wsUser.userInfo.wsid);
}
function getNonDashboardUsers() {
  return Array.from(wsUsers.values()).filter(
    (wsUser) => !wsUser.isDashboard && wsUser.readyState === WebSocket.OPEN
  );
}
export function getDashboards() {
  return Array.from(wsUsers.values()).filter(
    (wsUser) => wsUser.isDashboard && wsUser.readyState === WebSocket.OPEN
  );
}

// Function to broadcast status updates to monitoring clients
export function broadcastStatus(message) {
  const statusUpdate = {
    type: "status",
    connectedUsers: Array.from(wsUsers.values()).filter(
      (client) => !client.isDashboard
    ).length,
    message: message,
    timestamp: new Date().toISOString(),
  };

  wsUsers.forEach((client, clientId) => {
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
export function notifyNewClientConnection() {
  return;
}

// Add a new client to the clients map
export function addClient(sessionId, ws) {
  wsUsers.set(sessionId, ws);
  ws.sessionId = sessionId;
}

// Remove a client from the clients map
export function removeClient(sessionId) {
  wsUsers.delete(sessionId);
}

// Get client count
export function getClientCount() {
  return wsUsers.size;
}

// Notify all non-dashboard WS users that a user disconnected
export function notifyUserDisconnected(disconnectedSessionId) {
  const payload = {
    senderWsid: "Server",
    purpose: Purposes.ClientDisconnected,
    message: disconnectedSessionId,
  };

  wsUsers.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN && !client.isDashboard) {
      try {
        client.send(JSON.stringify(payload));
      } catch (e) {
        log.error(
          `Failed to notify ${clientId} about disconnection of ${disconnectedSessionId}: ${e.message}`
        );
      }
    }
  });
}
