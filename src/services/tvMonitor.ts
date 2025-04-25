/**
 * TV Monitor - Handles TV status monitoring independently from the scheduler
 */

import { connect, LGTVConnection, isConnected } from "../features/lgtv";
import { config } from "../config";
import logger from "../features/logger";
import { EventEmitter } from "events";

// Create a TV monitor event emitter
export const tvMonitorEvents = new EventEmitter();

// TV status interface
export interface TVStatus {
  connected: boolean;
  lastCheckTime: Date | null;
  connection: LGTVConnection | null;
}

// Initial TV status
const initialTVStatus: TVStatus = {
  connected: false,
  lastCheckTime: null,
  connection: null,
};

// Current TV status (immutable)
let currentTVStatus: TVStatus = { ...initialTVStatus };

// TV monitor interval
let tvMonitorInterval: NodeJS.Timeout | null = null;

/**
 * Update the TV status immutably
 * @param updates Partial updates to apply to the TV status
 */
function updateTVStatus(updates: Partial<TVStatus>): void {
  const previousStatus = { ...currentTVStatus };
  currentTVStatus = { ...currentTVStatus, ...updates };

  // Emit events if status changed
  if (previousStatus.connected !== currentTVStatus.connected) {
    tvMonitorEvents.emit("tv:connection-change", currentTVStatus.connected);
    logger.info(
      `TV connection status changed: ${currentTVStatus.connected ? "connected" : "disconnected"}`
    );
  }
}

/**
 * Check if the TV is on by attempting to connect to it or validate existing connection
 * @returns Promise that resolves to true if the TV is on, false otherwise
 */
export async function checkTvStatus(): Promise<boolean> {
  try {
    const checkTime = new Date();
    updateTVStatus({ lastCheckTime: checkTime });

    // If we have an existing connection, verify it's still valid
    if (currentTVStatus.connection) {
      logger.debug("Verifying existing TV connection");

      const isStillConnected = await isConnected(
        currentTVStatus.connection.connection
      );

      if (!isStillConnected) {
        logger.info("TV is no longer responsive, closing connection");
        currentTVStatus.connection.disconnect();
        updateTVStatus({
          connected: false,
          connection: null,
        });
        return false;
      }

      logger.debug("TV connection is valid - TV is on");
      updateTVStatus({ connected: true });
      return true;
    }

    // No existing connection, try to connect to the TV
    logger.debug("No existing connection, attempting to connect to TV");
    const connection = await connect(config.tv);

    // Verify the connection is responsive
    const isResponsive = await isConnected(connection.connection);

    if (!isResponsive) {
      logger.info("Connected to TV but it's not responsive, disconnecting");
      connection.disconnect();
      updateTVStatus({
        connected: false,
        connection: null,
      });
      return false;
    }

    logger.info("Successfully connected to TV - TV is on");
    updateTVStatus({
      connected: true,
      connection,
    });
    return true;
  } catch (error) {
    // If we can't connect, the TV is likely off or unreachable
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(
      `Failed to connect to TV - TV is likely off or unreachable: ${errorMessage}`
    );
    updateTVStatus({
      connected: false,
      connection: null,
    });
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
    tvConnected: currentTVStatus.connected,
    lastCheckTime: currentTVStatus.lastCheckTime,
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
  if (currentTVStatus.connection) {
    currentTVStatus.connection.disconnect();
    updateTVStatus({
      connected: false,
      connection: null,
    });
    logger.info("Disconnected from TV");
  }
}

/**
 * Get the TV connection if available
 * @returns The TV connection or null if not connected
 */
export function getTvConnection(): LGTVConnection | null {
  return currentTVStatus.connection;
}
