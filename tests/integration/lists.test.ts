import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/backend/server.js';
import { prisma } from '../../src/backend/services/database.js';

const getAuthHeaders = () => ({
  Authorization: 'Bearer valid-token-user-1',
});

describe('Lists API Integration Tests', () => {
  let boardId: string;
  let listId: string;
  let user: any;

  beforeAll(async () => {
    // Create a test user
    user = await prisma.user.create({
      data: {
        id: 'list-test-user-id',
        email: 'list-test@example.com',
        name: 'List Test User',
      },
    });

    // Create a test board for our lists tests, associated with the user
    const boardResponse = await request(app)
      .post('/api/boards')
      .set(getAuthHeaders())
      .send({
        name: 'Test Board for Lists',
        description: 'Created for integration testing',
        userId: user.id,
      });
    
    boardId = boardResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (boardId) {
      await prisma.board.deleteMany({ where: { id: boardId } });
    }
    if (user) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  describe('POST /api/boards/:id/lists', () => {
    it('should create a new list in a board', async () => {
      const response = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({
          name: 'Test List',
          position: 0
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test List',
        boardId: boardId,
        position: 0
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.cards).toEqual([]);

      listId = response.body.data.id;
    });

    it('should reject creation with empty name', async () => {
      const response = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({
          name: '',
          position: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('List name is required');
    });

    it('should reject creation for non-existent board', async () => {
      const response = await request(app)
        .post('/api/boards/non-existent-id/lists')
        .set(getAuthHeaders())
        .send({
          name: 'Test List',
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Board not found');
    });

    it('should auto-assign position when not provided', async () => {
      const response = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({
          name: 'Auto Position List'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.position).toBeGreaterThan(0);
      
      // Clean up
      await prisma.list.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('GET /api/lists/:id', () => {
    it('should get a list with its cards', async () => {
      const response = await request(app)
        .get(`/api/lists/${listId}`)
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(listId);
      expect(response.body.data.cards).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent list', async () => {
      const response = await request(app)
        .get('/api/lists/non-existent-id')
        .set(getAuthHeaders());
      
      expect(response.status).toBe(404);
    });

    it('should not allow access to a list in a board the user does not own', async () => {
      // Create another user and board
      const otherUser = await prisma.user.create({ data: { id: 'other-user', email: 'other@test.com' } });
      const otherBoard = await prisma.board.create({ data: { name: 'Other Board', userId: otherUser.id } });
      const otherList = await prisma.list.create({ data: { name: 'Other List', boardId: otherBoard.id, position: 1 } });

      const response = await request(app)
        .get(`/api/lists/${otherList.id}`)
        .set(getAuthHeaders()); // Authenticated as the main test user

      expect(response.status).toBe(404); // Should be treated as not found

      // Cleanup
      await prisma.list.delete({ where: { id: otherList.id } });
      await prisma.board.delete({ where: { id: otherBoard.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /api/lists/:id', () => {
    it('should update a list name', async () => {
      const newName = 'Updated Test List';
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set(getAuthHeaders())
        .send({ name: newName });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(newName);
    });

    it('should not update position directly', async () => {
      const originalList = await prisma.list.findUnique({ where: { id: listId } });
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set(getAuthHeaders())
        .send({ position: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(originalList?.position);
    });
  });

  describe('PUT /api/lists/:id/move', () => {
    it('should move a list to a new position', async () => {
      // Create another list to move around
      const secondListResponse = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({ name: 'Second List' });
      const secondListId = secondListResponse.body.data.id;

      const response = await request(app)
        .put(`/api/lists/${listId}/move`)
        .set(getAuthHeaders())
        .send({ newPosition: 0.5 }); // Move it before the second list

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(0.5);

      // Cleanup
      await prisma.list.delete({ where: { id: secondListId } });
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('should delete a list', async () => {
      // Create a list to be deleted
      const listToDeleteResponse = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({ name: 'To Be Deleted' });
      const listToDeleteId = listToDeleteResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/lists/${listToDeleteId}`)
        .set(getAuthHeaders());

      expect(response.status).toBe(204);

      const dbList = await prisma.list.findUnique({ where: { id: listToDeleteId } });
      expect(dbList).toBeNull();
    });
  });
});
