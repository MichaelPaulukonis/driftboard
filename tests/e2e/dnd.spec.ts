import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Seed the database if necessary or ensure a known state
    // For now, we assume a board with ID 'clzhtr5k30000e1p4a5w8f6z2' exists
    // This ID is from the seed data
    await page.goto('/board/clzhtr5k30000e1p4a5w8f6z2');
    // Wait for the board to load
    await expect(page.locator('h1:has-text("Project Phoenix")')).toBeVisible({ timeout: 10000 });
  });

  test('should allow reordering cards within the same list', async ({ page }) => {
    const todoList = page.locator('[data-testid="list-clzhtr5k90001e1p4h2g7f8i9"]');
    const card1 = todoList.locator('[data-testid="card-clzhtr5ke0004e1p4b9c8d2e3"]'); // "Setup project structure"
    const card2 = todoList.locator('[data-testid="card-clzhtr5kh0005e1p4c6a7f8b9"]'); // "Install dependencies"

    const card1Title = await card1.locator('h3').textContent();
    const card2Title = await card2.locator('h3').textContent();

    expect(card1Title).toBe('Setup project structure');
    expect(card2Title).toBe('Install dependencies');

    // Drag card2 before card1
    await card2.hover();
    await page.mouse.down();
    await card1.hover();
    await page.mouse.up();

    // Wait for potential network request and UI update
    await page.waitForTimeout(1000);

    const cardsInList = todoList.locator('[data-testid^="card-"]');
    const firstCardTitle = await cardsInList.first().locator('h3').textContent();
    
    expect(firstCardTitle).toBe('Install dependencies');
  });

  test('should allow moving cards between lists', async ({ page }) => {
    const todoList = page.locator('[data-testid="list-clzhtr5k90001e1p4h2g7f8i9"]');
    const inProgressList = page.locator('[data-testid="list-clzhtr5kc0002e1p4d5e6f7g8"]');
    const cardToMove = todoList.locator('[data-testid="card-clzhtr5ke0004e1p4b9c8d2e3"]'); // "Setup project structure"

    await expect(inProgressList.locator('h3:has-text("Setup project structure")')).not.toBeVisible();

    // Drag card from "To Do" to "In Progress"
    await cardToMove.hover();
    await page.mouse.down();
    await inProgressList.hover();
    await page.mouse.up();

    await page.waitForTimeout(1000);

    await expect(inProgressList.locator('h3:has-text("Setup project structure")')).toBeVisible();
    await expect(todoList.locator('h3:has-text("Setup project structure")')).not.toBeVisible();
  });

  test('should allow reordering lists', async ({ page }) => {
    const todoList = page.locator('[data-testid="list-clzhtr5k90001e1p4h2g7f8i9"]');
    const inProgressList = page.locator('[data-testid="list-clzhtr5kc0002e1p4d5e6f7g8"]');
    const doneList = page.locator('[data-testid="list-clzhtr5kd0003e1p4e9f8g7h6"]');

    const todoHeader = todoList.locator('h2');
    const inProgressHeader = inProgressList.locator('h2');

    // Drag "In Progress" list before "To Do" list
    await inProgressHeader.hover();
    await page.mouse.down();
    await todoHeader.hover();
    await page.mouse.up();

    await page.waitForTimeout(1000);

    const lists = page.locator('[data-testid^="list-"]');
    const firstListTitle = await lists.first().locator('h2').textContent();
    expect(firstListTitle).toBe('In Progress');
  });
});
