import WebSocket from "ws";
import { log } from "./logger.js";
import { Purposes, Targets } from "./constants.js";
import {
  wsUsers,
  getDashboards,
  getReadyClients,
  getReadySenders,
} from "./clientManager.js";

// Handle incoming WebSocket messages
export function handleMessage(ws, data) {
  const sessionId = ws.sessionId;
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
        handleServerMessage(ws, purpose, messageContent, sessionId);
        break;

      case Targets.SpecificWSUser:
        handleSpecificUserMessage(WSMessage);
        break;

      case Targets.AllWSUsers:
        log.info("Broadcasting message to all WebSocket users");
        // TODO: Implement broadcast to all users
        break;

      case Targets.AllSenders:
        log.info("Broadcasting message to all senders");
        // TODO: Implement broadcast to all senders
        break;

      case Targets.AllClients:
        log.info("Broadcasting message to all clients");
        // TODO: Implement broadcast to all clients
        break;

      default:
        log.warning("Invalid message target, ignoring");
        return;
    }
  } catch (e) {
    log.error("Failed to process message:", e.message);
  }
}

// Handle server-targeted messages
function handleServerMessage(ws, purpose, messageContent, sessionId) {
  log.server(`Processing server-targeted message: ${purpose}`);

  let userInfo = null;

  switch (purpose) {
    case Purposes.UserInfoUpdate: {
      userInfo = JSON.parse(messageContent);
      wsUsers.get(sessionId).userInfo = userInfo;
      log.success(`User info updated for ${sessionId}`, userInfo.activityType);
      if (userInfo.activityType === "Sender") {
        handleSenderUpdate(ws, sessionId);
      } else {
        handleClientUpdate(sessionId);
      }
      break;
    }
    case Purposes.UpdateConnectionList: {
      let connectionList = JSON.parse(messageContent);
      updateUserConnectionList(sessionId, connectionList);
      break;
    }

    default:
      log.warning(`Unknown server purpose: ${purpose}`);
      return;
  }
}

// Function to update user connection list
function updateUserConnectionList(sessionId, connectionList) {
  const user = wsUsers.get(sessionId);
  if (!user) {
    log.warning(`User not found for sessionId: ${sessionId}`);
    return;
  }
  user.connectionList = connectionList;
  log.success(`Updated connection list for ${sessionId}`, connectionList);

  // Get all dashboards and notify them of the updated connection list
  const dashboards = getDashboards();
  dashboards.forEach((dashboard) => {
    dashboard.send("MUST_UPDATE_CONNECTION_LIST");
  });
}

// Handle sender user info update
function handleSenderUpdate(ws, sessionId) {
  const allAvailableClients = getReadyClients();

  // Send available clients to the sender
  const availableClientsMessage = {
    senderWsid: "Server",
    purpose: Purposes.AvailableClients,
    message: JSON.stringify(allAvailableClients),
  };
  ws.send(JSON.stringify(availableClientsMessage));
  log.info(`Sent ${allAvailableClients.length} available clients to sender`);
}

// Handle client user info update
function handleClientUpdate(sessionId) {
  // Notify All Senders About New Client
  const newClientWsidMessage = {
    senderWsid: "Server",
    purpose: Purposes.NewClientConnect,
    message: JSON.stringify(wsUsers?.get(sessionId)?.userInfo),
  };

  const allSenders = getReadySenders();

  allSenders.forEach((sender) => {
    sender.send(JSON.stringify(newClientWsidMessage));
  });

  log.info(`Notified all senders about new connection: ${sessionId}`);
}

// Handle messages targeted to specific users
function handleSpecificUserMessage(WSMessage) {
  log.ws("Routing message to specific user");

  const targetWsid = WSMessage.targetWsid;
  const targetClient = wsUsers.get(targetWsid);

  if (!targetClient) {
    log.warning(`Target client not found: ${targetWsid}`);
    return;
  }

  targetClient.send(JSON.stringify(WSMessage));
  log.success(`Message routed to ${targetWsid}`);
}
