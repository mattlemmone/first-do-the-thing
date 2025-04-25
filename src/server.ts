import express from "express";
import path from "path";
import fs from "fs";
import logger from "./features/logger";
import { config } from "./config";
import { checkTasksAndControlTv, getStatus } from "./services/scheduler";
import { searchByTag } from "./features/things3";
import { turnOff } from "./features/lgtv";
import { getTvConnection, getTvStatus } from "./services/tvMonitor";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../../dist/public")));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Serve the admin interface
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist/public/index.html"));
});

// API Routes
app.post("/api/check-tasks", async (req, res) => {
  try {
    logger.info("Manual task check triggered via API");
    await checkTasksAndControlTv();
    res.json({ success: true, message: "Task check completed" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error in manual task check: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error checking tasks",
      error: errorMessage,
    });
  }
});

app.get("/api/status", (req, res) => {
  try {
    const status = getStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error getting status: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error getting status",
      error: errorMessage,
    });
  }
});

// New endpoint to fetch outstanding tasks
app.get("/api/tasks", async (req, res) => {
  try {
    logger.info(`Fetching tasks with tag: ${config.things3.tag}`);
    const tasks = await searchByTag(config.things3.tag);
    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error fetching tasks: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: errorMessage,
    });
  }
});

// New endpoint to turn off the TV directly
app.post("/api/tv/turn-off", async (req, res) => {
  try {
    logger.info("Manual TV turn off triggered via API");

    // Get TV connection from the monitor
    const tvConnection = getTvConnection();

    if (!tvConnection) {
      return res.status(400).json({
        success: false,
        message: "TV is not connected",
      });
    }

    await turnOff(tvConnection.connection);
    res.json({ success: true, message: "TV turn off command sent" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error turning off TV: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error turning off TV",
      error: errorMessage,
    });
  }
});

// New lightweight endpoint for TV status only
app.get("/api/tv/status", (req, res) => {
  try {
    const tvStatus = getTvStatus();
    res.json({
      success: true,
      status: {
        tvConnected: tvStatus.tvConnected,
        lastCheckTime: tvStatus.lastCheckTime,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error getting TV status: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error getting TV status",
      error: errorMessage,
    });
  }
});

// New endpoint to fetch logs
app.get("/api/logs", (req, res) => {
  try {
    // Use a more reliable path resolution
    const logsDir = path.resolve(process.cwd(), "logs");
    const logFile = path.join(logsDir, "combined.log");

    logger.info(`Attempting to read log file from: ${logFile}`);

    if (!fs.existsSync(logsDir)) {
      logger.info(`Logs directory not found, creating: ${logsDir}`);
      fs.mkdirSync(logsDir, { recursive: true });
    }

    if (!fs.existsSync(logFile)) {
      logger.info(`Log file not found, creating empty log file: ${logFile}`);
      fs.writeFileSync(logFile, "");
      return res.json({
        success: true,
        logs: [],
      });
    }

    // Read the log file
    logger.info(`Reading log file: ${logFile}`);
    const logContent = fs.readFileSync(logFile, "utf8");
    const logLines = logContent
      .split("\n")
      .filter((line) => line.trim() !== "");
    logger.info(`Found ${logLines.length} log lines`);

    // Parse log lines into structured data
    const logs = [];

    for (const line of logLines) {
      try {
        // Simple parsing: just split the line into timestamp, level, and message
        const timestampEnd = line.indexOf(" ");
        if (timestampEnd === -1) continue;

        const timestamp = line.substring(0, timestampEnd);

        const levelStart = line.indexOf("[", timestampEnd);
        const levelEnd = line.indexOf("]", levelStart);
        if (levelStart === -1 || levelEnd === -1) continue;

        const level = line.substring(levelStart + 1, levelEnd).toUpperCase();

        const message = line.substring(levelEnd + 2).trim();

        logs.push({
          timestamp,
          level,
          message,
        });
      } catch (err) {
        logger.error(`Error parsing log line: ${line}`, err);
      }
    }

    logger.info(`Successfully parsed ${logs.length} logs`);

    // Return the most recent 100 logs
    const recentLogs = logs.slice(-100);

    res.json({
      success: true,
      logs: recentLogs,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error fetching logs: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: "Error fetching logs",
      error: errorMessage,
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start the server
export const startServer = () => {
  const port = config.port;

  app.listen(port, () => {
    logger.info(`Server started on port ${port}`);
    logger.info(`Admin interface available at http://localhost:${port}`);
  });
};

export default app;
