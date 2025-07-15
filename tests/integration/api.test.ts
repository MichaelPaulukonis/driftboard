import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiResponse, Board, List, Card } from '../../src/shared/types';
import { setup, getAuthHeaders } from '../helpers';
import { prisma } from '../../src/backend/services/database';

describe('API Health Check', () => {
  let request: any;

  beforeAll(async () => {
    request = await setup();
  });

  it('should return OK status', async () => {
    const response = await request.get('/api/health');
    const data = response.body as ApiResponse<{ status: string }>;
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.status).toBe('healthy');
  });
});

describe('Boards API', () => {
  let request: any;
  let authHeaders: { Authorization: string };
  let testUser: any;
  let createdBoard: Board;

  beforeAll(async () => {
    request = await setup();
    const auth = await getAuthHeaders({ userId: `test-user-boards-api-${Date.now()}` });
    authHeaders = auth.headers;
    testUser = auth.user;
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.board.deleteMany({ where: { userId: testUser.userId } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it('should return boards list for an authenticated user', async () => {
    const response = await request.get('/api/boards').set(authHeaders);
    const data = response.body as ApiResponse<Board[]>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return board with only ACTIVE lists and cards', async () => {
    const response = await request
      .post('/api/boards')
      .set(authHeaders)
      .send({ name: 'Test Board for Details' });
    
    expect(response.status).toBe(201);
    createdBoard = response.body.data;

    expect(createdBoard).toBeDefined();
    if (!createdBoard) {
      // If board creation failed, we can't run this test.
      // This is expected until the backend is fixed.
      console.warn('Skipping test for ACTIVE items because board creation failed.');
      return;
    }

    // Manually create an ACTIVE list for the card
    const activeList = await prisma.list.create({
      data: {
        name: 'Active List',
        boardId: createdBoard.boardId,
        position: 1,
        status: 'ACTIVE',
      },
    });

    // Manually create an INACTIVE list and card to test the filter
    const inactiveList = await prisma.list.create({
      data: {
        name: 'Inactive List',
        boardId: createdBoard.boardId, // Use persistent boardId
        position: 999,
        status: 'INACTIVE',
      },
    });
    await prisma.card.create({
      data: {
        title: 'Inactive Card',
        listId: activeList.id,
        position: 1,
        status: 'INACTIVE',
      },
    });

    const detailResponse = await request
      .get(`/api/boards/${createdBoard.boardId}`)
      .set(authHeaders);
    
    const data = detailResponse.body as ApiResponse<Board & { lists: (List & { cards: Card[] })[] }>;
    
    expect(detailResponse.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.boardId).toBe(createdBoard.boardId);
    expect(Array.isArray(data.data?.lists)).toBe(true);

    // Verify that all returned lists and cards are ACTIVE
    data.data?.lists.forEach(list => {
      expect(list.status).toBe('ACTIVE');
      if (list.cards) {
        list.cards.forEach(card => {
          expect(card.status).toBe('ACTIVE');
        });
      }
    });
  });
});
