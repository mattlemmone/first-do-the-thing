/**
 * LG TV API - Implementation using lgtv2 package
 */

import logger from "./logger";
import lgtv from "lgtv2";

export interface LGTVConnectionConfig {
  ip: string;
  port?: number;
  key?: string;
}

export interface LGTVConnection {
  connection: LGTVClient;
  disconnect: () => void;
  clientKey?: string;
}

// Type definitions for the lgtv2 library
export interface LGTVClient {
  request: (
    uri: string,
    callback: (err: Error | null, data?: unknown) => void
  ) => void;
  disconnect: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

/**
 * Connect to the LG TV
 * @param config TV configuration
 * @returns The TV connection when connected
 */
export async function connect(
  config: LGTVConnectionConfig
): Promise<LGTVConnection> {
  const { ip, port = 3001, key } = config;

  if (!ip) {
    throw new Error("TV IP address is required");
  }

  logger.info(`Connecting to LG TV at ${ip}:${port}`);

  // Create connection with the client key and WebSocket options
  const connection = lgtv({
    url: `wss://${ip}:${port}`,
    timeout: 5000,
    reconnect: 0,
    clientKey: key,
    // Don't save the key to a file, we're using environment variables
    saveKey: () => {
      logger.info("Received new client key from TV (hidden for security)");
      // We don't need to save it since we already have it in .env
    },
    // Add WebSocket configuration to bypass security checks
    wsconfig: {
      rejectUnauthorized: false, // This is equivalent to --no-check
      tlsOptions: {
        rejectUnauthorized: false,
      },
    },
  }) as LGTVClient;

  // Create a promise that will resolve when connected or reject on error/timeout
  return await new Promise<LGTVConnection>((resolve, reject) => {
    // Handle connection events
    connection.on("error", (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`LG TV connection error: ${errorMessage}`);
      reject(new Error(errorMessage));
    });

    connection.on("connecting", () => {
      logger.info("Connecting to TV...");
    });

    connection.on("connect", () => {
      logger.info("Connected to TV successfully");

      // Create a wrapper object that includes the disconnect method
      const connectionWrapper: LGTVConnection = {
        connection,
        disconnect: () => {
          logger.info("Disconnecting from TV");
          connection.disconnect();
        },
        clientKey: key,
      };

      resolve(connectionWrapper);
    });

    // Set a timeout for the connection attempt
    const timeout = setTimeout(() => {
      logger.error("Connection timed out");
      connection.disconnect();
      reject(new Error("Connection timed out"));
    }, 5000);

    // Clear the timeout when connected
    connection.on("connect", () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Turn off the TV
 * @param connection The TV connection
 */
export async function turnOff(connection: LGTVClient): Promise<void> {
  if (!connection) {
    throw new Error("Not connected to TV");
  }

  logger.info("Sending turn off command to TV");

  return await new Promise<void>((resolve, reject) => {
    connection.request("ssap://system/turnOff", (err: Error | null) => {
      if (err) {
        logger.error(`Failed to turn off TV: ${err.message}`);
        reject(err);
        return;
      }

      logger.info("TV turned off successfully");
      resolve();
    });
  });
}

/**
 * Check if the TV is powered on by sending a ping request
 * @param connection The TV connection
 * @returns Promise that resolves to true if the TV is responsive, false otherwise
 */
export async function isConnected(connection: LGTVClient): Promise<boolean> {
  if (!connection) {
    return false;
  }

  logger.debug("Checking if TV is responsive");

  return await new Promise<boolean>((resolve) => {
    // Use a simple system info request as a ping
    connection.request(
      "ssap://system/getSystemInfo",
      (err: Error | null, data?: unknown) => {
        if (err) {
          logger.debug(`TV is not responsive: ${err.message}`);
          resolve(false);
          return;
        }

        if (!data) {
          logger.debug("TV returned empty response");
          resolve(false);
          return;
        }

        logger.debug("TV is responsive");
        resolve(true);
      }
    );

    // Set a short timeout for the ping request
    setTimeout(() => {
      logger.debug("TV ping request timed out");
      resolve(false);
    }, 2000);
  });
}
