import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical functionality checks
 * These tests verify that the application loads and basic features work
 */
test.describe('Smoke Tests - Critical Functionality', () => {
  
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    await expect(page).toHaveTitle(/OSI Cards/i);
    
    // Verify page loaded (check for main content)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should render basic page structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main navigation or header
    const header = page.locator('header, nav, [role="banner"]').first();
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
    }
    
    // Check for main content area
    const main = page.locator('main, [role="main"], app-root').first();
    await expect(main).toBeVisible();
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any async errors
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => {
      const lowerError = error.toLowerCase();
      return !lowerError.includes('favicon') && 
             !lowerError.includes('sourcemap') &&
             !lowerError.includes('extension');
    });
    
    if (criticalErrors.length > 0) {
      console.warn('Console errors detected:', criticalErrors);
      // Don't fail on warnings, only on critical errors
      const fatalErrors = criticalErrors.filter(e => 
        e.toLowerCase().includes('error') || 
        e.toLowerCase().includes('failed')
      );
      expect(fatalErrors.length).toBe(0);
    }
  });

  test('should be accessible (basic checks)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for at least one heading
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
  });
});
