import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/backend/server.js';
import { prisma } from '../../src/backend/services/database.js';

// Set environment to test for auth bypass
process.env.NODE_ENV = 'test';

describe('Cards API Integration Tests', () => {
  let boardId: string;
  let listId: string;
  let cardId: string;

  beforeAll(async () => {
    // Create a test board for our cards tests
    const boardResponse = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board for Cards',
        description: 'Created for cards integration testing'
      });
    
    boardId = boardResponse.body.data.id;

    // Create a test list for our cards
    const listResponse = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .send({
        name: 'Test List for Cards',
        position: 0
      });

    listId = listResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (boardId) {
      await prisma.board.delete({ where: { id: boardId } });
    }
  });

  describe('POST /api/lists/:id/cards', () => {
    it('should create a new card in a list', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/cards`)
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
      const response = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: '',
          description: 'Card with empty title',
          position: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card title is required');
    });

    it('should reject creation for non-existent list', async () => {
      const response = await request(app)
        .post('/api/lists/non-existent-id/cards')
        .send({
          title: 'Test Card',
          description: 'This should fail',
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('List not found');
    });

    it('should create card with optional description', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: 'Card Without Description',
          position: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Card Without Description');
      expect(response.body.data.description).toBeNull();
      
      // Clean up
      await prisma.card.delete({ where: { id: response.body.data.id } });
    });

    it('should auto-assign position when not provided', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/cards`)
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
    it('should get a card by ID', async () => {
      const response = await request(app)
        .get(`/api/cards/${cardId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: cardId,
        title: 'Test Card',
        description: 'This is a test card',
        listId: listId,
        position: 0
      });
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .get('/api/cards/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card not found');
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should update card title', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          title: 'Updated Test Card'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Test Card');
      expect(response.body.data.id).toBe(cardId);
      expect(response.body.data.description).toBe('This is a test card'); // Should preserve other fields
    });

    it('should update card description', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          description: 'Updated description for test card'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description for test card');
      expect(response.body.data.title).toBe('Updated Test Card'); // Should preserve other fields
    });

    it('should update card position', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          position: 1000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBe(1000);
    });

    it('should reject empty title', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          title: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card title cannot be empty');
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .put('/api/cards/non-existent-id')
        .send({
          title: 'New Title'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card not found');
    });
  });

  describe('PUT /api/cards/:id/move', () => {
    let secondListId: string;
    let secondCardId: string;

    beforeEach(async () => {
      // Create a second list for move operations
      const listResponse = await request(app)
        .post(`/api/boards/${boardId}/lists`)
        .send({
          name: 'Second List for Move Tests',
          position: 1
        });

      secondListId = listResponse.body.data.id;

      // Create a second card for position testing
      const cardResponse = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: 'Second Card',
          position: 1
        });

      secondCardId = cardResponse.body.data.id;
    });

    it('should move card to different list', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}/move`)
        .send({
          listId: secondListId,
          position: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listId).toBe(secondListId);
      expect(response.body.data.position).toBe(0);

      // Verify the card was moved
      const getResponse = await request(app)
        .get(`/api/cards/${cardId}`);
      
      expect(getResponse.body.data.listId).toBe(secondListId);
    });

    it('should reorder card within same list', async () => {
      // Create a fresh card for this test to avoid interference
      const cardResponse = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: 'Reorder Test Card',
          position: 100
        });

      const testCardId = cardResponse.body.data.id;

      const response = await request(app)
        .put(`/api/cards/${testCardId}/move`)
        .send({
          listId: listId, // Same list
          position: 1500 // After the second card
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listId).toBe(listId);
      expect(response.body.data.position).toBe(1500);
      
      // Clean up the test card
      await prisma.card.delete({ where: { id: testCardId } });
    });

    it('should reject move to non-existent list', async () => {
      // Create a fresh card for this test
      const cardResponse = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: 'Move Test Card',
          position: 200
        });

      const testCardId = cardResponse.body.data.id;

      const response = await request(app)
        .put(`/api/cards/${testCardId}/move`)
        .send({
          listId: 'non-existent-id',
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Target list not found');
      
      // Clean up the test card
      await prisma.card.delete({ where: { id: testCardId } });
    });

    it('should reject move for non-existent card', async () => {
      const response = await request(app)
        .put('/api/cards/non-existent-id/move')
        .send({
          listId: secondListId,
          position: 0
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card not found');
    });

    it('should reject move with missing required fields', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}/move`)
        .send({
          position: 0
          // Missing listId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Target list ID is required');
    });

    afterEach(async () => {
      // Clean up second list and card
      if (secondCardId) {
        await prisma.card.deleteMany({ where: { id: secondCardId } });
      }
      if (secondListId) {
        await prisma.list.deleteMany({ where: { id: secondListId } });
      }
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete a card', async () => {
      // Create a fresh card for deletion
      const cardResponse = await request(app)
        .post(`/api/lists/${listId}/cards`)
        .send({
          title: 'Card to Delete',
          position: 999
        });

      const deleteCardId = cardResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/cards/${deleteCardId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Card deleted successfully');

      // Verify card is deleted
      const getResponse = await request(app)
        .get(`/api/cards/${deleteCardId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .delete('/api/cards/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Card not found');
    });
  });
});
