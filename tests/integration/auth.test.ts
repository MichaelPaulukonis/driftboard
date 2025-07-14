import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Auth Middleware and Routes', () => {
  let request: any;
  let user1: any, user2: any, board1: any;

  beforeAll(async () => {
    request = await setup();
    // Create test users
    user1 = await prisma.user.create({ data: { userId: 'user-1-id', email: 'user1@test.com' } });
    user2 = await prisma.user.create({ data: { userId: 'user-2-id', email: 'user2@test.com' } });
    // Create a board for user1
    board1 = await prisma.board.create({ data: { name: 'User 1 Board', userId: user1.id } });
  });

  afterAll(async () => {
    await prisma.board.deleteMany({ where: { userId: user1.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
  });

  describe('GET /api/boards', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request.get('/api/boards');
      expect(response.status).toBe(401);
    });

    it('should return 403 Forbidden if token is invalid', async () => {
      const response = await request.get('/api/boards').set({ Authorization: 'Bearer invalid-token' });
      expect(response.status).toBe(403);
    });

    it('should return boards for an authenticated user', async () => {
      const response = await request.get('/api/boards').set(getAuthHeaders(user1));
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return an empty array if user has no boards', async () => {
      // Authenticate as user 2 who has no boards
      const response = await request.get('/api/boards').set(getAuthHeaders(user2));
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/boards/:id', () => {
    it("should not allow a user to see another user's board", async () => {
      const response = await request.get(`/api/boards/${board1.boardId}`).set(getAuthHeaders(user2)); // Authenticated as user 2
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });

    it('should allow a user to see their own board', async () => {
      const response = await request.get(`/api/boards/${board1.boardId}`).set(getAuthHeaders(user1));
      expect(response.status).toBe(200);
      expect(response.body.data.boardId).toBe(board1.boardId);
    });
  });

  describe('POST /api/boards', () => {
    it('should create a board for the authenticated user', async () => {
      const response = await request
        .post('/api/boards')
        .set(getAuthHeaders(user1))
        .send({ name: 'New Board by User 1' });
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('New Board by User 1');
      expect(response.body.data.userId).toBe(user1.id);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it("should not allow a user to update another user's board", async () => {
      const response = await request
        .put(`/api/boards/${board1.boardId}`)
        .set(getAuthHeaders(user2))
        .send({ name: 'Updated by User 2' });
      expect(response.status).toBe(404);
    });

    it('should allow a user to update their own board', async () => {
      const response = await request
        .put(`/api/boards/${board1.boardId}`)
        .set(getAuthHeaders(user1))
        .send({ name: 'Updated by User 1' });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated by User 1');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it("should not allow a user to delete another user's board", async () => {
      const response = await request.delete(`/api/boards/${board1.boardId}`).set(getAuthHeaders(user2));
      expect(response.status).toBe(404);
    });

    it('should allow a user to delete their own board', async () => {
      const response = await request.delete(`/api/boards/${board1.boardId}`).set(getAuthHeaders(user1));
      expect(response.status).toBe(204);

      // Verify board is marked as inactive
      const board = await prisma.board.findFirst({ where: { boardId: board1.boardId } });
      expect(board?.status).toBe('INACTIVE');
    });
  });

  describe('User creation on first login', () => {
    it('should create a new user in the database on their first authenticated request', async () => {
      const newUser = { userId: 'new-user-uid', email: 'new@test.com' };
      
      // First request should create the user
      const response = await request.get('/api/boards').set(getAuthHeaders(newUser));
      expect(response.status).toBe(200);

      // Verify user was created
      const dbUser = await prisma.user.findUnique({ where: { userId: newUser.userId } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(newUser.email);
      expect(dbUser?.status).toBe('ACTIVE');
      
      // Cleanup
      await prisma.user.delete({ where: { userId: newUser.userId } });
    });
  });
});
