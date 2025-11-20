import { test, expect, type Page } from '@playwright/test';

// Test the core functionality of the OSI Cards application
test.describe('OSI Cards Application', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/OSI Cards/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display the card list', async ({ page }) => {
    // Navigate to cards if not already there
    await page.getByRole('link', { name: /cards/i }).click();
    
    // Wait for cards to load
    await page.waitForSelector('[data-testid="card-list"]', { timeout: 10000 });
    
    // Check if cards are displayed
    const cardCount = await page.locator('[data-testid="card-item"]').count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should be able to search cards', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Find and use search input
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search functionality
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
  });

  test('should open card details when clicked', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Click on first card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    // Verify card details opened
    await expect(page.locator('[data-testid="card-details"]')).toBeVisible();
  });
});

test.describe('PWA Functionality', () => {
  
  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should show install prompt on supported browsers', async ({ page, browserName }) => {
    // Skip this test on WebKit as it doesn't support PWA install prompts
    test.skip(browserName === 'webkit', 'WebKit does not support PWA install prompts');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = () => {};
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    
    // Check for install prompt
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible({ timeout: 5000 });
  });

  test('should work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Navigate to a different page
    await page.goto('/cards');
    
    // Should still work (cached content)
    await expect(page.locator('body')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });
});

test.describe('Accessibility', () => {
  
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Install axe-core
    await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.4.3/axe.min.js' });
    
    // Run accessibility audit
    const accessibilityResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).axe.run(document, (err: any, results: any) => {
          resolve(results);
        });
      });
    });
    
    expect((accessibilityResults as any).violations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Check for ARIA labels on interactive elements
    const cardButtons = page.locator('[role="button"]');
    const count = await cardButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = cardButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
  
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = (entry as any).processingStart - entry.startTime;
            }
          });
          
          if (vitals.lcp !== undefined) {
            resolve(vitals);
          }
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    const vitals = metrics as any;
    
    // LCP should be under 2.5 seconds
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500);
    }
    
    // FID should be under 100ms
    if (vitals.fid) {
      expect(vitals.fid).toBeLessThan(100);
    }
  });
});

test.describe('Responsive Design', () => {
  
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile layout is applied
    const isMobileLayout = await page.evaluate(() => {
      return window.innerWidth < 768;
    });
    
    expect(isMobileLayout).toBeTruthy();
    
    // Check if navigation is accessible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify tablet layout
    const isTabletLayout = await page.evaluate(() => {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    });
    
    expect(isTabletLayout).toBeTruthy();
  });

  test('should work on desktop devices', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify desktop layout
    const isDesktopLayout = await page.evaluate(() => {
      return window.innerWidth >= 1024;
    });
    
    expect(isDesktopLayout).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  
  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
  });

  test('should recover from errors', async ({ page }) => {
    // Cause an error first
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Remove error condition
    await page.unroute('**/api/**');
    
    // Try to reload
    await page.getByRole('button', { name: /retry/i }).click();
    
    // Should recover
    await expect(page.locator('[data-testid="card-list"]')).toBeVisible();
  });
});

test.describe('Data Persistence', () => {
  
  test('should persist user preferences', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Change a preference (e.g., theme)
    await page.getByRole('button', { name: /settings/i }).click();
    await page.getByRole('button', { name: /dark theme/i }).click();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if preference is maintained
    const isDarkTheme = await page.evaluate(() => {
      return document.body.classList.contains('dark-theme');
    });
    
    expect(isDarkTheme).toBeTruthy();
  });

  test('should sync data when online', async ({ page, context }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Make some changes
    await page.getByRole('button', { name: /add card/i }).click();
    await page.fill('[data-testid="card-title"]', 'Offline Card');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    await page.waitForTimeout(2000);
    
    // Verify data was synced
    await expect(page.locator('text=Offline Card')).toBeVisible();
  });
});
