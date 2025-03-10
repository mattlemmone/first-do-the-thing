import express, { Request, Response, Router } from 'express';
import { CommandDispatcher } from '../commands/CommandDispatcher';
import logger from '../utils/logger';
import { config } from '../config';

const router: Router = express.Router();
const commandDispatcher = new CommandDispatcher();

/**
 * Validate command request body
 * @param body Request body
 * @returns True if valid, false otherwise
 */
const validateCommandRequest = (body: any): boolean => {
  return (
    body &&
    typeof body.protocol === 'string' &&
    typeof body.command === 'string' &&
    body.config !== undefined
  );
};

/**
 * POST /api/command - Trigger a command
 */
router.post('/command', async (req: Request, res: Response) => {
  try {
    if (!validateCommandRequest(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. Required fields: protocol, command, config',
      });
    }

    const { protocol, command, config } = req.body;
    
    logger.info(`Received command request: ${protocol}/${command}`);
    
    const result = await commandDispatcher.dispatchCommand(protocol, command, config);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API error: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      message: `Server error: ${errorMessage}`,
    });
  }
});

/**
 * GET /api/check-things3 - Check Things3 tasks and turn off TV if needed
 */
router.get('/check-things3', async (req: Request, res: Response) => {
  try {
    logger.info('Received Things3 check request');
    
    const result = await commandDispatcher.dispatchCommand(
      'things3',
      'checkTasks',
      { tag: config.things3.tag }
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API error: ${errorMessage}`);
    
    return res.status(500).json({
      success: false,
      message: `Server error: ${errorMessage}`,
    });
  }
});

export default router; 