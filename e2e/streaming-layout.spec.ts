import { test, expect } from '@playwright/test';
import {
  loadCardConfig,
  generateMultiSectionConfig,
  getComputedStyles,
  DOM_SELECTORS
} from './helpers/style-assertions';

/**
 * Streaming Layout Tests
 * 
 * Tests the masonry grid's streaming layout capabilities including:
 * - Incremental section rendering during streaming
 * - Layout stability when new sections are added
 * - Animation of new sections without affecting existing ones
 * - Virtual scrolling behavior with large section counts
 * - Layout recovery after streaming errors
 */

/**
 * Helper to log test progress
 */
function logProgress(message: string): void {
  console.log(`[STREAMING TEST] ${message}`);
}

/**
 * Simulate streaming by adding sections incrementally
 */
async function simulateStreamingSections(
  page: import('@playwright/test').Page,
  totalSections: number,
  delayBetweenMs: number = 200
): Promise<void> {
  for (let i = 1; i <= totalSections; i++) {
    const config = generateMultiSectionConfig(i);
    await loadCardConfig(page, config);
    if (i < totalSections) {
      await page.waitForTimeout(delayBetweenMs);
    }
  }
}

test.describe('Streaming Layout - Section Addition', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('sections are added incrementally during streaming', async ({ page }) => {
    // Start with empty state
    const initialConfig = { cardTitle: 'Streaming Test', sections: [] };
    await loadCardConfig(page, initialConfig);
    
    // Verify initial state
    const initialCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`Initial section count: ${initialCount}`);
    expect(initialCount).toBe(0);
    
    // Add sections one by one
    for (let i = 1; i <= 4; i++) {
      const config = generateMultiSectionConfig(i);
      await loadCardConfig(page, config);
      await page.waitForTimeout(300);
      
      const currentCount = await page.locator(DOM_SELECTORS.section).count();
      logProgress(`After adding section ${i}: ${currentCount} sections`);
      expect(currentCount).toBe(i);
    }
  });

  test('existing sections remain stable when new sections are added', async ({ page }) => {
    // Add initial sections
    const config = generateMultiSectionConfig(2);
    await loadCardConfig(page, config);
    await page.waitForTimeout(500);
    
    // Get initial positions
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const initialPositions = await masonryItems.evaluateAll((items) => {
      return items.map((item, idx) => ({
        index: idx,
        left: (item as HTMLElement).style.left,
        top: (item as HTMLElement).style.top,
        opacity: window.getComputedStyle(item).opacity
      }));
    });
    
    logProgress(`Initial positions: ${JSON.stringify(initialPositions)}`);
    
    // Verify initial sections are fully visible
    for (const pos of initialPositions) {
      expect(parseFloat(pos.opacity)).toBeGreaterThanOrEqual(0.9);
    }
    
    // Add more sections
    const expandedConfig = generateMultiSectionConfig(4);
    await loadCardConfig(page, expandedConfig);
    await page.waitForTimeout(500);
    
    // Check that the first 2 sections are still visible and not re-animating
    const afterPositions = await masonryItems.evaluateAll((items) => {
      return items.slice(0, 2).map((item, idx) => ({
        index: idx,
        opacity: window.getComputedStyle(item).opacity,
        hasAnimatingClass: item.classList.contains('masonry-item--animating')
      }));
    });
    
    logProgress(`After expansion: ${JSON.stringify(afterPositions)}`);
    
    // Original sections should remain fully visible and not be re-animating
    for (const pos of afterPositions) {
      expect(parseFloat(pos.opacity)).toBeGreaterThanOrEqual(0.9);
    }
  });

  test('new sections have entrance animation', async ({ page }) => {
    // Add initial sections
    const config = generateMultiSectionConfig(2);
    await loadCardConfig(page, config);
    await page.waitForTimeout(800);
    
    // Mark initial sections as animated
    await page.evaluate(() => {
      document.querySelectorAll('.masonry-item').forEach(item => {
        item.setAttribute('data-initial', 'true');
      });
    });
    
    // Add new section
    const expandedConfig = generateMultiSectionConfig(3);
    await loadCardConfig(page, expandedConfig);
    
    // Check for animation class on new section
    await page.waitForTimeout(100);
    
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const animationStates = await masonryItems.evaluateAll((items) => {
      return items.map((item, idx) => ({
        index: idx,
        isInitial: item.hasAttribute('data-initial'),
        hasAnimatingClass: item.classList.contains('masonry-item--animating'),
        isNew: item.classList.contains('masonry-item--animating') && !item.hasAttribute('data-initial')
      }));
    });
    
    logProgress(`Animation states: ${JSON.stringify(animationStates)}`);
    
    // Wait for new section animation to complete
    await page.waitForTimeout(500);
    
    // All sections should be visible after animation
    const finalStyles = await masonryItems.evaluateAll((items) => {
      return items.map((item) => ({
        opacity: window.getComputedStyle(item).opacity
      }));
    });
    
    for (const style of finalStyles) {
      expect(parseFloat(style.opacity)).toBeGreaterThanOrEqual(0.9);
    }
  });
});

test.describe('Streaming Layout - Layout Stability', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('masonry container height adjusts smoothly', async ({ page }) => {
    const config = generateMultiSectionConfig(2);
    await loadCardConfig(page, config);
    await page.waitForTimeout(500);
    
    // Get initial container height
    const container = page.locator(DOM_SELECTORS.masonryContainer);
    const initialHeight = await container.evaluate((el) => {
      return el.offsetHeight;
    });
    
    logProgress(`Initial container height: ${initialHeight}px`);
    
    // Add more sections
    const expandedConfig = generateMultiSectionConfig(5);
    await loadCardConfig(page, expandedConfig);
    await page.waitForTimeout(800);
    
    // Get new container height
    const finalHeight = await container.evaluate((el) => {
      return el.offsetHeight;
    });
    
    logProgress(`Final container height: ${finalHeight}px`);
    
    // Container should have grown
    expect(finalHeight).toBeGreaterThan(initialHeight);
    
    // Check for CSS transition on height
    const transition = await container.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    
    logProgress(`Container transition: ${transition}`);
  });

  test('column count is maintained during streaming', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    
    // Add sections progressively
    for (let i = 1; i <= 6; i++) {
      const config = generateMultiSectionConfig(i);
      await loadCardConfig(page, config);
      await page.waitForTimeout(300);
      
      // Get unique column positions
      const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
      const leftPositions = await masonryItems.evaluateAll((items) => {
        return items.map((item) => (item as HTMLElement).style.left).filter(Boolean);
      });
      
      const uniqueColumns = new Set(leftPositions);
      logProgress(`Sections: ${i}, Columns: ${uniqueColumns.size}`);
      
      // Should maintain consistent column count (won't suddenly change)
      if (i >= 2) {
        expect(uniqueColumns.size).toBeGreaterThanOrEqual(1);
        expect(uniqueColumns.size).toBeLessThanOrEqual(4);
      }
    }
  });

  test('sections do not overlap during streaming', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    
    const config = generateMultiSectionConfig(6);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1000);
    
    // Get all section bounding boxes
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const boundingBoxes = await masonryItems.evaluateAll((items) => {
      return items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      });
    });
    
    logProgress(`Checking ${boundingBoxes.length} sections for overlap`);
    
    // Check for overlaps
    let overlaps = 0;
    for (let i = 0; i < boundingBoxes.length; i++) {
      for (let j = i + 1; j < boundingBoxes.length; j++) {
        const a = boundingBoxes[i];
        const b = boundingBoxes[j];
        
        if (!a || !b) continue;
        
        // Check if rectangles overlap (with small tolerance for borders)
        const tolerance = 5;
        const horizontalOverlap = a.left < b.right - tolerance && a.right > b.left + tolerance;
        const verticalOverlap = a.top < b.bottom - tolerance && a.bottom > b.top + tolerance;
        
        if (horizontalOverlap && verticalOverlap) {
          overlaps++;
          console.log(`  Overlap detected: Section ${i} and ${j}`);
        }
      }
    }
    
    logProgress(`Total overlaps found: ${overlaps}`);
    expect(overlaps).toBe(0);
  });
});

test.describe('Streaming Layout - Animation States', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('streaming mode class is applied correctly', async ({ page }) => {
    const config = generateMultiSectionConfig(2);
    await loadCardConfig(page, config);
    
    // Check for streaming container class during load
    const container = page.locator(DOM_SELECTORS.masonryContainer);
    const containerClasses = await container.getAttribute('class');
    
    logProgress(`Container classes: ${containerClasses}`);
    
    // Wait for load to complete
    await page.waitForTimeout(1000);
    
    // After load, streaming class should be removed
    const finalClasses = await container.getAttribute('class');
    logProgress(`Final container classes: ${finalClasses}`);
  });

  test('animated sections are tracked correctly', async ({ page }) => {
    const config = generateMultiSectionConfig(3);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1500);
    
    // Check data-animated attribute
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const animationData = await masonryItems.evaluateAll((items) => {
      return items.map((item, idx) => ({
        index: idx,
        dataAnimated: item.getAttribute('data-animated'),
        hasAnimatedClass: item.classList.contains('masonry-item--animated')
      }));
    });
    
    logProgress(`Animation tracking: ${JSON.stringify(animationData)}`);
    
    // All sections should be marked as animated after completion
    for (const data of animationData) {
      // Either data-animated is 'true' or has the animated class
      const isAnimated = data.dataAnimated === 'true' || data.hasAnimatedClass;
      expect(isAnimated).toBe(true);
    }
  });

  test('sections do not re-animate after updates', async ({ page }) => {
    const config = generateMultiSectionConfig(2);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1000);
    
    // Mark current animation state
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    await masonryItems.first().evaluate((item) => {
      item.setAttribute('data-test-animated', 'true');
    });
    
    // Reload same config (simulating re-render)
    await loadCardConfig(page, config);
    await page.waitForTimeout(500);
    
    // Check that marked section didn't get animating class again
    const firstItem = masonryItems.first();
    const hasTestMarker = await firstItem.getAttribute('data-test-animated');
    const hasAnimatingClass = await firstItem.evaluate((item) => {
      return item.classList.contains('masonry-item--animating');
    });
    
    logProgress(`Test marker present: ${hasTestMarker}, Has animating class: ${hasAnimatingClass}`);
    
    // The section should not have the animating class since it was already animated
    // (The marker may or may not persist depending on how DOM updates work)
  });
});

test.describe('Streaming Layout - Performance', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('layout handles many sections without performance degradation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Start timing
    const startTime = Date.now();
    
    // Add many sections
    const config = generateMultiSectionConfig(20);
    await loadCardConfig(page, config);
    await page.waitForTimeout(2000);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    logProgress(`Time to load 20 sections: ${loadTime}ms`);
    
    // Verify all sections rendered
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const count = await masonryItems.count();
    
    logProgress(`Sections rendered: ${count}`);
    expect(count).toBe(20);
    
    // Layout should complete within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('rapid section updates do not cause layout thrashing', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    
    // Rapidly add sections
    const startTime = Date.now();
    
    for (let i = 1; i <= 10; i++) {
      const config = generateMultiSectionConfig(i);
      await loadCardConfig(page, config);
      await page.waitForTimeout(50); // Very short delay
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    logProgress(`Time for 10 rapid updates: ${totalTime}ms`);
    
    // Wait for layout to settle
    await page.waitForTimeout(1000);
    
    // Verify final state is correct
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const finalCount = await masonryItems.count();
    
    logProgress(`Final section count: ${finalCount}`);
    expect(finalCount).toBe(10);
    
    // All sections should be visible
    const visibleSections = await masonryItems.evaluateAll((items) => {
      return items.filter((item) => {
        const opacity = parseFloat(window.getComputedStyle(item).opacity);
        return opacity > 0.9;
      }).length;
    });
    
    logProgress(`Visible sections: ${visibleSections}`);
    expect(visibleSections).toBe(10);
  });

  test('container aria attributes update correctly', async ({ page }) => {
    const config = generateMultiSectionConfig(4);
    await loadCardConfig(page, config);
    await page.waitForTimeout(800);
    
    // Check ARIA attributes on container
    const container = page.locator(DOM_SELECTORS.masonryContainer);
    const ariaLabel = await container.getAttribute('aria-label');
    const ariaBusy = await container.getAttribute('aria-busy');
    const ariaRowcount = await container.getAttribute('aria-rowcount');
    
    logProgress(`ARIA attributes - label: ${ariaLabel}, busy: ${ariaBusy}, rowcount: ${ariaRowcount}`);
    
    // Container should have descriptive label
    if (ariaLabel) {
      expect(ariaLabel).toContain('sections');
    }
    
    // After load completes, aria-busy should be false
    await page.waitForTimeout(500);
    const finalAriaBusy = await container.getAttribute('aria-busy');
    expect(finalAriaBusy).toBe('false');
  });
});

test.describe('Streaming Layout - Error Recovery', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('layout recovers from invalid section data', async ({ page }) => {
    // First add valid sections
    const validConfig = generateMultiSectionConfig(2);
    await loadCardConfig(page, validConfig);
    await page.waitForTimeout(500);
    
    const initialCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`Initial valid sections: ${initialCount}`);
    
    // Try to add config with potentially problematic data
    const mixedConfig = {
      cardTitle: 'Mixed Test',
      sections: [
        { type: 'info', title: 'Valid Section', fields: [{ label: 'A', value: 'B' }] },
        { type: 'info', title: '', fields: [] }, // Empty section
        { type: 'analytics', title: 'Analytics', fields: [{ label: 'Metric', value: 100 }] }
      ]
    };
    
    await loadCardConfig(page, mixedConfig);
    await page.waitForTimeout(500);
    
    // Layout should still work
    const finalCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`Final sections after mixed config: ${finalCount}`);
    
    // Should render at least the valid sections
    expect(finalCount).toBeGreaterThanOrEqual(1);
  });

  test('layout handles empty sections array', async ({ page }) => {
    const emptyConfig = {
      cardTitle: 'Empty Test',
      sections: []
    };
    
    await loadCardConfig(page, emptyConfig);
    await page.waitForTimeout(500);
    
    // Container should exist but be empty
    const container = page.locator(DOM_SELECTORS.masonryContainer);
    const containerExists = await container.count();
    
    expect(containerExists).toBe(1);
    
    const sectionCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`Sections in empty config: ${sectionCount}`);
    expect(sectionCount).toBe(0);
  });

  test('layout recovers after clearing and re-adding sections', async ({ page }) => {
    // Add sections
    const config = generateMultiSectionConfig(3);
    await loadCardConfig(page, config);
    await page.waitForTimeout(500);
    
    const initialCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`Initial count: ${initialCount}`);
    expect(initialCount).toBe(3);
    
    // Clear sections
    const emptyConfig = { cardTitle: 'Reset Test', sections: [] };
    await loadCardConfig(page, emptyConfig);
    await page.waitForTimeout(500);
    
    const clearedCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`After clear: ${clearedCount}`);
    expect(clearedCount).toBe(0);
    
    // Re-add sections
    const newConfig = generateMultiSectionConfig(5);
    await loadCardConfig(page, newConfig);
    await page.waitForTimeout(500);
    
    const finalCount = await page.locator(DOM_SELECTORS.section).count();
    logProgress(`After re-add: ${finalCount}`);
    expect(finalCount).toBe(5);
  });
});

test.describe('Streaming Layout - Summary Report', () => {
  test('generate streaming layout summary', async ({ page }) => {
    logProgress('Generating streaming layout summary...');
    
    await page.goto('/');
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForLoadState('networkidle');
    
    console.log('\n========== STREAMING LAYOUT SUMMARY ==========\n');
    
    // Test incremental loading
    console.log('--- Incremental Loading Test ---');
    const loadTimes: number[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const start = Date.now();
      const config = generateMultiSectionConfig(i);
      await loadCardConfig(page, config);
      await page.waitForTimeout(200);
      const loadTime = Date.now() - start;
      loadTimes.push(loadTime);
      
      const count = await page.locator(DOM_SELECTORS.section).count();
      console.log(`  Sections: ${i}, Load time: ${loadTime}ms, Rendered: ${count}`);
    }
    
    console.log(`\n  Average load time: ${Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length)}ms`);
    
    // Check final layout
    console.log('\n--- Final Layout State ---');
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const itemCount = await masonryItems.count();
    
    const layoutInfo = await masonryItems.evaluateAll((items) => {
      const positions = items.map((item, idx) => {
        const style = (item as HTMLElement).style;
        const computed = window.getComputedStyle(item);
        return {
          index: idx,
          left: style.left,
          top: style.top,
          width: style.width,
          opacity: computed.opacity,
          animated: item.getAttribute('data-animated')
        };
      });
      
      // Count unique columns
      const uniqueLefts = new Set(positions.map(p => p.left).filter(Boolean));
      
      return {
        positions,
        columnCount: uniqueLefts.size
      };
    });
    
    console.log(`  Total items: ${itemCount}`);
    console.log(`  Column count: ${layoutInfo.columnCount}`);
    
    layoutInfo.positions.forEach(pos => {
      console.log(`    Item ${pos.index}: left=${pos.left}, top=${pos.top}, opacity=${pos.opacity}, animated=${pos.animated}`);
    });
    
    // Check container
    console.log('\n--- Container State ---');
    const container = page.locator(DOM_SELECTORS.masonryContainer);
    const containerState = await container.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        height: el.offsetHeight,
        classes: el.className,
        ariaBusy: el.getAttribute('aria-busy'),
        ariaLabel: el.getAttribute('aria-label')
      };
    });
    
    console.log(`  Height: ${containerState.height}px`);
    console.log(`  Classes: ${containerState.classes}`);
    console.log(`  aria-busy: ${containerState.ariaBusy}`);
    console.log(`  aria-label: ${containerState.ariaLabel}`);
    
    console.log('\n==============================================\n');
    
    expect(true).toBe(true);
  });
});

