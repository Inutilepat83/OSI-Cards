/**
 * Testing Utilities (Improvements #26-40)
 *
 * Comprehensive testing utilities for OSI Cards library.
 * Includes component harnesses, fixtures, mocks, and accessibility testing.
 *
 * IMPORTANT: All section fixtures are sourced from the Section Registry.
 * Do NOT create hardcoded section examples - use the registry fixtures instead.
 *
 * @example
 * ```typescript
 * import {
 *   createMockCard,
 *   getFixture,
 *   SECTION_FIXTURES,
 *   SAMPLE_CARDS,
 *   accessibilityAudit
 * } from 'osi-cards-lib/testing';
 *
 * // Use registry fixtures for consistent test data
 * const infoSection = getFixture('info', 'complete');
 * const analyticsSection = getFixture('analytics', 'minimal');
 *
 * // Use sample cards built from registry
 * const companyCard = SAMPLE_CARDS.company;
 * ```
 */

// Re-export existing testing utilities
export * from './fixtures';
export * from './mocks';
export * from './utils';
export * from './contract-testing';
export * from './section-test.utils';

// CDK Test Harnesses (Improvement Plan Point #13)
export {
  BaseHarness,
  FieldHarness,
  ItemHarness,
  SectionHarness,
  ActionHarness,
  CardHarness,
  MasonryGridHarness
} from './harnesses/card-harness';

// Re-export registry fixtures (SINGLE SOURCE OF TRUTH)
export {
  // Fixture access functions
  getFixture,
  getAllFixtures,
  getFixtureWithUniqueId,
  getAvailableSectionTypes,

  // Fixture collections
  SECTION_FIXTURES,
  COMPLETE_FIXTURES,
  MINIMAL_FIXTURES,
  EDGE_CASE_FIXTURES,

  // Sample cards from registry
  SAMPLE_CARDS,
  SAMPLE_COMPANY_CARD,
  SAMPLE_ANALYTICS_CARD,
  SAMPLE_NEWS_CARD,
  ALL_SECTIONS_CARD,
  MINIMAL_ALL_SECTIONS_CARD,
  EDGE_CASE_ALL_SECTIONS_CARD,

  // Types
  type FixtureCategory,
  type SectionFixtures
} from '../registry/fixtures.generated';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

import type { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../models';

/**
 * Create a mock card configuration
 */
export function createMockCard(overrides: Partial<AICardConfig> = {}): AICardConfig {
  return {
    id: `mock-card-${Math.random().toString(36).substring(7)}`,
    cardTitle: 'Test Card',
    description: 'A test card for unit testing',
    sections: [createMockSection()],
    ...overrides
  };
}

/**
 * Create a mock section
 */
export function createMockSection(overrides: Partial<CardSection> = {}): CardSection {
  return {
    id: `mock-section-${Math.random().toString(36).substring(7)}`,
    title: 'Test Section',
    type: 'info',
    fields: [createMockField()],
    ...overrides
  };
}

/**
 * Create a mock field
 */
export function createMockField(overrides: Partial<CardField> = {}): CardField {
  return {
    id: `mock-field-${Math.random().toString(36).substring(7)}`,
    label: 'Test Field',
    value: 'Test Value',
    ...overrides
  };
}

/**
 * Create a mock item
 */
export function createMockItem(overrides: Partial<CardItem> = {}): CardItem {
  return {
    id: `mock-item-${Math.random().toString(36).substring(7)}`,
    title: 'Test Item',
    description: 'Test item description',
    ...overrides
  };
}

/**
 * Create a mock action
 */
export function createMockAction(overrides: Partial<CardAction> = {}): CardAction {
  return {
    type: 'website',
    label: 'Test Action',
    url: 'https://example.com',
    ...overrides
  };
}

/**
 * Create multiple mock cards
 */
export function createMockCards(count: number): AICardConfig[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCard({
      id: `mock-card-${i}`,
      cardTitle: `Test Card ${i + 1}`
    })
  );
}

/**
 * Create a complex mock card with all section types
 */
export function createComplexMockCard(): AICardConfig {
  return {
    id: 'complex-mock-card',
    cardTitle: 'Complex Test Card',
    description: 'A card with multiple section types for comprehensive testing',
    sections: [
      createMockSection({ type: 'info', title: 'Information' }),
      createMockSection({ type: 'analytics', title: 'Analytics' }),
      createMockSection({ type: 'list', title: 'List Items', items: [
        createMockItem(),
        createMockItem({ title: 'Second Item' })
      ]}),
      createMockSection({ type: 'contact-card', title: 'Contact' }),
      createMockSection({ type: 'chart', title: 'Chart' }),
    ],
    actions: [
      createMockAction({ type: 'mail', label: 'Contact' }),
      createMockAction({ type: 'website', label: 'Website' })
    ]
  };
}

// ============================================================================
// STREAMING MOCKS
// ============================================================================

/**
 * Create a mock streaming response
 */
export function createMockStreamingResponse(card: AICardConfig): string {
  return JSON.stringify(card);
}

/**
 * Simulate streaming chunks
 */
export function* createStreamingChunks(
  json: string,
  chunkSize = 50
): Generator<string, void, unknown> {
  for (let i = 0; i < json.length; i += chunkSize) {
    yield json.slice(i, i + chunkSize);
  }
}

/**
 * Mock streaming service
 */
export class MockStreamingService {
  private chunks: string[] = [];

  setData(json: string, chunkSize = 50): void {
    this.chunks = Array.from(createStreamingChunks(json, chunkSize));
  }

  async *stream(): AsyncGenerator<string, void, unknown> {
    for (const chunk of this.chunks) {
      await new Promise(resolve => setTimeout(resolve, 10));
      yield chunk;
    }
  }

  reset(): void {
    this.chunks = [];
  }
}

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  passed: boolean;
  violations: A11yViolation[];
  warnings: A11yViolation[];
  passes: number;
}

/**
 * Accessibility violation
 */
export interface A11yViolation {
  id: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  nodes: string[];
  help: string;
}

/**
 * Run basic accessibility audit on an element
 * For full audits, integrate with axe-core in your test setup
 */
export function accessibilityAudit(element: HTMLElement): A11yAuditResult {
  const violations: A11yViolation[] = [];
  const warnings: A11yViolation[] = [];
  let passes = 0;

  // Check for alt text on images
  const images = element.querySelectorAll('img');
  images.forEach((img, i) => {
    if (!img.hasAttribute('alt')) {
      violations.push({
        id: 'image-alt',
        description: 'Image elements must have an alt attribute',
        impact: 'critical',
        nodes: [`img:nth-of-type(${i + 1})`],
        help: 'Add alt="" for decorative images or descriptive text for informative ones'
      });
    } else {
      passes++;
    }
  });

  // Check for button accessibility
  const buttons = element.querySelectorAll('button');
  buttons.forEach((btn, i) => {
    const hasText = btn.textContent?.trim();
    const hasAriaLabel = btn.hasAttribute('aria-label');
    const hasAriaLabelledBy = btn.hasAttribute('aria-labelledby');

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      violations.push({
        id: 'button-name',
        description: 'Buttons must have discernible text',
        impact: 'critical',
        nodes: [`button:nth-of-type(${i + 1})`],
        help: 'Add text content or aria-label to the button'
      });
    } else {
      passes++;
    }
  });

  // Check for heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((heading, i) => {
    const level = parseInt(heading.tagName[1]!, 10);
    if (level > lastLevel + 1) {
      warnings.push({
        id: 'heading-order',
        description: `Heading level ${level} skips level ${lastLevel + 1}`,
        impact: 'moderate',
        nodes: [`${heading.tagName.toLowerCase()}:nth-of-type(${i + 1})`],
        help: 'Maintain sequential heading hierarchy'
      });
    }
    lastLevel = level;
  });

  // Check for form labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach((input, i) => {
    const id = input.id;
    const hasLabel = id && element.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label');
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      violations.push({
        id: 'label',
        description: 'Form elements must have labels',
        impact: 'critical',
        nodes: [`input:nth-of-type(${i + 1})`],
        help: 'Add a label element or aria-label attribute'
      });
    } else {
      passes++;
    }
  });

  // Check color contrast (basic check for inline styles)
  const elementsWithColor = element.querySelectorAll('[style*="color"]');
  elementsWithColor.forEach((el, i) => {
    const style = (el as HTMLElement).style;
    if (style.color && style.backgroundColor) {
      // This is a simplified check - real contrast checking is more complex
      warnings.push({
        id: 'color-contrast-warning',
        description: 'Inline color styles detected - verify contrast manually',
        impact: 'moderate',
        nodes: [`[style*="color"]:nth-of-type(${i + 1})`],
        help: 'Ensure text has sufficient contrast with background'
      });
    }
  });

  // Check for tabindex > 0 (anti-pattern)
  const highTabIndex = element.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
  highTabIndex.forEach((el, i) => {
    const tabindex = el.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex, 10) > 0) {
      violations.push({
        id: 'tabindex',
        description: 'Avoid positive tabindex values',
        impact: 'serious',
        nodes: [`[tabindex="${tabindex}"]:nth-of-type(${i + 1})`],
        help: 'Use tabindex="0" or "-1" instead of positive values'
      });
    }
  });

  // Check for ARIA roles
  const ariaRoles = element.querySelectorAll('[role]');
  ariaRoles.forEach(() => {
    // Just count as a pass - proper role validation is complex
    passes++;
  });

  return {
    passed: violations.length === 0,
    violations,
    warnings,
    passes
  };
}

// ============================================================================
// COMPONENT HARNESS HELPERS
// ============================================================================

/**
 * Wait for element to appear
 */
export async function waitForElement(
  selector: string,
  container: HTMLElement = document.body,
  timeout = 5000
): Promise<HTMLElement | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return null;
}

/**
 * Wait for text content
 */
export async function waitForText(
  text: string,
  container: HTMLElement = document.body,
  timeout = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (container.textContent?.includes(text)) return true;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return false;
}

/**
 * Simulate user input
 */
export function simulateInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulate click event
 */
export function simulateClick(element: HTMLElement): void {
  element.click();
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/**
 * Simulate keyboard event
 */
export function simulateKeyPress(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {}
): void {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  element.dispatchEvent(event);
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * Performance test result
 */
export interface PerformanceTestResult {
  name: string;
  duration: number;
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  memoryUsed: number | undefined;
}

/**
 * Run a performance test
 */
export async function runPerformanceTest(
  name: string,
  fn: () => void | Promise<void>,
  iterations = 100
): Promise<PerformanceTestResult> {
  const durations: number[] = [];
  let memoryUsed: number | undefined;

  // Warm up
  await fn();

  // Run iterations
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    durations.push(performance.now() - start);
  }

  // Check memory if available
  if ('memory' in performance) {
    memoryUsed = (performance as any).memory.usedJSHeapSize;
  }

  return {
    name,
    duration: durations.reduce((a, b) => a + b, 0),
    iterations,
    avgDuration: durations.reduce((a, b) => a + b, 0) / iterations,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    memoryUsed
  };
}

// ============================================================================
// SNAPSHOT TESTING HELPERS
// ============================================================================

/**
 * Create a serializable snapshot of a card
 */
export function createCardSnapshot(card: AICardConfig): string {
  const snapshot = {
    cardTitle: card.cardTitle,
    sectionCount: card.sections.length,
    sectionTypes: card.sections.map(s => s.type),
    actionCount: card.actions?.length ?? 0
  };
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Compare two card snapshots
 */
export function compareSnapshots(
  snapshot1: string,
  snapshot2: string
): { equal: boolean; differences: string[] } {
  const obj1 = JSON.parse(snapshot1);
  const obj2 = JSON.parse(snapshot2);
  const differences: string[] = [];

  const compare = (a: any, b: any, path = ''): void => {
    if (typeof a !== typeof b) {
      differences.push(`${path}: type mismatch (${typeof a} vs ${typeof b})`);
      return;
    }

    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        differences.push(`${path}: array length mismatch (${a.length} vs ${b.length})`);
      }
      a.forEach((item, i) => compare(item, b[i], `${path}[${i}]`));
    } else if (typeof a === 'object' && a !== null) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      keys.forEach(key => {
        compare(a[key], b[key], path ? `${path}.${key}` : key);
      });
    } else if (a !== b) {
      differences.push(`${path}: value mismatch ("${a}" vs "${b}")`);
    }
  };

  compare(obj1, obj2);

  return {
    equal: differences.length === 0,
    differences
  };
}
