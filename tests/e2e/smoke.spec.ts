import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('basic smoke test - can access application', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check that the header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check that DriftBoard title is visible
    await expect(page.getByText('DriftBoard')).toBeVisible();
  });

  test('API health check via direct request', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
