import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Auth Middleware and Routes', () => {
  let request: any;
  let user1: any, user2: any, board1: any;
  let authHeaders1: { Authorization: string }, authHeaders2: { Authorization: string };

  beforeAll(async () => {
    request = await setup();
    
    const auth1 = await getAuthHeaders({ userId: `auth-test-user-1-${Date.now()}`, email: 'user1.auth@test.com' });
    user1 = auth1.user;
    authHeaders1 = auth1.headers;

    const auth2 = await getAuthHeaders({ userId: `auth-test-user-2-${Date.now()}`, email: 'user2.auth@test.com' });
    user2 = auth2.user;
    authHeaders2 = auth2.headers;

    // Create a board for user1 directly in the DB for testing access control
    board1 = await prisma.board.create({
      data: { name: 'User 1 Board', userId: user1.userId },
    });
  });

  afterAll(async () => {
    await prisma.board.deleteMany({ where: { userId: user1.userId } });
    await prisma.user.deleteMany({ where: { userId: { in: [user1.userId, user2.userId] } } });
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
      const response = await request.get('/api/boards').set(authHeaders1);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].userId).toBe(user1.userId);
    });

    it('should return an empty array if user has no boards', async () => {
      // Authenticate as user 2 who has no boards
      const response = await request.get('/api/boards').set(authHeaders2);
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/boards/:id', () => {
    it("should not allow a user to see another user's board", async () => {
      const response = await request.get(`/api/boards/${board1.boardId}`).set(authHeaders2); // Authenticated as user 2
      expect(response.status).toBe(404);
    });

    it('should allow a user to see their own board', async () => {
      const response = await request.get(`/api/boards/${board1.boardId}`).set(authHeaders1);
      expect(response.status).toBe(200);
      expect(response.body.data.boardId).toBe(board1.boardId);
    });
  });

  describe('POST /api/boards', () => {
    it('should create a board for the authenticated user', async () => {
      const boardName = 'New Board by User 1';
      const response = await request
        .post('/api/boards')
        .set(authHeaders1)
        .send({ name: boardName });
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(boardName);
      expect(response.body.data.userId).toBe(user1.userId);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it("should not allow a user to update another user's board", async () => {
      const response = await request
        .put(`/api/boards/${board1.boardId}`)
        .set(authHeaders2)
        .send({ name: 'Updated by User 2' });
      expect(response.status).toBe(404);
    });

    it('should update a board and create a new version', async () => {
      const updatedName = 'Updated by User 1';
      const response = await request
        .put(`/api/boards/${board1.boardId}`)
        .set(authHeaders1)
        .send({ name: updatedName });
      
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updatedName);
      expect(response.body.data.version).toBe(board1.version + 1);

      // Verify the old version is now inactive
      const oldBoardVersion = await prisma.board.findUnique({ where: { id: board1.id } });
      expect(oldBoardVersion?.status).toBe('INACTIVE');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it("should not allow a user to delete another user's board", async () => {
      const response = await request.delete(`/api/boards/${board1.boardId}`).set(authHeaders2);
      expect(response.status).toBe(404);
    });

    it('should allow a user to delete their own board', async () => {
      // We need a new board for this test since board1 is already inactive from the update test
      const newBoard = await prisma.board.create({ data: { name: 'Board to Delete', userId: user1.userId } });
      
      const response = await request.delete(`/api/boards/${newBoard.boardId}`).set(authHeaders1);
      expect(response.status).toBe(204);

      // Verify board is marked as inactive
      const board = await prisma.board.findFirst({ where: { boardId: newBoard.boardId, status: 'INACTIVE' } });
      expect(board).not.toBeNull();
    });
  });

  describe('User creation on first login', () => {
    it('should create a new user in the database on their first authenticated request', async () => {
      const newUser = { userId: `new-user-uid-${Date.now()}`, email: 'new@test.com' };
      
      // First request should create the user
      const { headers } = await getAuthHeaders(newUser);
      const response = await request.get('/api/boards').set(headers);
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
