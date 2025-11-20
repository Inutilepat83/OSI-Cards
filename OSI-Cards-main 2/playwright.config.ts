import { defineConfig, devices } from '@playwright/test';

/**
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
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['junit', { outputFile: 'e2e-results/results.xml' }],
    ['github'],
    ['dot']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot settings */
    screenshot: 'only-on-failure',
    
    /* Video settings */
    video: 'retain-on-failure',
    
    /* Context options */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state.
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Test against branded browsers. */
    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'chrome-beta',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome-beta',
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test'
    }
  },

  /* Test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Timeout for expect() assertions */
    timeout: 5 * 1000,
  },

  /* Output directory */
  outputDir: 'e2e-results/',
  
  /* Metadata */
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'app-version': process.env.npm_package_version || '1.0.0',
  },
});
