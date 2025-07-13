import { describe, it, expect, beforeAll } from 'vitest';
import type { Board, List, Card } from '../../src/shared/types';
import { setup, getAuthHeaders } from '../helpers';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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
    expect(data.data.status).toBe('healthy');
  });
});

describe('Boards API', () => {
  let request: any;

  beforeAll(async () => {
    request = await setup();
  });

  it('should return boards list for an authenticated user', async () => {
    const response = await request
      .get('/api/boards')
      .set(getAuthHeaders());
    const data = response.body as ApiResponse<Board[]>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return board with lists and cards for an authenticated user', async () => {
    // First get all boards to get an ID
    const boardsResponse = await request
      .get('/api/boards')
      .set(getAuthHeaders());
    const boardsData = boardsResponse.body as ApiResponse<Board[]>;
    
    let firstBoard: Board | undefined = boardsData.data[0];

    // Ensure there is at least one board to test with
    if (!firstBoard) {
      // If no boards, create one to proceed with the test
      const createResponse = await request
        .post('/api/boards')
        .set({ ...getAuthHeaders(), 'Content-Type': 'application/json' })
        .send({ name: 'Test Board for Details' });
      const createData = createResponse.body as ApiResponse<Board>;
      firstBoard = createData.data;
    }
    
    expect(firstBoard).toBeDefined();
    if (!firstBoard) return; // Guard for type safety

    // Then get the specific board
    const response = await request
      .get(`/api/boards/${firstBoard.id}`)
      .set(getAuthHeaders());
    const data = response.body as ApiResponse<Board & { lists: (List & { cards: Card[] })[] }>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(firstBoard.id);
    expect(Array.isArray(data.data.lists)).toBe(true);
  });
});
