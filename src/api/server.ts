import express from 'express';
import logger from '../utils/logger';
import { config } from '../config';
import { checkTasksAndControlTv, getStatus } from '../scheduler';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.post('/api/check-tasks', async (req, res) => {
  try {
    logger.info('Manual task check triggered via API');
    await checkTasksAndControlTv();
    res.json({ success: true, message: 'Task check completed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in manual task check: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Error checking tasks',
      error: errorMessage
    });
  }
});

app.get('/api/status', (req, res) => {
  try {
    const status = getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error getting status: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Error getting status',
      error: errorMessage
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start the server
export const startServer = () => {
  const port = config.port;
  
  app.listen(port, () => {
    logger.info(`Server started on port ${port}`);
  });
};

export default app; 