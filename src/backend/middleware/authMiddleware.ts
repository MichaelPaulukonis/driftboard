import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { prisma } from '../services/database.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: (admin.auth.DecodedIdToken | jwt.JwtPayload) & { id: string; uid: string };
    }
  }
}

const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || 'your-default-secret';

/**
 * Middleware to verify Firebase ID token and handle user creation.
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: No token provided or invalid format', 401, 'NO_TOKEN'));
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken) {
    return next(new AppError('Unauthorized: Token is missing', 401, 'NO_TOKEN'));
  }

  // In test environment, verify using the test secret
  if (process.env.NODE_ENV === 'test') {
    try {
      const decoded = jwt.verify(idToken, TEST_JWT_SECRET) as jwt.JwtPayload;
      
      // Find or create a test user based on the token's uid
      let user = await prisma.user.findUnique({ where: { userId: decoded.uid } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            userId: decoded.uid,
            email: decoded.email || `${decoded.uid}@example.com`,
            name: decoded.name || 'Test User',
          }
        });
      }

      req.user = { ...decoded, id: user.id, uid: user.userId };
      return next();
    } catch (error) {
      console.error('Test token verification failed:', error);
      return next(new AppError('Forbidden: Invalid test token', 403, 'INVALID_TOKEN'));
    }
  }

  // In production/development, verify using Firebase Admin
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user exists in our DB, if not, create them
    let user = await prisma.user.findUnique({ where: { userId: decodedToken.uid } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          userId: decodedToken.uid,
          email: decodedToken.email || '', // email is optional on firebase token
          name: decodedToken.name,
          version: 1,
          status: 'ACTIVE',
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
