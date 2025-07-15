import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('should allow a logged-in user to view the boards page', async ({ page }) => {
    // The `auth.setup.ts` file has already logged us in,
    // so we can navigate directly to the page we want to test.
    await page.goto('/boards');

    // Assert that the main heading is visible, confirming we are on the correct page.
    await expect(page.locator('h1:has-text("My Boards")')).toBeVisible();
  });
});
