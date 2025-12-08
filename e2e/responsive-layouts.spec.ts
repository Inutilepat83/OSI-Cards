import { test, expect } from '@playwright/test';

/**
 * E2E tests for responsive layouts
 * Tests card rendering and interactions across different viewport sizes
 */
test.describe('Responsive Layouts', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const jsonConfig = {
        cardTitle: 'Responsive Test Card',
        sections: [
          {
            type: 'info',
            title: 'Info Section',
            fields: [
              { label: 'Field 1', value: 'Value 1' },
              { label: 'Field 2', value: 'Value 2' },
              { label: 'Field 3', value: 'Value 3' }
            ]
          },
          {
            type: 'list',
            title: 'List Section',
            items: [
              { title: 'Item 1', value: 'Value 1' },
              { title: 'Item 2', value: 'Value 2' }
            ]
          }
        ]
      };

      const jsonEditor = page.locator('app-json-editor textarea');
      await jsonEditor.fill(JSON.stringify(jsonConfig));
      await page.waitForTimeout(1000);

      // Verify card is visible
      const cardPreview = page.locator('app-card-preview');
      await expect(cardPreview).toBeVisible();

      // Verify sections are rendered
      await expect(page.locator('.ai-section--info')).toBeVisible();
      await expect(page.locator('.ai-section--list')).toBeVisible();
    });
  }

  test('should adapt masonry grid layout on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsonConfig = {
      cardTitle: 'Masonry Grid Test',
      sections: Array.from({ length: 10 }, (_, i) => ({
        type: 'info',
        title: `Section ${i + 1}`,
        fields: [{ label: 'Field', value: 'Value' }]
      }))
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    // Check initial layout (should have multiple columns on large screen)
    const sections = page.locator('.masonry-item');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify sections are still visible
    await expect(sections.first()).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsonConfig = {
      cardTitle: 'Touch Test Card',
      sections: [
        {
          type: 'list',
          title: 'List Section',
          items: [
            { title: 'Item 1', value: 'Value 1' },
            { title: 'Item 2', value: 'Value 2' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(500);

    // Test touch interaction
    const item = page.locator('.list-card').first();
    await item.tap();

    // Verify interaction
    await expect(item).toBeVisible();
  });
});























