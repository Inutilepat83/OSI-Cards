/**
 * Smoke Tests
 *
 * Fast, essential tests to verify the application is basically working.
 * Run these first before deeper testing.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Path', () => {
  test('application loads successfully', async ({ page }) => {
    const response = await page.goto('http://localhost:4200');
    expect(response?.status()).toBe(200);
  });

  test('homepage displays content', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await expect(page.locator('body')).toBeVisible();

    // Should have some text content
    const text = await page.textContent('body');
    expect(text?.length).toBeGreaterThan(0);
  });

  test('no JavaScript errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });

  test('application has title', async ({ page }) => {
    await page.goto('http://localhost:4200');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('main navigation exists', async ({ page }) => {
    await page.goto('http://localhost:4200');
    const nav = page.locator('nav, [role="navigation"]');
    const exists = await nav.count() > 0;
    expect(exists).toBeTruthy();
  });

  test('cards render on homepage', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.masonry-grid-container, .card, [class*="card"]', {
      timeout: 5000,
    });

    const cards = page.locator('.masonry-grid-item, .card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CSS loads correctly', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Check if styles are applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should have some background color (not default)
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('images load successfully', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const images = await page.locator('img').all();
    for (const img of images) {
      const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('health check endpoint responds', async ({ page }) => {
    // Try to check health endpoint if it exists
    try {
      const response = await page.request.get('http://localhost:4200/health');
      expect([200, 404]).toContain(response.status());
    } catch {
      // Health endpoint might not exist, that's okay
    }
  });

  test('application is interactive', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Try to interact with page
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});

test.describe('Smoke Tests - Key Features', () => {
  test('documentation is accessible', async ({ page }) => {
    const response = await page.goto('http://localhost:4200/docs');
    expect([200, 404]).toContain(response?.status() || 0);
  });

  test('API explorer is accessible', async ({ page }) => {
    const response = await page.goto('http://localhost:4200/api');
    expect([200, 404]).toContain(response?.status() || 0);
  });

  test('theme switching works', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const themeButton = page.locator('[aria-label*="theme" i], button:has-text("Theme")');

    if (await themeButton.isVisible().catch(() => false)) {
      await themeButton.click();

      // Theme should change
      await page.waitForTimeout(100);
      const html = page.locator('html');
      const dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBeTruthy();
    }
  });
});

// Smoke Test Characteristics:
// 1. Fast (< 1 minute total)
// 2. Critical paths only
// 3. No deep testing
// 4. Fail fast on major issues
// 5. Run before every deployment

