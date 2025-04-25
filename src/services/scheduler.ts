import { searchByTag } from "../features/things3";
import { turnOff } from "../features/lgtv";
import { config } from "../config";
import logger from "../features/logger";
import { getTvStatus, getTvConnection, tvMonitorEvents } from "./tvMonitor";
import { EventEmitter } from "events";

// Create a scheduler event emitter
export const schedulerEvents = new EventEmitter();

// Scheduler state interface
export interface SchedulerState {
  running: boolean;
  lastCheckTime: Date | null;
  lastTaskCount: number;
  interval: NodeJS.Timeout | null;
}

// Initial scheduler state
const initialSchedulerState: SchedulerState = {
  running: false,
  lastCheckTime: null,
  lastTaskCount: 0,
  interval: null,
};

// Current scheduler state (immutable)
let currentSchedulerState: SchedulerState = { ...initialSchedulerState };

/**
 * Update the scheduler state immutably
 * @param updates Partial updates to apply to the scheduler state
 */
function updateSchedulerState(
  updates: Partial<Omit<SchedulerState, "interval">> & {
    interval?: NodeJS.Timeout | null;
  }
): void {
  const previousState = { ...currentSchedulerState };
  currentSchedulerState = { ...currentSchedulerState, ...updates };

  // Emit events if running state changed
  if (previousState.running !== currentSchedulerState.running) {
    schedulerEvents.emit(
      "scheduler:state-change",
      currentSchedulerState.running
    );
    logger.info(
      `Scheduler state changed: ${currentSchedulerState.running ? "running" : "stopped"}`
    );
  }
}

/**
 * Check for tasks with the configured tag and turn off the TV if any exist
 */
export async function checkTasksAndControlTv(): Promise<void> {
  try {
    logger.info(`Checking for tasks with tag: ${config.things3.tag}`);
    const checkTime = new Date();

    // Search for tasks with the configured tag
    const tasks = await searchByTag(config.things3.tag);

    // Update state immutably
    updateSchedulerState({
      lastCheckTime: checkTime,
      lastTaskCount: tasks.length,
    });

    if (tasks.length > 0) {
      logger.info(`Found ${tasks.length} tasks with tag ${config.things3.tag}`);

      // Get TV status from the monitor
      const { tvConnected } = getTvStatus();

      if (tvConnected) {
        const tvConnection = getTvConnection();
        if (tvConnection) {
          logger.info("TV is on and tasks exist - turning off TV");
          await turnOff(tvConnection.connection);
        }
      } else {
        logger.info("TV is already off or unreachable");
      }
    } else {
      logger.info(`No tasks found with tag ${config.things3.tag}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error checking tasks and controlling TV: ${errorMessage}`);
    const nextCheckInSeconds = Math.round(config.things3.checkInterval / 1000);
    logger.info(`Will try again in ${nextCheckInSeconds} seconds`);
  }
}

/**
 * Get the current status of the system
 * @returns Object containing the current status
 */
export function getStatus(): {
  schedulerRunning: boolean;
  lastCheckTime: Date | null;
  lastTaskCount: number;
  tvConnected: boolean;
  checkInterval: number;
  monitoredTag: string;
} {
  // Get TV status from the monitor
  const { tvConnected } = getTvStatus();

  return {
    schedulerRunning: currentSchedulerState.running,
    lastCheckTime: currentSchedulerState.lastCheckTime,
    lastTaskCount: currentSchedulerState.lastTaskCount,
    tvConnected,
    checkInterval: config.things3.checkInterval,
    monitoredTag: config.things3.tag,
  };
}

/**
 * Start the scheduler to periodically check tasks and control the TV
 */
export function startScheduler(): void {
  if (currentSchedulerState.interval) {
    logger.info("Scheduler already running");
    return;
  }

  logger.info(
    `Starting scheduler with interval: ${config.things3.checkInterval}ms`
  );

  // Run the check immediately
  checkTasksAndControlTv();

  // Then set up the interval
  const interval = setInterval(
    checkTasksAndControlTv,
    config.things3.checkInterval
  );

  // Update state immutably
  updateSchedulerState({
    running: true,
    interval,
  });

  // Listen for TV connection changes
  tvMonitorEvents.on("tv:connection-change", (connected: boolean) => {
    if (connected) {
      logger.info("TV connected - checking tasks immediately");
      checkTasksAndControlTv();
    }
  });
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (currentSchedulerState.interval) {
    clearInterval(currentSchedulerState.interval);

    // Remove TV connection change listener
    tvMonitorEvents.removeAllListeners("tv:connection-change");

    // Update state immutably
    updateSchedulerState({
      running: false,
      interval: null,
    });

    logger.info("Scheduler stopped");
  }
}
