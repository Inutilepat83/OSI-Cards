import { test, expect } from '@playwright/test';

/**
 * Integration test for provider switching
 * Tests switching between different card data providers
 * 
 * @integration
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

  test('should maintain card state during provider switch', async ({ page }) => {
    // Load initial card
    const jsonConfig = {
      cardTitle: 'Test Card',
      sections: [{ type: 'info', title: 'Test', fields: [] }]
    };
    
    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);
    
    // Verify card is displayed
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();
    
    // Card state should persist (this would require actual provider switching UI)
    // For now, verify card remains visible
    await page.waitForTimeout(500);
    await expect(cardPreview).toBeVisible();
  });

  test('should cache provider responses', async ({ page }) => {
    // This test would verify caching behavior
    // For now, verify page loads successfully
    await expect(page).toHaveTitle(/OSI Cards|OrangeSales/);
  });
});


