// WebSocket message purposes and targets constants
export const Purposes = {
  None: "None",
  ReadyToConnect: "ReadyToConnect",
  UserInfoUpdate: "UserInfoUpdate",
  UpdateConnectionList: "UpdateConnectionList",
  UserWSID: "UserWSID",
  AvailableClients: "AvailableClients",
  NewClientConnect: "NewClientConnect",
  CreateWebRTCPeer: "CreateWebRTCPeer",
  WebRTCPeerCreated: "WebRTCPeerCreated",
  WebRTCCommunication: "WebRTCCommunication",
  ClientDisconnected: "ClientDisconnected",
};

export const Targets = {
  Server: "Server",
  AllWSUsers: "AllWSUsers",
  AllSenders: "AllSenders",
  AllClients: "AllClients",
  SpecificWSUser: "SpecificWSUser",
};
