import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AppError } from './errorHandler.js';
import { prisma } from '../services/database.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken & { id: string }; // Ensure id is available
    }
  }
}

/**
 * Middleware to verify Firebase ID token and handle user creation.
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  // In test environment, mock user from a special header
  if (process.env.NODE_ENV === 'test') {
    const testUserUid = req.headers['x-test-user-uid'] as string;

    if (testUserUid) {
      // This mock allows us to test authenticated routes
      req.user = {
        uid: testUserUid,
        email: `${testUserUid}@example.com`,
        name: 'Test User',
        id: testUserUid, // For consistency
      } as unknown as admin.auth.DecodedIdToken & { id: string };
      return next();
    }
    // If no header, proceed as unauthenticated to test protected routes
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: No token provided or invalid format', 401, 'NO_TOKEN'));
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken) {
    return next(new AppError('Unauthorized: Token is missing', 401, 'NO_TOKEN'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user exists in our DB, if not, create them
    let user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email || '', // email is optional on firebase token
          name: decodedToken.name,
        },
      });
      console.log(`New user created: ${user.id} - ${user.email}`);
    }

    req.user = { ...decodedToken, id: user.id }; // Attach user to request
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    next(new AppError('Forbidden: Invalid or expired token', 403, 'INVALID_TOKEN'));
  }
};
