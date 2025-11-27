import { test, expect } from '@playwright/test';

/**
 * Visual regression tests
 * Compares screenshots to detect visual changes
 */
test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('card preview should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Visual Test Card',
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
    await page.waitForTimeout(1000);

    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toHaveScreenshot('card-preview.png', {
      maxDiffPixels: 100
    });
  });

  test('info section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Info Section Test',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Name', value: 'John Doe' },
            { label: 'Email', value: 'john@example.com' },
            { label: 'Status', value: 'Active' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    const section = page.locator('.ai-section--info');
    await expect(section).toHaveScreenshot('info-section.png', {
      maxDiffPixels: 100
    });
  });

  test('list section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'List Section Test',
      sections: [
        {
          type: 'list',
          title: 'List Section',
          items: [
            { title: 'Item 1', value: 'Value 1', description: 'Description 1' },
            { title: 'Item 2', value: 'Value 2', description: 'Description 2' },
            { title: 'Item 3', value: 'Value 3', description: 'Description 3' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    const section = page.locator('.ai-section--list');
    await expect(section).toHaveScreenshot('list-section.png', {
      maxDiffPixels: 100
    });
  });

  test('chart section should match baseline', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Chart Section Test',
      sections: [
        {
          type: 'chart',
          title: 'Chart Section',
          fields: [
            { label: 'Data 1', value: 30 },
            { label: 'Data 2', value: 50 },
            { label: 'Data 3', value: 20 }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    const section = page.locator('.ai-section--chart');
    await expect(section).toHaveScreenshot('chart-section.png', {
      maxDiffPixels: 100
    });
  });

  test('responsive layout should match baseline on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const jsonConfig = {
      cardTitle: 'Mobile Test Card',
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
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

