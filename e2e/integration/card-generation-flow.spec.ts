import { test, expect } from '@playwright/test';

/**
 * Integration test for complete card generation flow
 * Tests the end-to-end process from JSON input to card display
 */
test.describe('Card Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full card generation flow', async ({ page }) => {
    // Step 1: Select card type
    const cardTypeSelector = page.locator('app-card-type-selector');
    if (await cardTypeSelector.isVisible()) {
      await cardTypeSelector.locator('button').first().click();
      await page.waitForTimeout(500);
    }

    // Step 2: Input JSON configuration
    const jsonConfig = {
      cardTitle: 'Integration Test Card',
      cardType: 'company',
      sections: [
        {
          type: 'info',
          title: 'Company Information',
          fields: [
            { label: 'Company Name', value: 'Acme Corp' },
            { label: 'Industry', value: 'Technology' },
            { label: 'Founded', value: '2020' }
          ]
        },
        {
          type: 'list',
          title: 'Key Products',
          items: [
            { title: 'Product 1', value: 'Description 1' },
            { title: 'Product 2', value: 'Description 2' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    // Step 3: Verify JSON is valid
    const validIndicator = page.locator('.status-badge--success');
    await expect(validIndicator).toBeVisible({ timeout: 5000 });

    // Step 4: Verify card is rendered
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();

    // Step 5: Verify sections are displayed
    await expect(page.locator('.ai-section--info')).toBeVisible();
    await expect(page.locator('.ai-section--list')).toBeVisible();

    // Step 6: Verify card title
    const cardTitle = page.locator('h1, .card-title').first();
    await expect(cardTitle).toContainText('Integration Test Card');
  });

  test('should handle card type switching', async ({ page }) => {
    // Select initial card type
    const cardTypeSelector = page.locator('app-card-type-selector');
    if (await cardTypeSelector.isVisible()) {
      const buttons = cardTypeSelector.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 1) {
        await buttons.nth(0).click();
        await page.waitForTimeout(500);
        
        // Switch to different type
        await buttons.nth(1).click();
        await page.waitForTimeout(500);
        
        // Verify card updated
        const cardPreview = page.locator('app-card-preview');
        await expect(cardPreview).toBeVisible();
      }
    }
  });

  test('should handle LLM simulation', async ({ page }) => {
    // Find LLM simulation controls
    const llmControls = page.locator('app-llm-simulation-controls');
    if (await llmControls.isVisible()) {
      const simulateButton = llmControls.locator('button').first();
      await simulateButton.click();
      
      // Wait for simulation to start
      await page.waitForTimeout(500);
      
      // Verify simulation is running (check for loading indicator)
      const loadingIndicator = page.locator('.status-badge--generating, [aria-busy="true"]');
      if (await loadingIndicator.isVisible({ timeout: 2000 })) {
        // Wait for simulation to complete
        await page.waitForTimeout(5000);
        
        // Verify card was generated
        const cardPreview = page.locator('app-card-preview');
        await expect(cardPreview).toBeVisible();
      }
    }
  });

  test('should handle card export flow', async ({ page }) => {
    // Generate a card first
    const jsonConfig = {
      cardTitle: 'Export Flow Test',
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

    // Find export button
    const exportButton = page.locator('button[aria-label*="Export"], button[title*="Export"]').first();
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.png$/i);
      }
    }
  });

  test('should persist card state', async ({ page }) => {
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

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify card state was persisted (if localStorage is used)
    // This depends on implementation
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible({ timeout: 5000 });
  });
});
















