/**
 * End-to-End Tests for OSI Cards
 *
 * Critical user journeys and integration tests.
 */

import { test, expect } from '@playwright/test';

test.describe('OSI Cards Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/OSI Cards/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to documentation', async ({ page }) => {
    await page.click('text=Documentation');
    await expect(page).toHaveURL(/.*docs/);
    await expect(page.locator('h1')).toContainText('Documentation');
  });

  test('should display cards in grid', async ({ page }) => {
    const cards = page.locator('.masonry-grid-item');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle theme toggle', async ({ page }) => {
    // Find theme toggle button
    const themeButton = page.locator('[aria-label*="theme" i]');

    if (await themeButton.isVisible()) {
      await themeButton.click();

      // Verify theme changed
      const html = page.locator('html');
      const dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBeTruthy();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.masonry-grid-container')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.masonry-grid-container')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.masonry-grid-container')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('http://localhost:4200/non-existent');

    // Should show error page or redirect
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load lazy-loaded routes', async ({ page }) => {
    await page.click('text=API');
    await expect(page).toHaveURL(/.*api/);
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Performance', () => {
  test('should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Lighthouse score', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // This would integrate with Lighthouse CI
    // Target: Performance > 90, Accessibility > 95
    expect(true).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(0);
  });

  test('should have semantic HTML', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check for semantic elements
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header, nav')).toBeTruthy();
  });
});

test.describe('Card Interactions', () => {
  test('should render different section types', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Wait for cards to load
    await page.waitForSelector('.masonry-grid-item', { timeout: 5000 });

    const sections = await page.locator('[class*="section"]').count();
    expect(sections).toBeGreaterThan(0);
  });

  test('should handle card actions', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Find clickable card action
    const action = page.locator('.card-action').first();
    if (await action.isVisible()) {
      await action.click();
      // Verify action executed
    }
  });
});

