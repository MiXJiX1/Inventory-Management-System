import { test, expect } from '@playwright/test';

test.describe('Products Management', () => {
    test.beforeEach(async ({ page }) => {
        // Log in before each test
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@example.com'); // Replace with test credentials if needed
        await page.fill('input[name="password"]', 'admin123'); // Replace with test credentials if needed
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should display product list', async ({ page }) => {
        await page.goto('/products');
        await expect(page.locator('table')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    });

    test('should search for products', async ({ page }) => {
        await page.goto('/products');
        const searchInput = page.getByPlaceholder('Search products...');
        await searchInput.fill('Test Product');
        // Wait for debounce and check results
        await page.waitForTimeout(1000);
        // Add specific checks for filtered content if product exists
    });

    test('should open create product dialog', async ({ page }) => {
        await page.goto('/products');
        await page.click('button:has-text("Add Product")');
        await expect(page.getByText('Create Product')).toBeVisible();
        await expect(page.getByLabel('Name')).toBeVisible();
    });
});
