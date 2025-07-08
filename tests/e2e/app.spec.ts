import { test, expect } from '@playwright/test';

test.describe('DriftBoard Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display the main header and navigation', async ({ page }) => {
    // Check that the main header is visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DriftBoard' })).toBeVisible();
    await expect(page.getByText('Personal Kanban Board')).toBeVisible();
  });

  test('should display the boards page with sample data', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the boards page
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
    
    // Check that the "Create Board" button is visible
    await expect(page.getByRole('button', { name: 'Create Board' })).toBeVisible();
    
    // Check that the sample board is displayed
    await expect(page.getByText('My First Board')).toBeVisible();
    await expect(page.getByText('A sample board to get started')).toBeVisible();
    
    // Check that board stats are displayed
    await expect(page.getByText('3 lists')).toBeVisible();
    await expect(page.getByText('4 cards')).toBeVisible();
    
    // Check that the "Open Board" button is visible
    await expect(page.getByRole('button', { name: 'Open Board' })).toBeVisible();
  });

  test('should navigate from boards list to board detail', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click the "Open Board" button
    await page.getByRole('button', { name: 'Open Board' }).click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Check that we're now on the board detail page
    await expect(page.getByText('← Back to Boards')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My First Board' })).toBeVisible();
    await expect(page.getByText('A sample board to get started')).toBeVisible();
    
    // Check that the "Add List" button is visible
    await expect(page.getByRole('button', { name: 'Add List' })).toBeVisible();
    
    // Check that lists are displayed
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
    
    // Check that some cards are displayed
    await expect(page.getByText('Welcome to DriftBoard!')).toBeVisible();
    await expect(page.getByText('Learn React and TypeScript')).toBeVisible();
    await expect(page.getByText('Set up development environment')).toBeVisible();
    await expect(page.getByText('Create project structure')).toBeVisible();
  });

  test('should navigate back from board detail to boards list', async ({ page }) => {
    // Navigate to board detail first
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Open Board' }).click();
    await page.waitForLoadState('networkidle');
    
    // Click the "Back to Boards" link
    await page.getByText('← Back to Boards').click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Check that we're back on the boards page
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Board' })).toBeVisible();
    await expect(page.getByText('My First Board')).toBeVisible();
  });

  test('should display board detail with horizontal scrolling for lists', async ({ page }) => {
    // Navigate to board detail
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Open Board' }).click();
    await page.waitForLoadState('networkidle');
    
    // Check that the board content container has overflow-x-auto class
    const boardContent = page.locator('.overflow-x-auto');
    await expect(boardContent).toBeVisible();
    
    // Check that lists are displayed in a horizontal layout
    const lists = page.locator('.bg-gray-100.rounded-lg');
    await expect(lists).toHaveCount(3);
    
    // Check that "Add a card" buttons are present in each list
    const addCardButtons = page.getByRole('button', { name: '+ Add a card' });
    await expect(addCardButtons).toHaveCount(3);
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Intercept the API call to delay it
    await page.route('/api/boards', async route => {
      // Delay the response by 1 second to test loading state
      await page.waitForTimeout(1000);
      await route.continue();
    });
    
    // Navigate to the page
    await page.goto('/');
    
    // Check that loading spinner is visible initially
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check that loading spinner is gone and content is visible
    await expect(page.locator('.animate-spin')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
  });
});
