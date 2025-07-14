import supertest from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || 'your-default-secret';

export const getAuthHeaders = (user: { userId?: string; email?: string; name?: string } = {}) => {
  const testUserId = user.userId || `test-user-uid-${Date.now()}-${Math.random()}`;
  const testEmail = user.email || `test-${Date.now()}-${Math.random()}@example.com`;
  const testName = user.name || 'Test User';

  const token = jwt.sign(
    {
      uid: testUserId,
      email: testEmail,
      name: testName,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const setup = async () => {
  const { default: app } = await import('../src/backend/server');
  return supertest(app);
};
