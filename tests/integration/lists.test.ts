import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Lists API Integration Tests', () => {
  let request: any;
  let testUser: any;
  let authHeaders: { Authorization: string };
  let board: any;
  let list1: any;

  beforeAll(async () => {
    request = await setup();
    const auth = await getAuthHeaders({ userId: `list-test-user-uid-${Date.now()}` });
    testUser = auth.user;
    authHeaders = auth.headers;

    board = await prisma.board.create({
      data: {
        name: 'Test Board for Lists',
        user: { connect: { userId: testUser.userId } },
      },
    });

    list1 = await prisma.list.create({
      data: {
        name: 'Test List 1',
        boardId: board.boardId,
        position: 100,
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.board.deleteMany({ where: { userId: testUser.userId } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  describe('POST /api/boards/:id/lists', () => {
    it('should create a new list in a board', async () => {
      const response = await request
        .post(`/api/boards/${board.boardId}/lists`)
        .set(authHeaders)
        .send({
          name: 'A New List',
          position: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const createdList = response.body.data;
      expect(createdList.name).toBe('A New List');
      expect(createdList.position).toBe(0);
    });

    it('should reject creation with empty name', async () => {
      const response = await request
        .post(`/api/boards/${board.boardId}/lists`)
        .set(authHeaders)
        .send({ name: '' });
      expect(response.status).toBe(400);
    });

    it('should reject creation for non-existent board', async () => {
      const response = await request
        .post('/api/boards/non-existent-id/lists')
        .set(authHeaders)
        .send({ name: 'Test List' });
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/lists/:id', () => {
    it('should get a list with its cards', async () => {
      const response = await request
        .get(`/api/lists/${list1.listId}`)
        .set(authHeaders);
      expect(response.status).toBe(200);
      if (response.status === 200) {
        expect(response.body.data.listId).toBe(list1.listId);
      }
    });

    it('should return 404 for non-existent list', async () => {
      const response = await request
        .get('/api/lists/non-existent-id')
        .set(authHeaders);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/lists/:id', () => {
    it('should update a list name and create a new version', async () => {
      const newName = 'Updated Test List';
      const response = await request
        .put(`/api/lists/${list1.listId}`)
        .set(authHeaders)
        .send({ name: newName });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const updatedList = response.body.data;
        expect(updatedList.name).toBe(newName);
        expect(updatedList.version).toBe(list1.version + 1);

        const oldList = await prisma.list.findUnique({ where: { id: list1.id } });
        expect(oldList?.status).toBe('INACTIVE');
      }
    });
  });

  describe('PUT /api/lists/:id/move', () => {
    it('should move a list and create a new version', async () => {
      const list2 = await prisma.list.create({
        data: { name: 'List B', boardId: board.boardId, position: 200 },
      });

      const moveResponse = await request
        .put(`/api/lists/${list2.listId}/move`)
        .set(authHeaders)
        .send({ position: 50 }); // Move it before list1

      expect(moveResponse.status).toBe(200);
      const movedList = moveResponse.body.data;
      expect(movedList.position).toBe(50);
      expect(movedList.version).toBe(list2.version + 1);

      const oldList = await prisma.list.findUnique({ where: { id: list2.id } });
      expect(oldList?.status).toBe('INACTIVE');
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('should mark a list as inactive', async () => {
      const listToDelete = await prisma.list.create({
        data: { name: 'To Be Deleted', boardId: board.boardId, position: 300 },
      });
      
      const response = await request
        .delete(`/api/lists/${listToDelete.listId}`)
        .set(authHeaders);
      expect(response.status).toBe(204);

      const dbList = await prisma.list.findUnique({ where: { id: listToDelete.id } });
      expect(dbList?.status).toBe('INACTIVE');
    });
  });
});
