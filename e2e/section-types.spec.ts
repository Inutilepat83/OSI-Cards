import { test, expect } from '@playwright/test';

/**
 * E2E tests for all section types
 * Tests each section type to ensure proper rendering and interaction
 */
test.describe('Section Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  const sectionTypes = [
    'info',
    'analytics',
    'list',
    'chart',
    'overview',
    'solutions',
    'contact-card',
    'map',
    'timeline',
    'table',
    'financials',
    'product',
    'event',
    'network-card',
    'text-reference',
    'quotation',
    'brand-colors',
    'news',
    'social-media'
  ];

  for (const sectionType of sectionTypes) {
    test(`should render ${sectionType} section correctly`, async ({ page }) => {
      // Generate a card with the specific section type
      const jsonConfig = {
        cardTitle: `Test ${sectionType} Card`,
        sections: [
          {
            type: sectionType,
            title: `${sectionType} Section`,
            fields: sectionType === 'list' ? [
              { label: 'Item 1', value: 'Value 1' },
              { label: 'Item 2', value: 'Value 2' }
            ] : [
              { label: 'Field 1', value: 'Value 1' },
              { label: 'Field 2', value: 'Value 2' }
            ]
          }
        ]
      };

      // Find JSON editor and input the config
      const jsonEditor = page.locator('app-json-editor textarea');
      await jsonEditor.fill(JSON.stringify(jsonConfig));
      await page.waitForTimeout(500); // Wait for parsing

      // Check if section is rendered
      const section = page.locator(`.ai-section--${sectionType}`);
      await expect(section).toBeVisible({ timeout: 5000 });
    });
  }

  test('should handle section interactions', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Interactive Card',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Clickable Field', value: 'Test Value' }
          ]
        }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(500);

    // Click on a field
    const field = page.locator('.info-row').first();
    await field.click();

    // Verify interaction occurred (no errors)
    await expect(page.locator('.ai-section--info')).toBeVisible();
  });

  test('should handle multiple sections of different types', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Multi-Section Card',
      sections: [
        { type: 'info', title: 'Info', fields: [{ label: 'Field', value: 'Value' }] },
        { type: 'list', title: 'List', items: [{ title: 'Item', value: 'Value' }] },
        { type: 'chart', title: 'Chart', fields: [{ label: 'Data', value: 50 }] }
      ]
    };

    const jsonEditor = page.locator('app-json-editor textarea');
    await jsonEditor.fill(JSON.stringify(jsonConfig));
    await page.waitForTimeout(1000);

    // Verify all sections are rendered
    await expect(page.locator('.ai-section--info')).toBeVisible();
    await expect(page.locator('.ai-section--list')).toBeVisible();
    await expect(page.locator('.ai-section--chart')).toBeVisible();
  });
});











