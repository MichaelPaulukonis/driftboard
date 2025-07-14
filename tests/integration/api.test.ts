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
  const testUser = { userId: `test-user-api-${Date.now()}` };
  let createdBoard: Board;

  beforeAll(async () => {
    request = await setup();
    const response = await request
      .post('/api/boards')
      .set(getAuthHeaders(testUser))
      .send({ name: 'Test Board for Details' });
    expect(response.status).toBe(201);
    createdBoard = response.body.data;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userId: testUser.userId } });
  });

  it('should return boards list for an authenticated user', async () => {
    const response = await request.get('/api/boards').set(getAuthHeaders(testUser));
    const data = response.body as ApiResponse<Board[]>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return board with lists and cards for an authenticated user', async () => {
    expect(createdBoard).toBeDefined();
    if (!createdBoard) return;

    const response = await request
      .get(`/api/boards/${createdBoard.boardId}`)
      .set(getAuthHeaders(testUser));
    
    const data = response.body as ApiResponse<Board & { lists: (List & { cards: Card[] })[] }>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.boardId).toBe(createdBoard.boardId);
    expect(Array.isArray(data.data?.lists)).toBe(true);
  });
});
