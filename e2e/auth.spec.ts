import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login page with OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('ProjectHub')).toBeVisible();
    await expect(page.getByText('Continue with GitHub')).toBeVisible();
    await expect(page.getByText('Continue with GitLab')).toBeVisible();
    await expect(page.getByText('Continue with Demo Account')).toBeVisible();
  });

  test('should login with demo credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'demo@projecthub.dev');
    await page.fill('input[name="name"]', 'Demo User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
