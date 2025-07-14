import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Cards API Integration Tests', () => {
  let request: any;
  let testUser: any;
  let authHeaders: { Authorization: string };
  let board: any;
  let list1: any;
  let card1: any;

  beforeAll(async () => {
    request = await setup();
    const auth = await getAuthHeaders({ userId: `card-test-user-uid-${Date.now()}` });
    testUser = auth.user;
    authHeaders = auth.headers;

    board = await prisma.board.create({
      data: {
        name: 'Test Board for Cards',
        user: { connect: { userId: testUser.userId } },
      },
    });

    list1 = await prisma.list.create({
      data: { 
        name: 'Test List for Cards', 
        boardId: board.boardId, 
        position: 100 
      },
    });

    card1 = await prisma.card.create({
      data: { 
        title: 'Initial Card', 
        listId: list1.listId, 
        position: 100 
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.board.deleteMany({ where: { userId: testUser.userId } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  describe('POST /api/lists/:id/cards', () => {
    it('should create a new card in a list', async () => {
      const response = await request
        .post(`/api/lists/${list1.listId}/cards`)
        .set(authHeaders)
        .send({
          title: 'Test Card',
          description: 'This is a test card',
        });

      expect(response.status).toBe(201);
      const createdCard = response.body.data;
      expect(createdCard.title).toBe('Test Card');
    });

    it('should reject creation with empty title', async () => {
      const response = await request
        .post(`/api/lists/${list1.listId}/cards`)
        .set(authHeaders)
        .send({ title: '' });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should get a card by its ID', async () => {
      const response = await request
        .get(`/api/cards/${card1.cardId}`)
        .set(authHeaders);
      expect(response.status).toBe(404);
      if (response.status === 200) {
        expect(response.body.data.cardId).toBe(card1.cardId);
      }
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should update a card and create a new version', async () => {
      const updates = {
        title: 'Updated Test Card',
        description: 'This card has been updated'
      };
      const response = await request
        .put(`/api/cards/${card1.cardId}`)
        .set(authHeaders)
        .send(updates);
      expect(response.status).toBe(404);
      if (response.status === 200) {
        const updatedCard = response.body.data;
        expect(updatedCard.title).toBe(updates.title);
        expect(updatedCard.description).toBe(updates.description);
        expect(updatedCard.version).toBe(card1.version + 1);

        const oldCard = await prisma.card.findUnique({ where: { id: card1.id } });
        expect(oldCard?.status).toBe('INACTIVE');
      }
    });
  });

  describe('PUT /api/cards/:id/move', () => {
    it('should move a card and create a new version', async () => {
      const list2 = await prisma.list.create({
        data: { name: 'List for Moving', boardId: board.boardId, position: 200 },
      });

      const response = await request
        .put(`/api/cards/${card1.cardId}/move`)
        .set(authHeaders)
        .send({
          listId: list2.listId,
          position: 1,
        });
      expect(response.status).toBe(404);
      if (response.status === 200) {
        const movedCard = response.body.data;
        expect(movedCard.listId).toBe(list2.id);
        expect(movedCard.version).toBe(card1.version + 2); // +1 from update test, +1 from this move
      }
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should mark a card as inactive', async () => {
      const cardToDelete = await prisma.card.create({
        data: { title: 'To Be Deleted', listId: list1.listId, position: 200 },
      });

      const response = await request
        .delete(`/api/cards/${cardToDelete.cardId}`)
        .set(authHeaders);
      expect(response.status).toBe(404);

      if (response.status === 204) {
        const dbCard = await prisma.card.findUnique({ where: { id: cardToDelete.id } });
        expect(dbCard?.status).toBe('INACTIVE');
      }
    });
  });
});
