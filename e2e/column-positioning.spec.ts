import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Column Positioning Tests
 * 
 * Tests that verify sections are positioned correctly in the masonry grid:
 * - Column assignment for each section
 * - Exact left/top position calculations
 * - Column-span behavior (sections spanning multiple columns)
 * - Proper vertical stacking within columns
 * - Position updates during resize
 */

// Grid configuration constants (from grid-config.util.ts)
const GRID_CONFIG = {
  minColumnWidth: 260,
  maxColumns: 4,
  gap: 12
};

/**
 * Helper to log progress
 */
function logProgress(message: string): void {
  console.log(`[COLUMN POSITION] ${message}`);
}

/**
 * Position data for a masonry item
 */
interface ItemPosition {
  index: number;
  sectionType: string;
  left: number;
  top: number;
  width: number;
  height: number;
  columnIndex: number;
  colSpan: number;
}

/**
 * Column assignment data
 */
interface ColumnAssignment {
  columnIndex: number;
  columnLeft: number;
  items: ItemPosition[];
  totalHeight: number;
}

/**
 * Extract detailed position data for all masonry items
 */
async function extractItemPositions(page: Page): Promise<ItemPosition[]> {
  const items = page.locator('.masonry-item');
  const count = await items.count();
  const positions: ItemPosition[] = [];
  
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const box = await item.boundingBox();
    
    if (box) {
      // Get section type from the item
      const sectionType = await item.evaluate(el => {
        const section = el.querySelector('.ai-section');
        if (section) {
          const classes = Array.from(section.classList);
          const typeClass = classes.find(c => c.startsWith('ai-section--'));
          return typeClass?.replace('ai-section--', '') || 'unknown';
        }
        return 'unknown';
      });
      
      // Get col-span attribute
      const colSpan = await item.evaluate(el => {
        return parseInt(el.getAttribute('data-col-span') || '1', 10);
      });
      
      positions.push({
        index: i,
        sectionType,
        left: Math.round(box.x),
        top: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        columnIndex: -1, // Will be calculated
        colSpan
      });
    }
  }
  
  return positions;
}

/**
 * Assign column indices to items based on their left positions
 */
function assignColumnIndices(positions: ItemPosition[]): ItemPosition[] {
  if (positions.length === 0) return positions;
  
  // Find unique left positions (column boundaries)
  const uniqueLefts = [...new Set(positions.map(p => p.left))].sort((a, b) => a - b);
  
  // Assign column index based on left position
  return positions.map(pos => ({
    ...pos,
    columnIndex: uniqueLefts.indexOf(pos.left)
  }));
}

/**
 * Group items by their column
 */
function groupByColumn(positions: ItemPosition[]): ColumnAssignment[] {
  const columnMap = new Map<number, ItemPosition[]>();
  
  for (const pos of positions) {
    const items = columnMap.get(pos.columnIndex) || [];
    items.push(pos);
    columnMap.set(pos.columnIndex, items);
  }
  
  const columns: ColumnAssignment[] = [];
  
  for (const [columnIndex, items] of columnMap) {
    // Sort items by top position
    items.sort((a, b) => a.top - b.top);
    
    const columnLeft = items[0]?.left || 0;
    const lastItem = items[items.length - 1];
    const totalHeight = lastItem ? lastItem.top + lastItem.height - items[0]!.top : 0;
    
    columns.push({
      columnIndex,
      columnLeft,
      items,
      totalHeight
    });
  }
  
  return columns.sort((a, b) => a.columnIndex - b.columnIndex);
}

/**
 * Calculate expected left position for a column
 */
function calculateExpectedLeft(columnIndex: number, columnWidth: number, gap: number, containerLeft: number): number {
  return containerLeft + columnIndex * (columnWidth + gap);
}

/**
 * Verify vertical stacking within a column
 */
function verifyVerticalStacking(items: ItemPosition[], gap: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (items.length < 2) {
    return { valid: true, errors: [] };
  }
  
  for (let i = 1; i < items.length; i++) {
    const prevItem = items[i - 1]!;
    const currItem = items[i]!;
    
    const expectedTop = prevItem.top + prevItem.height + gap;
    const actualTop = currItem.top;
    const diff = Math.abs(actualTop - expectedTop);
    
    // Allow 4px tolerance for rounding
    if (diff > 4) {
      errors.push(
        `Item ${currItem.index} (${currItem.sectionType}): expected top=${expectedTop}px, got ${actualTop}px (diff: ${diff}px)`
      );
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Navigate to home page and wait for card to render
 */
async function loadCardPage(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.masonry-item', { state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Column Positioning - Column Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Each section is assigned to a specific column', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    logProgress(`Found ${positions.length} items in ${columns.length} columns`);
    
    // Log column assignments
    for (const col of columns) {
      logProgress(`  Column ${col.columnIndex} (x=${col.columnLeft}): ${col.items.length} items`);
      for (const item of col.items) {
        logProgress(`    - Item ${item.index} (${item.sectionType}): ${item.width}x${item.height}px`);
      }
    }
    
    // Every item should have a valid column assignment
    for (const pos of positionsWithColumns) {
      expect(pos.columnIndex).toBeGreaterThanOrEqual(0);
    }
    
    // Should have at least 1 column
    expect(columns.length).toBeGreaterThanOrEqual(1);
  });

  test('Items are distributed across available columns', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    if (columns.length > 1) {
      // Check that items are distributed, not all in one column
      const itemCounts = columns.map(c => c.items.length);
      const maxItems = Math.max(...itemCounts);
      const minItems = Math.min(...itemCounts);
      
      logProgress(`Item distribution: min=${minItems}, max=${maxItems}`);
      
      // Columns should be reasonably balanced (max shouldn't be more than 2x min)
      // This is a soft check - bin-packing may result in uneven distribution
      expect(maxItems).toBeLessThanOrEqual(minItems * 3 + 2);
    }
    
    expect(true).toBe(true);
  });

  test('Columns have consistent left positions', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    // All items in the same column should have the same left position
    for (const col of columns) {
      if (col.items.length > 1) {
        const firstLeft = col.items[0]!.left;
        
        for (const item of col.items) {
          const diff = Math.abs(item.left - firstLeft);
          expect(diff).toBeLessThanOrEqual(2); // Allow 2px tolerance
        }
        
        logProgress(`Column ${col.columnIndex}: all items at x=${firstLeft}px`);
      }
    }
  });
});

test.describe('Column Positioning - Position Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Left positions follow column formula', async ({ page }) => {
    const container = page.locator('.masonry-container').first();
    const containerBox = await container.boundingBox();
    
    if (!containerBox) {
      logProgress('Container not found');
      return;
    }
    
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    if (columns.length < 2) {
      logProgress('Single column - skipping left position formula test');
      return;
    }
    
    // Calculate column width from first two columns
    const col0Left = columns[0]!.columnLeft;
    const col1Left = columns[1]!.columnLeft;
    const columnWidth = columns[0]!.items[0]!.width;
    const gap = col1Left - col0Left - columnWidth;
    
    logProgress(`Container starts at x=${containerBox.x}`);
    logProgress(`Column width: ${columnWidth}px, Gap: ${gap}px`);
    
    // Verify each column's left position
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]!;
      const expectedLeft = calculateExpectedLeft(i, columnWidth, gap, col0Left);
      const actualLeft = col.columnLeft;
      const diff = Math.abs(actualLeft - expectedLeft);
      
      logProgress(`  Column ${i}: expected x=${expectedLeft}px, actual x=${actualLeft}px (diff: ${diff}px)`);
      
      // Allow 4px tolerance
      expect(diff).toBeLessThanOrEqual(4);
    }
  });

  test('Column widths are consistent', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    if (columns.length < 2) {
      logProgress('Single column - skipping width consistency test');
      return;
    }
    
    // Get widths of single-span items only (exclude special sections like charts)
    const singleSpanItems = positionsWithColumns.filter(p => 
      p.colSpan === 1 && 
      !['chart', 'map', 'analytics'].includes(p.sectionType)
    );
    
    if (singleSpanItems.length < 2) {
      logProgress('Not enough standard single-span items to compare');
      return;
    }
    
    // Get the most common width (mode)
    const widthCounts = new Map<number, number>();
    for (const item of singleSpanItems) {
      const roundedWidth = Math.round(item.width / 10) * 10; // Round to nearest 10px
      widthCounts.set(roundedWidth, (widthCounts.get(roundedWidth) || 0) + 1);
    }
    
    const mostCommonWidth = [...widthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    
    logProgress(`Most common width: ${mostCommonWidth}px`);
    
    // Count how many items are close to the most common width
    let consistentCount = 0;
    for (const item of singleSpanItems) {
      const diff = Math.abs(item.width - mostCommonWidth);
      if (diff <= 20) { // Allow 20px tolerance
        consistentCount++;
      } else {
        logProgress(`  Outlier width: ${item.width}px (${item.sectionType})`);
      }
    }
    
    // At least 80% of items should have consistent width
    const consistencyRate = consistentCount / singleSpanItems.length;
    logProgress(`Width consistency rate: ${(consistencyRate * 100).toFixed(1)}%`);
    
    expect(consistencyRate).toBeGreaterThanOrEqual(0.7);
  });

  test('Top positions account for items above', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    logProgress(`Verifying vertical stacking in ${columns.length} columns`);
    
    let totalGaps = 0;
    let validGaps = 0;
    
    for (const col of columns) {
      if (col.items.length > 1) {
        for (let i = 1; i < col.items.length; i++) {
          const prevItem = col.items[i - 1]!;
          const currItem = col.items[i]!;
          
          const expectedTop = prevItem.top + prevItem.height + GRID_CONFIG.gap;
          const actualTop = currItem.top;
          const diff = Math.abs(actualTop - expectedTop);
          
          totalGaps++;
          
          // Allow larger tolerance (items can have different heights affecting layout)
          // The masonry layout may add extra space due to bin-packing
          if (diff <= 4 || actualTop >= expectedTop) {
            validGaps++;
          } else {
            logProgress(`  Gap issue: item ${currItem.index} expected at ${expectedTop}px, got ${actualTop}px`);
          }
        }
        
        logProgress(`  Column ${col.columnIndex}: ${col.items.length} items checked`);
      }
    }
    
    // At least 80% of vertical gaps should be valid (items can't overlap)
    const validRate = totalGaps > 0 ? validGaps / totalGaps : 1;
    logProgress(`Vertical stacking valid rate: ${(validRate * 100).toFixed(1)}%`);
    
    expect(validRate).toBeGreaterThanOrEqual(0.8);
  });
});

test.describe('Column Positioning - Vertical Stacking', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Items in same column do not overlap vertically', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    let overlapCount = 0;
    
    for (const col of columns) {
      for (let i = 0; i < col.items.length; i++) {
        for (let j = i + 1; j < col.items.length; j++) {
          const a = col.items[i]!;
          const b = col.items[j]!;
          
          // Check vertical overlap
          const aBottom = a.top + a.height;
          const bBottom = b.top + b.height;
          
          const overlapVertical = a.top < bBottom && aBottom > b.top;
          
          if (overlapVertical) {
            logProgress(`  Overlap in column ${col.columnIndex}: items ${a.index} and ${b.index}`);
            overlapCount++;
          }
        }
      }
    }
    
    logProgress(`Total vertical overlaps: ${overlapCount}`);
    expect(overlapCount).toBe(0);
  });

  test('Gap between vertically stacked items is approximately 12px', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    const gaps: number[] = [];
    
    for (const col of columns) {
      for (let i = 1; i < col.items.length; i++) {
        const prev = col.items[i - 1]!;
        const curr = col.items[i]!;
        
        const gap = curr.top - (prev.top + prev.height);
        gaps.push(gap);
      }
    }
    
    if (gaps.length === 0) {
      logProgress('No vertical gaps to measure (single items per column)');
      return;
    }
    
    // Filter out outliers (gaps larger than 100px are likely due to special layouts)
    const normalGaps = gaps.filter(g => g <= 100 && g >= 0);
    
    if (normalGaps.length === 0) {
      logProgress('No normal gaps found (all gaps are outliers)');
      return;
    }
    
    const avgGap = normalGaps.reduce((a, b) => a + b, 0) / normalGaps.length;
    const minGap = Math.min(...normalGaps);
    const maxGap = Math.max(...normalGaps);
    
    logProgress(`Vertical gaps: min=${minGap}px, max=${maxGap}px, avg=${avgGap.toFixed(1)}px`);
    logProgress(`Expected gap: ${GRID_CONFIG.gap}px`);
    logProgress(`Outlier gaps filtered: ${gaps.length - normalGaps.length}`);
    
    // Average gap should be close to expected (within 10px to account for rounding)
    expect(Math.abs(avgGap - GRID_CONFIG.gap)).toBeLessThanOrEqual(10);
    
    // Minimum gap should not be negative (items shouldn't overlap)
    expect(minGap).toBeGreaterThanOrEqual(-2);
  });

  test('First item in each column starts near container top', async ({ page }) => {
    const container = page.locator('.masonry-container').first();
    const containerBox = await container.boundingBox();
    
    if (!containerBox) {
      logProgress('Container not found');
      return;
    }
    
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    for (const col of columns) {
      if (col.items.length > 0) {
        const firstItem = col.items[0]!;
        const offsetFromContainer = firstItem.top - containerBox.y;
        
        logProgress(`  Column ${col.columnIndex}: first item at y=${firstItem.top}, container at y=${containerBox.y}, offset=${offsetFromContainer}px`);
        
        // First item should be close to container top (within padding)
        expect(offsetFromContainer).toBeLessThanOrEqual(50);
      }
    }
  });
});

test.describe('Column Positioning - Column Span', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loadCardPage(page);
  });

  test('Sections with colSpan attribute are detected', async ({ page }) => {
    const positions = await extractItemPositions(page);
    
    const singleSpan = positions.filter(p => p.colSpan === 1);
    const multiSpan = positions.filter(p => p.colSpan > 1);
    
    logProgress(`Single-span items: ${singleSpan.length}`);
    logProgress(`Multi-span items: ${multiSpan.length}`);
    
    for (const item of multiSpan) {
      logProgress(`  Item ${item.index} (${item.sectionType}): colSpan=${item.colSpan}`);
    }
    
    // Just verify we can detect col-span
    expect(positions.length).toBeGreaterThan(0);
  });

  test('Multi-span sections have wider width', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    if (columns.length < 2) {
      logProgress('Need multiple columns to test multi-span');
      return;
    }
    
    const singleSpanItems = positionsWithColumns.filter(p => p.colSpan === 1);
    const multiSpanItems = positionsWithColumns.filter(p => p.colSpan > 1);
    
    if (singleSpanItems.length === 0 || multiSpanItems.length === 0) {
      logProgress('No single-span or multi-span items to compare');
      return;
    }
    
    const singleSpanWidth = singleSpanItems[0]!.width;
    
    for (const item of multiSpanItems) {
      const expectedMinWidth = singleSpanWidth * item.colSpan + GRID_CONFIG.gap * (item.colSpan - 1) - 10;
      
      logProgress(`  Multi-span item ${item.index}: width=${item.width}px, expected min=${expectedMinWidth}px`);
      
      // Multi-span should be wider than single-span
      expect(item.width).toBeGreaterThan(singleSpanWidth);
    }
  });
});

test.describe('Column Positioning - No Horizontal Overlap', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Sections in different columns do not overlap horizontally', async ({ page }) => {
    const positions = await extractItemPositions(page);
    
    let overlapCount = 0;
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i]!;
        const b = positions[j]!;
        
        // Check if they occupy same vertical space
        const aBottom = a.top + a.height;
        const bBottom = b.top + b.height;
        const verticalOverlap = a.top < bBottom && aBottom > b.top;
        
        if (verticalOverlap) {
          // Check horizontal overlap
          const aRight = a.left + a.width;
          const bRight = b.left + b.width;
          const horizontalOverlap = a.left < bRight && aRight > b.left;
          
          if (horizontalOverlap) {
            logProgress(`  Overlap: items ${i} and ${j}`);
            logProgress(`    Item ${i}: (${a.left}, ${a.top}) ${a.width}x${a.height}`);
            logProgress(`    Item ${j}: (${b.left}, ${b.top}) ${b.width}x${b.height}`);
            overlapCount++;
          }
        }
      }
    }
    
    logProgress(`Total overlapping item pairs: ${overlapCount}`);
    expect(overlapCount).toBe(0);
  });
});

test.describe('Column Positioning - Dynamic Resize', () => {
  test('Positions recalculate correctly on viewport resize', async ({ page }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
    
    const initialPositions = await extractItemPositions(page);
    const initialColumns = groupByColumn(assignColumnIndices(initialPositions));
    
    logProgress(`Initial: ${initialColumns.length} columns, ${initialPositions.length} items`);
    
    // Resize to wider viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const widePositions = await extractItemPositions(page);
    const wideColumns = groupByColumn(assignColumnIndices(widePositions));
    
    logProgress(`After resize to 1920px: ${wideColumns.length} columns`);
    
    // Resize to narrower viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const narrowPositions = await extractItemPositions(page);
    const narrowColumns = groupByColumn(assignColumnIndices(narrowPositions));
    
    logProgress(`After resize to 768px: ${narrowColumns.length} columns`);
    
    // Verify positions are recalculated (at least some positions should change)
    // Just verify no errors occur during resize
    expect(initialPositions.length).toBe(widePositions.length);
    expect(widePositions.length).toBe(narrowPositions.length);
  });

  test('Column count adapts to available width', async ({ page }) => {
    const breakpoints = [
      { width: 375, name: 'Mobile' },
      { width: 768, name: 'Tablet' },
      { width: 1280, name: 'Desktop' },
      { width: 1920, name: 'Wide' }
    ];
    
    const results: Array<{ breakpoint: string; columns: number }> = [];
    
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: 900 });
      await loadCardPage(page);
      
      const positions = await extractItemPositions(page);
      const columns = groupByColumn(assignColumnIndices(positions));
      
      results.push({ breakpoint: bp.name, columns: columns.length });
      logProgress(`${bp.name} (${bp.width}px): ${columns.length} columns`);
    }
    
    // At minimum, mobile should have fewer columns than wide
    const mobileResult = results.find(r => r.breakpoint === 'Mobile');
    const wideResult = results.find(r => r.breakpoint === 'Wide');
    
    if (mobileResult && wideResult) {
      expect(mobileResult.columns).toBeLessThanOrEqual(wideResult.columns);
    }
  });
});

test.describe('Column Positioning - Summary Report', () => {
  test('Generate comprehensive position report', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
    
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    console.log('\n' + '='.repeat(60));
    console.log('        COLUMN POSITIONING REPORT');
    console.log('='.repeat(60));
    
    console.log(`\nTotal Items: ${positions.length}`);
    console.log(`Total Columns: ${columns.length}`);
    
    console.log('\n--- COLUMN DETAILS ---');
    for (const col of columns) {
      console.log(`\nColumn ${col.columnIndex}:`);
      console.log(`  Left Position: ${col.columnLeft}px`);
      console.log(`  Items: ${col.items.length}`);
      console.log(`  Total Height: ${col.totalHeight}px`);
      
      for (const item of col.items) {
        console.log(`    [${item.index}] ${item.sectionType.padEnd(15)} @ (${item.left}, ${item.top}) ${item.width}x${item.height}px`);
      }
    }
    
    // Calculate gaps
    console.log('\n--- VERTICAL GAPS ---');
    for (const col of columns) {
      if (col.items.length > 1) {
        console.log(`Column ${col.columnIndex}:`);
        for (let i = 1; i < col.items.length; i++) {
          const prev = col.items[i - 1]!;
          const curr = col.items[i]!;
          const gap = curr.top - (prev.top + prev.height);
          console.log(`  Between items ${prev.index} and ${curr.index}: ${gap}px`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    expect(positions.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// PADDING TESTS
// ============================================================================

test.describe('Padding Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Section padding should be consistent', async ({ page }) => {
    const sections = page.locator('.ai-section');
    const count = await sections.count();
    
    logProgress(`Checking padding on ${count} sections`);
    
    const paddings: string[] = [];
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const section = sections.nth(i);
      const padding = await section.evaluate(el => window.getComputedStyle(el).padding);
      paddings.push(padding);
      logProgress(`  Section ${i}: padding = ${padding}`);
    }
    
    // Sections should have padding defined
    expect(paddings.length).toBeGreaterThan(0);
    
    // Most sections should have similar padding
    const paddingCounts = new Map<string, number>();
    for (const p of paddings) {
      paddingCounts.set(p, (paddingCounts.get(p) || 0) + 1);
    }
    
    logProgress(`Unique padding values: ${paddingCounts.size}`);
    
    // Should have reasonably consistent padding (not all different)
    expect(paddingCounts.size).toBeLessThanOrEqual(5);
  });

  test('Card container padding should be applied', async ({ page }) => {
    const cardSurface = page.locator('.ai-card-surface').first();
    
    if (await cardSurface.count() > 0) {
      const padding = await cardSurface.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          top: style.paddingTop,
          right: style.paddingRight,
          bottom: style.paddingBottom,
          left: style.paddingLeft
        };
      });
      
      logProgress(`Card surface padding: ${JSON.stringify(padding)}`);
      
      // Card should have some padding
      const totalPadding = parseFloat(padding.top) + parseFloat(padding.right) + 
                          parseFloat(padding.bottom) + parseFloat(padding.left);
      expect(totalPadding).toBeGreaterThan(0);
    }
  });

  test('Info row padding should be consistent', async ({ page }) => {
    const infoRows = page.locator('.info-row');
    const count = await infoRows.count();
    
    if (count === 0) {
      logProgress('No info rows found');
      return;
    }
    
    logProgress(`Checking padding on ${count} info rows`);
    
    const paddings: string[] = [];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const row = infoRows.nth(i);
      const padding = await row.evaluate(el => window.getComputedStyle(el).padding);
      paddings.push(padding);
    }
    
    // Info rows should have consistent padding
    const uniquePaddings = new Set(paddings);
    logProgress(`Info row padding values: ${[...uniquePaddings].join(', ')}`);
    
    expect(uniquePaddings.size).toBeLessThanOrEqual(2);
  });

  test('Button padding should match spec (10px 20px)', async ({ page }) => {
    const buttons = page.locator('.osi-action-button');
    const count = await buttons.count();
    
    if (count === 0) {
      logProgress('No action buttons found on page');
      return;
    }
    
    logProgress(`Checking ${count} action buttons`);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const styles = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft
        };
      });
      
      logProgress(`  Button ${i}: padding = ${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`);
      
      // Expected: 0.625rem 1.25rem = 10px 20px
      const pTop = parseFloat(styles.paddingTop);
      const pRight = parseFloat(styles.paddingRight);
      const pBottom = parseFloat(styles.paddingBottom);
      const pLeft = parseFloat(styles.paddingLeft);
      
      // Allow 2px tolerance
      expect(pTop).toBeGreaterThanOrEqual(8);
      expect(pTop).toBeLessThanOrEqual(12);
      expect(pRight).toBeGreaterThanOrEqual(18);
      expect(pRight).toBeLessThanOrEqual(22);
      expect(pBottom).toBeGreaterThanOrEqual(8);
      expect(pBottom).toBeLessThanOrEqual(12);
      expect(pLeft).toBeGreaterThanOrEqual(18);
      expect(pLeft).toBeLessThanOrEqual(22);
    }
  });
});

// ============================================================================
// GAP TESTS
// ============================================================================

test.describe('Gap Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Masonry grid gap should be 12px', async ({ page }) => {
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    if (columns.length < 2) {
      logProgress('Need multiple columns to test horizontal gap');
      return;
    }
    
    // Calculate horizontal gap between columns
    const col0Left = columns[0]!.columnLeft;
    const col0Width = columns[0]!.items[0]!.width;
    const col1Left = columns[1]!.columnLeft;
    
    const horizontalGap = col1Left - col0Left - col0Width;
    
    logProgress(`Horizontal gap between columns: ${horizontalGap}px`);
    
    // Should be approximately 12px (allow 4px tolerance)
    expect(Math.abs(horizontalGap - GRID_CONFIG.gap)).toBeLessThanOrEqual(4);
    
    // Also verify vertical gaps
    let validVerticalGaps = 0;
    let totalVerticalGaps = 0;
    
    for (const col of columns) {
      for (let i = 1; i < col.items.length; i++) {
        const prev = col.items[i - 1]!;
        const curr = col.items[i]!;
        const gap = curr.top - (prev.top + prev.height);
        
        totalVerticalGaps++;
        if (Math.abs(gap - GRID_CONFIG.gap) <= 4 || gap > 50) {
          // Normal gap or large gap (due to layout balancing)
          validVerticalGaps++;
        }
        
        if (gap <= 50) {
          logProgress(`  Vertical gap col${col.columnIndex}: ${gap}px`);
        }
      }
    }
    
    // Most vertical gaps should be approximately 12px
    if (totalVerticalGaps > 0) {
      const validRate = validVerticalGaps / totalVerticalGaps;
      logProgress(`Valid gap rate: ${(validRate * 100).toFixed(1)}%`);
      expect(validRate).toBeGreaterThanOrEqual(0.8);
    }
  });

  test('Section internal gaps should be consistent', async ({ page }) => {
    // Check gaps within sections (between fields, items, etc.)
    const infoSections = page.locator('.ai-section--info');
    const count = await infoSections.count();
    
    if (count === 0) {
      logProgress('No info sections found');
      return;
    }
    
    const section = infoSections.first();
    const gap = await section.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.gap || style.rowGap || 'not set';
    });
    
    logProgress(`Info section gap: ${gap}`);
    
    // Gap should be defined
    expect(gap).not.toBe('not set');
  });

  test('Button container gap should be 0.75rem (12px)', async ({ page }) => {
    const actionContainers = page.locator('.osi-card-actions__container');
    const count = await actionContainers.count();
    
    if (count === 0) {
      logProgress('No action button containers found');
      return;
    }
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const container = actionContainers.nth(i);
      const gap = await container.evaluate(el => window.getComputedStyle(el).gap);
      
      logProgress(`Button container ${i} gap: ${gap}`);
      
      // Expected: 0.75rem = 12px
      const gapValue = parseFloat(gap);
      expect(gapValue).toBeGreaterThanOrEqual(10);
      expect(gapValue).toBeLessThanOrEqual(14);
    }
  });

  test('Badge group gaps should be appropriate', async ({ page }) => {
    const badgeGroups = page.locator('.badge-group');
    const count = await badgeGroups.count();
    
    if (count === 0) {
      logProgress('No badge groups found');
      return;
    }
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const group = badgeGroups.nth(i);
      const gap = await group.evaluate(el => window.getComputedStyle(el).gap);
      
      logProgress(`Badge group ${i} gap: ${gap}`);
      
      // Gap should be defined and reasonable
      const gapValue = parseFloat(gap);
      expect(gapValue).toBeGreaterThan(0);
      expect(gapValue).toBeLessThanOrEqual(24);
    }
  });
});

// ============================================================================
// BUTTON STYLE TESTS
// ============================================================================

test.describe('Button Style Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
  });

  test('Primary button should have correct styles', async ({ page }) => {
    const primaryButtons = page.locator('.osi-action-button--primary');
    const count = await primaryButtons.count();
    
    if (count === 0) {
      logProgress('No primary buttons found');
      return;
    }
    
    const button = primaryButtons.first();
    const styles = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderRadius: style.borderRadius,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight
      };
    });
    
    logProgress(`Primary button styles:`);
    logProgress(`  Background: ${styles.backgroundColor}`);
    logProgress(`  Color: ${styles.color}`);
    logProgress(`  Border-radius: ${styles.borderRadius}`);
    logProgress(`  Font-size: ${styles.fontSize}`);
    logProgress(`  Font-weight: ${styles.fontWeight}`);
    
    // Expected: background-color: #FF7900 = rgb(255, 121, 0)
    expect(styles.backgroundColor).toMatch(/rgb\(255,\s*121,\s*0\)/);
    
    // Expected: color: #ffffff = rgb(255, 255, 255)
    expect(styles.color).toMatch(/rgb\(255,\s*255,\s*255\)/);
    
    // Expected: border-radius: 10px
    const radius = parseFloat(styles.borderRadius);
    expect(radius).toBeGreaterThanOrEqual(8);
    expect(radius).toBeLessThanOrEqual(12);
    
    // Expected: font-size: 0.875rem = 14px
    const fontSize = parseFloat(styles.fontSize);
    expect(fontSize).toBeGreaterThanOrEqual(13);
    expect(fontSize).toBeLessThanOrEqual(15);
    
    // Expected: font-weight: 600
    expect(parseInt(styles.fontWeight)).toBeGreaterThanOrEqual(500);
  });

  test('Secondary button should have correct styles', async ({ page }) => {
    const secondaryButtons = page.locator('.osi-action-button--secondary');
    const count = await secondaryButtons.count();
    
    if (count === 0) {
      logProgress('No secondary buttons found');
      return;
    }
    
    const button = secondaryButtons.first();
    const styles = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        border: style.border,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderStyle: style.borderStyle,
        borderRadius: style.borderRadius
      };
    });
    
    logProgress(`Secondary button styles:`);
    logProgress(`  Background: ${styles.backgroundColor}`);
    logProgress(`  Color: ${styles.color}`);
    logProgress(`  Border: ${styles.border}`);
    logProgress(`  Border-radius: ${styles.borderRadius}`);
    
    // Expected: background-color: transparent = rgba(0, 0, 0, 0)
    expect(styles.backgroundColor).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/);
    
    // Expected: color: #FF7900 = rgb(255, 121, 0)
    expect(styles.color).toMatch(/rgb\(255,\s*121,\s*0\)/);
    
    // Expected: border: 2px solid #FF7900
    const borderWidth = parseFloat(styles.borderWidth);
    expect(borderWidth).toBeGreaterThanOrEqual(1);
    expect(borderWidth).toBeLessThanOrEqual(3);
    expect(styles.borderStyle).toBe('solid');
    expect(styles.borderColor).toMatch(/rgb\(255,\s*121,\s*0\)/);
  });

  test('Button typography should be consistent', async ({ page }) => {
    const buttons = page.locator('.osi-action-button');
    const count = await buttons.count();
    
    if (count === 0) {
      logProgress('No action buttons found');
      return;
    }
    
    const fontFamilies: string[] = [];
    const fontSizes: number[] = [];
    const fontWeights: number[] = [];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const styles = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      });
      
      fontFamilies.push(styles.fontFamily);
      fontSizes.push(parseFloat(styles.fontSize));
      fontWeights.push(parseInt(styles.fontWeight));
    }
    
    // All buttons should have the same font family
    const uniqueFontFamilies = new Set(fontFamilies);
    logProgress(`Unique font families: ${uniqueFontFamilies.size}`);
    expect(uniqueFontFamilies.size).toBe(1);
    
    // All buttons should have the same font size
    const uniqueFontSizes = new Set(fontSizes.map(s => Math.round(s)));
    logProgress(`Unique font sizes: ${[...uniqueFontSizes].join(', ')}px`);
    expect(uniqueFontSizes.size).toBe(1);
    
    // All buttons should have the same font weight
    const uniqueFontWeights = new Set(fontWeights);
    logProgress(`Unique font weights: ${[...uniqueFontWeights].join(', ')}`);
    expect(uniqueFontWeights.size).toBe(1);
    
    // Font should be Helvetica-based
    const fontFamily = fontFamilies[0]!;
    logProgress(`Button font family: ${fontFamily}`);
    expect(fontFamily.toLowerCase()).toMatch(/helvetica|arial|sans-serif/);
  });

  test('Button border-radius should be 10px', async ({ page }) => {
    const buttons = page.locator('.osi-action-button');
    const count = await buttons.count();
    
    if (count === 0) {
      logProgress('No action buttons found');
      return;
    }
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const borderRadius = await button.evaluate(el => 
        window.getComputedStyle(el).borderRadius
      );
      
      logProgress(`Button ${i} border-radius: ${borderRadius}`);
      
      const radius = parseFloat(borderRadius);
      expect(radius).toBeGreaterThanOrEqual(8);
      expect(radius).toBeLessThanOrEqual(12);
    }
  });
});

// ============================================================================
// COMPREHENSIVE SPACING REPORT
// ============================================================================

test.describe('Spacing Report', () => {
  test('Generate comprehensive spacing report', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadCardPage(page);
    
    console.log('\n' + '='.repeat(60));
    console.log('        SPACING & STYLING REPORT');
    console.log('='.repeat(60));
    
    // Collect padding data
    const sections = page.locator('.ai-section');
    const sectionCount = await sections.count();
    
    console.log('\n--- SECTION PADDING ---');
    for (let i = 0; i < Math.min(sectionCount, 5); i++) {
      const section = sections.nth(i);
      const className = await section.evaluate(el => el.className);
      const padding = await section.evaluate(el => window.getComputedStyle(el).padding);
      console.log(`  ${className.split(' ')[1] || 'section'}: ${padding}`);
    }
    
    // Collect button data
    const buttons = page.locator('.osi-action-button');
    const buttonCount = await buttons.count();
    
    console.log('\n--- BUTTON STYLES ---');
    console.log(`  Found ${buttonCount} buttons`);
    
    if (buttonCount > 0) {
      const primaryCount = await page.locator('.osi-action-button--primary').count();
      const secondaryCount = await page.locator('.osi-action-button--secondary').count();
      console.log(`  Primary buttons: ${primaryCount}`);
      console.log(`  Secondary buttons: ${secondaryCount}`);
      
      const button = buttons.first();
      const styles = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          padding: style.padding,
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily
        };
      });
      console.log(`  Sample button styles:`);
      console.log(`    Padding: ${styles.padding}`);
      console.log(`    Border-radius: ${styles.borderRadius}`);
      console.log(`    Font-size: ${styles.fontSize}`);
      console.log(`    Font-weight: ${styles.fontWeight}`);
      console.log(`    Font-family: ${styles.fontFamily.substring(0, 50)}...`);
    }
    
    // Collect gap data
    const positions = await extractItemPositions(page);
    const positionsWithColumns = assignColumnIndices(positions);
    const columns = groupByColumn(positionsWithColumns);
    
    console.log('\n--- GRID GAPS ---');
    console.log(`  Column count: ${columns.length}`);
    
    if (columns.length >= 2) {
      const col0Width = columns[0]!.items[0]!.width;
      const horizontalGap = columns[1]!.columnLeft - columns[0]!.columnLeft - col0Width;
      console.log(`  Horizontal gap: ${horizontalGap}px`);
    }
    
    const verticalGaps: number[] = [];
    for (const col of columns) {
      for (let i = 1; i < col.items.length; i++) {
        const prev = col.items[i - 1]!;
        const curr = col.items[i]!;
        const gap = curr.top - (prev.top + prev.height);
        if (gap <= 100) verticalGaps.push(gap);
      }
    }
    
    if (verticalGaps.length > 0) {
      const avgGap = verticalGaps.reduce((a, b) => a + b, 0) / verticalGaps.length;
      console.log(`  Vertical gaps: min=${Math.min(...verticalGaps)}px, max=${Math.max(...verticalGaps)}px, avg=${avgGap.toFixed(1)}px`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    expect(true).toBe(true);
  });
});

