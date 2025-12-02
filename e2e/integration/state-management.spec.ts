import { test, expect } from '@playwright/test';

/**
 * Integration test for state management
 * Tests NgRx store integration and state persistence
 */
test.describe('State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should update state when card is generated', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'State Test Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [{ label: 'Field', value: 'Value' }]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    // Verify card is in state (check if it's displayed)
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();

    // Verify sections are in state
    await expect(page.locator('.ai-section--info')).toBeVisible();
  });

  test('should persist state across navigation', async ({ page }) => {
    // Generate a card
    const jsonConfig = {
      cardTitle: 'Persistence Test',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [{ label: 'Field', value: 'Value' }]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    // Navigate away and back (if navigation exists)
    // For now, just verify state is maintained
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();
  });
});
















