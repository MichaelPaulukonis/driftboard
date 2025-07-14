import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/backend/services/database.js';
import { setup, getAuthHeaders } from '../helpers';

describe('Cards API Integration Tests', () => {
  let request: any;
  let boardId: string;
  let listId: string;
  let cardId: string;
  const testUser = { userId: 'card-test-user-uid', email: 'card-test@example.com', name: 'Card Test User' };

  beforeAll(async () => {
    request = await setup();
    
    const boardResponse = await request
      .post('/api/boards')
      .set(getAuthHeaders(testUser))
      .send({
        name: 'Test Board for Cards',
        description: 'Created for cards integration testing',
      });
    
    expect(boardResponse.status).toBe(201);
    boardId = boardResponse.body.data.boardId;

    const listResponse = await request
      .post(`/api/boards/${boardId}/lists`)
      .set(getAuthHeaders(testUser))
      .send({ name: 'Test List for Cards' });
    
    expect(listResponse.status).toBe(201);
    listId = listResponse.body.data.listId;

    const cardResponse = await request
      .post(`/api/lists/${listId}/cards`)
      .set(getAuthHeaders(testUser))
      .send({ title: 'Initial Card' });
    expect(cardResponse.status).toBe(201);
    cardId = cardResponse.body.data.cardId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userId: testUser.userId } });
  });

  describe('POST /api/lists/:id/cards', () => {
    it('should create a new card in a list', async () => {
      const response = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders(testUser))
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
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders(testUser))
        .send({ title: '' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Card title is required');
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should get a card by its ID', async () => {
      const response = await request
        .get(`/api/cards/${cardId}`)
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(200);
      expect(response.body.data.cardId).toBe(cardId);
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
        .set(getAuthHeaders(testUser))
        .send(updates);
      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.description).toBe(updates.description);
    });
  });

  describe('PUT /api/cards/:id/move', () => {
    it('should move a card to a new list and position', async () => {
      const otherListResponse = await request
        .post(`/api/boards/${boardId}/lists`)
        .set(getAuthHeaders(testUser))
        .send({ name: 'Other List for Moving Cards' });
      const otherListId = otherListResponse.body.data.listId;
      const otherListVersionId = otherListResponse.body.data.id;

      const response = await request
        .put(`/api/cards/${cardId}/move`)
        .set(getAuthHeaders(testUser))
        .send({
          listId: otherListId,
          position: 1,
        });
      expect(response.status).toBe(200);
      expect(response.body.data.listId).toBe(otherListVersionId);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete a card', async () => {
      const cardToDeleteResponse = await request
        .post(`/api/lists/${listId}/cards`)
        .set(getAuthHeaders(testUser))
        .send({ title: 'To Be Deleted' });
      const cardToDeleteId = cardToDeleteResponse.body.data.cardId;

      const response = await request
        .delete(`/api/cards/${cardToDeleteId}`)
        .set(getAuthHeaders(testUser));
      expect(response.status).toBe(204);

      const dbCard = await prisma.card.findFirst({ where: { cardId: cardToDeleteId, status: 'ACTIVE' } });
      expect(dbCard).toBeNull();
    });
  });
});
