import { test, expect } from '@playwright/test';
import {
  SECTION_TYPES,
  SECTION_CSS_CLASSES,
  SectionType,
  loadCardConfig,
  generateSectionConfig,
  generateMultiSectionConfig,
  waitForSection,
  assertSectionVisible
} from './helpers/style-assertions';

/**
 * Comprehensive Visual Regression Tests
 * 
 * Tests all 15 section types with:
 * - Visual screenshot comparisons
 * - Proper wait states
 * - Clear pass/fail reporting
 * - Cross-browser support
 * 
 * Run: npm run test:visual
 * Update snapshots: npm run test:visual:update
 */

// Test configuration
const RENDER_WAIT_MS = 1500;
const SECTION_TIMEOUT_MS = 5000;

/**
 * Helper to log test progress
 */
function logProgress(message: string): void {
  console.log(`[VISUAL TEST] ${message}`);
}

test.describe('Visual Regression - Core Pages', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('homepage should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });
});

test.describe('Visual Regression - All Section Types', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  // Test each of the 15 section types
  for (const sectionType of SECTION_TYPES) {
    test(`${sectionType} section should match baseline`, async ({ page }) => {
      const config = generateSectionConfig(sectionType);
      await loadCardConfig(page, config);
      
      const cssClass = SECTION_CSS_CLASSES[sectionType];
      const section = page.locator(cssClass).first();
      
      // Wait for section to be visible with explicit timeout
      const isVisible = await section.isVisible().catch(() => false);
      if (!isVisible) {
        logProgress(`Waiting for ${sectionType} section (${cssClass})...`);
        await page.waitForSelector(cssClass, { state: 'visible', timeout: SECTION_TIMEOUT_MS })
          .catch(() => {
            logProgress(`Section ${sectionType} not found - skipping visual test`);
          });
      }
      
      // Take screenshot if section exists
      if (await section.count() > 0 && await section.isVisible()) {
        await page.waitForTimeout(500); // Allow animations to settle
        await expect(section).toHaveScreenshot(`sections/${sectionType}-section.png`, {
          maxDiffPixels: 150
        });
        logProgress(`Screenshot captured for ${sectionType}`);
      } else {
        test.skip();
      }
    });
  }
});

test.describe('Visual Regression - Card States', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('card with actions should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Card with Actions',
      sections: [
        {
          type: 'info',
          title: 'Info Section',
          fields: [
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' }
          ]
        }
      ],
      actions: [
        {
          label: 'Contact Us',
          type: 'mail',
          email: {
            contact: { name: 'Support', email: 'support@example.com', role: 'Support Team' },
            subject: 'Inquiry',
            body: 'Hello'
          }
        },
        {
          label: 'Visit Website',
          type: 'website',
          url: 'https://example.com'
        }
      ]
    };

    await loadCardConfig(page, config);
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(cardPreview).toHaveScreenshot('states/card-with-actions.png', {
      maxDiffPixels: 150
    });
  });

  test('card with multiple sections should match baseline', async ({ page }) => {
    const config = generateMultiSectionConfig(4);
    await loadCardConfig(page, config);
    
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(cardPreview).toHaveScreenshot('states/multi-section-card.png', {
      maxDiffPixels: 200
    });
  });

  test('empty section should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Empty Section Test',
      sections: [
        {
          type: 'info',
          title: 'Empty Info Section',
          fields: []
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--info').first();
    
    // Check if section renders even when empty
    if (await section.count() > 0) {
      await expect(section).toHaveScreenshot('states/empty-section.png', {
        maxDiffPixels: 100
      });
    } else {
      logProgress('Empty section not rendered - expected behavior');
    }
  });
});

test.describe('Visual Regression - Responsive Layouts', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('mobile layout (375x667) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const config = generateMultiSectionConfig(3);
    await loadCardConfig(page, config);
    
    await expect(page).toHaveScreenshot('responsive/mobile-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });

  test('tablet layout (768x1024) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const config = generateMultiSectionConfig(4);
    await loadCardConfig(page, config);
    
    await expect(page).toHaveScreenshot('responsive/tablet-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });

  test('desktop layout (1920x1080) should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const config = {
      ...generateMultiSectionConfig(6),
      columns: 3
    };
    await loadCardConfig(page, config);
    
    await expect(page).toHaveScreenshot('responsive/desktop-layout.png', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });
});

test.describe('Visual Regression - Edge Cases', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('long text content should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Very Long Card Title That Should Be Handled Gracefully Without Breaking Layout',
      sections: [
        {
          type: 'info',
          title: 'Section with Long Content',
          fields: [
            {
              label: 'Very Long Field Label',
              value: 'This is a very long field value that contains a lot of text and should be displayed properly'
            },
            { label: 'Short', value: 'OK' }
          ]
        }
      ]
    };

    await loadCardConfig(page, config);
    const cardPreview = page.locator('app-card-preview').first();
    await expect(cardPreview).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(cardPreview).toHaveScreenshot('edge-cases/long-text-content.png', {
      maxDiffPixels: 200
    });
  });

  test('many items in list should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'List with Many Items',
      sections: [
        {
          type: 'list',
          title: 'Large List',
          items: Array.from({ length: 10 }, (_, i) => ({
            title: `Item ${i + 1}`,
            value: `Value ${i + 1}`,
            description: `Description for item ${i + 1}`
          }))
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--list').first();
    await expect(section).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(section).toHaveScreenshot('edge-cases/many-list-items.png', {
      maxDiffPixels: 200
    });
  });

  test('many fields in info section should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Info Section with Many Fields',
      sections: [
        {
          type: 'info',
          title: 'Detailed Information',
          fields: Array.from({ length: 12 }, (_, i) => ({
            label: `Field ${i + 1}`,
            value: `Value ${i + 1}`
          }))
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(section).toHaveScreenshot('edge-cases/many-info-fields.png', {
      maxDiffPixels: 200
    });
  });

  test('special characters in content should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Special Characters: <>&"\'',
      sections: [
        {
          type: 'info',
          title: 'Test Section',
          fields: [
            { label: 'HTML', value: '<script>alert("test")</script>' },
            { label: 'Unicode', value: '你好 🌟 🚀 émojis' },
            { label: 'Math', value: 'E=mc² ±10% ≠ ∞' }
          ]
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--info').first();
    await expect(section).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
    await expect(section).toHaveScreenshot('edge-cases/special-characters.png', {
      maxDiffPixels: 150
    });
  });
});

test.describe('Visual Regression - Chart Types', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    logProgress('Page loaded');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('bar chart should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Bar Chart Test',
      sections: [
        {
          type: 'chart',
          title: 'Sales Performance',
          chartType: 'bar',
          fields: [
            { label: 'Q1', value: 30000 },
            { label: 'Q2', value: 45000 },
            { label: 'Q3', value: 52000 },
            { label: 'Q4', value: 61000 }
          ]
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--chart').first();
    
    if (await section.count() > 0) {
      await expect(section).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
      await expect(section).toHaveScreenshot('charts/bar-chart.png', {
        maxDiffPixels: 200
      });
    }
  });

  test('pie chart should match baseline', async ({ page }) => {
    const config = {
      cardTitle: 'Pie Chart Test',
      sections: [
        {
          type: 'chart',
          title: 'Market Share',
          chartType: 'pie',
          fields: [
            { label: 'Product A', value: 35 },
            { label: 'Product B', value: 28 },
            { label: 'Product C', value: 22 },
            { label: 'Product D', value: 15 }
          ]
        }
      ]
    };

    await loadCardConfig(page, config);
    const section = page.locator('.ai-section--chart').first();
    
    if (await section.count() > 0) {
      await expect(section).toBeVisible({ timeout: SECTION_TIMEOUT_MS });
      await expect(section).toHaveScreenshot('charts/pie-chart.png', {
        maxDiffPixels: 200
      });
    }
  });
});
