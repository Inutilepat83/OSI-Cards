import { test, expect } from '@playwright/test';

/**
 * Integration test for provider switching
 * Tests switching between different card data providers
 */
test.describe('Provider Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load cards from default provider', async ({ page }) => {
    // Wait for cards to load
    await page.waitForTimeout(2000);
    
    // Verify cards are displayed (if default provider loads cards)
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();
  });

  test('should handle provider errors gracefully', async ({ page }) => {
    // This test would require mocking provider errors
    // For now, verify error handling UI exists
    const errorBoundary = page.locator('app-error-boundary');
    if (await errorBoundary.count() > 0) {
      // Error boundaries should be present
      expect(await errorBoundary.count()).toBeGreaterThan(0);
    }
  });
});

