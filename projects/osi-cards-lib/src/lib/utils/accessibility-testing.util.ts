/**
 * Accessibility & Testing Utility
 * 
 * Accessibility features and testing utilities for masonry grid:
 * 
 * ACCESSIBILITY (Items 91-95):
 * - Keyboard navigation for grid
 * - Screen reader announcements
 * - Focus management
 * - ARIA attributes generation
 * - Color contrast validation
 * 
 * TESTING (Items 96-100):
 * - Layout consistency validation
 * - Regression test helpers
 * - Snapshot comparison
 * - Performance benchmarks
 * - Automated layout testing
 * 
 * @example
 * ```typescript
 * import { 
 *   KeyboardNavigator,
 *   generateAriaAttributes,
 *   LayoutTestRunner 
 * } from './accessibility-testing.util';
 * 
 * const nav = new KeyboardNavigator(sections);
 * nav.handleKeyDown(event);
 * 
 * const attrs = generateAriaAttributes(section, index, total);
 * 
 * const runner = new LayoutTestRunner();
 * const results = await runner.runAllTests(layout);
 * ```
 */

import { CardSection } from '../models/card.model';
import { SectionPlacement } from './layout-performance.util';

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * Navigation direction
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'start' | 'end';

/**
 * Focus state
 */
export interface FocusState {
  currentIndex: number;
  previousIndex: number | null;
  sectionKey: string;
}

/**
 * ARIA attributes for a section
 */
export interface SectionAriaAttributes {
  role: string;
  'aria-label': string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-setsize': number;
  'aria-posinset': number;
  'aria-rowindex'?: number;
  'aria-colindex'?: number;
  'aria-colspan'?: number;
  tabIndex: number;
}

/**
 * Screen reader announcement
 */
export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavConfig {
  /** Enable wrap-around navigation */
  wrapAround: boolean;
  /** Key to activate section (default: Enter) */
  activationKey: string;
  /** Enable arrow key navigation */
  arrowNavigation: boolean;
  /** Enable home/end keys */
  homeEndNavigation: boolean;
}

/**
 * Default keyboard navigation config
 */
export const DEFAULT_KEYBOARD_CONFIG: KeyboardNavConfig = {
  wrapAround: true,
  activationKey: 'Enter',
  arrowNavigation: true,
  homeEndNavigation: true,
};

// ============================================================================
// KEYBOARD NAVIGATION (Item 91)
// ============================================================================

/**
 * Manages keyboard navigation for grid sections
 */
export class KeyboardNavigator {
  private sections: Array<{ key: string; x: number; y: number }> = [];
  private currentIndex = 0;
  private columns: number;
  private config: KeyboardNavConfig;
  private onFocusChange: ((state: FocusState) => void) | null = null;
  private onActivate: ((key: string) => void) | null = null;

  constructor(columns: number, config: Partial<KeyboardNavConfig> = {}) {
    this.columns = columns;
    this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...config };
  }

  /**
   * Updates section positions
   */
  updateSections(sections: Array<{ key: string; x: number; y: number }>): void {
    this.sections = sections;
    // Sort by position for consistent navigation
    this.sections.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  /**
   * Handles keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.config.arrowNavigation && !this.config.homeEndNavigation) {
      return false;
    }

    let direction: NavigationDirection | null = null;
    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        if (this.config.arrowNavigation) {
          direction = 'up';
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (this.config.arrowNavigation) {
          direction = 'down';
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (this.config.arrowNavigation) {
          direction = 'left';
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (this.config.arrowNavigation) {
          direction = 'right';
          handled = true;
        }
        break;
      case 'Home':
        if (this.config.homeEndNavigation) {
          direction = 'start';
          handled = true;
        }
        break;
      case 'End':
        if (this.config.homeEndNavigation) {
          direction = 'end';
          handled = true;
        }
        break;
      case this.config.activationKey:
        this.activate();
        handled = true;
        break;
    }

    if (direction) {
      this.navigate(direction);
    }

    if (handled) {
      event.preventDefault();
    }

    return handled;
  }

  /**
   * Navigates in a direction
   */
  navigate(direction: NavigationDirection): void {
    if (this.sections.length === 0) return;

    const previousIndex = this.currentIndex;
    const current = this.sections[this.currentIndex];
    if (!current) return;

    let nextIndex: number;

    switch (direction) {
      case 'up':
        nextIndex = this.findSectionAbove(current);
        break;
      case 'down':
        nextIndex = this.findSectionBelow(current);
        break;
      case 'left':
        nextIndex = Math.max(0, this.currentIndex - 1);
        break;
      case 'right':
        nextIndex = Math.min(this.sections.length - 1, this.currentIndex + 1);
        break;
      case 'start':
        nextIndex = 0;
        break;
      case 'end':
        nextIndex = this.sections.length - 1;
        break;
      default:
        return;
    }

    // Handle wrap-around
    if (this.config.wrapAround) {
      if (nextIndex < 0) nextIndex = this.sections.length - 1;
      if (nextIndex >= this.sections.length) nextIndex = 0;
    }

    nextIndex = Math.max(0, Math.min(this.sections.length - 1, nextIndex));

    if (nextIndex !== this.currentIndex) {
      this.currentIndex = nextIndex;
      this.emitFocusChange(previousIndex);
    }
  }

  /**
   * Finds section above current
   */
  private findSectionAbove(current: { x: number; y: number }): number {
    let bestIndex = this.currentIndex;
    let bestY = -Infinity;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (!section) continue;

      if (section.y < current.y && section.y > bestY && section.x === current.x) {
        bestY = section.y;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * Finds section below current
   */
  private findSectionBelow(current: { x: number; y: number }): number {
    let bestIndex = this.currentIndex;
    let bestY = Infinity;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (!section) continue;

      if (section.y > current.y && section.y < bestY && section.x === current.x) {
        bestY = section.y;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * Activates current section
   */
  activate(): void {
    const section = this.sections[this.currentIndex];
    if (section) {
      this.onActivate?.(section.key);
    }
  }

  /**
   * Sets focus to specific section
   */
  focusSection(key: string): boolean {
    const index = this.sections.findIndex(s => s.key === key);
    if (index >= 0) {
      const previousIndex = this.currentIndex;
      this.currentIndex = index;
      this.emitFocusChange(previousIndex);
      return true;
    }
    return false;
  }

  /**
   * Emits focus change event
   */
  private emitFocusChange(previousIndex: number | null): void {
    const section = this.sections[this.currentIndex];
    if (section) {
      this.onFocusChange?.({
        currentIndex: this.currentIndex,
        previousIndex,
        sectionKey: section.key,
      });
    }
  }

  /**
   * Sets focus change callback
   */
  setFocusChangeCallback(callback: (state: FocusState) => void): void {
    this.onFocusChange = callback;
  }

  /**
   * Sets activation callback
   */
  setActivationCallback(callback: (key: string) => void): void {
    this.onActivate = callback;
  }

  /**
   * Gets current focus state
   */
  getFocusState(): FocusState {
    const section = this.sections[this.currentIndex];
    return {
      currentIndex: this.currentIndex,
      previousIndex: null,
      sectionKey: section?.key ?? '',
    };
  }
}

// ============================================================================
// SCREEN READER SUPPORT (Item 92)
// ============================================================================

/**
 * Manages screen reader announcements
 */
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegion();
  }

  /**
   * Creates the live region element
   */
  private createLiveRegion(): void {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announces a message
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    
    // Clear and re-add to trigger announcement
    this.liveRegion.textContent = '';
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Announces layout change
   */
  announceLayoutChange(sectionsCount: number, columns: number): void {
    this.announce(
      `Grid updated with ${sectionsCount} sections in ${columns} columns`,
      'polite'
    );
  }

  /**
   * Announces focus change
   */
  announceFocusChange(
    section: CardSection,
    position: number,
    total: number
  ): void {
    const title = section.title ?? 'Section';
    const type = section.type ?? 'content';
    this.announce(
      `${title}, ${type} section, ${position} of ${total}`,
      'polite'
    );
  }

  /**
   * Destroys the announcer
   */
  destroy(): void {
    this.liveRegion?.remove();
    this.liveRegion = null;
  }
}

// ============================================================================
// ARIA ATTRIBUTES (Item 94)
// ============================================================================

/**
 * Generates ARIA attributes for a section
 */
export function generateAriaAttributes(
  section: CardSection,
  index: number,
  total: number,
  placement?: SectionPlacement
): SectionAriaAttributes {
  const title = section.title ?? 'Section';
  const type = section.type ?? 'content';

  const attrs: SectionAriaAttributes = {
    role: 'region',
    'aria-label': `${title}, ${type} section`,
    'aria-setsize': total,
    'aria-posinset': index + 1,
    tabIndex: 0,
  };

  // Add grid-specific attributes if placement provided
  if (placement) {
    attrs['aria-colindex'] = placement.x + 1;
    attrs['aria-colspan'] = placement.width;
  }

  // Add description if available
  if (section.description) {
    attrs['aria-describedby'] = `${section.id ?? index}-desc`;
  }

  return attrs;
}

/**
 * Generates ARIA attributes for the grid container
 */
export function generateGridAriaAttributes(
  columns: number,
  sectionsCount: number
): Record<string, string | number> {
  return {
    role: 'grid',
    'aria-label': `Content grid with ${columns} columns and ${sectionsCount} items`,
    'aria-colcount': columns,
    'aria-rowcount': Math.ceil(sectionsCount / columns),
  };
}

// ============================================================================
// COLOR CONTRAST (Item 95)
// ============================================================================

/**
 * Calculates relative luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 */
export function calculateContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if contrast meets WCAG standards
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Parses hex color to RGB
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  } : null;
}

// ============================================================================
// TESTING TYPES
// ============================================================================

/**
 * Test result
 */
export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

/**
 * Layout snapshot for comparison
 */
export interface LayoutSnapshot {
  timestamp: number;
  sections: Array<{ key: string; type?: string }>;
  placements: SectionPlacement[];
  metrics: {
    totalHeight: number;
    utilization: number;
    gapCount: number;
  };
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
}

// ============================================================================
// LAYOUT TESTING (Items 96-100)
// ============================================================================

/**
 * Validates layout consistency
 */
export function validateLayoutConsistency(
  placements: SectionPlacement[],
  columns: number
): TestResult {
  const start = performance.now();
  const issues: string[] = [];

  // Check for overlapping sections
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i]!;
      const b = placements[j]!;

      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;

      if (overlapX && overlapY) {
        issues.push(`Overlap: ${a.key} and ${b.key}`);
      }
    }
  }

  // Check for out-of-bounds
  for (const p of placements) {
    if (p.x < 0 || p.x + p.width > columns) {
      issues.push(`Out of bounds: ${p.key} (x: ${p.x}, width: ${p.width})`);
    }
    if (p.y < 0) {
      issues.push(`Negative Y: ${p.key} (y: ${p.y})`);
    }
  }

  return {
    name: 'Layout Consistency',
    passed: issues.length === 0,
    message: issues.length === 0 
      ? 'Layout is consistent' 
      : `Found ${issues.length} issues: ${issues.join('; ')}`,
    duration: performance.now() - start,
    details: { issues },
  };
}

/**
 * Compares two layout snapshots
 */
export function compareSnapshots(
  snapshot1: LayoutSnapshot,
  snapshot2: LayoutSnapshot,
  tolerancePercent: number = 5
): TestResult {
  const start = performance.now();
  const differences: string[] = [];

  // Compare section count
  if (snapshot1.sections.length !== snapshot2.sections.length) {
    differences.push(
      `Section count: ${snapshot1.sections.length} vs ${snapshot2.sections.length}`
    );
  }

  // Compare placements
  const map1 = new Map(snapshot1.placements.map(p => [p.key, p]));
  const map2 = new Map(snapshot2.placements.map(p => [p.key, p]));

  for (const [key, p1] of map1) {
    const p2 = map2.get(key);
    if (!p2) {
      differences.push(`Missing in snapshot2: ${key}`);
      continue;
    }

    // Check position with tolerance
    const xDiff = Math.abs(p1.x - p2.x);
    const yDiff = Math.abs(p1.y - p2.y);
    const heightDiff = Math.abs(p1.height - p2.height) / p1.height * 100;

    if (xDiff > 0) {
      differences.push(`${key}: X moved from ${p1.x} to ${p2.x}`);
    }
    if (yDiff > p1.height * tolerancePercent / 100) {
      differences.push(`${key}: Y moved from ${p1.y} to ${p2.y}`);
    }
    if (heightDiff > tolerancePercent) {
      differences.push(`${key}: Height changed by ${heightDiff.toFixed(1)}%`);
    }
  }

  // Check metrics
  const utilizationDiff = Math.abs(
    snapshot1.metrics.utilization - snapshot2.metrics.utilization
  );
  if (utilizationDiff > tolerancePercent) {
    differences.push(
      `Utilization: ${snapshot1.metrics.utilization.toFixed(1)}% vs ${snapshot2.metrics.utilization.toFixed(1)}%`
    );
  }

  return {
    name: 'Snapshot Comparison',
    passed: differences.length === 0,
    message: differences.length === 0
      ? 'Snapshots match within tolerance'
      : `Found ${differences.length} differences`,
    duration: performance.now() - start,
    details: { differences },
  };
}

/**
 * Runs a performance benchmark
 */
export async function runBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warm-up
  for (let i = 0; i < 5; i++) {
    await fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const totalTime = times.reduce((a, b) => a + b, 0);

  return {
    name,
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    minTime: times[0] ?? 0,
    maxTime: times[times.length - 1] ?? 0,
    p95Time: times[Math.floor(iterations * 0.95)] ?? 0,
  };
}

/**
 * Layout test runner
 */
export class LayoutTestRunner {
  private results: TestResult[] = [];

  /**
   * Runs all tests
   */
  async runAllTests(
    sections: CardSection[],
    placements: SectionPlacement[],
    columns: number
  ): Promise<TestResult[]> {
    this.results = [];

    // Consistency test
    this.results.push(validateLayoutConsistency(placements, columns));

    // No overlaps test
    this.results.push(this.testNoOverlaps(placements));

    // All sections placed test
    this.results.push(this.testAllSectionsPlaced(sections, placements));

    // Utilization test
    this.results.push(this.testUtilization(placements, columns));

    return this.results;
  }

  /**
   * Tests that no sections overlap
   */
  private testNoOverlaps(placements: SectionPlacement[]): TestResult {
    const start = performance.now();
    
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i]!;
        const b = placements[j]!;

        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;

        if (overlapX && overlapY) {
          return {
            name: 'No Overlaps',
            passed: false,
            message: `Sections ${a.key} and ${b.key} overlap`,
            duration: performance.now() - start,
          };
        }
      }
    }

    return {
      name: 'No Overlaps',
      passed: true,
      message: 'No overlapping sections found',
      duration: performance.now() - start,
    };
  }

  /**
   * Tests that all sections are placed
   */
  private testAllSectionsPlaced(
    sections: CardSection[],
    placements: SectionPlacement[]
  ): TestResult {
    const start = performance.now();
    const placedKeys = new Set(placements.map(p => p.key));
    const unplaced: string[] = [];

    for (const section of sections) {
      const key = section.id ?? section.title ?? '';
      if (!placedKeys.has(key)) {
        unplaced.push(key);
      }
    }

    return {
      name: 'All Sections Placed',
      passed: unplaced.length === 0,
      message: unplaced.length === 0
        ? 'All sections have placements'
        : `${unplaced.length} sections not placed`,
      duration: performance.now() - start,
      details: { unplaced },
    };
  }

  /**
   * Tests layout utilization
   */
  private testUtilization(
    placements: SectionPlacement[],
    columns: number
  ): TestResult {
    const start = performance.now();
    
    if (placements.length === 0) {
      return {
        name: 'Utilization',
        passed: true,
        message: 'No sections to measure',
        duration: performance.now() - start,
      };
    }

    const totalHeight = Math.max(...placements.map(p => p.y + p.height));
    const totalArea = columns * totalHeight;
    const usedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
    const utilization = (usedArea / totalArea) * 100;

    const passed = utilization >= 70;  // 70% minimum utilization

    return {
      name: 'Utilization',
      passed,
      message: `Utilization: ${utilization.toFixed(1)}% (minimum: 70%)`,
      duration: performance.now() - start,
      details: { utilization, totalArea, usedArea },
    };
  }

  /**
   * Gets all test results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Gets summary
   */
  getSummary(): { total: number; passed: number; failed: number } {
    const passed = this.results.filter(r => r.passed).length;
    return {
      total: this.results.length,
      passed,
      failed: this.results.length - passed,
    };
  }

  /**
   * Prints results to console
   */
  printResults(): void {
    console.group('Layout Test Results');
    
    for (const result of this.results) {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? 'color: green' : 'color: red';
      console.log(`%c${icon} ${result.name}: ${result.message}`, color);
    }

    const summary = this.getSummary();
    console.log(`\nTotal: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    
    console.groupEnd();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates an accessible grid configuration
 */
export function createAccessibleGrid(
  sections: CardSection[],
  placements: SectionPlacement[],
  columns: number
): {
  containerAttrs: Record<string, string | number>;
  sectionAttrs: Map<string, SectionAriaAttributes>;
} {
  const containerAttrs = generateGridAriaAttributes(columns, sections.length);
  const sectionAttrs = new Map<string, SectionAriaAttributes>();

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const key = section.id ?? section.title ?? '';
    const placement = placements.find(p => p.key === key);
    
    sectionAttrs.set(key, generateAriaAttributes(section, i, sections.length, placement));
  }

  return { containerAttrs, sectionAttrs };
}

/**
 * Creates a complete test suite
 */
export function createTestSuite(
  sections: CardSection[],
  placements: SectionPlacement[],
  columns: number
): {
  runTests: () => Promise<TestResult[]>;
  createSnapshot: () => LayoutSnapshot;
} {
  const runner = new LayoutTestRunner();

  return {
    runTests: () => runner.runAllTests(sections, placements, columns),
    createSnapshot: () => ({
      timestamp: Date.now(),
      sections: sections.map(s => ({ key: s.id ?? s.title ?? '', type: s.type })),
      placements: [...placements],
      metrics: {
        totalHeight: Math.max(...placements.map(p => p.y + p.height), 0),
        utilization: calculateUtilization(placements, columns),
        gapCount: 0,  // Would need gap analysis
      },
    }),
  };
}

/**
 * Calculates layout utilization
 */
function calculateUtilization(placements: SectionPlacement[], columns: number): number {
  if (placements.length === 0) return 100;
  
  const totalHeight = Math.max(...placements.map(p => p.y + p.height));
  const totalArea = columns * totalHeight;
  const usedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  
  return totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
}

