import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { prisma } from '../../src/backend/services/database';
import { setup, getAuthHeaders } from '../helpers';

describe('Auth Middleware and Routes', () => {
  let request: any;
  let user1: any, board1: any;

  beforeAll(async () => {
    request = await setup();
  });

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
        userId: 'user-1-uid',
        email: 'user1@test.com',
        name: 'Test User 1',
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
      const response = await request.get('/api/boards').set({ Authorization: 'Bearer invalid-token' });
      expect(response.status).toBe(403);
    });

    it('should return boards for an authenticated user', async () => {
      const response = await request.get('/api/boards').set(getAuthHeaders(1));
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return an empty array if user has no boards', async () => {
      // Authenticate as user 2 who has no boards
      const response = await request.get('/api/boards').set(getAuthHeaders(2));
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/boards/:id', () => {
    it("should not allow a user to see another user's board", async () => {
      const response = await request.get(`/api/boards/${board1.id}`).set(getAuthHeaders(2)); // Authenticated as user 2
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });

    it('should allow a user to see their own board', async () => {
      const response = await request.get(`/api/boards/${board1.id}`).set(getAuthHeaders(1));
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(board1.id);
    });
  });

  describe('POST /api/boards', () => {
    it('should create a board for the authenticated user', async () => {
      const response = await request
        .post('/api/boards')
        .set(getAuthHeaders(1))
        .send({ name: 'New Board by User 1' });
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('New Board by User 1');
      expect(response.body.data.userId).toBe(user1.id);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it("should not allow a user to update another user's board", async () => {
      const response = await request
        .put(`/api/boards/${board1.id}`)
        .set(getAuthHeaders(2))
        .send({ name: 'Updated by User 2' });
      expect(response.status).toBe(404);
    });

    it('should allow a user to update their own board', async () => {
      const response = await request
        .put(`/api/boards/${board1.id}`)
        .set(getAuthHeaders(1))
        .send({ name: 'Updated by User 1' });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated by User 1');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it("should not allow a user to delete another user's board", async () => {
      const response = await request.delete(`/api/boards/${board1.id}`).set(getAuthHeaders(2));
      expect(response.status).toBe(404);
    });

    it('should allow a user to delete their own board', async () => {
      const response = await request.delete(`/api/boards/${board1.id}`).set(getAuthHeaders(1));
      expect(response.status).toBe(204);

      // Verify board is marked as inactive
      const dbBoard = await prisma.board.findUnique({ where: { id: board1.id } });
      expect(dbBoard?.status).toBe('INACTIVE');
    });
  });

  describe('User creation on first login', () => {
    it('should create a new user in the database on their first authenticated request', async () => {
      const newUserId = 3;
      const newUserUid = `user-${newUserId}-id`;
      let dbUser = await prisma.user.findUnique({ where: { userId: newUserUid } });
      expect(dbUser).toBeNull();

      // First request from a new authenticated user
      await request.get('/api/boards').set(getAuthHeaders(newUserId));

      // Verify user was created
      dbUser = await prisma.user.findUnique({ where: { userId: newUserUid } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(`user${newUserId}@test.com`);
      expect(dbUser?.status).toBe('ACTIVE');
    });
  });
});
