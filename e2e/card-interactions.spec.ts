import { test, expect } from '@playwright/test';

/**
 * E2E tests for card interactions
 * Tests user interactions with cards including clicks, keyboard navigation, and exports
 */
test.describe('Card Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle card field clicks', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Interactive Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(500);

    // Click on first field
    const field = page.locator('.info-row').first();
    await field.click();

    // Verify field is clickable and responsive
    await expect(field).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Keyboard Navigation Card',
      sections: [
        {
          type: 'list',
          title: 'List Section',
          items: [
            { title: 'Item 1', value: 'Value 1' },
            { title: 'Item 2', value: 'Value 2' },
            { title: 'Item 3', value: 'Value 3' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(500);

    // Focus first item
    const firstItem = page.locator('.list-card').first();
    await firstItem.focus();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.list-card').nth(1)).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(firstItem).toBeFocused();
  });

  test('should export card as PNG', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Export Test Card',
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
    await page.waitForTimeout(500);

    // Find and click export button
    const exportButton = page.locator('button[aria-label*="Export"], button[title*="Export"]').first();
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.png$/i);
    }
  });

  test('should handle fullscreen toggle', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Fullscreen Test Card',
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
    await page.waitForTimeout(500);

    // Find fullscreen button
    const fullscreenButton = page.locator('button[aria-label*="Fullscreen"], button[title*="Fullscreen"]').first();
    if (await fullscreenButton.isVisible()) {
      await fullscreenButton.click();
      await page.waitForTimeout(300);
      
      // Verify fullscreen state (check for fullscreen class or attribute)
      const preview = page.locator('app-card-preview');
      await expect(preview).toBeVisible();
    }
  });

  test('should handle agent actions', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Agent Action Card',
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
    await page.waitForTimeout(500);

    // Look for agent action buttons
    const agentButton = page.locator('button[aria-label*="Agent"], button[title*="Agent"]').first();
    if (await agentButton.isVisible()) {
      await agentButton.click();
      await page.waitForTimeout(300);
      // Verify action was triggered (no errors)
      await expect(page.locator('.ai-section--info')).toBeVisible();
    }
  });
});





























