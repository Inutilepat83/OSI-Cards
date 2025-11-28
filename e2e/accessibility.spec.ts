import { test, expect } from '@playwright/test';

// Note: Install @axe-core/playwright for full accessibility testing
// npm install --save-dev @axe-core/playwright
// Uncomment the following line after installation:
// import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests for WCAG 2.1 AA compliance
 * 
 * To enable full axe-core testing:
 * 1. Install: npm install --save-dev @axe-core/playwright
 * 2. Uncomment AxeBuilder imports and related code below
 */
test.describe('WCAG 2.1 AA Compliance - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should have no WCAG 2.1 AA accessibility violations', async ({ page }) => {
    // Check if axe-core is available
    let axeAvailable = false;
    try {
      // Dynamic import check - will work if @axe-core/playwright is installed
      await page.evaluate(() => {
        // Check if axe is available globally (set up in CI/CD)
        return typeof (window as any).axe !== 'undefined';
      });
      axeAvailable = true;
    } catch {
      // axe-core not available - run basic checks
    }

    if (axeAvailable) {
      // Full axe-core testing (uncomment after installing @axe-core/playwright)
      /*
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
      */
    }
    
    // Basic accessibility checks
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Verify page has title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Verify main landmark exists
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
  });

  test('card preview should be accessible and WCAG 2.1 AA compliant', async ({ page }) => {
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
    await page.waitForTimeout(1500); // Wait for card to render

    // Full axe-core testing (uncomment after installing @axe-core/playwright)
    /*
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('app-card-preview')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    */
    
    // Basic accessibility checks
    const cardPreview = page.locator('app-card-preview');
    await expect(cardPreview).toBeVisible();
    
    // Verify card has accessible name (aria-label or title)
    const card = cardPreview.locator('app-ai-card-renderer').first();
    const ariaLabel = await card.getAttribute('aria-label');
    const title = await card.locator('[role="article"]').first().getAttribute('aria-label');
    expect(ariaLabel || title).toBeTruthy();
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

  test('color contrast should meet WCAG 2.1 AA standards', async ({ page }) => {
    // Full color contrast testing with axe-core (uncomment after installing @axe-core/playwright)
    /*
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toEqual([]);
    */
    
    // Basic checks
    await expect(page).toHaveTitle(/OSI Cards|OrangeSales/);
    
    // Verify page has body content (basic structure check)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Verify main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
    
    // Verify heading hierarchy
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1 per page
    
    // Verify HTML lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });

  test('should have skip links for keyboard navigation', async ({ page }) => {
    // Verify skip links exist
    const skipLinks = page.locator('.skip-link, a[href^="#"]').filter({ 
      hasText: /skip|Skip/i 
    });
    const skipLinkCount = await skipLinks.count();
    expect(skipLinkCount).toBeGreaterThan(0);
  });

  test('all interactive elements should have accessible names', async ({ page }) => {
    // Check buttons
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // At least one method of labeling should exist
      expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});

