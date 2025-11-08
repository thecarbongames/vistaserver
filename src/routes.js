import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getReadyClients, getReadySenders } from "./clientManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve the dashboard page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// API endpoint to get ready clients
router.get("/readyClients", (req, res) => {
  const readyClients = getReadyClients();
  res.json(readyClients);
});
// API endpoint to get ready senders
router.get("/readySenders", (req, res) => {
  const readySenders = getReadySenders();
  res.json(readySenders);
});

export default router;
