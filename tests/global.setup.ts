import { vi } from 'vitest';

export default function () {
  // Mock Firebase Admin SDK
  vi.mock('firebase-admin', () => ({
    auth: () => ({
      verifyIdToken: vi.fn().mockImplementation(async (token) => {
        if (token.startsWith('valid-token-')) {
          const userId = token.split('-').pop();
          return { uid: `user-${userId}-id`, email: `user${userId}@test.com`, name: `Test User ${userId}` };
        }
        throw new Error('Invalid token');
      }),
    }),
    initializeApp: vi.fn(),
  }));
}
