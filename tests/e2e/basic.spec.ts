import { test, expect } from '@playwright/test';

test.describe('DriftBoard E2E Tests', () => {
  
  test('API health endpoint responds correctly', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('status', 'healthy');
  });

  test('Boards API returns data correctly', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/boards');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    
    // Validate board structure
    const board = data.data[0];
    expect(board).toHaveProperty('id');
    expect(board).toHaveProperty('name');
    expect(board).toHaveProperty('lists');
    expect(Array.isArray(board.lists)).toBe(true);
  });

  test('Individual board API returns detailed data', async ({ request }) => {
    // First get boards to get a valid board ID
    const boardsResponse = await request.get('http://localhost:8000/api/boards');
    const boardsData = await boardsResponse.json();
    const boardId = boardsData.data[0].id;
    
    // Test individual board endpoint
    const response = await request.get(`http://localhost:8000/api/boards/${boardId}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    
    const board = data.data;
    expect(board).toHaveProperty('id', boardId);
    expect(board).toHaveProperty('name');
    expect(board).toHaveProperty('lists');
    
    // Validate lists structure
    expect(Array.isArray(board.lists)).toBe(true);
    expect(board.lists.length).toBe(3); // We know from seed data
    
    // Validate cards within lists
    const listsWithCards = board.lists.filter((list: any) => 
      list.cards && Array.isArray(list.cards) && list.cards.length > 0
    );
    expect(listsWithCards.length).toBeGreaterThan(0);
  });

  // Browser tests - simplified
  test('Homepage loads and displays header', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Check that the page loads
    await page.waitForLoadState('networkidle');
    
    // Check header elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('DriftBoard')).toBeVisible();
    await expect(page.getByText('Personal Kanban Board')).toBeVisible();
  });

  test('Boards page displays board data', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
    
    // Check for board content
    await expect(page.getByText('My First Board')).toBeVisible();
    await expect(page.getByText('A sample board to get started')).toBeVisible();
    
    // Check for Open Board button
    await expect(page.getByRole('button', { name: 'Open Board' })).toBeVisible();
  });

  test('Navigation from boards to board detail works', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    // Click Open Board button
    await page.getByRole('button', { name: 'Open Board' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on board detail page
    await expect(page.getByText('← Back to Boards')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My First Board' })).toBeVisible();
    
    // Check that lists are visible
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });
});
