import process from "process";

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

// Log level gating
const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const envLevelName = (process.env.LOG_LEVEL || "").toLowerCase();
const defaultLevelName =
  process.env.NODE_ENV === "production" ? "error" : "debug";
const levelName = LEVELS[envLevelName] ? envLevelName : defaultLevelName;
let currentLevel = LEVELS[levelName];

function should(level) {
  return LEVELS[level] <= currentLevel;
}

function setLogLevel(name) {
  const n = (name || "").toLowerCase();
  if (LEVELS[n] !== undefined) currentLevel = LEVELS[n];
}

function getLogLevel() {
  return Object.keys(LEVELS).find((k) => LEVELS[k] === currentLevel);
}

const log = {
  info: (msg, data = "") => {
    if (!should("info")) return;
    console.log(`${colors.cyan}ℹ ${colors.white}${msg}${colors.reset}`, data);
  },
  success: (msg, data = "") => {
    if (!should("info")) return;
    console.log(`${colors.green}✓ ${colors.white}${msg}${colors.reset}`, data);
  },
  warning: (msg, data = "") => {
    if (!should("warn")) return;
    console.warn(
      `${colors.yellow}⚠ ${colors.white}${msg}${colors.reset}`,
      data
    );
  },
  error: (msg, data = "") => {
    if (!should("error")) return;
    console.error(`${colors.red}✗ ${colors.white}${msg}${colors.reset}`, data);
  },
  server: (msg, data = "") => {
    if (!should("info")) return;
    console.log(
      `${colors.bgBlue}${colors.white} SERVER ${colors.reset} ${colors.blue}${msg}${colors.reset}`,
      data
    );
  },
  client: (msg, data = "") => {
    if (!should("info")) return;
    console.log(
      `${colors.bgGreen}${colors.white} CLIENT ${colors.reset} ${colors.green}${msg}${colors.reset}`,
      data
    );
  },
  dashboard: (msg, data = "") => {
    if (!should("info")) return;
    console.log(
      `${colors.bgMagenta}${colors.white} DASHBOARD ${colors.reset} ${colors.magenta}${msg}${colors.reset}`,
      data
    );
  },
  ws: (msg, data = "") => {
    if (!should("debug")) return;
    console.log(
      `${colors.bgCyan}${colors.white} WEBSOCKET ${colors.reset} ${colors.cyan}${msg}${colors.reset}`,
      data
    );
  },
  message: (msg, data = "") => {
    if (!should("debug")) return;
    console.log(
      `${colors.yellow}📨 ${colors.white}${msg}${colors.reset}`,
      data
    );
  },
};

export { log, colors, setLogLevel, getLogLevel };
