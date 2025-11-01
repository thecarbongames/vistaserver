import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import process from "process";

// Import our modules
import { log } from "./src/logger.js";
import { getClientCount } from "./src/clientManager.js";
import { handleConnection } from "./src/websocketHandler.js";
import routes from "./src/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log.server("🚀 Starting Vista Server Application...");

// Create Express app
const app = express();

// CORS configuration
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

// Use routes
app.use("/", routes);

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server using the HTTP server
const wss = new WebSocketServer({ server });

// Handle new WebSocket connections
wss.on("connection", handleConnection);

// Start the HTTP server
server.listen(8080, () => {
  log.success("🌐 WebSocket Server Running on port 8080");
  log.info("📊 Visit http://localhost:8080 to view the dashboard");
  log.info(`👥 Current connections: ${getClientCount()}`);
});

// Graceful shutdown
process.on("SIGINT", function () {
  log.warning("\n🛑 Stopping server...");
  server.close(() => {
    log.success("✅ Server stopped gracefully");
    process.exit(0);
  });
});

log.info("⏹️  Press Ctrl+C to stop the server...");
