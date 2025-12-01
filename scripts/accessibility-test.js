#!/usr/bin/env node

/**
 * Accessibility Testing Script
 * 
 * Runs axe-core accessibility tests using Playwright.
 * Integrates with CI/CD pipeline to ensure accessibility standards.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'accessibility-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'accessibility-report.json');

/**
 * Run accessibility tests using Playwright
 */
function runAccessibilityTests() {
  console.log('🔍 Running accessibility tests with axe-core...\n');

  // Create reports directory
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  try {
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'ignore' });
    } catch {
      console.error('❌ Playwright is not installed. Install with: npm install -D @playwright/test');
      process.exit(1);
    }

    // Run Playwright accessibility tests
    // This assumes a Playwright test file exists for accessibility
    const testFile = path.join(__dirname, '..', 'e2e', 'accessibility.spec.ts');
    
    if (!fs.existsSync(testFile)) {
      console.warn('⚠️  Accessibility test file not found. Creating basic test file...');
      createAccessibilityTestFile(testFile);
    }

    console.log('Running Playwright accessibility tests...');
    execSync(`npx playwright test e2e/accessibility.spec.ts --reporter=json`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log('\n✅ Accessibility tests completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Accessibility tests failed:', error.message);
    return false;
  }
}

/**
 * Create basic accessibility test file if it doesn't exist
 */
function createAccessibilityTestFile(testFile) {
  const testDir = path.dirname(testFile);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testContent = `import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should have no accessibility violations on home page', async ({ page }) => {
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });

  test('should have no accessibility violations in card preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-card-preview', { timeout: 10000 });
    await checkA11y(page, 'app-card-preview', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
});
`;

  fs.writeFileSync(testFile, testContent);
  console.log(`✅ Created accessibility test file: ${testFile}`);
}

/**
 * Main function
 */
function main() {
  const success = runAccessibilityTests();
  process.exit(success ? 0 : 1);
}

main();













