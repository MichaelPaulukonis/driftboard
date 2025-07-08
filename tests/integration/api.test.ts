import { describe, it, expect } from 'vitest';

describe('API Health Check', () => {
  it('should return OK status', async () => {
    const response = await fetch('http://localhost:8000/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ok');
  });
});

describe('Boards API', () => {
  it('should return boards list', async () => {
    const response = await fetch('http://localhost:8000/api/boards');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('should return board with lists and cards', async () => {
    // First get all boards to get an ID
    const boardsResponse = await fetch('http://localhost:8000/api/boards');
    const boardsData = await boardsResponse.json();
    const firstBoard = boardsData.data[0];
    
    // Then get the specific board
    const response = await fetch(`http://localhost:8000/api/boards/${firstBoard.id}`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(firstBoard.id);
    expect(Array.isArray(data.data.lists)).toBe(true);
    expect(data.data.lists.length).toBeGreaterThan(0);
    expect(Array.isArray(data.data.lists[0].cards)).toBe(true);
  });
});
