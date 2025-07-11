import { describe, it, expect } from 'vitest';
import type { Board, List, Card } from '../../src/shared/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const getAuthHeaders = () => ({
  Authorization: 'Bearer valid-token-user-1',
});

describe('API Health Check', () => {
  it('should return OK status', async () => {
    const response = await fetch('http://localhost:8002/api/health');
    const data = (await response.json()) as ApiResponse<{ status: string }>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });
});

describe('Boards API', () => {
  it('should return boards list for an authenticated user', async () => {
    const response = await fetch('http://localhost:8002/api/boards', {
      headers: getAuthHeaders(),
    });
    const data = (await response.json()) as ApiResponse<Board[]>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return board with lists and cards for an authenticated user', async () => {
    // First get all boards to get an ID
    const boardsResponse = await fetch('http://localhost:8002/api/boards', {
      headers: getAuthHeaders(),
    });
    const boardsData = (await boardsResponse.json()) as ApiResponse<Board[]>;
    
    let firstBoard: Board | undefined = boardsData.data[0];

    // Ensure there is at least one board to test with
    if (!firstBoard) {
      // If no boards, create one to proceed with the test
      const createResponse = await fetch('http://localhost:8002/api/boards', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Board for Details' }),
      });
      const createData = (await createResponse.json()) as ApiResponse<Board>;
      firstBoard = createData.data;
    }
    
    expect(firstBoard).toBeDefined();
    if (!firstBoard) return; // Guard for type safety

    // Then get the specific board
    const response = await fetch(`http://localhost:8002/api/boards/${firstBoard.id}`, {
      headers: getAuthHeaders(),
    });
    const data = (await response.json()) as ApiResponse<Board & { lists: (List & { cards: Card[] })[] }>;
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(firstBoard.id);
    expect(Array.isArray(data.data.lists)).toBe(true);
  });
});
