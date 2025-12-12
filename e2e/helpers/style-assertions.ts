/**
 * Style Assertions Helper
 *
 * Provides reusable assertion functions for visual regression testing.
 * Validates CSS properties, animations, layout structure, and visual consistency.
 *
 * CORRECT SELECTORS (from actual DOM):
 * - .masonry-container - Grid container
 * - .masonry-item - Section card wrapper
 * - .info-row - Field row in info section
 * - .info-row__label - Field label
 * - .info-row__value - Field value
 * - .ai-section__header - Section header
 * - .ai-section__title - Section title
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Section type definitions matching the library's built-in sections
 */
export const SECTION_TYPES = [
  'overview', 'info', 'analytics', 'financials', 'list', 'event',
  'product', 'solutions', 'contact-card', 'network-card', 'map',
  'chart', 'quotation', 'text-reference', 'brand-colors'
] as const;

export type SectionType = typeof SECTION_TYPES[number];

/**
 * CSS class for each section type
 */
export const SECTION_CSS_CLASSES: Record<SectionType, string> = {
  'overview': '.ai-section--overview',
  'info': '.ai-section--info',
  'analytics': '.ai-section--analytics',
  'financials': '.ai-section--financials',
  'list': '.ai-section--list',
  'event': '.ai-section--event',
  'product': '.ai-section--product',
  'solutions': '.ai-section--solutions',
  'contact-card': '.ai-section--contact',
  'network-card': '.ai-section--network-card',
  'map': '.ai-section--map',
  'chart': '.ai-section--chart',
  'quotation': '.ai-section--quotation',
  'text-reference': '.ai-section--text-reference',
  'brand-colors': '.ai-section--brand-colors'
};

/**
 * Animation states for streaming simulation
 */
export interface AnimationState {
  className: string;
  expectedOpacity: string;
  expectedTransform: RegExp;
}

export const ANIMATION_STATES = {
  sectionStreaming: {
    className: 'section-streaming',
    expectedOpacity: '0',
    expectedTransform: /translate3d\(0(px)?, 20px, 0(px)?\)/
  },
  sectionEntered: {
    className: 'section-entered',
    expectedOpacity: '1',
    expectedTransform: /matrix\(1, 0, 0, 1, 0, 0\)|none|translate3d\(0(px)?, 0(px)?, 0(px)?\)/
  },
  fieldStreaming: {
    className: 'field-streaming',
    expectedOpacity: '0',
    expectedTransform: /translate3d\(0(px)?, 10px, 0(px)?\)/
  },
  fieldEntered: {
    className: 'field-entered',
    expectedOpacity: '1',
    expectedTransform: /matrix\(1, 0, 0, 1, 0, 0\)|none|translate3d\(0(px)?, 0(px)?, 0(px)?\)/
  },
  itemStreaming: {
    className: 'item-streaming',
    expectedOpacity: '0',
    expectedTransform: /translate3d\(-10px, 0(px)?, 0(px)?\)/
  },
  itemEntered: {
    className: 'item-entered',
    expectedOpacity: '1',
    expectedTransform: /matrix\(1, 0, 0, 1, 0, 0\)|none|translate3d\(0(px)?, 0(px)?, 0(px)?\)/
  }
};

/**
 * Extracted computed styles from an element
 */
export interface ComputedStyles {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderRadius: string;
  padding: string;
  margin: string;
  gap: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
  display: string;
  flexDirection: string;
  alignItems: string;
  opacity: string;
  transform: string;
  animationName: string;
  animationDuration: string;
  animationDelay: string;
  boxShadow: string;
}

/**
 * Extract computed styles from an element
 */
export async function getComputedStyles(locator: Locator): Promise<ComputedStyles> {
  return locator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      margin: computed.margin,
      gap: computed.gap,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontFamily: computed.fontFamily,
      lineHeight: computed.lineHeight,
      display: computed.display,
      flexDirection: computed.flexDirection,
      alignItems: computed.alignItems,
      opacity: computed.opacity,
      transform: computed.transform,
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      animationDelay: computed.animationDelay,
      boxShadow: computed.boxShadow
    };
  });
}

/**
 * Assert that an element has specific CSS properties
 */
export async function assertStyles(
  locator: Locator,
  expectedStyles: Partial<ComputedStyles>,
  tolerance: number = 0
): Promise<{ passed: boolean; failures: string[] }> {
  const actual = await getComputedStyles(locator);
  const failures: string[] = [];

  for (const [prop, expected] of Object.entries(expectedStyles)) {
    const actualValue = actual[prop as keyof ComputedStyles];

    if (expected instanceof RegExp) {
      if (!expected.test(actualValue)) {
        failures.push(`${prop}: expected to match ${expected}, got "${actualValue}"`);
      }
    } else if (tolerance > 0 && isNumericValue(expected) && isNumericValue(actualValue)) {
      const expNum = parseFloat(expected);
      const actNum = parseFloat(actualValue);
      if (Math.abs(expNum - actNum) > tolerance) {
        failures.push(`${prop}: expected ${expected} (±${tolerance}), got "${actualValue}"`);
      }
    } else if (actualValue !== expected) {
      failures.push(`${prop}: expected "${expected}", got "${actualValue}"`);
    }
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Check if a value is numeric (e.g., "16px", "1.5")
 */
function isNumericValue(value: string): boolean {
  return /^-?\d+(\.\d+)?(px|em|rem|%)?$/.test(value);
}

/**
 * Wait for section to render and return its locator
 */
export async function waitForSection(
  page: Page,
  sectionType: SectionType,
  timeout: number = 5000
): Promise<Locator> {
  const selector = SECTION_CSS_CLASSES[sectionType];
  await page.waitForSelector(selector, { state: 'visible', timeout });
  return page.locator(selector).first();
}

/**
 * Assert that a section exists and is visible
 */
export async function assertSectionVisible(
  page: Page,
  sectionType: SectionType
): Promise<void> {
  const selector = SECTION_CSS_CLASSES[sectionType];
  const section = page.locator(selector).first();
  await expect(section).toBeVisible({ timeout: 5000 });
}

/**
 * Assert animation has completed (entered state)
 */
export async function assertAnimationComplete(
  locator: Locator,
  type: 'section' | 'field' | 'item' = 'section'
): Promise<void> {
  const enteredState = type === 'section'
    ? ANIMATION_STATES.sectionEntered
    : type === 'field'
      ? ANIMATION_STATES.fieldEntered
      : ANIMATION_STATES.itemEntered;

  const styles = await getComputedStyles(locator);

  expect(styles.opacity).toBe(enteredState.expectedOpacity);
  expect(styles.transform).toMatch(enteredState.expectedTransform);
}

/**
 * Assert stagger animation delays are correctly applied
 */
export async function assertStaggerDelays(
  page: Page,
  selector: string,
  expectedIncrementMs: number
): Promise<{ valid: boolean; delays: number[]; issues: string[] }> {
  const elements = page.locator(selector);
  const count = await elements.count();
  const delays: number[] = [];
  const issues: string[] = [];

  for (let i = 0; i < count; i++) {
    const delay = await elements.nth(i).evaluate((el) => {
      return window.getComputedStyle(el).animationDelay;
    });
    const delayMs = parseFloat(delay) * (delay.includes('ms') ? 1 : 1000);
    delays.push(delayMs);
  }

  // Check that delays increment correctly
  for (let i = 1; i < delays.length; i++) {
    const diff = delays[i] - delays[i - 1];
    if (Math.abs(diff - expectedIncrementMs) > 5) { // 5ms tolerance
      issues.push(`Delay between item ${i-1} and ${i}: expected ${expectedIncrementMs}ms, got ${diff}ms`);
    }
  }

  return { valid: issues.length === 0, delays, issues };
}

/**
 * Assert masonry grid column count
 */
export async function assertColumnCount(
  page: Page,
  expectedColumns: number,
  tolerance: number = 0
): Promise<void> {
  const items = page.locator('.masonry-item');
  const count = await items.count();

  if (count === 0) {
    throw new Error('No masonry items found');
  }

  const uniqueLeftPositions = await items.evaluateAll((elements) => {
    const lefts = new Set(elements.map((el) => {
      const style = (el as HTMLElement).style.left;
      return style || window.getComputedStyle(el).left;
    }));
    return lefts.size;
  });

  if (tolerance > 0) {
    expect(uniqueLeftPositions).toBeGreaterThanOrEqual(expectedColumns - tolerance);
    expect(uniqueLeftPositions).toBeLessThanOrEqual(expectedColumns + tolerance);
  } else {
    expect(uniqueLeftPositions).toBe(expectedColumns);
  }
}

/**
 * Assert loading state is visible
 */
export async function assertLoadingState(
  page: Page,
  shouldBeVisible: boolean = true
): Promise<void> {
  const spinner = page.locator('.loading-spinner');

  if (shouldBeVisible) {
    await expect(spinner).toBeVisible({ timeout: 3000 });
  } else {
    await expect(spinner).not.toBeVisible({ timeout: 3000 });
  }
}

/**
 * Assert loading spinner animation is active
 */
export async function assertSpinnerAnimating(page: Page): Promise<void> {
  const spinner = page.locator('.spinner-svg');
  await expect(spinner).toBeVisible();

  const animation = await spinner.evaluate((el) => {
    return window.getComputedStyle(el).animationName;
  });

  expect(animation).toContain('spinner-rotate');
}

/**
 * Assert particles animation is active
 */
export async function assertParticlesAnimating(page: Page): Promise<void> {
  const particles = page.locator('.loading-particles .particle');
  const count = await particles.count();

  expect(count).toBeGreaterThan(0);

  const animation = await particles.first().evaluate((el) => {
    return window.getComputedStyle(el).animationName;
  });

  expect(animation).toContain('particle-float');
}

/**
 * Load a card configuration into the JSON editor
 */
export async function loadCardConfig(page: Page, config: object): Promise<void> {
  const jsonEditor = page.locator('app-json-editor textarea');
  if (await jsonEditor.count() > 0) {
    await jsonEditor.fill(JSON.stringify(config));
    // Wait for rendering
    await page.waitForTimeout(1500);
  }
}

/**
 * Generate a test card config for a specific section type
 */
export function generateSectionConfig(sectionType: SectionType): object {
  const baseConfig = {
    cardTitle: `${sectionType} Section Test`,
    sections: [] as object[]
  };

  const sectionConfigs: Record<SectionType, object> = {
    'overview': {
      type: 'overview',
      title: 'Company Overview',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Founded', value: '2010' },
        { label: 'Employees', value: '250' }
      ]
    },
    'info': {
      type: 'info',
      title: 'Information',
      fields: [
        { label: 'Name', value: 'Test Item' },
        { label: 'Status', value: 'Active' }
      ]
    },
    'analytics': {
      type: 'analytics',
      title: 'Metrics',
      fields: [
        { label: 'Revenue', value: 1250000, format: 'currency', trend: 'up', change: 15.5 },
        { label: 'Users', value: 5432, format: 'number', trend: 'up', change: 8.2 }
      ]
    },
    'financials': {
      type: 'financials',
      title: 'Financial Overview',
      fields: [
        { label: 'Revenue', value: 2500000, format: 'currency', trend: 'up' },
        { label: 'Profit', value: 700000, format: 'currency', trend: 'up' }
      ]
    },
    'list': {
      type: 'list',
      title: 'Items',
      items: [
        { title: 'Item 1', value: 'Active', status: 'in-progress' },
        { title: 'Item 2', value: 'Completed', status: 'completed' }
      ]
    },
    'event': {
      type: 'event',
      title: 'Events',
      fields: [
        { label: 'Launch', value: '2024-12-15', description: 'Product launch', status: 'pending' }
      ]
    },
    'product': {
      type: 'product',
      title: 'Products',
      fields: [
        { label: 'Product A', value: '$99/month', description: 'Feature-rich solution' }
      ]
    },
    'solutions': {
      type: 'solutions',
      title: 'Solutions',
      fields: [
        { label: 'Cloud Migration', value: 'Infrastructure migration', benefits: ['Scalability', 'Security'] }
      ]
    },
    'contact-card': {
      type: 'contact-card',
      title: 'Contacts',
      fields: [
        { label: 'Jane Smith', value: 'CEO', email: 'jane@example.com', phone: '+1-555-0123' }
      ]
    },
    'network-card': {
      type: 'network-card',
      title: 'Network',
      fields: [
        { label: 'Alice Johnson', value: 'Director', connections: 245, strength: 85 }
      ]
    },
    'map': {
      type: 'map',
      title: 'Locations',
      fields: [
        { label: 'HQ', value: 'New York, NY', address: '123 Main St', coordinates: { lat: 40.7128, lng: -74.0060 } }
      ]
    },
    'chart': {
      type: 'chart',
      title: 'Performance',
      chartType: 'bar',
      fields: [
        { label: 'Q1', value: 30000 },
        { label: 'Q2', value: 45000 }
      ]
    },
    'quotation': {
      type: 'quotation',
      title: 'Testimonials',
      fields: [
        { label: 'John Smith', value: 'Great product!', role: 'CEO' }
      ]
    },
    'text-reference': {
      type: 'text-reference',
      title: 'References',
      fields: [
        { label: 'Source 1', value: 'Industry Report 2024', url: 'https://example.com' }
      ]
    },
    'brand-colors': {
      type: 'brand-colors',
      title: 'Brand Colors',
      fields: [
        { label: 'Primary', value: '#FF7900' },
        { label: 'Secondary', value: '#000000' }
      ]
    }
  };

  baseConfig.sections.push(sectionConfigs[sectionType]);
  return baseConfig;
}

/**
 * Generate a multi-section card config for layout testing
 */
export function generateMultiSectionConfig(sectionCount: number = 6): object {
  const sections: object[] = [];
  const types: SectionType[] = ['overview', 'info', 'analytics', 'list', 'event', 'chart'];

  for (let i = 0; i < sectionCount; i++) {
    const type = types[i % types.length];
    const config = generateSectionConfig(type);
    sections.push((config as { sections: object[] }).sections[0]);
  }

  return {
    cardTitle: 'Multi-Section Test Card',
    sections
  };
}

/**
 * Report helper - generates detailed mismatch report
 */
export interface StyleMismatchReport {
  element: string;
  selector: string;
  mismatches: Array<{
    property: string;
    expected: string;
    actual: string;
  }>;
}

export async function generateMismatchReport(
  page: Page,
  expectedStyles: Map<string, Partial<ComputedStyles>>
): Promise<StyleMismatchReport[]> {
  const reports: StyleMismatchReport[] = [];

  for (const [selector, expected] of expectedStyles) {
    const locator = page.locator(selector).first();
    if (await locator.count() === 0) {
      reports.push({
        element: selector,
        selector,
        mismatches: [{ property: 'existence', expected: 'present', actual: 'not found' }]
      });
      continue;
    }

    const result = await assertStyles(locator, expected);
    if (!result.passed) {
      reports.push({
        element: selector,
        selector,
        mismatches: result.failures.map(f => {
          const match = f.match(/(.+): expected "?(.+?)"?, got "(.+)"/);
          if (match) {
            return { property: match[1], expected: match[2], actual: match[3] };
          }
          return { property: 'unknown', expected: '', actual: f };
        })
      });
    }
  }

  return reports;
}

/**
 * CORRECT DOM SELECTORS based on actual component structure
 */
export const DOM_SELECTORS = {
  // Masonry Grid
  masonryContainer: '.masonry-container',
  masonryItem: '.masonry-item',

  // Section structure
  section: '.ai-section',
  sectionHeader: '.ai-section__header',
  sectionTitle: '.ai-section__title',
  sectionBody: '.ai-section__body',
  sectionBadge: '.ai-section__badge',

  // Info section fields
  infoRow: '.info-row',
  infoRowLabel: '.info-row__label',
  infoRowValue: '.info-row__value',
  infoRowDescription: '.info-row__description',

  // Analytics
  analyticsMetric: '.analytics-metric',
  metricValue: '.metric-value',
  metricLabel: '.metric-label',

  // Contact card
  contactCard: '.contact-card',
  contactAvatar: '.contact-avatar',
  contactName: '.contact-name',
  contactRole: '.contact-role',

  // List items
  listItem: '.list-item',
  solutionItem: '.solution-item',

  // Card structure
  cardSurface: '.ai-card-surface',
  cardHeader: '.ai-card-header',
  cardTitle: '.ai-card-title',
  cardActions: '.ai-card-actions',
  cardAction: '.ai-card-action',
  cardSignature: '.card-signature',

  // Loading states
  loadingSpinner: '.loading-spinner',
  spinnerSvg: '.spinner-svg',
  loadingParticles: '.loading-particles',
  particle: '.particle',
  skeleton: '.skeleton-card',

  // Animation classes
  sectionStreaming: '.section-streaming',
  sectionEntered: '.section-entered',
  fieldStreaming: '.field-streaming',
  fieldEntered: '.field-entered',
  itemStreaming: '.item-streaming',
  itemEntered: '.item-entered'
};

/**
 * Get element from Shadow DOM
 */
export async function getShadowElement(
  page: Page,
  hostSelector: string,
  innerSelector: string
): Promise<Locator | null> {
  const host = page.locator(hostSelector).first();
  if (await host.count() === 0) return null;

  // Use evaluate to access shadow root
  const exists = await host.evaluate((el, selector) => {
    const shadowRoot = el.shadowRoot;
    if (!shadowRoot) return false;
    return shadowRoot.querySelector(selector) !== null;
  }, innerSelector);

  if (!exists) return null;

  // Return a locator that can work with shadow DOM
  return page.locator(`${hostSelector} >> ${innerSelector}`);
}

/**
 * Get computed styles from Shadow DOM element
 */
export async function getShadowStyles(
  page: Page,
  hostSelector: string,
  innerSelector: string
): Promise<ComputedStyles | null> {
  const host = page.locator(hostSelector).first();
  if (await host.count() === 0) return null;

  return host.evaluate((el, selector) => {
    const shadowRoot = el.shadowRoot;
    if (!shadowRoot) return null;

    const target = shadowRoot.querySelector(selector);
    if (!target) return null;

    const computed = window.getComputedStyle(target);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      margin: computed.margin,
      gap: computed.gap,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontFamily: computed.fontFamily,
      lineHeight: computed.lineHeight,
      display: computed.display,
      flexDirection: computed.flexDirection,
      alignItems: computed.alignItems,
      opacity: computed.opacity,
      transform: computed.transform,
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      animationDelay: computed.animationDelay,
      boxShadow: computed.boxShadow
    };
  }, innerSelector);
}

/**
 * Count elements in Shadow DOM
 */
export async function countShadowElements(
  page: Page,
  hostSelector: string,
  innerSelector: string
): Promise<number> {
  const host = page.locator(hostSelector).first();
  if (await host.count() === 0) return 0;

  return host.evaluate((el, selector) => {
    const shadowRoot = el.shadowRoot;
    if (!shadowRoot) return 0;
    return shadowRoot.querySelectorAll(selector).length;
  }, innerSelector);
}

/**
 * Test result interface for CEO report
 */
export interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'skip';
  duration?: number;
  details?: string;
}

/**
 * CEO Report data structure
 */
export interface CEOReport {
  date: string;
  version: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  sections: {
    name: string;
    status: 'pass' | 'fail' | 'skip';
  }[];
  animations: {
    name: string;
    status: 'pass' | 'fail';
    details?: string;
  }[];
  cssValidation: {
    category: string;
    passRate: number;
    issues: string[];
  }[];
  responsiveLayouts: {
    viewport: string;
    columns: number;
    status: 'pass' | 'fail';
  }[];
}

/**
 * Format CEO report as string
 */
export function formatCEOReport(report: CEOReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(50));
  lines.push('       OSI-CARDS VISUAL TEST REPORT');
  lines.push('='.repeat(50));
  lines.push(`Date: ${report.date}`);
  lines.push(`Version: ${report.version}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`  Total Tests: ${report.summary.total}`);
  lines.push(`  Passed: ${report.summary.passed}`);
  lines.push(`  Failed: ${report.summary.failed}`);
  lines.push(`  Skipped: ${report.summary.skipped}`);
  lines.push(`  Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
  lines.push('');

  // Section Coverage
  const passedSections = report.sections.filter(s => s.status === 'pass').length;
  lines.push(`SECTION COVERAGE (${passedSections}/${report.sections.length})`);

  const sectionRows: string[] = [];
  for (let i = 0; i < report.sections.length; i += 3) {
    const row = report.sections.slice(i, i + 3)
      .map(s => `${s.status === 'pass' ? '✓' : s.status === 'fail' ? '✗' : '○'} ${s.name.padEnd(12)}`)
      .join(' ');
    sectionRows.push(`  ${row}`);
  }
  lines.push(...sectionRows);
  lines.push('');

  // Animation Status
  lines.push('ANIMATION STATUS');
  for (const anim of report.animations) {
    const icon = anim.status === 'pass' ? '✓' : '✗';
    lines.push(`  ${icon} ${anim.name}${anim.details ? ` (${anim.details})` : ''}`);
  }
  lines.push('');

  // CSS Validation
  lines.push('CSS VALIDATION');
  for (const css of report.cssValidation) {
    lines.push(`  ${css.category}: ${css.passRate.toFixed(0)}% consistent`);
    if (css.issues.length > 0) {
      css.issues.slice(0, 3).forEach(issue => {
        lines.push(`    - ${issue}`);
      });
    }
  }
  lines.push('');

  // Responsive Layouts
  lines.push('RESPONSIVE LAYOUTS');
  for (const layout of report.responsiveLayouts) {
    const icon = layout.status === 'pass' ? '✓' : '✗';
    lines.push(`  ${icon} ${layout.viewport.padEnd(16)} - ${layout.columns} column${layout.columns > 1 ? 's' : ''}`);
  }

  lines.push('');
  lines.push('='.repeat(50));
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// GRID TESTING HELPERS
// ============================================================================

/**
 * Grid configuration constants
 */
export const GRID_CONFIG = {
  minColumnWidth: 260,
  maxColumns: 4,
  gap: 12
};

/**
 * Expected breakpoint column counts
 */
export const BREAKPOINT_COLUMNS = {
  375: 1,   // Mobile
  768: 2,   // Tablet
  1024: 3,  // Desktop
  1280: 3,  // Large Desktop
  1920: 4   // Wide
};

/**
 * Grid metrics interface
 */
export interface GridMetrics {
  containerWidth: number;
  containerHeight: number;
  columnCount: number;
  columnWidths: number[];
  gaps: number[];
  itemCount: number;
  itemPositions: Array<{ left: number; top: number; width: number; height: number }>;
}

/**
 * Extract grid metrics from the masonry container
 */
export async function getGridMetrics(page: Page): Promise<GridMetrics> {
  const container = page.locator(DOM_SELECTORS.masonryContainer).first();
  const items = page.locator(DOM_SELECTORS.masonryItem);

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
 * Assert that the grid has the expected number of columns
 */
export async function assertGridColumns(
  page: Page,
  expectedColumns: number,
  tolerance: number = 1
): Promise<{ passed: boolean; actual: number; message: string }> {
  const metrics = await getGridMetrics(page);

  const minExpected = Math.max(1, expectedColumns - tolerance);
  const maxExpected = Math.min(GRID_CONFIG.maxColumns, expectedColumns + tolerance);

  const passed = metrics.columnCount >= minExpected && metrics.columnCount <= maxExpected;

  return {
    passed,
    actual: metrics.columnCount,
    message: passed
      ? `Grid has ${metrics.columnCount} columns (expected: ${expectedColumns}±${tolerance})`
      : `Grid has ${metrics.columnCount} columns but expected ${expectedColumns}±${tolerance}`
  };
}

/**
 * Assert that the grid gap matches expected value
 */
export async function assertGridGap(
  page: Page,
  expectedGap: number = GRID_CONFIG.gap,
  tolerance: number = 4
): Promise<{ passed: boolean; actual: number[]; message: string }> {
  const metrics = await getGridMetrics(page);

  if (metrics.gaps.length === 0) {
    return {
      passed: true,
      actual: [],
      message: 'Single column layout - no gaps to verify'
    };
  }

  const allGapsValid = metrics.gaps.every(gap =>
    gap >= expectedGap - tolerance && gap <= expectedGap + tolerance
  );

  return {
    passed: allGapsValid,
    actual: metrics.gaps,
    message: allGapsValid
      ? `Grid gaps are ${metrics.gaps.join(', ')}px (expected: ~${expectedGap}px)`
      : `Grid gaps ${metrics.gaps.join(', ')}px don't match expected ${expectedGap}±${tolerance}px`
  };
}

/**
 * Assert padding matches expected value
 */
export async function assertPadding(
  locator: Locator,
  expected: string | { min: string; max: string },
  tolerance: number = 2
): Promise<{ passed: boolean; actual: string; message: string }> {
  const actual = await locator.evaluate(el => window.getComputedStyle(el).padding);

  if (typeof expected === 'string') {
    // Simple exact match with tolerance
    const actualValue = parseFloat(actual);
    const expectedValue = parseFloat(expected);
    const passed = Math.abs(actualValue - expectedValue) <= tolerance;

    return {
      passed,
      actual,
      message: passed
        ? `Padding ${actual} matches expected ${expected}`
        : `Padding ${actual} doesn't match expected ${expected}`
    };
  } else {
    // Range check
    const actualValue = parseFloat(actual);
    const minValue = parseFloat(expected.min);
    const maxValue = parseFloat(expected.max);
    const passed = actualValue >= minValue - tolerance && actualValue <= maxValue + tolerance;

    return {
      passed,
      actual,
      message: passed
        ? `Padding ${actual} is within range ${expected.min}-${expected.max}`
        : `Padding ${actual} is outside range ${expected.min}-${expected.max}`
    };
  }
}

/**
 * Animation lifecycle states
 */
export interface AnimationLifecycleState {
  initial: { opacity: string; transform: string };
  animating: { animationName: string; animationDuration: string; animationDelay: string };
  final: { opacity: string; transform: string };
}

/**
 * Assert animation lifecycle is correct
 */
export async function assertAnimationLifecycle(
  locator: Locator,
  expectedAnimation: string = 'field-stream'
): Promise<{ passed: boolean; state: Partial<AnimationLifecycleState>; message: string }> {
  const state = await locator.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      animationDelay: computed.animationDelay,
      opacity: computed.opacity,
      transform: computed.transform
    };
  });

  // After animations complete, opacity should be 1
  const isComplete = parseFloat(state.opacity) >= 0.99;
  const hasAnimation = state.animationName !== 'none';

  return {
    passed: isComplete,
    state: {
      animating: {
        animationName: state.animationName,
        animationDuration: state.animationDuration,
        animationDelay: state.animationDelay
      },
      final: {
        opacity: state.opacity,
        transform: state.transform
      }
    },
    message: isComplete
      ? `Animation completed (opacity: ${state.opacity})`
      : `Animation not complete (opacity: ${state.opacity}, animation: ${state.animationName})`
  };
}

/**
 * Format grid metrics report
 */
export function formatGridReport(metrics: GridMetrics): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('--- GRID METRICS ---');
  lines.push(`  Container: ${metrics.containerWidth}px x ${metrics.containerHeight}px`);
  lines.push(`  Columns: ${metrics.columnCount}`);
  lines.push(`  Items: ${metrics.itemCount}`);

  if (metrics.columnWidths.length > 0) {
    lines.push(`  Column widths: ${metrics.columnWidths.map(w => `${w}px`).join(', ')}`);
  }

  if (metrics.gaps.length > 0) {
    lines.push(`  Gaps: ${metrics.gaps.map(g => `${g}px`).join(', ')}`);
  }

  lines.push('--------------------');

  return lines.join('\n');
}

// ============================================================================
// COLUMN POSITIONING HELPERS
// ============================================================================

/**
 * Item position data structure
 */
export interface ItemPosition {
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
 * Column assignment data structure
 */
export interface ColumnAssignment {
  columnIndex: number;
  columnLeft: number;
  items: ItemPosition[];
  totalHeight: number;
}

/**
 * Get column assignments for all masonry items
 */
export async function getColumnAssignments(page: Page): Promise<Map<number, ItemPosition[]>> {
  const items = page.locator(DOM_SELECTORS.masonryItem);
  const count = await items.count();
  const positions: ItemPosition[] = [];

  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const box = await item.boundingBox().catch(() => null);

    if (box) {
      const sectionType = await item.evaluate(el => {
        const section = el.querySelector('.ai-section');
        if (section) {
          const classes = Array.from(section.classList);
          const typeClass = classes.find(c => c.startsWith('ai-section--'));
          return typeClass?.replace('ai-section--', '') || 'unknown';
        }
        return 'unknown';
      });

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
        columnIndex: -1,
        colSpan
      });
    }
  }

  // Assign column indices based on left positions
  const uniqueLefts = [...new Set(positions.map(p => p.left))].sort((a, b) => a - b);

  for (const pos of positions) {
    pos.columnIndex = uniqueLefts.indexOf(pos.left);
  }

  // Group by column
  const columnMap = new Map<number, ItemPosition[]>();

  for (const pos of positions) {
    const items = columnMap.get(pos.columnIndex) || [];
    items.push(pos);
    columnMap.set(pos.columnIndex, items);
  }

  // Sort items within each column by top position
  for (const items of columnMap.values()) {
    items.sort((a, b) => a.top - b.top);
  }

  return columnMap;
}

/**
 * Verify position calculation for an item
 */
export function verifyPositionCalculation(
  item: ItemPosition,
  columnIndex: number,
  columnWidth: number,
  gap: number,
  containerLeft: number
): { valid: boolean; expectedLeft: number; actualLeft: number; diff: number } {
  const expectedLeft = containerLeft + columnIndex * (columnWidth + gap);
  const diff = Math.abs(item.left - expectedLeft);

  return {
    valid: diff <= 4, // 4px tolerance
    expectedLeft,
    actualLeft: item.left,
    diff
  };
}

/**
 * Verify vertical stacking within a column
 */
export function verifyVerticalStacking(
  items: ItemPosition[],
  gap: number
): { valid: boolean; errors: string[] } {
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

    if (diff > 4) {
      errors.push(
        `Item ${currItem.index}: expected top=${expectedTop}px, got ${actualTop}px (diff: ${diff}px)`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check for overlapping items
 */
export function checkForOverlaps(
  positions: ItemPosition[]
): { hasOverlaps: boolean; overlappingPairs: Array<[number, number]> } {
  const overlappingPairs: Array<[number, number]> = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!;
      const b = positions[j]!;

      const aRight = a.left + a.width;
      const aBottom = a.top + a.height;
      const bRight = b.left + b.width;
      const bBottom = b.top + b.height;

      const horizontalOverlap = a.left < bRight && aRight > b.left;
      const verticalOverlap = a.top < bBottom && aBottom > b.top;

      if (horizontalOverlap && verticalOverlap) {
        overlappingPairs.push([i, j]);
      }
    }
  }

  return {
    hasOverlaps: overlappingPairs.length > 0,
    overlappingPairs
  };
}

/**
 * Format column position report
 */
export function formatColumnPositionReport(columnMap: Map<number, ItemPosition[]>): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('--- COLUMN POSITION REPORT ---');
  lines.push(`Total Columns: ${columnMap.size}`);

  for (const [columnIndex, items] of columnMap) {
    lines.push(`\nColumn ${columnIndex}:`);
    lines.push(`  Left: ${items[0]?.left || 0}px`);
    lines.push(`  Items: ${items.length}`);

    for (const item of items) {
      lines.push(`    [${item.index}] ${item.sectionType.padEnd(15)} @ (${item.left}, ${item.top}) ${item.width}x${item.height}`);
    }
  }

  lines.push('');
  lines.push('------------------------------');

  return lines.join('\n');
}

