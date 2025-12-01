import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type, Component } from '@angular/core';
import { provideOsiCardsTesting } from '../providers/osi-cards.providers';

/**
 * Test utilities for section components
 */

/**
 * Creates a mock section config for testing
 */
export function createMockSection<T extends Record<string, unknown>>(
  type: string,
  overrides: Partial<T> = {}
): T {
  const defaults: Record<string, unknown> = {
    type,
    title: 'Test Section',
    columnSpan: 1,
    fields: [],
    items: [],
    ...overrides,
  };

  return defaults as T;
}

/**
 * Creates a mock card config for testing
 */
export function createMockCard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'test-card-' + Math.random().toString(36).slice(2),
    title: 'Test Card',
    subtitle: 'Test Subtitle',
    sections: [],
    theme: 'light',
    status: 'complete',
    ...overrides,
  };
}

/**
 * Renders a section component for testing
 */
export async function renderSection<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {}
): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [provideOsiCardsTesting()],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);

  // Apply inputs
  for (const [key, value] of Object.entries(inputs)) {
    (fixture.componentInstance as Record<string, unknown>)[key] = value;
  }

  fixture.detectChanges();
  return fixture;
}

/**
 * Creates a test host component for testing sections
 */
export function createTestHost<T>(
  component: Type<T>,
  template: string
): Type<{ hostComponent: T }> {
  @Component({
    selector: 'test-host',
    template,
    standalone: true,
    imports: [component],
  })
  class TestHostComponent {
    hostComponent!: T;
  }

  return TestHostComponent;
}

/**
 * Mock data generators
 */
export const MockData = {
  /**
   * Generate mock analytics section data
   */
  analytics: (count = 3) => ({
    type: 'analytics',
    title: 'Analytics',
    fields: Array.from({ length: count }, (_, i) => ({
      label: `Metric ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: `${(Math.random() * 10).toFixed(1)}%`,
    })),
  }),

  /**
   * Generate mock list section data
   */
  list: (count = 5) => ({
    type: 'list',
    title: 'List Items',
    items: Array.from({ length: count }, (_, i) => ({
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
      icon: 'circle',
    })),
  }),

  /**
   * Generate mock chart section data
   */
  chart: () => ({
    type: 'chart',
    title: 'Chart Data',
    chartType: 'bar',
    fields: [
      { label: 'Q1', value: 100 },
      { label: 'Q2', value: 200 },
      { label: 'Q3', value: 150 },
      { label: 'Q4', value: 300 },
    ],
  }),

  /**
   * Generate mock contact section data
   */
  contact: () => ({
    type: 'contact-card',
    title: 'Contact',
    items: [
      {
        name: 'John Doe',
        title: 'CEO',
        email: 'john@example.com',
        phone: '+1 555-0100',
        avatar: 'https://via.placeholder.com/100',
      },
    ],
  }),

  /**
   * Generate a complete card with multiple sections
   */
  completeCard: () => ({
    id: 'test-complete-card',
    title: 'Complete Test Card',
    subtitle: 'With all section types',
    theme: 'light',
    status: 'complete',
    sections: [
      MockData.analytics(),
      MockData.list(),
      MockData.chart(),
      MockData.contact(),
    ],
  }),
};

/**
 * Assertion helpers
 */
export const SectionAssertions = {
  /**
   * Assert section has a title
   */
  hasTitle: (fixture: ComponentFixture<unknown>, expectedTitle: string) => {
    const titleEl = fixture.nativeElement.querySelector('.section-title, [data-testid="section-title"]');
    expect(titleEl?.textContent?.trim()).toBe(expectedTitle);
  },

  /**
   * Assert section has correct field count
   */
  hasFieldCount: (fixture: ComponentFixture<unknown>, count: number) => {
    const fields = fixture.nativeElement.querySelectorAll('.field, [data-testid^="field-"]');
    expect(fields.length).toBe(count);
  },

  /**
   * Assert section has correct item count
   */
  hasItemCount: (fixture: ComponentFixture<unknown>, count: number) => {
    const items = fixture.nativeElement.querySelectorAll('.item, [data-testid^="item-"]');
    expect(items.length).toBe(count);
  },

  /**
   * Assert section renders without errors
   */
  rendersWithoutErrors: (fixture: ComponentFixture<unknown>) => {
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement).toBeTruthy();
  },
};

/**
 * Event simulation helpers
 */
export const EventHelpers = {
  /**
   * Simulate click on element
   */
  click: (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },

  /**
   * Simulate keyboard event
   */
  keydown: (element: HTMLElement, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  },

  /**
   * Simulate hover
   */
  hover: (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  },

  /**
   * Simulate blur
   */
  blur: (element: HTMLElement) => {
    element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  },
};

