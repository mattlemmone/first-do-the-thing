import dotenv from "dotenv";
import logger from "./utils/logger";

// Load environment variables from .env file
dotenv.config();

interface TVConfig {
  ip: string;
  port: number;
  key: string;
  statusCheckInterval: number;
}

interface Things3Config {
  tag: string;
  checkInterval: number;
}

interface AppConfig {
  port: number;
  tv: TVConfig;
  things3: Things3Config;
}

// Load and validate configuration
const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  tv: {
    ip: process.env.TV_IP || "",
    port: parseInt(process.env.TV_PORT || "3001", 10),
    key: process.env.TV_KEY || "",
    statusCheckInterval: parseInt(
      process.env.TV_STATUS_CHECK_INTERVAL || "10000",
      10
    ), // Default: 10 seconds
  },
  things3: {
    tag: process.env.THINGS3_TAG || "do the thing",
    checkInterval: parseInt(process.env.THINGS3_CHECK_INTERVAL || "300000", 10), // Default: 5 minutes
  },
};

// Validate required configuration
const validateConfig = (): boolean => {
  let isValid = true;

  if (!config.tv.ip) {
    logger.error("TV_IP is not set in environment variables");
    isValid = false;
  }

  if (!config.things3.tag) {
    logger.error("THINGS3_TAG is not set in environment variables");
    isValid = false;
  }

  return isValid;
};

export { config, validateConfig };
