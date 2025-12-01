import { test, expect } from '@playwright/test';

/**
 * Performance tests
 * Measures Web Vitals and performance metrics
 */
test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load within performance budget', async ({ page }) => {
    const navigationTiming = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart
      };
    });

    // Performance budgets
    expect(navigationTiming.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(navigationTiming.totalTime).toBeLessThan(5000); // 5 seconds
  });

  test('should have acceptable Largest Contentful Paint (LCP)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(5000), 5000);
      });
    });

    // LCP should be under 2.5 seconds for good performance
    expect(lcp).toBeLessThan(2500);
  });

  test('should have acceptable First Input Delay (FID)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Simulate user interaction
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      const startTime = Date.now();
      await button.click();
      const endTime = Date.now();
      const fid = endTime - startTime;
      
      // FID should be under 100ms for good performance
      expect(fid).toBeLessThan(100);
    }
  });

  test('should have acceptable Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait 2 seconds then resolve
        setTimeout(() => resolve(clsValue), 2000);
      });
    });

    // CLS should be under 0.1 for good performance
    expect(cls).toBeLessThan(0.1);
  });

  test('bundle size should be within limits', async ({ page }) => {
    const response = await page.goto('/');
    const contentLength = response?.headers()['content-length'];
    
    if (contentLength) {
      const sizeInKB = parseInt(contentLength) / 1024;
      // Initial bundle should be under 650KB
      expect(sizeInKB).toBeLessThan(650);
    }
  });

  test('should not have memory leaks', async ({ page }) => {
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform multiple navigations
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory should not increase significantly (allow 20% increase)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
      expect(memoryIncrease).toBeLessThan(0.2);
    }
  });
});










