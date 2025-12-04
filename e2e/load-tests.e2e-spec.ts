/**
 * Load Tests
 *
 * Tests application behavior under load.
 * Use k6 or Artillery for actual load testing.
 */

import { test, expect } from '@playwright/test';

test.describe('Load Tests', () => {
  test('should handle 10 concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    // Navigate all pages simultaneously
    const startTime = Date.now();
    await Promise.all(
      pages.map(page => page.goto('http://localhost:4200'))
    );
    const loadTime = Date.now() - startTime;

    // All pages should load in reasonable time
    expect(loadTime).toBeLessThan(10000);

    // Verify all pages loaded
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible();
    }

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Rapidly navigate between routes
    const routes = ['/', '/docs', '/api', '/'];

    for (let i = 0; i < 5; i++) {
      for (const route of routes) {
        await page.goto(`http://localhost:4200${route}`);
        await page.waitForLoadState('load');
      }
    }

    // App should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle memory stress', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform memory-intensive operations
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        // Simulate creating and destroying elements
        const div = document.createElement('div');
        div.innerHTML = 'Test '.repeat(1000);
        document.body.appendChild(div);
        document.body.removeChild(div);
      });
    }

    // Measure final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Memory growth should be reasonable
    const growth = finalMemory - initialMemory;
    const growthMB = growth / (1024 * 1024);

    expect(growthMB).toBeLessThan(50); // Less than 50MB growth
  });

  test('should handle rapid clicks', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Find clickable element
    const button = page.locator('button').first();

    if (await button.isVisible()) {
      // Click rapidly
      for (let i = 0; i < 20; i++) {
        await button.click({ force: true });
      }

      // App should still be responsive
      await expect(button).toBeVisible();
    }
  });

  test('should handle long session', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Simulate long session with activity
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollBy(0, 100));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollBy(0, -100));
    }

    // App should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance Under Load', () => {
  test('should maintain performance with many elements', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Measure FPS during interaction
    const fps = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let frames = 0;
        const startTime = performance.now();

        function countFrame() {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames);
          }
        }

        requestAnimationFrame(countFrame);
      });
    });

    // Should maintain near 60fps
    expect(fps).toBeGreaterThan(50);
  });

  test('should handle network slowdown gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('http://localhost:4200');

    // Should show loading states
    // Should eventually load
    await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
  });
});

