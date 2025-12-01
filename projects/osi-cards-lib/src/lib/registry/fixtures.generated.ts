/**
 * Generated Registry Fixtures
 *
 * Auto-generated section fixtures from the section registry.
 * This file provides sample data for testing and documentation.
 *
 * DO NOT EDIT MANUALLY - regenerate with `npm run generate:registry-fixtures`
 */

import type { AICardConfig, CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

export type FixtureCategory = 'complete' | 'minimal' | 'edge-case';

export interface SectionFixtures {
  complete: CardSection;
  minimal: CardSection;
  edgeCase: CardSection;
}

// ============================================================================
// SECTION FIXTURES
// ============================================================================

const infoSection: CardSection = {
  id: 'info-fixture',
  title: 'Company Information',
  type: 'info',
  fields: [
    { id: 'industry', label: 'Industry', value: 'Technology' },
    { id: 'founded', label: 'Founded', value: '2010' },
    { id: 'employees', label: 'Employees', value: '5,000+' },
    { id: 'headquarters', label: 'Headquarters', value: 'San Francisco, CA' },
  ],
};

const analyticsSection: CardSection = {
  id: 'analytics-fixture',
  title: 'Performance Analytics',
  type: 'analytics',
  fields: [
    { id: 'revenue', label: 'Revenue', value: '$2.5M', trend: 'up', trendValue: '+12%' },
    { id: 'users', label: 'Active Users', value: '125K', trend: 'up', trendValue: '+8%' },
    { id: 'conversion', label: 'Conversion Rate', value: '3.2%', trend: 'stable' },
  ],
};

const contactSection: CardSection = {
  id: 'contact-fixture',
  title: 'Contact Information',
  type: 'contact-card',
  fields: [
    { id: 'name', label: 'Name', value: 'John Smith' },
    { id: 'email', label: 'Email', value: 'john@example.com' },
    { id: 'phone', label: 'Phone', value: '+1 (555) 123-4567' },
    { id: 'role', label: 'Role', value: 'Senior Director' },
  ],
};

const listSection: CardSection = {
  id: 'list-fixture',
  title: 'Recent Activity',
  type: 'list',
  items: [
    { id: 'item-1', title: 'Contract Signed', subtitle: '2 hours ago' },
    { id: 'item-2', title: 'Meeting Scheduled', subtitle: 'Yesterday' },
    { id: 'item-3', title: 'Proposal Sent', subtitle: '3 days ago' },
  ],
};

const newsSection: CardSection = {
  id: 'news-fixture',
  title: 'Latest News',
  type: 'news',
  items: [
    { id: 'news-1', title: 'Company Announces Q4 Results', subtitle: 'Financial Times', date: '2024-01-15' },
    { id: 'news-2', title: 'New Product Launch', subtitle: 'TechCrunch', date: '2024-01-10' },
  ],
};

const chartSection: CardSection = {
  id: 'chart-fixture',
  title: 'Revenue Trend',
  type: 'chart',
  chartType: 'line',
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ label: 'Revenue', data: [100, 120, 115, 140, 160, 180] }],
  },
};

const eventSection: CardSection = {
  id: 'event-fixture',
  title: 'Upcoming Events',
  type: 'event',
  fields: [
    { id: 'event-1', label: 'Conference', value: 'Annual Tech Summit', date: '2024-03-15', status: 'pending' },
    { id: 'event-2', label: 'Webinar', value: 'Product Demo', date: '2024-03-20', status: 'active' },
    { id: 'event-3', label: 'Meeting', value: 'Quarterly Review', date: '2024-03-25', status: 'pending' },
  ],
};

// ============================================================================
// FIXTURE COLLECTIONS
// ============================================================================

export const COMPLETE_FIXTURES: Record<string, CardSection> = {
  'info': infoSection,
  'analytics': analyticsSection,
  'contact-card': contactSection,
  'list': listSection,
  'news': newsSection,
  'chart': chartSection,
  'event': eventSection,
};

export const MINIMAL_FIXTURES: Record<string, CardSection> = {
  'info': { id: 'info-min', title: 'Info', type: 'info', fields: [] },
  'analytics': { id: 'analytics-min', title: 'Analytics', type: 'analytics', fields: [] },
  'contact-card': { id: 'contact-min', title: 'Contact', type: 'contact-card', fields: [] },
  'list': { id: 'list-min', title: 'List', type: 'list', items: [] },
  'news': { id: 'news-min', title: 'News', type: 'news', items: [] },
  'chart': { id: 'chart-min', title: 'Chart', type: 'chart' },
  'event': { id: 'event-min', title: 'Events', type: 'event', fields: [] },
};

export const EDGE_CASE_FIXTURES: Record<string, CardSection> = {
  'info': { id: 'info-edge', title: '', type: 'info', fields: [{ id: 'empty', label: '', value: null }] },
  'analytics': { id: 'analytics-edge', title: 'Very Long Title That Exceeds Normal Width', type: 'analytics', fields: [] },
  'list': { id: 'list-edge', title: 'List', type: 'list', items: Array(50).fill({ id: 'item', title: 'Item' }) },
};

export const SECTION_FIXTURES: Record<string, SectionFixtures> = {
  'info': { complete: COMPLETE_FIXTURES['info']!, minimal: MINIMAL_FIXTURES['info']!, edgeCase: EDGE_CASE_FIXTURES['info']! },
  'analytics': { complete: COMPLETE_FIXTURES['analytics']!, minimal: MINIMAL_FIXTURES['analytics']!, edgeCase: EDGE_CASE_FIXTURES['analytics']! },
  'contact-card': { complete: COMPLETE_FIXTURES['contact-card']!, minimal: MINIMAL_FIXTURES['contact-card']!, edgeCase: MINIMAL_FIXTURES['contact-card']! },
  'list': { complete: COMPLETE_FIXTURES['list']!, minimal: MINIMAL_FIXTURES['list']!, edgeCase: EDGE_CASE_FIXTURES['list']! },
  'news': { complete: COMPLETE_FIXTURES['news']!, minimal: MINIMAL_FIXTURES['news']!, edgeCase: MINIMAL_FIXTURES['news']! },
  'chart': { complete: COMPLETE_FIXTURES['chart']!, minimal: MINIMAL_FIXTURES['chart']!, edgeCase: MINIMAL_FIXTURES['chart']! },
  'event': { complete: COMPLETE_FIXTURES['event']!, minimal: MINIMAL_FIXTURES['event']!, edgeCase: MINIMAL_FIXTURES['event']! },
};

// ============================================================================
// SAMPLE CARDS
// ============================================================================

export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Acme Corporation',
  cardType: 'company',
  sections: [infoSection, analyticsSection],
  actions: [
    { id: 'view', label: 'View Details', variant: 'primary' },
    { id: 'contact', label: 'Contact', variant: 'secondary' },
  ],
};

export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Performance Dashboard',
  cardType: 'analytics',
  sections: [analyticsSection, chartSection],
};

export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest Updates',
  cardType: 'news',
  sections: [newsSection],
};

export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'Complete Card Example',
  sections: Object.values(COMPLETE_FIXTURES),
};

export const MINIMAL_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'minimal-all-sections',
  cardTitle: 'Minimal Card',
  sections: Object.values(MINIMAL_FIXTURES),
};

export const EDGE_CASE_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'edge-case-all-sections',
  cardTitle: 'Edge Case Card',
  sections: Object.values(EDGE_CASE_FIXTURES),
};

export const SAMPLE_CARDS = {
  company: SAMPLE_COMPANY_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
  allSections: ALL_SECTIONS_CARD,
};

// ============================================================================
// FIXTURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a fixture for a specific section type and category
 */
export function getFixture(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixtures = SECTION_FIXTURES[sectionType];
  if (!fixtures) return undefined;

  switch (category) {
    case 'complete': return fixtures.complete;
    case 'minimal': return fixtures.minimal;
    case 'edge-case': return fixtures.edgeCase;
    default: return fixtures.complete;
  }
}

/**
 * Get all fixtures for a section type
 */
export function getAllFixtures(sectionType: string): SectionFixtures | undefined {
  return SECTION_FIXTURES[sectionType];
}

/**
 * Get a fixture with a unique ID generated
 */
export function getFixtureWithUniqueId(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixture = getFixture(sectionType, category);
  if (!fixture) return undefined;

  return {
    ...fixture,
    id: `${fixture.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

/**
 * Get list of available section types
 */
export function getAvailableSectionTypes(): string[] {
  return Object.keys(SECTION_FIXTURES);
}

