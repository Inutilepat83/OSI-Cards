import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Visual Regression Testing Configuration
 * 
 * Features:
 * - No video recording (faster execution)
 * - List reporter for clear console output
 * - HTML reporter with detailed visual diffs
 * - Cross-browser testing (Chrome, Firefox, WebKit, Mobile)
 * - Fast timeouts with clear failure messages
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Parallel workers */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration - clear output with detailed reports */
  reporter: [
    // List reporter for clear console output with pass/fail status
    ['list', { printSteps: true }],
    // HTML reporter with visual diffs for screenshot comparisons
    ['html', { 
      open: 'never',
      outputFolder: 'playwright-report'
    }],
    // JSON output for programmatic analysis
    ['json', { outputFile: 'e2e-results/results.json' }],
    // JUnit for CI integration
    ['junit', { outputFile: 'e2e-results/results.xml' }],
    // GitHub Actions annotations
    ...(process.env.CI ? [['github' as const]] : [])
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:4200',

    /* Trace on first retry for debugging */
    trace: 'on-first-retry',
    
    /* Screenshot on failure for debugging */
    screenshot: 'only-on-failure',
    
    /* NO video recording - faster execution */
    video: 'off',
    
    /* Default viewport */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* Reduced timeouts for faster feedback */
    actionTimeout: 5000,
    navigationTimeout: 15000,
  },

  /* Browser projects for cross-browser testing */
  projects: [
    // Desktop browsers
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    // Edge browser
    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  /* Web server configuration */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test'
    }
  },

  /* Test timeout - fail fast */
  timeout: 20 * 1000,
  
  /* Expect configuration */
  expect: {
    /* Assertion timeout */
    timeout: 5 * 1000,
    
    /* Screenshot comparison settings */
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.2
    }
  },

  /* Output directory for test artifacts */
  outputDir: 'e2e-results/',
  
  /* Metadata for reports */
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'app-version': process.env.npm_package_version || '1.0.0',
  },
});
