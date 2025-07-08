import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/types/index.js';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'DriftBoard API is healthy',
  };

  res.json(response);
});

export { router as healthRouter };
