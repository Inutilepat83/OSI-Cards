/**
 * Test Card Configuration Fixtures
 * 
 * TypeScript fixtures for Playwright E2E tests.
 * These configs are used to test all card features across different environments.
 */

import * as allSectionsComplete from '../../src/assets/configs/generated/all-sections-complete.json';
import * as allSectionsMinimal from '../../src/assets/configs/generated/all-sections-minimal.json';
import * as allSectionsEdgeCases from '../../src/assets/configs/generated/all-sections-edge-cases.json';

/**
 * Card configuration interface (simplified for tests)
 */
export interface TestCardConfig {
  cardTitle: string;
  cardType?: string;
  description?: string;
  sections: Array<{
    title: string;
    type: string;
    description?: string;
    fields?: any[];
    items?: any[];
    [key: string]: any;
  }>;
  actions?: Array<{
    label: string;
    type: string;
    [key: string]: any;
  }>;
}

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  name: string;
  theme: 'night' | 'day';
  state: 'normal' | 'streaming' | 'empty';
  queryParams: string;
}

/**
 * All available test environments (theme x state matrix)
 */
export const TEST_ENVIRONMENTS: TestEnvironment[] = [
  { name: 'Night - Normal', theme: 'night', state: 'normal', queryParams: '?theme=night&state=normal' },
  { name: 'Night - Streaming', theme: 'night', state: 'streaming', queryParams: '?theme=night&state=streaming' },
  { name: 'Night - Empty', theme: 'night', state: 'empty', queryParams: '?theme=night&state=empty' },
  { name: 'Day - Normal', theme: 'day', state: 'normal', queryParams: '?theme=day&state=normal' },
  { name: 'Day - Streaming', theme: 'day', state: 'streaming', queryParams: '?theme=day&state=streaming' },
  { name: 'Day - Empty', theme: 'day', state: 'empty', queryParams: '?theme=day&state=empty' },
];

/**
 * Core test environments (4 main combinations)
 */
export const CORE_TEST_ENVIRONMENTS: TestEnvironment[] = [
  { name: 'Night - Normal', theme: 'night', state: 'normal', queryParams: '?theme=night&state=normal' },
  { name: 'Night - Streaming', theme: 'night', state: 'streaming', queryParams: '?theme=night&state=streaming' },
  { name: 'Day - Normal', theme: 'day', state: 'normal', queryParams: '?theme=day&state=normal' },
  { name: 'Day - Streaming', theme: 'day', state: 'streaming', queryParams: '?theme=day&state=streaming' },
];

/**
 * Complete card config with all section types
 */
export const ALL_SECTIONS_COMPLETE: TestCardConfig = allSectionsComplete as TestCardConfig;

/**
 * Minimal card config with all section types (minimum required fields)
 */
export const ALL_SECTIONS_MINIMAL: TestCardConfig = allSectionsMinimal as TestCardConfig;

/**
 * Edge case card config (boundary values, long text, special chars)
 */
export const ALL_SECTIONS_EDGE_CASES: TestCardConfig = allSectionsEdgeCases as TestCardConfig;

/**
 * Empty card config (for testing empty state)
 */
export const EMPTY_CONFIG: TestCardConfig = {
  cardTitle: 'Empty Card',
  sections: []
};

/**
 * Streaming simulation config (same as complete but with streaming flag)
 */
export const STREAMING_CONFIG: TestCardConfig = {
  ...ALL_SECTIONS_COMPLETE,
  cardTitle: 'Streaming Demo'
};

/**
 * Single section configs for isolated testing
 */
export const SINGLE_SECTION_CONFIGS: Record<string, TestCardConfig> = {
  info: {
    cardTitle: 'Info Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'info')!]
  },
  analytics: {
    cardTitle: 'Analytics Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'analytics')!]
  },
  'contact-card': {
    cardTitle: 'Contact Card Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'contact-card')!]
  },
  'network-card': {
    cardTitle: 'Network Card Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'network-card')!]
  },
  map: {
    cardTitle: 'Map Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'map')!]
  },
  financials: {
    cardTitle: 'Financials Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'financials')!]
  },
  event: {
    cardTitle: 'Event Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'event')!]
  },
  list: {
    cardTitle: 'List Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'list')!]
  },
  chart: {
    cardTitle: 'Chart Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'chart')!]
  },
  product: {
    cardTitle: 'Product Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'product')!]
  },
  solutions: {
    cardTitle: 'Solutions Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'solutions')!]
  },
  overview: {
    cardTitle: 'Overview Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'overview')!]
  },
  stats: {
    cardTitle: 'Stats Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'stats')!]
  },
  quotation: {
    cardTitle: 'Quotation Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'quotation')!]
  },
  'text-reference': {
    cardTitle: 'Text Reference Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'text-reference')!]
  },
  'brand-colors': {
    cardTitle: 'Brand Colors Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'brand-colors')!]
  },
  news: {
    cardTitle: 'News Section Test',
    sections: [ALL_SECTIONS_COMPLETE.sections.find(s => s.type === 'news')!]
  }
};

/**
 * Get all section types from the complete config
 */
export function getAllSectionTypes(): string[] {
  return ALL_SECTIONS_COMPLETE.sections.map(s => s.type);
}

/**
 * Get section count from a config
 */
export function getSectionCount(config: TestCardConfig): number {
  return config.sections.length;
}

/**
 * Create a config with specific number of sections
 */
export function createConfigWithSections(count: number): TestCardConfig {
  return {
    cardTitle: `${count} Sections Test`,
    sections: ALL_SECTIONS_COMPLETE.sections.slice(0, count)
  };
}

/**
 * Viewport configurations for responsive testing
 */
export const VIEWPORTS = {
  'desktop-large': { width: 1920, height: 1080 },
  'desktop': { width: 1280, height: 720 },
  'tablet-landscape': { width: 1024, height: 768 },
  'tablet-portrait': { width: 768, height: 1024 },
  'mobile': { width: 375, height: 812 }
} as const;

/**
 * Expected section types that should render
 */
export const EXPECTED_SECTION_TYPES = [
  'info',
  'analytics', 
  'contact-card',
  'network-card',
  'map',
  'financials',
  'event',
  'list',
  'chart',
  'product',
  'solutions',
  'overview',
  'stats',
  'quotation',
  'text-reference',
  'brand-colors',
  'news',
  'timeline',
  'metrics',
  'locations',
  'project',
  'table',
  'reference',
  'text-ref'
] as const;

export type SectionType = typeof EXPECTED_SECTION_TYPES[number];

