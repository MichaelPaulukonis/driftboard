import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types/index.js';

const router = Router();

/**
 * Verify Firebase token endpoint
 * POST /api/auth/verify
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If this endpoint is reached, the authMiddleware has already verified the token
    const response: ApiResponse = {
      success: true,
      data: {
        user: req.user,
        verified: true,
      },
      message: 'Token verified successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Get current user info
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: {
        user: req.user,
      },
      message: 'User info retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
