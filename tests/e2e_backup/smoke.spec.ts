import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('basic smoke test - can access application dashboard', async ({ page }) => {
    // Listen for all console events and log them to the test output
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // The auth.setup.ts script handles login. We start at the main page.
    await page.goto('/boards');
    
    // Wait for the initial loading spinner to disappear.
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 }); // Increased timeout

    // Now that we know the page has finished its initial load,
    // we can safely check for the main content.
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('API health check via direct request', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
