import { test, expect } from '@playwright/test';
import { prisma } from '../../src/backend/services/database';

test.describe('Drag and Drop', () => {
  let board: any;
  let todoList: any;
  let inProgressList: any;
  let card1: any;
  let card2: any;

  // Fetch dynamic IDs from the seeded database before tests run
  test.beforeAll(async () => {
    // This user and board are created by the main `prisma/seed.ts`
    board = await prisma.board.findFirst({
      where: { user: { email: 'test@example.com' } },
      include: {
        lists: {
          where: { status: 'ACTIVE' },
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!board) {
      throw new Error('Default seed data not found. Make sure the database is seeded.');
    }

    todoList = board.lists.find((l: any) => l.name === 'To Do');
    inProgressList = board.lists.find((l: any) => l.name === 'In Progress');
    
    card1 = todoList.cards[0];
    card2 = todoList.cards[1];
  });

  test.beforeEach(async ({ page }) => {
    // The user is already logged in thanks to auth.setup.ts
    // We just need to navigate to the correct board
    await page.goto(`/board/${board.boardId}`);
    await expect(page.locator(`h1:has-text("${board.name}")`)).toBeVisible({ timeout: 10000 });
  });

  test('should allow reordering cards within the same list', async ({ page }) => {
    const listLocator = page.locator(`[data-testid="list-${todoList.listId}"]`);
    const card1Locator = listLocator.locator(`[data-testid="card-${card1.cardId}"]`);
    const card2Locator = listLocator.locator(`[data-testid="card-${card2.cardId}"]`);

    const card1Title = await card1Locator.locator('h3').textContent();
    const card2Title = await card2Locator.locator('h3').textContent();

    expect(card1Title).toBe(card1.title);
    expect(card2Title).toBe(card2.title);

    // Drag card2 before card1
    await card2Locator.hover();
    await page.mouse.down();
    await card1Locator.hover();
    await page.mouse.up();

    // Wait for the UI to settle
    await page.waitForTimeout(500); 

    const cardsInList = listLocator.locator('[data-testid^="card-"]');
    const firstCardTitle = await cardsInList.first().locator('h3').textContent();
    
    expect(firstCardTitle).toBe(card2.title);
  });

  test('should allow moving cards between lists', async ({ page }) => {
    const todoListLocator = page.locator(`[data-testid="list-${todoList.listId}"]`);
    const inProgressListLocator = page.locator(`[data-testid="list-${inProgressList.listId}"]`);
    const cardToMoveLocator = todoListLocator.locator(`[data-testid="card-${card1.cardId}"]`);

    await expect(inProgressListLocator.locator(`h3:has-text("${card1.title}")`)).not.toBeVisible();

    // Drag card from "To Do" to "In Progress"
    await cardToMoveLocator.hover();
    await page.mouse.down();
    await inProgressListLocator.hover();
    await page.mouse.up();

    await page.waitForTimeout(500);

    await expect(inProgressListLocator.locator(`h3:has-text("${card1.title}")`)).toBeVisible();
    await expect(todoListLocator.locator(`h3:has-text("${card1.title}")`)).not.toBeVisible();
  });

  test('should allow reordering lists', async ({ page }) => {
    const todoListLocator = page.locator(`[data-testid="list-${todoList.listId}"]`);
    const inProgressListLocator = page.locator(`[data-testid="list-${inProgressList.listId}"]`);

    const todoHeader = todoListLocator.locator('h2');
    const inProgressHeader = inProgressListLocator.locator('h2');

    // Drag "In Progress" list before "To Do" list
    await inProgressHeader.hover();
    await page.mouse.down();
    await todoHeader.hover();
    await page.mouse.up();

    await page.waitForTimeout(500);

    const lists = page.locator('[data-testid^="list-"]');
    const firstListTitle = await lists.first().locator('h2').textContent();
    expect(firstListTitle).toBe('In Progress');
  });
});
