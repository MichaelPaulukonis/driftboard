import { test, expect } from '@playwright/test';

//  npx playwright test tests/e2e/test_user.basics.spec.ts --reporter=list --headed

test('test', async ({ page }) => {
  await page.goto('http://localhost:3002/boards');
  await page.locator('div').filter({ hasText: 'LoginEmailPasswordLoginORSign' }).nth(1).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
  await page.getByRole('textbox', { name: 'Email' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('Password#123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Open Board' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Board' })).toBeVisible();
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All Boards' })).toBeVisible();
  await page.getByRole('button', { name: 'All Boards' }).click();
  await expect(page.getByRole('heading', { name: 'Board One' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Board' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Board' }).click();
  await expect(page.getByRole('link', { name: '← Back to Boards' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add List' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Board' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'List One 3 cards Delete' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Add a list' })).toBeVisible();
});