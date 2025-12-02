/**
 * Global Setup for Playwright E2E Tests
 * 
 * This file runs once before all tests to set up the test environment.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  // Ensure auth directory exists
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Create empty auth state if it doesn't exist
  const authFile = path.join(authDir, 'user.json');
  if (!fs.existsSync(authFile)) {
    fs.writeFileSync(authFile, JSON.stringify({
      cookies: [],
      origins: []
    }));
  }

  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('Global setup complete');
}

export default globalSetup;









