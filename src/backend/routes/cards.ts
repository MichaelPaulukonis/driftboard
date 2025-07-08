import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types/index.js';

const router = Router();

/**
 * Placeholder for cards routes
 * These will be implemented in the next phase
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: [],
      message: 'Cards routes not yet implemented',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as cardsRouter };
