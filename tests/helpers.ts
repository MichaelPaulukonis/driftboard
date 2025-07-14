import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/backend/services/database.js';

const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || 'your-default-secret';

export const getAuthHeaders = async (user: { userId?: string; email?: string; name?: string } = {}) => {
  const testUserId = user.userId || `test-user-uid-${Date.now()}-${Math.random()}`;
  const testEmail = user.email || `test-${Date.now()}-${Math.random()}@example.com`;
  const testName = user.name || 'Test User';

  // Ensure the user exists in the database before generating a token
  const dbUser = await prisma.user.upsert({
    where: { userId: testUserId },
    update: { name: testName },
    create: {
      userId: testUserId,
      email: testEmail,
      name: testName,
    },
  });

  const token = jwt.sign(
    {
      uid: dbUser.userId,
      email: dbUser.email,
      name: dbUser.name,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    headers: { Authorization: `Bearer ${token}` },
    user: dbUser,
  };
};

export const setup = async () => {
  const { default: app } = await import('../src/backend/server');
  return supertest(app);
};
