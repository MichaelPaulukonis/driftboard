import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/backend/server.js';
import { prisma } from '../../src/backend/services/database.js';

// Set environment to test for auth bypass
process.env.NODE_ENV = 'test';

describe('Lists API Integration Tests', () => {
  let boardId: string;
  let listId: string;

  beforeAll(async () => {
    // Create a test board for our lists tests
    const boardResponse = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board for Lists',
        description: 'Created for integration testing'
      });
    
    boardId = boardResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (boardId) {
      await prisma.board.delete({ where: { id: boardId } });
    }
  });

  describe('POST /api/boards/:id/lists', () => {
    it('should create a new list in a board', async () => {
      const response = await request(app)
        .post(`/api/boards/${boardId}/lists`)
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
        .send({
          name: '',
          position: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('List name is required');
    });

    it('should reject creation for non-existent board', async () => {
      const response = await request(app)
        .post('/api/boards/non-existent-id/lists')
        .send({
          name: 'Test List',
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Board not found');
    });

    it('should auto-assign position when not provided', async () => {
      const response = await request(app)
        .post(`/api/boards/${boardId}/lists`)
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
        .get(`/api/lists/${listId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: listId,
        name: 'Test List',
        boardId: boardId,
        position: 0
      });
      expect(response.body.data.cards).toEqual([]);
    });

    it('should return 404 for non-existent list', async () => {
      const response = await request(app)
        .get('/api/lists/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('List not found');
    });

    it('should return 400 for missing list ID', async () => {
      const response = await request(app)
        .get('/api/lists/');

      expect(response.status).toBe(404); // Express returns 404 for missing route params
    });
  });

  describe('PUT /api/lists/:id', () => {
    it('should update list name', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .send({
          name: 'Updated Test List'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test List');
      expect(response.body.data.id).toBe(listId);
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .send({
          name: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('List name cannot be empty');
    });

    it('should not update position', async () => {
      const originalList = await prisma.list.findUnique({ where: { id: listId } });
      const originalPosition = originalList?.position;

      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .send({
          name: 'Another Update',
          position: 9999
        });

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(originalPosition);
      expect(response.body.data.position).not.toBe(9999);
    });
  });

  describe('PUT /api/lists/:id/move', () => {
    it('should update list position', async () => {
      const newPosition = 123.456;
      const response = await request(app)
        .put(`/api/lists/${listId}/move`)
        .send({
          position: newPosition,
          boardId: boardId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBe(newPosition);
      expect(response.body.data.id).toBe(listId);
    });

    it('should reject invalid position', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}/move`)
        .send({
          position: -100,
          boardId: boardId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('A valid new position is required');
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('should delete a list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('List deleted successfully');

      // Verify list is deleted
      const getResponse = await request(app)
        .get(`/api/lists/${listId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent list', async () => {
      const response = await request(app)
        .delete('/api/lists/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('List not found');
    });
  });
});
