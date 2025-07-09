import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        name?: string;
      };
    }
  }
}

/**
 * Simple auth middleware for development (bypasses Firebase)
 * In production, this should be replaced with proper Firebase auth
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // For development and testing, use a mock user
    // TODO: Replace with actual Firebase auth
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      req.user = {
        uid: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      };
      return next();
    }

    // In production, require proper authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    // For now, just accept any bearer token in production
    // TODO: Implement proper Firebase token verification
    req.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
    }
  }
};
