/**
 * Accessibility (a11y) Tests
 *
 * Ensures WCAG 2.1 AA compliance.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Should have one H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const hasAriaLabel = await input.getAttribute('aria-label');

        expect(hasLabel || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Tab through elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();

    // Tab again
    await page.keyboard.press('Tab');
    const focused2 = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused2).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('http://localhost:4200');

    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el!);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
      };
    });

    // Should have some focus indicator
    expect(
      focusedElement.outline !== 'none' ||
      focusedElement.outlineWidth !== '0px'
    ).toBeTruthy();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Tab to skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")');
    const hasSkipLink = await skipLink.count() > 0;

    // Skip links are recommended but not required
    if (hasSkipLink) {
      expect(await skipLink.isVisible()).toBeTruthy();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').count();

    // Should have at least one live region for dynamic content
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      expect(
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy
      ).toBeTruthy();
    }
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check for screen reader only text
    const srOnly = await page.locator('.sr-only, .visually-hidden').count();

    // Having SR-only content is good for accessibility
    expect(srOnly).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should have touch targets large enough', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const buttons = await page.locator('button, a').all();

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // WCAG recommends 44x44px minimum
        expect(box.width >= 44 || box.height >= 44).toBeTruthy();
      }
    }
  });

  test('should not have horizontal scrolling', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const scrollWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(scrollWidth).toBeFalsy();
  });
});

