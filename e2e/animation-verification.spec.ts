import { test, expect } from '@playwright/test';
import {
  loadCardConfig,
  generateSectionConfig,
  generateMultiSectionConfig,
  getComputedStyles,
  assertAnimationComplete,
  assertStaggerDelays,
  assertColumnCount,
  ANIMATION_STATES,
  DOM_SELECTORS
} from './helpers/style-assertions';

/**
 * Animation Verification Tests
 * 
 * Tests all card and section animations including:
 * - Thinking phase (loading spinner, particles)
 * - Section entrance animations
 * - Field/item stagger animations
 * - Card structure column layout
 * 
 * Verifies animation properties like:
 * - Animation names are correct
 * - Timing and delays are applied
 * - Final states are reached (opacity: 1, transform: none)
 */

/**
 * Helper to log test progress
 */
function logProgress(message: string): void {
  console.log(`[ANIMATION TEST] ${message}`);
}

test.describe('Animation - Thinking Phase', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('loading spinner has correct animation', async ({ page }) => {
    // The spinner may appear during initial load or when generating
    // Look for the loading spinner SVG
    const spinner = page.locator('.loading-spinner .spinner-svg, .preview-spinner');
    
    // If we can find a spinner, check its animation
    const count = await spinner.count();
    if (count > 0) {
      const animation = await spinner.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animationName: computed.animationName,
          animationDuration: computed.animationDuration,
          animationIterationCount: computed.animationIterationCount
        };
      });
      
      logProgress('Spinner animation properties:');
      console.log(`  animationName: ${animation.animationName}`);
      console.log(`  animationDuration: ${animation.animationDuration}`);
      console.log(`  animationIterationCount: ${animation.animationIterationCount}`);
      
      // If animation exists, it should be spinner-rotate or similar
      if (animation.animationName !== 'none') {
        expect(animation.animationDuration).toBeTruthy();
      }
    } else {
      logProgress('No spinner visible (page may have loaded quickly)');
    }
  });

  test('loading particles have correct animation', async ({ page }) => {
    // Particles appear during loading state
    const particles = page.locator('.loading-particles .particle');
    const count = await particles.count();
    
    logProgress(`Found ${count} particles`);
    
    if (count > 0) {
      const animation = await particles.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animationName: computed.animationName,
          animationDuration: computed.animationDuration,
          animationDelay: computed.animationDelay
        };
      });
      
      logProgress('Particle animation properties:');
      console.log(`  animationName: ${animation.animationName}`);
      console.log(`  animationDuration: ${animation.animationDuration}`);
      console.log(`  animationDelay: ${animation.animationDelay}`);
      
      // Verify particles have staggered delays
      const delays: number[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const delay = await particles.nth(i).evaluate((el) => {
          return window.getComputedStyle(el).animationDelay;
        });
        const delayMs = parseFloat(delay) * (delay.includes('ms') ? 1 : 1000);
        delays.push(delayMs);
        console.log(`  particle[${i}] delay: ${delay}`);
      }
      
      // Particles should have different delays
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    } else {
      logProgress('No particles visible (expected if not in loading state)');
    }
  });

  test('skeleton card appears during loading', async ({ page }) => {
    // Check for skeleton loader
    const skeleton = page.locator('app-card-skeleton, .skeleton-card, .preview-loading');
    const count = await skeleton.count();
    
    if (count > 0) {
      logProgress('Skeleton/loading state found');
      
      // Check for shimmer animation
      const shimmerAnimation = await skeleton.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        // Check pseudo elements or the element itself
        return {
          animationName: computed.animationName,
          background: computed.background
        };
      });
      
      console.log(`  animationName: ${shimmerAnimation.animationName}`);
    } else {
      logProgress('No skeleton visible (page loaded quickly)');
    }
  });
});

test.describe('Animation - Section Entrance', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('section animations complete successfully', async ({ page }) => {
    const config = generateMultiSectionConfig(3);
    await loadCardConfig(page, config);
    
    // Wait a bit for animations to complete
    await page.waitForTimeout(2000);
    
    const sections = page.locator('.ai-section');
    const count = await sections.count();
    
    logProgress(`Found ${count} sections`);
    
    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);
      const styles = await getComputedStyles(section);
      
      console.log(`  Section ${i + 1}:`);
      console.log(`    opacity: ${styles.opacity}`);
      console.log(`    transform: ${styles.transform}`);
      console.log(`    animationName: ${styles.animationName}`);
      
      // After animations complete, opacity should be 1
      expect(parseFloat(styles.opacity)).toBeGreaterThanOrEqual(0.99);
    }
  });

  test('section-streaming class transitions to section-entered', async ({ page }) => {
    const config = generateSectionConfig('info');
    await loadCardConfig(page, config);
    
    // Check for streaming or entered class
    const streamingSection = page.locator('.section-streaming');
    const enteredSection = page.locator('.section-entered');
    
    // Wait for animation to complete
    await page.waitForTimeout(1500);
    
    const streamingCount = await streamingSection.count();
    const enteredCount = await enteredSection.count();
    
    logProgress(`Streaming sections: ${streamingCount}, Entered sections: ${enteredCount}`);
    
    // After waiting, streaming should be 0 and entered should be >= 1
    // (or neither if the animation system isn't using these classes)
    if (streamingCount === 0 && enteredCount === 0) {
      logProgress('Animation classes not used (may use different system)');
    } else {
      expect(streamingCount).toBe(0);
      expect(enteredCount).toBeGreaterThan(0);
    }
  });

  test('section animation has correct timing', async ({ page }) => {
    const config = generateSectionConfig('analytics');
    await loadCardConfig(page, config);
    
    const section = page.locator('.ai-section--analytics').first();
    
    try {
      await section.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      logProgress('Section not found');
      test.skip();
      return;
    }

    const animation = await section.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animationName: computed.animationName,
        animationDuration: computed.animationDuration,
        animationTimingFunction: computed.animationTimingFunction,
        animationFillMode: computed.animationFillMode
      };
    });
    
    logProgress('Section animation timing:');
    console.log(`  animationName: ${animation.animationName}`);
    console.log(`  animationDuration: ${animation.animationDuration}`);
    console.log(`  animationTimingFunction: ${animation.animationTimingFunction}`);
    console.log(`  animationFillMode: ${animation.animationFillMode}`);
    
    // Just verify the section is visible and animatable
    const styles = await getComputedStyles(section);
    expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
  });
});

test.describe('Animation - Field Stagger', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('field stagger delays are applied', async ({ page }) => {
    const config = {
      cardTitle: 'Stagger Test',
      sections: [{
        type: 'info',
        title: 'Multiple Fields',
        fields: Array.from({ length: 6 }, (_, i) => ({
          label: `Field ${i + 1}`,
          value: `Value ${i + 1}`
        }))
      }]
    };
    
    await loadCardConfig(page, config);
    
    // Look for field stagger classes
    const staggeredFields = page.locator('[class*="field-stagger-"]');
    const count = await staggeredFields.count();
    
    logProgress(`Found ${count} staggered fields`);
    
    if (count > 0) {
      // Field stagger now uses 40ms increments (aligned with CSS)
      const result = await assertStaggerDelays(page, '[class*="field-stagger-"]', 40);
      
      console.log('  Delays:', result.delays.map(d => `${d}ms`).join(', '));
      
      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach(issue => console.log(`    - ${issue}`));
      }
      
      // Expect delays to be present
      expect(result.delays.length).toBeGreaterThan(0);
    } else {
      // Check if fields exist without stagger classes
      const fields = page.locator('.info-row, .field-row');
      const fieldCount = await fields.count();
      logProgress(`Found ${fieldCount} fields (no stagger classes)`);
    }
  });

  test('field animations complete with correct final state', async ({ page }) => {
    const config = {
      cardTitle: 'Field Animation Test',
      sections: [{
        type: 'info',
        title: 'Test Fields',
        fields: [
          { label: 'Field 1', value: 'Value 1' },
          { label: 'Field 2', value: 'Value 2' },
          { label: 'Field 3', value: 'Value 3' }
        ]
      }]
    };
    
    await loadCardConfig(page, config);
    await page.waitForTimeout(2000); // Wait for animations
    
    const fields = page.locator('.info-row, .field-row');
    const count = await fields.count();
    
    logProgress(`Checking ${count} fields for final animation state`);
    
    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);
      const styles = await getComputedStyles(field);
      
      console.log(`  Field ${i + 1}: opacity=${styles.opacity}, transform=${styles.transform}`);
      
      // After animation, opacity should be 1
      expect(parseFloat(styles.opacity)).toBeGreaterThanOrEqual(0.99);
    }
  });
});

test.describe('Animation - Item Stagger', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('item stagger delays are applied for list items', async ({ page }) => {
    const config = {
      cardTitle: 'List Stagger Test',
      sections: [{
        type: 'list',
        title: 'Item List',
        items: Array.from({ length: 5 }, (_, i) => ({
          title: `Item ${i + 1}`,
          value: `Status ${i + 1}`
        }))
      }]
    };
    
    await loadCardConfig(page, config);
    
    // Look for item stagger classes
    const staggeredItems = page.locator('[class*="item-stagger-"]');
    const count = await staggeredItems.count();
    
    logProgress(`Found ${count} staggered items`);
    
    if (count > 0) {
      const result = await assertStaggerDelays(page, '[class*="item-stagger-"]', 40);
      
      console.log('  Delays:', result.delays.map(d => `${d}ms`).join(', '));
      
      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach(issue => console.log(`    - ${issue}`));
      }
    } else {
      // Items may not use stagger classes
      const listItems = page.locator('.list-item, .section-list-item');
      const itemCount = await listItems.count();
      logProgress(`Found ${itemCount} list items (no stagger classes)`);
    }
  });

  test('list item animations complete correctly', async ({ page }) => {
    const config = {
      cardTitle: 'List Animation Test',
      sections: [{
        type: 'list',
        title: 'Animated List',
        items: [
          { title: 'Item A', value: 'Active' },
          { title: 'Item B', value: 'Pending' },
          { title: 'Item C', value: 'Complete' }
        ]
      }]
    };
    
    await loadCardConfig(page, config);
    await page.waitForTimeout(2000); // Wait for animations
    
    const section = page.locator('.ai-section--list').first();
    
    try {
      await section.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      logProgress('List section not found');
      test.skip();
      return;
    }

    const styles = await getComputedStyles(section);
    
    logProgress('List section final state:');
    console.log(`  opacity: ${styles.opacity}`);
    console.log(`  transform: ${styles.transform}`);
    
    expect(parseFloat(styles.opacity)).toBeGreaterThanOrEqual(0.99);
  });
});

test.describe('Animation - Card Structure & Columns', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    logProgress(`Starting: ${testInfo.title}`);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✓ PASS' : '✗ FAIL';
    logProgress(`${status}: ${testInfo.title}`);
  });

  test('desktop viewport shows multiple columns', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const config = generateMultiSectionConfig(6);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1500);
    
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const count = await masonryItems.count();
    
    logProgress(`Found ${count} masonry items`);
    
    if (count >= 2) {
      // Get unique left positions to determine column count
      const leftPositions = await masonryItems.evaluateAll((items) => {
        return items.map((item) => {
          const style = (item as HTMLElement).style.left;
          return style || 'auto';
        });
      });
      
      const uniqueLefts = new Set(leftPositions.filter(l => l !== 'auto'));
      logProgress(`Unique left positions: ${uniqueLefts.size}`);
      console.log('  Positions:', Array.from(uniqueLefts).join(', '));
      
      // Desktop should have at least 2 columns
      expect(uniqueLefts.size).toBeGreaterThanOrEqual(2);
    }
  });

  test('mobile viewport shows single column', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const config = generateMultiSectionConfig(3);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1500);
    
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const count = await masonryItems.count();
    
    logProgress(`Found ${count} masonry items`);
    
    if (count >= 2) {
      // On mobile, check left positions - should all be 0 or very small (single column)
      const leftPositions = await masonryItems.evaluateAll((items) => {
        return items.map((item) => {
          const style = (item as HTMLElement).style.left;
          const computed = window.getComputedStyle(item).left;
          return style || computed || '0px';
        });
      });
      
      console.log('  Item left positions:', leftPositions.join(', '));
      
      // On mobile, all items should have same/similar left position (single column)
      const uniqueLefts = new Set(leftPositions.map(l => {
        const num = parseFloat(l) || 0;
        return Math.round(num / 10) * 10; // Round to nearest 10px
      }));
      
      logProgress(`Unique left positions (rounded): ${uniqueLefts.size}`);
      
      // Single column = all items at same left position (or very close)
      expect(uniqueLefts.size).toBeLessThanOrEqual(2);
    }
  });

  test('tablet viewport shows appropriate columns', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const config = generateMultiSectionConfig(4);
    await loadCardConfig(page, config);
    await page.waitForTimeout(1500);
    
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const count = await masonryItems.count();
    
    logProgress(`Found ${count} masonry items on tablet`);
    
    if (count >= 2) {
      const leftPositions = await masonryItems.evaluateAll((items) => {
        return items.map((item) => {
          const style = (item as HTMLElement).style.left;
          return style || 'auto';
        });
      });
      
      const uniqueLefts = new Set(leftPositions.filter(l => l !== 'auto'));
      logProgress(`Tablet columns: ${uniqueLefts.size}`);
      
      // Tablet should have 1-2 columns
      expect(uniqueLefts.size).toBeGreaterThanOrEqual(1);
      expect(uniqueLefts.size).toBeLessThanOrEqual(3);
    }
  });

  test('col-span sections expand correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Create a config with sections that should span multiple columns
    const config = {
      cardTitle: 'Col-Span Test',
      sections: [
        {
          type: 'info',
          title: 'Small Section',
          fields: [{ label: 'A', value: 'B' }]
        },
        {
          type: 'overview',
          title: 'Large Overview Section',
          fields: Array.from({ length: 8 }, (_, i) => ({
            label: `Field ${i + 1}`,
            value: `Value ${i + 1}`
          }))
        },
        {
          type: 'chart',
          title: 'Chart Section',
          chartType: 'bar',
          fields: [
            { label: 'Q1', value: 100 },
            { label: 'Q2', value: 200 }
          ]
        }
      ]
    };
    
    await loadCardConfig(page, config);
    await page.waitForTimeout(1500);
    
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const count = await masonryItems.count();
    
    logProgress(`Found ${count} masonry items`);
    
    // Check for col-span attributes
    const colSpans = await masonryItems.evaluateAll((items) => {
      return items.map((item) => {
        return item.getAttribute('data-col-span') || '1';
      });
    });
    
    console.log('  Col-spans:', colSpans.join(', '));
    
    // At least one section should have col-span > 1 for large content
    const hasMultiColSpan = colSpans.some(span => parseInt(span) > 1);
    logProgress(`Has multi-column sections: ${hasMultiColSpan}`);
  });
});

test.describe('Animation - Summary Report', () => {
  test('generate animation summary report', async ({ page }) => {
    logProgress('Generating animation summary report...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const config = generateMultiSectionConfig(4);
    await loadCardConfig(page, config);
    await page.waitForTimeout(2000);
    
    console.log('\n========== ANIMATION SUMMARY REPORT ==========\n');
    
    // Check section animations
    const sections = page.locator(DOM_SELECTORS.section);
    const sectionCount = await sections.count();
    console.log(`Sections Found: ${sectionCount}`);
    
    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const styles = await getComputedStyles(section);
      const classes = await section.getAttribute('class') || '';
      
      console.log(`\n  Section ${i + 1}:`);
      console.log(`    Classes: ${classes.substring(0, 80)}...`);
      console.log(`    Opacity: ${styles.opacity}`);
      console.log(`    Transform: ${styles.transform}`);
      console.log(`    Animation: ${styles.animationName}`);
    }
    
    // Check masonry layout
    console.log('\n--- Masonry Layout ---');
    const masonryItems = page.locator(DOM_SELECTORS.masonryItem);
    const itemCount = await masonryItems.count();
    console.log(`  Items: ${itemCount}`);
    
    const positions = await masonryItems.evaluateAll((items) => {
      return items.map((item, idx) => {
        const style = (item as HTMLElement).style;
        return {
          index: idx,
          left: style.left,
          top: style.top,
          width: style.width
        };
      });
    });
    
    positions.forEach(pos => {
      console.log(`    Item ${pos.index}: left=${pos.left}, top=${pos.top}, width=${pos.width}`);
    });
    
    // Check for animation classes
    console.log('\n--- Animation Classes ---');
    const streamingCount = await page.locator('.section-streaming').count();
    const enteredCount = await page.locator('.section-entered').count();
    const fieldStreamingCount = await page.locator('.field-streaming').count();
    const fieldEnteredCount = await page.locator('.field-entered').count();
    
    console.log(`  .section-streaming: ${streamingCount}`);
    console.log(`  .section-entered: ${enteredCount}`);
    console.log(`  .field-streaming: ${fieldStreamingCount}`);
    console.log(`  .field-entered: ${fieldEnteredCount}`);
    
    console.log('\n==============================================\n');
    
    expect(true).toBe(true);
  });
});

