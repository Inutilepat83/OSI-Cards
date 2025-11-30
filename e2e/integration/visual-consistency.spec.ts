/**
 * Visual Consistency Tests
 * 
 * Verifies that OSI Cards render identically across different client environments.
 * Uses the homepage as baseline and compares against /ilibrary with various environments.
 * 
 * Run with: npx playwright test e2e/integration/visual-consistency.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import { extractAllStyles, waitForCardReady, StyleExtractionResult } from '../helpers/style-extractor';
import { compareStyles, StyleComparisonResult, getCriticalFailures } from '../helpers/style-comparator';
import { generateConsoleReport, saveReports, generateMultiEnvSummary } from '../helpers/report-generator';
import { CLIENT_ENVIRONMENTS, ClientEnvironment } from '../fixtures/critical-styles';

// Store baseline styles for comparison across tests
let baselineStyles: StyleExtractionResult | null = null;
const allResults: StyleComparisonResult[] = [];

/**
 * Test configuration
 */
const TEST_CONFIG = {
  // Homepage URL for baseline
  baselineUrl: '/',
  // ILibrary URL for environment tests
  testUrl: '/ilibrary',
  // Time to wait for animations to settle
  animationSettleTime: 1000,
  // Whether to generate reports
  generateReports: true,
  // Maximum acceptable failure count for critical properties
  maxCriticalFailures: 0,
  // Maximum acceptable failure percentage
  maxFailurePercentage: 5,
};

test.describe('Visual Consistency Testing', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  /**
   * Setup: Capture baseline styles from homepage
   */
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    try {
      // Navigate to homepage
      await page.goto(TEST_CONFIG.baselineUrl);
      
      // Wait for card to be fully rendered
      await waitForCardReady(page);
      await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
      
      // Extract baseline styles
      baselineStyles = await extractAllStyles(page);
      
      console.log('\n📊 Baseline captured from homepage');
      console.log(`   URL: ${baselineStyles.url}`);
      console.log(`   Elements found: ${baselineStyles.elements.filter(e => e.found).length}/${baselineStyles.elements.length}`);
      console.log(`   Timestamp: ${baselineStyles.timestamp}\n`);
      
    } finally {
      await page.close();
    }
  });
  
  /**
   * After all tests: Generate summary report
   */
  test.afterAll(async () => {
    if (allResults.length > 0) {
      console.log(generateMultiEnvSummary(allResults));
    }
  });
  
  /**
   * Test each client environment against baseline
   */
  for (const environment of CLIENT_ENVIRONMENTS) {
    test(`should render identically in ${environment.name}`, async ({ page }) => {
      // Skip if baseline not captured
      test.skip(!baselineStyles, 'Baseline not captured');
      
      // Navigate to test page with environment
      await page.goto(`${TEST_CONFIG.testUrl}?env=${environment.id}`);
      
      // Wait for card to render
      await waitForCardReady(page);
      await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
      
      // Apply environment styles (simulated conflicting CSS)
      await applyEnvironmentStyles(page, environment);
      await page.waitForTimeout(500);
      
      // Extract test styles
      const testStyles = await extractAllStyles(page);
      
      // Compare against baseline
      const comparison = compareStyles(baselineStyles!, testStyles, environment.name);
      allResults.push(comparison);
      
      // Generate console report
      console.log(generateConsoleReport(comparison));
      
      // Save detailed reports
      if (TEST_CONFIG.generateReports) {
        await saveReports(comparison, {
          outputDir: 'e2e/reports',
          jsonReport: true,
          consoleOutput: false,
          htmlReport: true
        });
      }
      
      // Assertions
      const criticalFailures = getCriticalFailures(comparison);
      const totalCritical = criticalFailures.elements.reduce(
        (sum, el) => sum + el.properties.length, 0
      ) + criticalFailures.cssVariables.length;
      
      // Assert no critical failures
      expect(
        totalCritical,
        `Critical style failures in ${environment.name}: ${JSON.stringify(criticalFailures, null, 2)}`
      ).toBeLessThanOrEqual(TEST_CONFIG.maxCriticalFailures);
      
      // Assert acceptable failure percentage
      expect(
        100 - comparison.summary.passRate,
        `Too many style failures in ${environment.name}: ${comparison.summary.failedProperties} failures`
      ).toBeLessThanOrEqual(TEST_CONFIG.maxFailurePercentage);
    });
  }
  
  /**
   * Screenshot comparison test
   */
  test('visual regression: homepage vs ilibrary baseline', async ({ page }) => {
    // Capture homepage screenshot
    await page.goto(TEST_CONFIG.baselineUrl);
    await waitForCardReady(page);
    await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
    
    const homepageCard = page.locator('app-ai-card-renderer');
    const homepageScreenshot = await homepageCard.screenshot();
    
    // Navigate to ilibrary (no environment, clean)
    await page.goto(TEST_CONFIG.testUrl);
    await waitForCardReady(page);
    await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
    
    // Compare visually
    await expect(page.locator('app-ai-card-renderer')).toHaveScreenshot(
      'baseline-card.png',
      {
        maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
        threshold: 0.2, // Color threshold
      }
    );
  });
  
  /**
   * Test all environments with screenshot comparison
   */
  for (const environment of CLIENT_ENVIRONMENTS) {
    test(`screenshot comparison: ${environment.name}`, async ({ page }) => {
      await page.goto(`${TEST_CONFIG.testUrl}?env=${environment.id}`);
      await waitForCardReady(page);
      
      // Apply environment styles
      await applyEnvironmentStyles(page, environment);
      await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
      
      // Take screenshot and compare to baseline
      await expect(page.locator('app-ai-card-renderer')).toHaveScreenshot(
        `card-${environment.id}.png`,
        {
          maxDiffPixelRatio: 0.05, // 5% tolerance for minor rendering differences
          threshold: 0.25,
        }
      );
    });
  }
  
  /**
   * Theme consistency test: night vs day
   */
  test('theme consistency: night and day themes should apply correctly', async ({ page }) => {
    // Test night theme
    await page.goto(`${TEST_CONFIG.testUrl}?theme=night`);
    await waitForCardReady(page);
    await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
    
    await expect(page.locator('app-ai-card-renderer')).toHaveScreenshot(
      'theme-night.png',
      { maxDiffPixelRatio: 0.02 }
    );
    
    // Test day theme
    await page.goto(`${TEST_CONFIG.testUrl}?theme=day`);
    await waitForCardReady(page);
    await page.waitForTimeout(TEST_CONFIG.animationSettleTime);
    
    await expect(page.locator('app-ai-card-renderer')).toHaveScreenshot(
      'theme-day.png',
      { maxDiffPixelRatio: 0.02 }
    );
  });
  
});

/**
 * Apply simulated conflicting styles based on environment
 */
async function applyEnvironmentStyles(page: Page, environment: ClientEnvironment): Promise<void> {
  const styles = getEnvironmentCSS(environment.id);
  
  await page.addStyleTag({
    content: styles
  });
}

/**
 * Get CSS that simulates a client environment's conflicting styles
 */
function getEnvironmentCSS(envId: string): string {
  switch (envId) {
    case 'corporate':
      // Bootstrap/Boosted-like resets
      return `
        /* Corporate Portal - Bootstrap-like styles */
        * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        body {
          font-size: 16px;
          line-height: 1.5;
          color: #212529;
          background: #ffffff;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 500;
          line-height: 1.2;
          color: #333333;
        }
        .btn, button {
          font-family: inherit;
          font-size: 1rem;
          border-radius: 0.25rem;
          background-color: #0d6efd;
          color: white;
        }
        a {
          color: #0d6efd;
          text-decoration: underline;
        }
        /* Aggressive box-sizing reset */
        *, *::before, *::after {
          box-sizing: border-box;
        }
      `;
    
    case 'developer':
      // Terminal-like dark theme
      return `
        /* Developer Console - Terminal aesthetic */
        * {
          font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", monospace !important;
        }
        body {
          background: #1a1a1a;
          color: #00ff00;
          font-size: 14px;
        }
        h1, h2, h3 {
          color: #00ff00;
          font-weight: bold;
          text-transform: uppercase;
        }
        a {
          color: #00ffff;
        }
        button, .btn {
          background: #333;
          color: #00ff00;
          border: 1px solid #00ff00;
          font-family: monospace;
        }
        p, span, div {
          color: #cccccc;
        }
      `;
    
    case 'marketing':
      // Light marketing site with purple accents
      return `
        /* Marketing Site - Light with conflicts */
        * {
          font-family: "Poppins", "Open Sans", Arial, sans-serif !important;
        }
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          color: #333;
        }
        h1, h2, h3 {
          color: #7c3aed;
          font-weight: 700;
        }
        button, .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 999px;
          font-weight: 600;
        }
        a {
          color: #7c3aed;
        }
        p {
          color: #666;
          font-size: 18px;
        }
      `;
    
    case 'legacy':
      // Aggressive legacy resets
      return `
        /* Legacy System - Aggressive resets */
        * {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.2 !important;
        }
        html, body {
          background: #f0f0f0;
        }
        div, span, p {
          display: block;
          color: #000000;
        }
        table, tr, td {
          border-collapse: collapse;
        }
        a {
          color: blue;
          text-decoration: underline;
        }
        input, button, select {
          appearance: none;
          background: #ddd;
          color: #000;
        }
        h1 { font-size: 24px !important; }
        h2 { font-size: 20px !important; }
        h3 { font-size: 16px !important; }
      `;
    
    default:
      return '';
  }
}

