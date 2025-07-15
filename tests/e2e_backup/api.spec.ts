import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should have healthy API endpoints', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get('http://localhost:8000/api/health');
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData.success).toBe(true);
    expect(healthData.data.status).toBe('healthy');
  });

  test('should return boards data from API', async ({ request }) => {
    // Test boards endpoint
    const boardsResponse = await request.get('http://localhost:8000/api/boards');
    expect(boardsResponse.ok()).toBeTruthy();
    
    const boardsData = await boardsResponse.json();
    expect(boardsData.success).toBe(true);
    expect(Array.isArray(boardsData.data)).toBe(true);
    expect(boardsData.data.length).toBeGreaterThan(0);
    
    // Check that the first board has the expected structure
    const firstBoard = boardsData.data[0];
    expect(firstBoard).toHaveProperty('id');
    expect(firstBoard).toHaveProperty('name');
    expect(firstBoard).toHaveProperty('lists');
    expect(Array.isArray(firstBoard.lists)).toBe(true);
  });

  test('should return specific board details from API', async ({ request }) => {
    // First get the list of boards to get a valid board ID
    const boardsResponse = await request.get('http://localhost:8000/api/boards');
    const boardsData = await boardsResponse.json();
    const boardId = boardsData.data[0].id;
    
    // Test specific board endpoint
    const boardResponse = await request.get(`http://localhost:8000/api/boards/${boardId}`);
    expect(boardResponse.ok()).toBeTruthy();
    
    const boardData = await boardResponse.json();
    expect(boardData.success).toBe(true);
    expect(boardData.data).toHaveProperty('id', boardId);
    expect(boardData.data).toHaveProperty('name');
    expect(boardData.data).toHaveProperty('lists');
    
    // Check that lists have cards
    const lists = boardData.data.lists;
    expect(Array.isArray(lists)).toBe(true);
    expect(lists.length).toBeGreaterThan(0);
    
    // Check that at least one list has cards
    const listsWithCards = lists.filter((list: any) => list.cards && list.cards.length > 0);
    expect(listsWithCards.length).toBeGreaterThan(0);
  });
});
