import { searchByTag } from './things3';
import { connect, turnOff, LGTVConnection } from './lgtv';
import { config } from './config';
import logger from './utils/logger';

let tvConnection: LGTVConnection | null = null;
let schedulerInterval: NodeJS.Timeout | null = null;
let lastCheckTime: Date | null = null;
let lastTaskCount: number = 0;

/**
 * Check if the TV is on by attempting to connect to it
 * @returns Promise that resolves to true if the TV is on, false otherwise
 */
async function isTvOn(): Promise<boolean> {
  try {
    // If we already have a connection, the TV is on
    if (tvConnection) {
      return true;
    }
    
    // Try to connect to the TV
    tvConnection = await connect(config.tv);
    logger.info('Successfully connected to TV - TV is on');
    return true;
  } catch (error) {
    // If we can't connect, the TV is likely off or unreachable
    logger.info('Failed to connect to TV - TV is likely off or unreachable');
    tvConnection = null;
    return false;
  }
}

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
      
      // Check if the TV is on
      const tvIsOn = await isTvOn();
      
      if (tvIsOn && tvConnection) {
        logger.info('TV is on and tasks exist - turning off TV');
        await turnOff(tvConnection.connection);
        tvConnection = null;
      } else {
        logger.info('TV is already off or unreachable');
      }
    } else {
      logger.info(`No tasks found with tag ${config.things3.tag}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error checking tasks and controlling TV: ${errorMessage}`);
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
  return {
    schedulerRunning: schedulerInterval !== null,
    lastCheckTime,
    lastTaskCount,
    tvConnected: tvConnection !== null,
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
  
  // Disconnect from TV if connected
  if (tvConnection) {
    tvConnection.disconnect();
    tvConnection = null;
    logger.info('Disconnected from TV');
  }
} 