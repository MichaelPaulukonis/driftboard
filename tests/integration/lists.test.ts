import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Lists API Integration Tests', () => {
  let request: any;
  let boardId: string;
  let listId: string;
  const testUser = { userId: 'list-test-user-uid', email: 'list-test@example.com', name: 'List Test User' };

  beforeAll(async () => {
    request = await setup();
    
    const boardResponse = await request
      .post('/api/boards')
      .set(getAuthHeaders(testUser))
      .send({
        name: 'Test Board for Lists',
        description: 'Created for integration testing',
      });
    
    expect(boardResponse.status).toBe(201);
    boardId = boardResponse.body.data.boardId;

    const listResponse = await request
      .post(`/api/boards/${boardId}/lists`)
      .set(getAuthHeaders(testUser))
      .send({ name: 'Test List' });
    expect(listResponse.status).toBe(201);
    listId = listResponse.body.data.listId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userId: testUser.userId } });
  });

  describe('POST /api/boards/:id/lists', () => {
    it('should create a new list in a board', async () => {
      const response = await request
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders(testUser))
        .send({
          name: 'Test List',
          position: 0
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const createdList = response.body.data;
      expect(createdList.name).toBe('Test List');
      expect(createdList.position).toBe(0);
    });

    it('should reject creation with empty name', async () => {
      const response = await request
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders(testUser))
        .send({ name: '' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('List name is required');
    });

    it('should reject creation for non-existent board', async () => {
      const response = await request
        .post('/api/boards/non-existent-id/lists')
        .set(getAuthHeaders(testUser))
        .send({ name: 'Test List' });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Board not found');
    });

    it('should auto-assign position when not provided', async () => {
      const response = await request
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders(testUser))
        .send({ name: 'Auto Position List' });
      expect(response.status).toBe(201);
      expect(response.body.data.position).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/lists/:id', () => {
    it('should get a list with its cards', async () => {
      const response = await request
        .get(`/api/lists/${listId}`)
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(200);
      expect(response.body.data.listId).toBe(listId);
    });

    it('should return 404 for non-existent list', async () => {
      const response = await request
        .get('/api/lists/non-existent-id')
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(404);
    });

    it('should not allow access to a list in a board the user does not own', async () => {
      const otherUser = { userId: 'other-user-uid' };
      const otherBoardResponse = await request.post('/api/boards').set(getAuthHeaders(otherUser)).send({ name: 'Other Board' });
      const otherBoardId = otherBoardResponse.body.data.boardId;
      const otherListResponse = await request.post(`/api/boards/${otherBoardId}/lists`).set(getAuthHeaders(otherUser)).send({ name: 'Other List' });
      const otherListId = otherListResponse.body.data.listId;

      const response = await request
        .get(`/api/lists/${otherListId}`)
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(404);
      await prisma.user.deleteMany({ where: { userId: otherUser.userId } });
    });
  });

  describe('PUT /api/lists/:id', () => {
    it('should update a list name', async () => {
      const newName = 'Updated Test List';
      const response = await request
        .put(`/api/lists/${listId}`)
        .set(getAuthHeaders(testUser))
        .send({ name: newName });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(newName);
    });
  });

  describe('PUT /api/lists/:id/move', () => {
    it('should move a list to a new position', async () => {
      await request.post(`/api/boards/${boardId}/lists`).set(getAuthHeaders(testUser)).send({ name: 'List B', position: 200 });

      const moveResponse = await request
        .put(`/api/lists/${listId}/move`)
        .set(getAuthHeaders(testUser))
        .send({ position: 250 });
      expect(moveResponse.status).toBe(200);
      expect(moveResponse.body.data.position).toBe(250);
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('should delete a list', async () => {
      const listToDeleteRes = await request.post(`/api/boards/${boardId}/lists`).set(getAuthHeaders(testUser)).send({ name: 'To Be Deleted' });
      const listToDeleteId = listToDeleteRes.body.data.listId;
      
      const response = await request
        .delete(`/api/lists/${listToDeleteId}`)
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(204);

      const dbList = await prisma.list.findFirst({ where: { listId: listToDeleteId, status: 'ACTIVE' } });
      expect(dbList).toBeNull();
    });
  });
});
