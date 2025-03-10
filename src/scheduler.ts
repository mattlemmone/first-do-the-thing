import { searchByTag } from './things3';
import { turnOff } from './lgtv';
import { config } from './config';
import logger from './utils/logger';
import { getTvStatus, getTvConnection } from './tvMonitor';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastCheckTime: Date | null = null;
let lastTaskCount: number = 0;

/**
 * Check for tasks with the configured tag and turn off the TV if any exist
 */
export async function checkTasksAndControlTv(): Promise<void> {
  try {
    logger.info(`Checking for tasks with tag: ${config.things3.tag}`);
    lastCheckTime = new Date();
    
    // Search for tasks with the configured tag
    const tasks = await searchByTag(config.things3.tag);
    lastTaskCount = tasks.length;
    
    if (tasks.length > 0) {
      logger.info(`Found ${tasks.length} tasks with tag ${config.things3.tag}`);
      
      // Get TV status from the monitor
      const { tvConnected } = getTvStatus();
      
      if (tvConnected) {
        const tvConnection = getTvConnection();
        if (tvConnection) {
          logger.info('TV is on and tasks exist - turning off TV');
          await turnOff(tvConnection.connection);
        }
      } else {
        logger.info('TV is already off or unreachable');
      }
    } else {
      logger.info(`No tasks found with tag ${config.things3.tag}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
    schedulerRunning: schedulerInterval !== null,
    lastCheckTime,
    lastTaskCount,
    tvConnected,
    checkInterval: config.things3.checkInterval,
    monitoredTag: config.things3.tag
  };
}

/**
 * Start the scheduler to periodically check tasks and control the TV
 */
export function startScheduler(): void {
  if (schedulerInterval) {
    logger.info('Scheduler already running');
    return;
  }
  
  logger.info(`Starting scheduler with interval: ${config.things3.checkInterval}ms`);
  
  // Run the check immediately
  checkTasksAndControlTv();
  
  // Then set up the interval
  schedulerInterval = setInterval(
    checkTasksAndControlTv,
    config.things3.checkInterval
  );
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Scheduler stopped');
  }
} 