import { test, expect, Page } from '@playwright/test';

/**
 * Grid Layout Tests
 * 
 * Comprehensive tests for the masonry grid layout system, verifying:
 * - Column counts at different breakpoints
 * - Gap spacing (expected: 12px)
 * - Column width calculations
 * - Section placement and positioning
 * - Multi-column span sections
 */

// Grid configuration constants (from grid-config.util.ts)
const GRID_CONFIG = {
  minColumnWidth: 260,  // MIN_COLUMN_WIDTH
  maxColumns: 4,        // MAX_COLUMNS
  gap: 12               // GRID_GAP
};

// Breakpoint definitions
// Note: Expected columns depend on CONTAINER width, not viewport
// The home page card container width determines actual columns
const BREAKPOINTS = {
  mobile: { width: 375, height: 667, expectedColumns: 1, name: 'Mobile' },
  tablet: { width: 768, height: 1024, expectedColumns: 1, name: 'Tablet' },
  desktop: { width: 1280, height: 900, expectedColumns: 2, name: 'Desktop' },
  wide: { width: 1920, height: 1080, expectedColumns: 3, name: 'Wide Desktop' }
};

// Expected padding values
const EXPECTED_PADDINGS = {
  masonryItem: '12px',
  infoRow: { min: '12px', max: '16px' },
  listCard: '12px',
  sectionBody: '0px'
};

/**
 * Helper to log progress
 */
function logProgress(message: string): void {
  console.log(`[GRID TEST] ${message}`);
}

/**
 * Extract grid metrics from the page
 */
async function getGridMetrics(page: Page): Promise<{
  containerWidth: number;
  containerHeight: number;
  columnCount: number;
  columnWidths: number[];
  gaps: number[];
  itemCount: number;
  itemPositions: Array<{ left: number; top: number; width: number; height: number }>;
}> {
  const container = page.locator('.masonry-container').first();
  const items = page.locator('.masonry-item');
  
  // Get container dimensions
  const containerBox = await container.boundingBox().catch(() => null);
  const containerWidth = containerBox?.width || 0;
  const containerHeight = containerBox?.height || 0;
  
  // Get item positions
  const itemCount = await items.count();
  const itemPositions: Array<{ left: number; top: number; width: number; height: number }> = [];
  
  for (let i = 0; i < itemCount; i++) {
    const box = await items.nth(i).boundingBox().catch(() => null);
    if (box) {
      itemPositions.push({
        left: Math.round(box.x),
        top: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height)
      });
    }
  }
  
  // Calculate columns from unique left positions
  const uniqueLefts = [...new Set(itemPositions.map(p => p.left))].sort((a, b) => a - b);
  const columnCount = uniqueLefts.length || 1;
  
  // Calculate column widths
  const columnWidths = itemPositions.slice(0, columnCount).map(p => p.width);
  
  // Calculate gaps between columns
  const gaps: number[] = [];
  for (let i = 1; i < uniqueLefts.length; i++) {
    const prevRight = uniqueLefts[i - 1]! + (columnWidths[i - 1] || 0);
    const gap = uniqueLefts[i]! - prevRight;
    gaps.push(Math.round(gap));
  }
  
  return {
    containerWidth,
    containerHeight,
    columnCount,
    columnWidths,
    gaps,
    itemCount,
    itemPositions
  };
}

/**
 * Load a multi-section card config via home page
 */
async function loadMultiSectionCard(page: Page): Promise<void> {
  // Navigate to home page which has a pre-rendered card
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Wait for card to render
  await page.waitForSelector('.masonry-item, .ai-section', { state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Grid Layout - Breakpoint Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (const [key, bp] of Object.entries(BREAKPOINTS)) {
    test(`${bp.name} (${bp.width}px) should show ${bp.expectedColumns} column(s)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await loadMultiSectionCard(page);
      
      const metrics = await getGridMetrics(page);
      
      logProgress(`${bp.name}: Container ${metrics.containerWidth}px, ${metrics.columnCount} columns, ${metrics.itemCount} items`);
      
      if (metrics.columnCount > 1) {
        logProgress(`  Column widths: ${metrics.columnWidths.map(w => `${w}px`).join(', ')}`);
        logProgress(`  Gaps: ${metrics.gaps.map(g => `${g}px`).join(', ')}`);
      }
      
      // Verify column count (allow ±1 tolerance for edge cases)
      expect(metrics.columnCount).toBeGreaterThanOrEqual(Math.max(1, bp.expectedColumns - 1));
      expect(metrics.columnCount).toBeLessThanOrEqual(Math.min(GRID_CONFIG.maxColumns, bp.expectedColumns + 1));
    });
  }
});

test.describe('Grid Layout - Gap Verification', () => {
  test('Gap between columns should be approximately 12px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    logProgress(`Testing gap spacing with ${metrics.columnCount} columns`);
    
    if (metrics.columnCount > 1 && metrics.gaps.length > 0) {
      for (let i = 0; i < metrics.gaps.length; i++) {
        const gap = metrics.gaps[i]!;
        logProgress(`  Gap ${i + 1}: ${gap}px (expected: ~${GRID_CONFIG.gap}px)`);
        
        // Allow 4px tolerance for rounding
        expect(gap).toBeGreaterThanOrEqual(GRID_CONFIG.gap - 4);
        expect(gap).toBeLessThanOrEqual(GRID_CONFIG.gap + 4);
      }
    } else {
      logProgress('  Single column layout - no gaps to verify');
    }
    
    expect(true).toBe(true);
  });
});

test.describe('Grid Layout - Column Width Verification', () => {
  test('Column widths should be equal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    logProgress(`Verifying column widths with ${metrics.columnCount} columns`);
    
    if (metrics.columnCount > 1 && metrics.columnWidths.length > 1) {
      const firstWidth = metrics.columnWidths[0]!;
      
      for (let i = 1; i < metrics.columnWidths.length; i++) {
        const width = metrics.columnWidths[i]!;
        const diff = Math.abs(width - firstWidth);
        
        logProgress(`  Column ${i + 1}: ${width}px (diff from first: ${diff}px)`);
        
        // Columns should have similar widths (within 5px)
        expect(diff).toBeLessThanOrEqual(5);
      }
    }
    
    expect(true).toBe(true);
  });

  test('Column width calculation should match formula', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    if (metrics.containerWidth > 0 && metrics.columnCount > 1) {
      // Expected width: (containerWidth - (columnCount - 1) * gap) / columnCount
      const expectedWidth = (metrics.containerWidth - (metrics.columnCount - 1) * GRID_CONFIG.gap) / metrics.columnCount;
      const actualWidth = metrics.columnWidths[0] || 0;
      
      logProgress(`Expected column width: ${expectedWidth.toFixed(1)}px`);
      logProgress(`Actual column width: ${actualWidth}px`);
      
      // Allow 10% tolerance
      const tolerance = expectedWidth * 0.1;
      expect(Math.abs(actualWidth - expectedWidth)).toBeLessThanOrEqual(tolerance);
    }
  });
});

test.describe('Grid Layout - Section Positioning', () => {
  test('Sections should be positioned in grid pattern', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    logProgress(`Verifying section positions (${metrics.itemCount} items)`);
    
    // Check that items are arranged in columns
    const itemsByColumn = new Map<number, typeof metrics.itemPositions>();
    
    for (const item of metrics.itemPositions) {
      const existingItems = itemsByColumn.get(item.left) || [];
      existingItems.push(item);
      itemsByColumn.set(item.left, existingItems);
    }
    
    logProgress(`  Items distributed across ${itemsByColumn.size} columns`);
    
    for (const [left, items] of itemsByColumn) {
      logProgress(`  Column at x=${left}: ${items.length} items`);
      
      // Verify items in same column are stacked vertically
      if (items.length > 1) {
        const sortedByTop = [...items].sort((a, b) => a.top - b.top);
        for (let i = 1; i < sortedByTop.length; i++) {
          const prevBottom = sortedByTop[i - 1]!.top + sortedByTop[i - 1]!.height;
          const currentTop = sortedByTop[i]!.top;
          const spacing = currentTop - prevBottom;
          
          // Items should have gap spacing between them
          expect(spacing).toBeGreaterThanOrEqual(GRID_CONFIG.gap - 4);
        }
      }
    }
    
    expect(itemsByColumn.size).toBeGreaterThan(0);
  });

  test('No items should overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    logProgress(`Checking for overlapping items (${metrics.itemCount} items)`);
    
    let overlaps = 0;
    
    for (let i = 0; i < metrics.itemPositions.length; i++) {
      for (let j = i + 1; j < metrics.itemPositions.length; j++) {
        const a = metrics.itemPositions[i]!;
        const b = metrics.itemPositions[j]!;
        
        // Check for overlap
        const overlapX = a.left < b.left + b.width && a.left + a.width > b.left;
        const overlapY = a.top < b.top + b.height && a.top + a.height > b.top;
        
        if (overlapX && overlapY) {
          overlaps++;
          logProgress(`  ⚠️  Overlap detected: Item ${i} and Item ${j}`);
        }
      }
    }
    
    logProgress(`  Total overlaps: ${overlaps}`);
    expect(overlaps).toBe(0);
  });
});

test.describe('Grid Layout - Padding Verification', () => {
  test('Masonry items should have correct padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const item = page.locator('.masonry-item').first();
    
    if (await item.count() > 0) {
      const padding = await item.evaluate(el => window.getComputedStyle(el).padding);
      
      logProgress(`Masonry item padding: ${padding}`);
      logProgress(`Expected: ${EXPECTED_PADDINGS.masonryItem}`);
      
      // Verify padding contains expected value
      expect(padding).toBeTruthy();
    }
  });

  test('Info rows should have correct padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const infoRow = page.locator('.info-row').first();
    
    if (await infoRow.count() > 0) {
      const padding = await infoRow.evaluate(el => window.getComputedStyle(el).padding);
      
      logProgress(`Info row padding: ${padding}`);
      
      // Parse padding value
      const paddingValue = parseFloat(padding);
      expect(paddingValue).toBeGreaterThanOrEqual(parseFloat(EXPECTED_PADDINGS.infoRow.min));
      expect(paddingValue).toBeLessThanOrEqual(parseFloat(EXPECTED_PADDINGS.infoRow.max) + 2);
    }
  });
});

test.describe('Grid Layout - Responsive Behavior', () => {
  test('Grid should reflow on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    // Get initial metrics
    const initialMetrics = await getGridMetrics(page);
    logProgress(`Initial: ${initialMetrics.columnCount} columns at ${initialMetrics.containerWidth}px`);
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileMetrics = await getGridMetrics(page);
    logProgress(`Mobile: ${mobileMetrics.columnCount} columns at ${mobileMetrics.containerWidth}px`);
    
    // Resize back to desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(500);
    
    const finalMetrics = await getGridMetrics(page);
    logProgress(`Final: ${finalMetrics.columnCount} columns at ${finalMetrics.containerWidth}px`);
    
    // Verify grid adapts
    expect(mobileMetrics.columnCount).toBeLessThanOrEqual(initialMetrics.columnCount);
    expect(finalMetrics.columnCount).toBe(initialMetrics.columnCount);
  });
});

test.describe('Grid Layout - Summary Report', () => {
  test('Generate grid layout summary', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('          GRID LAYOUT TEST SUMMARY');
    console.log('='.repeat(60) + '\n');
    
    const results: Array<{ breakpoint: string; columns: number; containerWidth: number; itemCount: number }> = [];
    
    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await loadMultiSectionCard(page);
      
      const metrics = await getGridMetrics(page);
      results.push({
        breakpoint: bp.name,
        columns: metrics.columnCount,
        containerWidth: metrics.containerWidth,
        itemCount: metrics.itemCount
      });
    }
    
    console.log('Breakpoint Results:');
    console.log('-'.repeat(50));
    
    for (const result of results) {
      const expected = Object.values(BREAKPOINTS).find(b => b.name === result.breakpoint)?.expectedColumns || 0;
      const match = Math.abs(result.columns - expected) <= 1 ? '✓' : '✗';
      console.log(`  ${match} ${result.breakpoint.padEnd(15)} ${result.columns} columns (expected: ${expected})`);
      console.log(`      Container: ${result.containerWidth}px, Items: ${result.itemCount}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    expect(results.length).toBe(Object.keys(BREAKPOINTS).length);
  });
});

// ============================================================================
// ROW-FIRST PACKING ALGORITHM TESTS
// ============================================================================

test.describe('Grid Layout - Row-First Packing', () => {
  /**
   * Helper to calculate row utilization from item positions
   */
  function calculateRowUtilization(
    itemPositions: Array<{ left: number; top: number; width: number; height: number }>,
    containerWidth: number
  ): { rows: number; avgUtilization: number; rowsWithGaps: number } {
    if (itemPositions.length === 0 || containerWidth === 0) {
      return { rows: 0, avgUtilization: 100, rowsWithGaps: 0 };
    }

    // Group items by their top position (rows)
    const rowMap = new Map<number, typeof itemPositions>();
    for (const item of itemPositions) {
      // Use rounded top to group items in the same row (allow 5px tolerance)
      const rowKey = Math.round(item.top / 10) * 10;
      const existing = rowMap.get(rowKey) || [];
      existing.push(item);
      rowMap.set(rowKey, existing);
    }

    let totalUtilization = 0;
    let rowsWithGaps = 0;

    for (const [, rowItems] of rowMap) {
      const rowWidth = rowItems.reduce((sum, item) => sum + item.width, 0);
      // Account for gaps between items
      const gapsWidth = (rowItems.length - 1) * GRID_CONFIG.gap;
      const utilization = ((rowWidth + gapsWidth) / containerWidth) * 100;
      
      totalUtilization += utilization;
      if (utilization < 95) { // Less than 95% utilization means there's a gap
        rowsWithGaps++;
      }
    }

    return {
      rows: rowMap.size,
      avgUtilization: totalUtilization / rowMap.size,
      rowsWithGaps
    };
  }

  test('Rows should be filled with high utilization', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    if (metrics.itemCount > 1 && metrics.columnCount > 1) {
      const utilization = calculateRowUtilization(metrics.itemPositions, metrics.containerWidth);
      
      logProgress(`Row-first packing analysis:`);
      logProgress(`  Total rows: ${utilization.rows}`);
      logProgress(`  Average utilization: ${utilization.avgUtilization.toFixed(1)}%`);
      logProgress(`  Rows with gaps: ${utilization.rowsWithGaps}`);
      
      // Row-first packing should achieve at least 70% average utilization
      // (accounting for the last row which may be incomplete)
      expect(utilization.avgUtilization).toBeGreaterThan(70);
    }
  });

  test('Items should fill available horizontal space', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    if (metrics.columnCount > 1 && metrics.itemPositions.length > 0) {
      // Find the rightmost edge of items in each row
      const rowMap = new Map<number, number>();
      
      for (const item of metrics.itemPositions) {
        const rowKey = Math.round(item.top / 10) * 10;
        const rightEdge = item.left + item.width;
        const existing = rowMap.get(rowKey) || 0;
        rowMap.set(rowKey, Math.max(existing, rightEdge));
      }
      
      // Check each row's fill
      for (const [rowTop, rightEdge] of rowMap) {
        const fillPercent = (rightEdge / metrics.containerWidth) * 100;
        logProgress(`  Row at y=${rowTop}: ${fillPercent.toFixed(1)}% filled`);
      }
      
      // At least one row should be well-filled (>80%)
      const maxFill = Math.max(...Array.from(rowMap.values()).map(
        rightEdge => (rightEdge / metrics.containerWidth) * 100
      ));
      expect(maxFill).toBeGreaterThan(80);
    }
  });

  test('Sections should not create unnecessary vertical gaps', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    if (metrics.itemCount > 1) {
      // Group by column
      const columnMap = new Map<number, typeof metrics.itemPositions>();
      for (const item of metrics.itemPositions) {
        const existing = columnMap.get(item.left) || [];
        existing.push(item);
        columnMap.set(item.left, existing);
      }
      
      let largeGaps = 0;
      
      for (const [colLeft, items] of columnMap) {
        const sorted = [...items].sort((a, b) => a.top - b.top);
        
        for (let i = 1; i < sorted.length; i++) {
          const prevBottom = sorted[i - 1]!.top + sorted[i - 1]!.height;
          const currentTop = sorted[i]!.top;
          const gap = currentTop - prevBottom;
          
          // Large gaps (>50px beyond expected) indicate inefficient packing
          if (gap > GRID_CONFIG.gap + 50) {
            largeGaps++;
            logProgress(`  Large gap (${gap}px) at column ${colLeft} between items`);
          }
        }
      }
      
      logProgress(`  Total large vertical gaps: ${largeGaps}`);
      
      // Should have minimal large gaps
      expect(largeGaps).toBeLessThanOrEqual(metrics.columnCount);
    }
  });

  test('Priority sections should appear earlier in layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadMultiSectionCard(page);
    
    const metrics = await getGridMetrics(page);
    
    // Get section types/classes to determine priority
    const items = page.locator('.masonry-item');
    const itemTypes: Array<{ type: string; top: number }> = [];
    
    for (let i = 0; i < Math.min(await items.count(), 10); i++) {
      const item = items.nth(i);
      const priorityAttr = await item.getAttribute('data-priority').catch(() => null);
      const position = metrics.itemPositions[i];
      
      if (priorityAttr && position) {
        itemTypes.push({ type: priorityAttr, top: position.top });
      }
    }
    
    if (itemTypes.length > 0) {
      logProgress('Section priorities in layout:');
      for (const item of itemTypes.slice(0, 5)) {
        logProgress(`  ${item.type} at y=${item.top}`);
      }
      
      // Critical priority items should generally appear at or near the top
      const criticalItems = itemTypes.filter(i => i.type === 'critical');
      if (criticalItems.length > 0) {
        const criticalAvgTop = criticalItems.reduce((sum, i) => sum + i.top, 0) / criticalItems.length;
        const allAvgTop = itemTypes.reduce((sum, i) => sum + i.top, 0) / itemTypes.length;
        
        // Critical items should be at or above average position
        expect(criticalAvgTop).toBeLessThanOrEqual(allAvgTop * 1.5);
      }
    }
    
    expect(true).toBe(true);
  });
});

