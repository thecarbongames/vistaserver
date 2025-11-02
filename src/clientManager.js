import WebSocket from "ws";
import { log } from "./logger.js";

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
export function notifyNewClientConnection(newSessionId) {
  return;
  const newClientMessage = `NewClientConnect#${newSessionId}`;

  wsUsers.forEach((client, clientId) => {
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
