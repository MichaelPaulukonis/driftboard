import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import app from '../../src/backend/server';
import { prisma } from '../../src/backend/services/database';

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

const request = supertest(app);

describe('Auth Middleware and Routes', () => {
  let user1: any, user2: any, board1: any;

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.board.deleteMany();
    await prisma.list.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();
    
    // Create test users
    user1 = await prisma.user.create({
      data: {
        id: 'user-1-id',
        email: 'user1@test.com',
        name: 'Test User 1',
      },
    });
    user2 = await prisma.user.create({
      data: {
        id: 'user-2-id',
        email: 'user2@test.com',
        name: 'Test User 2',
      },
    });

    // Create a board for user 1
    board1 = await prisma.board.create({
      data: {
        name: "User 1's Board",
        userId: user1.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    vi.clearAllMocks();
  });

  describe('GET /api/boards', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request.get('/api/boards');
      expect(response.status).toBe(401);
    });

    it('should return 403 Forbidden if token is invalid', async () => {
      const response = await request
        .get('/api/boards')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(403);
    });

    it('should return boards for an authenticated user', async () => {
      const response = await request
        .get('/api/boards')
        .set('x-test-user-uid', user1.id);

      expect(response.status).toBe(200);
      const { success, data, message } = response.body;
      expect(success).toBe(true);
      expect(message).toBe('Boards retrieved successfully');
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe("User 1's Board");
      expect(data[0].userId).toBe(user1.id);
    });

    it('should return an empty array if user has no boards', async () => {
      const response = await request
        .get('/api/boards')
        .set('x-test-user-uid', user2.id);

      expect(response.status).toBe(200);
      const { success, data } = response.body;
      expect(success).toBe(true);
      expect(data).toEqual([]);
    });
  });

  describe('GET /api/boards/:id', () => {
    it("should not allow a user to see another user's board", async () => {
      const response = await request
        .get(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user2.id);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Board not found or access denied');
    });

    it("should allow a user to see their own board", async () => {
      const response = await request
        .get(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user1.id);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(board1.id);
      expect(response.body.data.userId).toBe(user1.id);
    });
  });

  describe('POST /api/boards', () => {
    it('should create a board for the authenticated user', async () => {
      const newBoardName = 'User 2 New Board';
      const response = await request
        .post('/api/boards')
        .set('x-test-user-uid', user2.id)
        .send({ name: newBoardName });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(newBoardName);
      expect(response.body.data.userId).toBe(user2.id);

      // Verify it's in the database
      const dbBoard = await prisma.board.findFirst({
        where: { name: newBoardName },
      });
      expect(dbBoard).not.toBeNull();
      expect(dbBoard?.userId).toBe(user2.id);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it("should not allow a user to update another user's board", async () => {
      const updatedName = "Attempted Update by User 2";
      const response = await request
        .put(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user2.id)
        .send({ name: updatedName });

      expect(response.status).toBe(404);
    });

    it("should allow a user to update their own board", async () => {
      const updatedName = "Updated Board Name by User 1";
      const response = await request
        .put(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user1.id)
        .send({ name: updatedName });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updatedName);
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it("should not allow a user to delete another user's board", async () => {
      const response = await request
        .delete(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user2.id);

      expect(response.status).toBe(404);

      // Verify board still exists
      const dbBoard = await prisma.board.findUnique({ where: { id: board1.id } });
      expect(dbBoard).not.toBeNull();
    });

    it("should allow a user to delete their own board", async () => {
      const response = await request
        .delete(`/api/boards/${board1.id}`)
        .set('x-test-user-uid', user1.id);

      expect(response.status).toBe(204);

      // Verify board is deleted
      const dbBoard = await prisma.board.findUnique({ where: { id: board1.id } });
      expect(dbBoard).toBeNull();
    });
  });

  describe('User creation on first login', () => {
    it('should create a new user in the database on their first authenticated request', async () => {
      const newUserUid = 'new-user-id';
      
      // Make sure user does not exist
      let dbUser = await prisma.user.findUnique({ where: { id: newUserUid } });
      expect(dbUser).toBeNull();

      // Make first request
      const response = await request
        .get('/api/boards')
        .set('x-test-user-uid', newUserUid);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);

      // Verify user was created
      dbUser = await prisma.user.findUnique({ where: { id: newUserUid } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(`${newUserUid}@example.com`);
    });
  });
});
