import supertest from 'supertest';

export const getAuthHeaders = (userId = 1) => ({
  Authorization: `Bearer valid-token-${userId}`,
});

export const setup = async () => {
  const { default: app } = await import('../src/backend/server');
  return supertest(app);
};
