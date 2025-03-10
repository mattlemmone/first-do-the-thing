/**
 * TV Monitor - Handles TV status monitoring independently from the scheduler
 */

import { connect, LGTVConnection } from "./lgtv";
import { config } from "./config";
import logger from "./utils/logger";

// TV connection state
let tvConnection: LGTVConnection | null = null;
let tvMonitorInterval: NodeJS.Timeout | null = null;
let lastTvCheckTime: Date | null = null;

/**
 * Check if the TV is on by attempting to connect to it
 * @returns Promise that resolves to true if the TV is on, false otherwise
 */
export async function checkTvStatus(): Promise<boolean> {
  try {
    lastTvCheckTime = new Date();

    // If we already have a connection, the TV is on
    if (tvConnection) {
      logger.debug("TV connection exists - TV is on");
      return true;
    }

    // Try to connect to the TV
    tvConnection = await connect(config.tv);
    logger.info("Successfully connected to TV - TV is on");
    return true;
  } catch (error) {
    // If we can't connect, the TV is likely off or unreachable
    logger.debug(
      "Failed to connect to TV - TV is likely off or unreachable:",
      error
    );
    tvConnection = null;
    return false;
  }
}

/**
 * Get the current TV status
 * @returns Object containing the current TV status
 */
export function getTvStatus(): {
  tvConnected: boolean;
  lastCheckTime: Date | null;
} {
  return {
    tvConnected: tvConnection !== null,
    lastCheckTime: lastTvCheckTime,
  };
}

/**
 * Start the TV monitor to periodically check TV status
 * @param checkInterval Optional interval in milliseconds (defaults to config value)
 */
export function startTvMonitor(checkInterval?: number): void {
  if (tvMonitorInterval) {
    logger.info("TV monitor already running");
    return;
  }

  // Use provided interval or fall back to config value
  const interval = checkInterval || config.tv.statusCheckInterval;

  logger.info(`Starting TV monitor with interval: ${interval}ms`);

  // Run the check immediately
  checkTvStatus();

  // Then set up the interval
  tvMonitorInterval = setInterval(checkTvStatus, interval);
}

/**
 * Stop the TV monitor
 */
export function stopTvMonitor(): void {
  if (tvMonitorInterval) {
    clearInterval(tvMonitorInterval);
    tvMonitorInterval = null;
    logger.info("TV monitor stopped");
  }

  // Disconnect from TV if connected
  if (tvConnection) {
    tvConnection.disconnect();
    tvConnection = null;
    logger.info("Disconnected from TV");
  }
}

/**
 * Get the TV connection if available
 * @returns The TV connection or null if not connected
 */
export function getTvConnection(): LGTVConnection | null {
  return tvConnection;
}
