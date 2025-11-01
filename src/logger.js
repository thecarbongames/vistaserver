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

export { log, colors };
