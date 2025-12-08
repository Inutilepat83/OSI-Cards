/**
 * Global Teardown for Playwright E2E Tests
 * 
 * This file runs once after all tests to clean up the test environment.
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Global teardown complete');
}

export default globalTeardown;
















