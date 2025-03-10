import { startServer } from "./api/server";
import { validateConfig } from "./config";
import { startScheduler } from "./scheduler";
import { startTvMonitor } from "./tvMonitor";
import logger from "./utils/logger";

// Create logs directory if it doesn't exist
import fs from "fs";
import path from "path";

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Validate configuration before starting
if (!validateConfig()) {
  logger.error("Invalid configuration. Please check your .env file.");
  process.exit(1);
}

// Start the server, TV monitor, and scheduler
try {
  startServer();
  startTvMonitor(); // Start TV monitor with default interval (10 seconds)
  startScheduler();

  logger.info("Application started successfully");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logger.error(`Failed to start application: ${errorMessage}`);
  process.exit(1);
}
