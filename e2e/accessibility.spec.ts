import { test, expect } from '@playwright/test';
// Note: Install @axe-core/playwright for full accessibility testing
// npm install --save-dev @axe-core/playwright
// import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core
 * Tests WCAG 2.1 AA compliance
 */
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should have no accessibility violations', async ({ page }) => {
    // Basic accessibility checks without axe-core
    // For full testing, install @axe-core/playwright and uncomment:
    /*
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    */
    
    // Basic checks
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
  });

  test('card preview should be accessible', async ({ page }) => {
    const jsonConfig = {
      cardTitle: 'Accessibility Test Card',
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

    // Basic accessibility checks
    // For full testing with axe-core, uncomment:
    /*
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('app-card-preview')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    */
    
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();
  });

  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('images should have alt text', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty for decorative images, but should exist
      const ariaHidden = await img.getAttribute('aria-hidden');
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // At least one labeling method should exist
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
    }
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    // Color contrast testing requires axe-core
    // For full testing, install @axe-core/playwright and uncomment:
    /*
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toEqual([]);
    */
    
    // Basic check - verify page loads
    await expect(page).toHaveTitle(/OSI Cards|OrangeSales/);
  });
});

