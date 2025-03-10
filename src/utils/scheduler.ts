import { CommandDispatcher } from '../commands/CommandDispatcher';
import { config } from '../config';
import logger from './logger';

/**
 * Scheduler for periodic tasks
 */
export class Scheduler {
  private commandDispatcher: CommandDispatcher;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(commandDispatcher: CommandDispatcher) {
    this.commandDispatcher = commandDispatcher;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    logger.info(`Starting Things3 check scheduler with interval: ${config.things3.checkInterval}ms`);
    
    // Perform an initial check
    this.checkThings3Tasks();
    
    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkThings3Tasks();
    }, config.things3.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Things3 check scheduler stopped');
    }
  }

  /**
   * Check Things3 tasks
   */
  private async checkThings3Tasks(): Promise<void> {
    try {
      logger.info('Checking Things3 tasks');
      
      const result = await this.commandDispatcher.dispatchCommand(
        'things3',
        'checkTasks',
        { tag: config.things3.tag }
      );
      
      logger.info(`Things3 check result: ${result.message}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Things3 check failed: ${errorMessage}`);
    }
  }
} 