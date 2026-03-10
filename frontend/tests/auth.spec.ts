import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*login/);
    });

    test('should show error on invalid login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Check for toast error (assuming sonner or similar)
        await expect(page.getByText(/invalid/i).or(page.getByText(/failed/i))).toBeVisible();
    });
});
