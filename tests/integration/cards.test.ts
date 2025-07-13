import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Cards API Integration Tests', () => {
  let request: any;
  let boardId: string;
  let listId: string;
  let cardId: string;
  let user: any;

  beforeAll(async () => {
    request = await setup();
    // Create a test user
    user = await prisma.user.create({
      data: {
        id: 'card-test-user-id',
        userId: 'card-test-user-uid',
        email: 'card-test@example.com',
        name: 'Card Test User',
      },
    });

    // Create a test board for our cards tests
    const boardResponse = await request
      .post('/api/boards')
      .set(getAuthHeaders())
      .send({
        name: 'Test Board for Cards',
        description: 'Created for cards integration testing',
        userId: user.id,
      });
    
    boardId = boardResponse.body.data.id;

    // Create a test list for our cards
    const listResponse = await request
      .post(`/api/boards/${boardId}/lists`)
      .set(getAuthHeaders())
      .send({
        name: 'Test List for Cards',
        position: 0
      });

    listId = listResponse.body.data.id;
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

  describe('POST /api/lists/:id/cards', () => {
    it('should create a new card in a list', async () => {
      const response = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders())
        .send({
          title: 'Test Card',
          description: 'This is a test card',
          position: 0
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: 'Test Card',
        description: 'This is a test card',
        listId: listId,
        position: 0
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();

      cardId = response.body.data.id;
    });

    it('should reject creation with empty title', async () => {
      const response = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders())
        .send({
          title: '',
          description: 'Card with empty title',
          position: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Card title is required');
    });

    it('should reject creation for non-existent list', async () => {
      const response = await request
        .post('/api/lists/non-existent-id/cards')
        .set(getAuthHeaders())
        .send({
          title: 'Test Card',
          description: 'This should fail',
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('List not found');
    });

    it('should create card with optional description', async () => {
      const response = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders())
        .send({
          title: 'Card Without Description',
          position: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBeNull();
      
      // Clean up
      await prisma.card.delete({ where: { id: response.body.data.id } });
    });

    it('should auto-assign position when not provided', async () => {
      const response = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders())
        .send({
          title: 'Auto Position Card'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.position).toBeGreaterThan(0);
      
      // Clean up
      await prisma.card.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should get a card by its ID', async () => {
      const response = await request
        .get(`/api/cards/${cardId}`)
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(cardId);
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request
        .get('/api/cards/non-existent-id')
        .set(getAuthHeaders());
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should update a card title and description', async () => {
      const updates = {
        title: 'Updated Test Card',
        description: 'This card has been updated'
      };
      const response = await request
        .put(`/api/cards/${cardId}`)
        .set(getAuthHeaders())
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.description).toBe(updates.description);
    });

    it('should not update position directly', async () => {
      const originalCard = await prisma.card.findUnique({ where: { id: cardId } });
      const response = await request
        .put(`/api/cards/${cardId}`)
        .set(getAuthHeaders())
        .send({ position: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(originalCard?.position);
    });
  });

  describe('PUT /api/cards/:id/move', () => {
    let otherListId: string;

    beforeAll(async () => {
      // Create another list to move cards to
      const otherListResponse = await request
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders())
        .send({ name: 'Other List for Moving Cards' });
      otherListId = otherListResponse.body.data.id;
    });

    afterAll(async () => {
      if (otherListId) {
        await prisma.list.delete({ where: { id: otherListId } });
      }
    });

    it('should move a card to a new list and position', async () => {
      const response = await request
        .put(`/api/cards/${cardId}/move`)
        .set(getAuthHeaders())
        .send({
          newListId: otherListId,
          newPosition: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.listId).toBe(otherListId);
      expect(response.body.data.position).toBe(1);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete a card', async () => {
      // Create a card to be deleted
      const cardToDeleteResponse = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders())
        .send({ title: 'To Be Deleted' });
      const cardToDeleteId = cardToDeleteResponse.body.data.id;

      const response = await request
        .delete(`/api/cards/${cardToDeleteId}`)
        .set(getAuthHeaders());

      expect(response.status).toBe(204);

      const dbCard = await prisma.card.findUnique({ where: { id: cardToDeleteId } });
      expect(dbCard).toBeNull();
    });
  });
});
