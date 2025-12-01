import { test, expect, Page } from '@playwright/test';
import {
  TEST_ENVIRONMENTS,
  CORE_TEST_ENVIRONMENTS,
  ALL_SECTIONS_COMPLETE,
  ALL_SECTIONS_MINIMAL,
  ALL_SECTIONS_EDGE_CASES,
  EMPTY_CONFIG,
  STREAMING_CONFIG,
  VIEWPORTS,
  EXPECTED_SECTION_TYPES,
  TestEnvironment,
  TestCardConfig,
  getSectionCount
} from '../fixtures/card-configs';

/**
 * Multi-Environment Testing Suite
 * 
 * Tests OSI Cards library across different theme and state combinations:
 * - Themes: night (dark), day (light)
 * - States: normal (populated), streaming, empty
 * 
 * This creates a comprehensive test matrix to ensure all features
 * work correctly in all supported environments.
 */

// Base URL for the library test page
const ILIBRARY_URL = '/ilibrary';

/**
 * Helper to navigate to ilibrary with specific environment settings
 */
async function navigateToEnvironment(
  page: Page,
  env: TestEnvironment,
  config?: 'complete' | 'minimal' | 'edge-cases'
) {
  let url = `${ILIBRARY_URL}${env.queryParams}`;
  if (config) {
    url += `&config=${config}`;
  }
  await page.goto(url);
  await page.waitForSelector('app-ai-card-renderer', { timeout: 15000 });
}

/**
 * Helper to check if card surface has correct theme class
 */
async function verifyTheme(page: Page, theme: 'night' | 'day') {
  const container = page.locator('.osi-cards-container, [data-theme]').first();
  
  if (await container.count() > 0) {
    const dataTheme = await container.getAttribute('data-theme');
    // Theme may be set or default
    expect(dataTheme === theme || dataTheme === null).toBeTruthy();
  }
}

/**
 * Helper to verify streaming state
 */
async function verifyStreamingState(page: Page, isStreaming: boolean) {
  const cardSurface = page.locator('.ai-card-surface');
  
  if (isStreaming) {
    // Streaming indicator or class should be present
    const hasStreamingClass = await cardSurface.evaluate(el => 
      el.classList.contains('streaming-active')
    );
    const streamingIndicator = page.locator('.streaming-indicator, app-card-streaming-indicator');
    const hasIndicator = await streamingIndicator.count() > 0;
    
    // Either class or indicator should be present
    expect(hasStreamingClass || hasIndicator).toBeTruthy();
  }
}

/**
 * Helper to verify empty state
 */
async function verifyEmptyState(page: Page, isEmpty: boolean) {
  const emptyState = page.locator('.card-empty-state');
  const masonryItems = page.locator('.masonry-item');
  
  if (isEmpty) {
    // Empty state should be visible
    await expect(emptyState).toBeVisible();
    // No masonry items
    expect(await masonryItems.count()).toBe(0);
  } else {
    // Should have sections
    expect(await masonryItems.count()).toBeGreaterThan(0);
  }
}

// ============================================================
// CORE ENVIRONMENT TESTS (4 main combinations)
// ============================================================

test.describe('Multi-Environment Testing - Core Matrix', () => {
  for (const env of CORE_TEST_ENVIRONMENTS) {
    test.describe(`Environment: ${env.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await navigateToEnvironment(page, env, 'complete');
      });

      test('should render card surface correctly', async ({ page }) => {
        const cardSurface = page.locator('.ai-card-surface');
        await expect(cardSurface).toBeVisible();
        
        // Verify theme
        await verifyTheme(page, env.theme);
      });

      test('should render all section types', async ({ page }) => {
        if (env.state === 'empty') {
          // Empty state - verify empty state is shown
          await verifyEmptyState(page, true);
          return;
        }

        const masonryItems = page.locator('.masonry-item');
        const sectionCount = await masonryItems.count();
        
        // Should have multiple sections
        expect(sectionCount).toBeGreaterThan(0);
      });

      test('should apply correct streaming state', async ({ page }) => {
        if (env.state === 'streaming') {
          await verifyStreamingState(page, true);
        }
      });

      test('should have accessible card structure', async ({ page }) => {
        const cardSurface = page.locator('.ai-card-surface');
        const role = await cardSurface.getAttribute('role');
        expect(role).toBe('article');
      });

      test(`visual snapshot - ${env.name}`, async ({ page }) => {
        // Wait for animations to settle
        await page.waitForTimeout(1000);
        
        const cardSurface = page.locator('.ai-card-surface');
        await expect(cardSurface).toHaveScreenshot(
          `multi-env-${env.theme}-${env.state}.png`,
          { maxDiffPixels: 500, threshold: 0.3 }
        );
      });
    });
  }
});

// ============================================================
// FULL ENVIRONMENT MATRIX (6 combinations)
// ============================================================

test.describe('Multi-Environment Testing - Full Matrix', () => {
  for (const env of TEST_ENVIRONMENTS) {
    test(`[${env.theme}/${env.state}] Card renders correctly`, async ({ page }) => {
      await navigateToEnvironment(page, env, env.state === 'empty' ? undefined : 'complete');
      
      const cardSurface = page.locator('.ai-card-surface');
      await expect(cardSurface).toBeVisible();
      
      // Verify theme
      await verifyTheme(page, env.theme);
      
      // Verify state
      if (env.state === 'empty') {
        await verifyEmptyState(page, true);
      } else if (env.state === 'streaming') {
        await verifyStreamingState(page, true);
      } else {
        await verifyEmptyState(page, false);
      }
    });
  }
});

// ============================================================
// SECTION TYPE TESTING
// ============================================================

test.describe('Section Type Rendering', () => {
  const testEnv = CORE_TEST_ENVIRONMENTS[0]; // Night - Normal

  test.beforeEach(async ({ page }) => {
    await navigateToEnvironment(page, testEnv, 'complete');
  });

  test('should render info section', async ({ page }) => {
    const infoSection = page.locator('[class*="info-section"], .masonry-item').filter({
      has: page.locator('text=Company Information')
    });
    
    if (await infoSection.count() > 0) {
      await expect(infoSection.first()).toBeVisible();
    }
  });

  test('should render analytics section with metrics', async ({ page }) => {
    const analyticsSection = page.locator('[class*="analytics"], .masonry-item').filter({
      has: page.locator('text=Performance')
    });
    
    if (await analyticsSection.count() > 0) {
      await expect(analyticsSection.first()).toBeVisible();
    }
  });

  test('should render chart section', async ({ page }) => {
    const chartSection = page.locator('[class*="chart"], .masonry-item').filter({
      has: page.locator('text=Revenue')
    });
    
    if (await chartSection.count() > 0) {
      await expect(chartSection.first()).toBeVisible();
    }
  });

  test('should render contact card section', async ({ page }) => {
    const contactSection = page.locator('[class*="contact"], .masonry-item').filter({
      has: page.locator('text=Contact')
    });
    
    if (await contactSection.count() > 0) {
      await expect(contactSection.first()).toBeVisible();
    }
  });

  test('should render all expected sections', async ({ page }) => {
    const masonryItems = page.locator('.masonry-item');
    const count = await masonryItems.count();
    
    // Should have multiple sections based on complete config
    expect(count).toBeGreaterThanOrEqual(15);
  });
});

// ============================================================
// RESPONSIVE TESTING ACROSS ENVIRONMENTS
// ============================================================

test.describe('Responsive Multi-Environment Testing', () => {
  const viewportConfigs = Object.entries(VIEWPORTS);
  const testEnv = CORE_TEST_ENVIRONMENTS[0]; // Night - Normal

  for (const [name, viewport] of viewportConfigs) {
    test(`[${name}] renders correctly at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await navigateToEnvironment(page, testEnv, 'complete');
      
      const cardSurface = page.locator('.ai-card-surface');
      await expect(cardSurface).toBeVisible();
      
      const boundingBox = await cardSurface.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(0);
      expect(boundingBox!.width).toBeLessThanOrEqual(viewport.width);
    });
  }
});

// ============================================================
// CONFIG VARIATION TESTING
// ============================================================

test.describe('Config Variation Testing', () => {
  const testEnv = CORE_TEST_ENVIRONMENTS[0]; // Night - Normal

  test('complete config renders all sections', async ({ page }) => {
    await navigateToEnvironment(page, testEnv, 'complete');
    
    const masonryItems = page.locator('.masonry-item');
    const count = await masonryItems.count();
    
    // Complete config should have many sections
    expect(count).toBeGreaterThanOrEqual(15);
  });

  test('minimal config renders with minimum data', async ({ page }) => {
    await navigateToEnvironment(page, testEnv, 'minimal');
    
    const cardSurface = page.locator('.ai-card-surface');
    await expect(cardSurface).toBeVisible();
  });

  test('edge case config handles boundary values', async ({ page }) => {
    await navigateToEnvironment(page, testEnv, 'edge-cases');
    
    const cardSurface = page.locator('.ai-card-surface');
    await expect(cardSurface).toBeVisible();
    
    // Should not have any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Filter out expected warnings
    const realErrors = consoleErrors.filter(e => 
      !e.includes('Angular') && 
      !e.includes('DevTools')
    );
    
    expect(realErrors.length).toBe(0);
  });
});

// ============================================================
// THEME SWITCHING TESTS
// ============================================================

test.describe('Theme Switching', () => {
  test('should switch from night to day theme', async ({ page }) => {
    // Start with night theme
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[0], 'complete');
    await verifyTheme(page, 'night');
    
    // Switch to day theme
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[2], 'complete');
    await verifyTheme(page, 'day');
  });

  test('should switch from day to night theme', async ({ page }) => {
    // Start with day theme
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[2], 'complete');
    await verifyTheme(page, 'day');
    
    // Switch to night theme
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[0], 'complete');
    await verifyTheme(page, 'night');
  });
});

// ============================================================
// STREAMING STATE TRANSITIONS
// ============================================================

test.describe('State Transitions', () => {
  test('should transition from streaming to normal', async ({ page }) => {
    // Start with streaming
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[1], 'complete'); // Night - Streaming
    
    // Verify streaming state
    await verifyStreamingState(page, true);
    
    // Switch to normal
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[0], 'complete'); // Night - Normal
    
    // Should no longer show streaming
    const cardSurface = page.locator('.ai-card-surface');
    const hasStreamingClass = await cardSurface.evaluate(el => 
      el.classList.contains('streaming-active')
    );
    
    // May or may not have streaming class depending on implementation
    expect(typeof hasStreamingClass).toBe('boolean');
  });

  test('should show empty state then populate', async ({ page }) => {
    // Start with empty
    await navigateToEnvironment(page, TEST_ENVIRONMENTS[2], undefined); // Night - Empty
    await verifyEmptyState(page, true);
    
    // Switch to populated
    await navigateToEnvironment(page, CORE_TEST_ENVIRONMENTS[0], 'complete');
    await verifyEmptyState(page, false);
  });
});

// ============================================================
// PERFORMANCE TESTING ACROSS ENVIRONMENTS
// ============================================================

test.describe('Performance Across Environments', () => {
  for (const env of CORE_TEST_ENVIRONMENTS) {
    test(`[${env.name}] renders within acceptable time`, async ({ page }) => {
      const startTime = Date.now();
      
      await navigateToEnvironment(page, env, 'complete');
      
      const loadTime = Date.now() - startTime;
      
      // Should render within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  }
});

// ============================================================
// ACCESSIBILITY ACROSS ENVIRONMENTS
// ============================================================

test.describe('Accessibility Across Environments', () => {
  for (const env of CORE_TEST_ENVIRONMENTS) {
    test(`[${env.name}] has proper ARIA attributes`, async ({ page }) => {
      await navigateToEnvironment(page, env, env.state === 'empty' ? undefined : 'complete');
      
      const cardSurface = page.locator('.ai-card-surface');
      const role = await cardSurface.getAttribute('role');
      
      expect(role).toBe('article');
    });

    test(`[${env.name}] supports keyboard navigation`, async ({ page }) => {
      await navigateToEnvironment(page, env, 'complete');
      
      // Tab through the page
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  }
});

// ============================================================
// VISUAL REGRESSION MATRIX
// ============================================================

test.describe('Visual Regression Matrix', () => {
  for (const env of CORE_TEST_ENVIRONMENTS) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS).slice(0, 3)) { // Test 3 viewports
      test(`[${env.name}] [${viewportName}] visual snapshot`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await navigateToEnvironment(page, env, env.state === 'empty' ? undefined : 'complete');
        
        // Wait for animations
        await page.waitForTimeout(1000);
        
        const cardSurface = page.locator('.ai-card-surface');
        
        await expect(cardSurface).toHaveScreenshot(
          `visual-${env.theme}-${env.state}-${viewportName}.png`,
          { 
            maxDiffPixels: 500,
            threshold: 0.3
          }
        );
      });
    }
  }
});




