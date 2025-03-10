import express from 'express';
import routes from './routes';
import logger from '../utils/logger';
import { config } from '../config';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api', routes);

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