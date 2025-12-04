/**
 * Visual Regression Tests
 *
 * Detects unintended visual changes in the UI.
 * Uses Playwright's screenshot comparison.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
    });
  });

  test('card grid should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.masonry-grid-container');

    const grid = page.locator('.masonry-grid-container');
    await expect(grid).toHaveScreenshot('card-grid.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('dark theme should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Toggle to dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await expect(page).toHaveScreenshot('dark-theme.png');
  });

  test('mobile view should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-view.png');
  });

  test('tablet view should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tablet-view.png');
  });

  test('card section should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.masonry-grid-item');

    const section = page.locator('.masonry-grid-item').first();
    await expect(section).toHaveScreenshot('card-section.png');
  });

  test('navigation should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const nav = page.locator('nav');
    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('navigation.png');
    }
  });

  test('loading state should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Try to capture loading state
    const loading = page.locator('.loading-spinner, .skeleton');
    if (await loading.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loading.first()).toHaveScreenshot('loading-state.png');
    }
  });

  test('error state should match screenshot', async ({ page }) => {
    // Navigate to trigger error (if error page exists)
    await page.goto('http://localhost:4200/non-existent-page');

    // Wait a bit for error page
    await page.waitForTimeout(1000);

    // If error page shown, capture it
    const body = page.locator('body');
    await expect(body).toHaveScreenshot('error-state.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe('Component Visual Regression', () => {
  test('button states should match screenshots', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const button = page.locator('button').first();
    if (await button.isVisible()) {
      // Normal state
      await expect(button).toHaveScreenshot('button-normal.png');

      // Hover state
      await button.hover();
      await expect(button).toHaveScreenshot('button-hover.png');

      // Focus state
      await button.focus();
      await expect(button).toHaveScreenshot('button-focus.png');
    }
  });

  test('card interactions should match screenshots', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.masonry-grid-item');

    const card = page.locator('.masonry-grid-item').first();

    // Initial state
    await expect(card).toHaveScreenshot('card-initial.png');

    // Hover state
    await card.hover();
    await page.waitForTimeout(300); // Wait for animations
    await expect(card).toHaveScreenshot('card-hover.png');
  });
});

// Visual Regression Testing Best Practices:
// 1. Use stable test data
// 2. Wait for animations to complete
// 3. Hide dynamic content (dates, times)
// 4. Set viewport size explicitly
// 5. Allow small pixel differences (maxDiffPixels)
// 6. Update baselines when intentional changes made
// 7. Run in CI for every PR

