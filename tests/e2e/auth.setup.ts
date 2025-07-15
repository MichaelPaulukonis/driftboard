import { test as setup, expect } from '@playwright/test';
import { createUser, deleteUser } from '../test-utils'; // We will create this utility

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = `e2e-user-${Date.now()}@example.com`;
  const password = 'password123';

  // 1. Create a test user for the session
  await createUser({ email, password });

  // 2. Perform login
  await page.goto('/login');
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.locator('button[type="submit"]').click();

  // 3. Wait for authentication to complete and redirect to the main page
  await page.waitForURL('/boards');
  await expect(page.locator('h1:has-text("My Boards")')).toBeVisible();

  // 4. Save the authenticated state to a file
  await page.context().storageState({ path: authFile });

  // 5. Clean up the user from Firebase Auth
  await deleteUser(email);
});