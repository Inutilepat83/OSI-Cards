/**
 * Section Registry - Single Source of Truth
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:registry-fixtures
 * 
 * This file provides typed access to all section definitions from the registry.
 */

import type { CardSection } from '../models/card.model';
import { SectionType } from '../models/generated-section-types';

/**
 * Section definition from registry
 */
export interface SectionDefinition {
  name: string;
  description: string;
  componentPath: string;
  stylePath?: string;
  selector: string;
  useCases: string[];
  bestPractices: string[];
  rendering: {
    usesFields: boolean;
    usesItems: boolean;
    usesChartData?: boolean;
    defaultColumns: number;
    supportsCollapse?: boolean;
    supportsEmoji?: boolean;
    requiresExternalLib?: string;
  };
  aliases?: string[];
  isInternal?: boolean;
}

/**
 * Registry metadata
 */
export const REGISTRY_VERSION = '1.0.0';
export const REGISTRY_DESCRIPTION = 'Single source of truth for all OSI Cards section types';

/**
 * All public section types (excludes internal sections)
 */
export const PUBLIC_SECTION_TYPES: SectionType[] = [
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
  'quotation',
  'text-reference',
  'brand-colors',
  'news',
  'social-media'
];

/**
 * Section type aliases mapping
 */
export const TYPE_ALIASES: Record<string, SectionType> = {
  'metrics': 'analytics',
  'stats': 'analytics',
  'timeline': 'event',
  'table': 'list',
  'locations': 'map',
  'quote': 'quotation',
  'reference': 'text-reference',
  'text-ref': 'text-reference',
  'brands': 'brand-colors',
  'colors': 'brand-colors',
  'project': 'info'
};

/**
 * Default section type for unknown types
 */
export const DEFAULT_SECTION_TYPE: SectionType = 'fallback';

/**
 * Section definitions from registry
 */
export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  'info': {
    name: 'Info Section',
    description: 'Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.',
    componentPath: './lib/components/sections/info-section.component',
    stylePath: './lib/styles/components/sections/_info.scss',
    selector: 'app-info-section',
    useCases: ["Company information","Contact details","Metadata display","Key-value pairs"],
    bestPractices: ["Use for structured data with clear labels and values","Keep labels concise and descriptive","Use trend indicators for dynamic data","Group related fields together"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'analytics': {
    name: 'Analytics Section',
    description: 'Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.',
    componentPath: './lib/components/sections/analytics-section/analytics-section.component',
    stylePath: './lib/styles/components/sections/_analytics.scss',
    selector: 'app-analytics-section',
    useCases: ["Performance metrics","KPIs","Growth statistics","Analytics dashboards"],
    bestPractices: ["Include percentage values for better visualization","Use trend indicators (up/down/stable)","Show change values when available","Group related metrics together"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 2,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: ["metrics","stats"],
    isInternal: false
  },
  'contact-card': {
    name: 'Contact Card Section',
    description: 'Displays person information with avatars, roles, contact details, and social links.',
    componentPath: './lib/components/sections/contact-card-section/contact-card-section.component',
    stylePath: './lib/styles/components/sections/_contact.scss',
    selector: 'app-contact-card-section',
    useCases: ["Team members","Key contacts","Leadership","Stakeholders"],
    bestPractices: ["Include name, role, and contact info","Add avatar images when available","Include social media links","Group by department or role"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 2,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'network-card': {
    name: 'Network Card Section',
    description: 'Displays relationship graphs, network connections, and influence metrics.',
    componentPath: './lib/components/sections/network-card-section/network-card-section.component',
    stylePath: './lib/styles/components/sections/_network.scss',
    selector: 'app-network-card-section',
    useCases: ["Org charts","Relationship maps","Network analysis","Connection graphs"],
    bestPractices: ["Show relationships clearly","Include connection types","Add influence metrics","Use visual hierarchy"],
    rendering: {
      usesFields: false,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'map': {
    name: 'Map Section',
    description: 'Displays geographic data with embedded maps, pins, and location information.',
    componentPath: './lib/components/sections/map-section/map-section.component',
    stylePath: './lib/styles/components/sections/_map.scss',
    selector: 'app-map-section',
    useCases: ["Office locations","Store finder","Geographic data","Location tracking"],
    bestPractices: ["Include coordinates or addresses","Use proper location formats","Add location metadata","Ensure map accessibility"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: false,
      supportsEmoji: false,
      requiresExternalLib: 'leaflet'
    },
    aliases: ["locations"],
    isInternal: false
  },
  'financials': {
    name: 'Financials Section',
    description: 'Displays financial data including revenue, expenses, P&L statements, and currency information.',
    componentPath: './lib/components/sections/financials-section/financials-section.component',
    stylePath: './lib/styles/components/sections/_financials.scss',
    selector: 'app-financials-section',
    useCases: ["Financial reports","Quarterly earnings","Budget information","Revenue tracking"],
    bestPractices: ["Use currency formatting","Include time periods","Show trends and changes","Group by category"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 2,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'event': {
    name: 'Event Section',
    description: 'Displays chronological events, timelines, schedules, and calendar information.',
    componentPath: './lib/components/sections/event-section/event-section.component',
    stylePath: './lib/styles/components/sections/_event.scss',
    selector: 'app-event-section',
    useCases: ["Event calendars","Project timelines","Schedules","Milestones"],
    bestPractices: ["Include dates and times","Add location information","Use status for event state","Chronological ordering"],
    rendering: {
      usesFields: true,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: ["timeline"],
    isInternal: false
  },
  'list': {
    name: 'List Section',
    description: 'Displays structured lists and tables. Supports sorting, filtering, and item interactions.',
    componentPath: './lib/components/sections/list-section/list-section.component',
    stylePath: './lib/styles/components/sections/_list.scss',
    selector: 'app-list-section',
    useCases: ["Product lists","Employee rosters","Inventory","Task lists"],
    bestPractices: ["Use items array for list data","Include titles and descriptions","Add status badges when relevant","Keep list items scannable"],
    rendering: {
      usesFields: false,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: ["table"],
    isInternal: false
  },
  'chart': {
    name: 'Chart Section',
    description: 'Displays data visualizations including bar charts, line charts, pie charts, and more.',
    componentPath: './lib/components/sections/chart-section/chart-section.component',
    stylePath: './lib/styles/components/sections/_chart.scss',
    selector: 'app-chart-section',
    useCases: ["Data visualization","Analytics dashboards","Statistical reports","Trend analysis"],
    bestPractices: ["Provide proper chart configuration","Include chart type specification","Use appropriate data formats","Ensure accessibility with labels"],
    rendering: {
      usesFields: false,
      usesItems: false,
      usesChartData: true,
      defaultColumns: 2,
      supportsCollapse: false,
      supportsEmoji: false,
      requiresExternalLib: 'chart.js'
    },
    aliases: [],
    isInternal: false
  },
  'product': {
    name: 'Product Section',
    description: 'Displays product information, features, benefits, and pricing.',
    componentPath: './lib/components/sections/product-section/product-section.component',
    stylePath: './lib/styles/components/sections/_product.scss',
    selector: 'app-product-section',
    useCases: ["Product catalogs","Feature lists","Product comparisons","Pricing tables"],
    bestPractices: ["Highlight key features","Include pricing when relevant","Use descriptions for details","Add status for availability"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'solutions': {
    name: 'Solutions Section',
    description: 'Displays solution offerings, use cases, features, and benefits.',
    componentPath: './lib/components/sections/solutions-section/solutions-section.component',
    stylePath: './lib/styles/components/sections/_solutions.scss',
    selector: 'app-solutions-section',
    useCases: ["Service offerings","Solution portfolios","Use cases","Case studies"],
    bestPractices: ["Highlight key benefits","Include use cases","Add feature lists","Show outcomes when available"],
    rendering: {
      usesFields: true,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'overview': {
    name: 'Overview Section',
    description: 'Displays high-level summaries, executive dashboards, and key highlights.',
    componentPath: './lib/components/sections/overview-section/overview-section.component',
    stylePath: './lib/styles/components/sections/_overview.scss',
    selector: 'app-overview-section',
    useCases: ["Executive summaries","Dashboard overviews","Key highlights","Quick insights"],
    bestPractices: ["Keep content high-level","Focus on key metrics","Use visual indicators","Limit to essential information"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: false,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'quotation': {
    name: 'Quotation Section',
    description: 'Displays quotes, testimonials, highlighted text, and citations.',
    componentPath: './lib/components/sections/quotation-section/quotation-section.component',
    stylePath: './lib/styles/components/sections/_quotation.scss',
    selector: 'app-quotation-section',
    useCases: ["Testimonials","Quotes","Citations","Highlighted content"],
    bestPractices: ["Include source attribution","Add author information","Use for emphasis","Include dates when relevant"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: ["quote"],
    isInternal: false
  },
  'text-reference': {
    name: 'Text Reference Section',
    description: 'Displays long-form text, paragraphs, articles, and reference content.',
    componentPath: './lib/components/sections/text-reference-section/text-reference-section.component',
    stylePath: './lib/styles/components/sections/_text-reference.scss',
    selector: 'app-text-reference-section',
    useCases: ["Articles","Blog posts","Research summaries","Long-form content"],
    bestPractices: ["Break into readable chunks","Use proper formatting","Include citations","Add metadata for context"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: ["reference","text-ref"],
    isInternal: false
  },
  'brand-colors': {
    name: 'Brand Colors Section',
    description: 'Displays color swatches, brand palettes, and design system colors.',
    componentPath: './lib/components/sections/brand-colors-section/brand-colors-section.component',
    stylePath: './lib/styles/components/sections/_brand-colors.scss',
    selector: 'app-brand-colors-section',
    useCases: ["Brand assets","Design systems","Color palettes","Style guides"],
    bestPractices: ["Include hex/RGB values","Show color names","Group by category","Enable copy-to-clipboard"],
    rendering: {
      usesFields: true,
      usesItems: false,
      usesChartData: false,
      defaultColumns: 2,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: ["brands","colors"],
    isInternal: false
  },
  'news': {
    name: 'News Section',
    description: 'Displays news articles, headlines, and press releases. Supports source attribution and publication dates.',
    componentPath: './lib/components/sections/news-section/news-section.component',
    stylePath: './lib/styles/components/sections/_news.scss',
    selector: 'app-news-section',
    useCases: ["News feeds","Press releases","Announcements","Blog posts"],
    bestPractices: ["Include source and publication date in meta","Keep headlines concise","Use descriptions for summaries","Include status for article state"],
    rendering: {
      usesFields: false,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: false,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'social-media': {
    name: 'Social Media Section',
    description: 'Displays social media posts, engagement metrics, and social feed content.',
    componentPath: './lib/components/sections/social-media-section/social-media-section.component',
    stylePath: './lib/styles/components/sections/_social-media.scss',
    selector: 'app-social-media-section',
    useCases: ["Social feeds","Engagement tracking","Social monitoring","Content aggregation"],
    bestPractices: ["Include platform information","Show engagement metrics","Add timestamps","Include author information"],
    rendering: {
      usesFields: true,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: false
  },
  'fallback': {
    name: 'Fallback Section',
    description: 'Default section renderer for unknown or unsupported section types.',
    componentPath: './lib/components/sections/fallback-section/fallback-section.component',
    stylePath: './lib/styles/components/sections/_fallback.scss',
    selector: 'app-fallback-section',
    useCases: ["Unknown types","Error handling","Graceful degradation"],
    bestPractices: ["Display section data in readable format","Show section type for debugging","Provide helpful error messages"],
    rendering: {
      usesFields: true,
      usesItems: true,
      usesChartData: false,
      defaultColumns: 1,
      supportsCollapse: true,
      supportsEmoji: true,
      requiresExternalLib: undefined
    },
    aliases: [],
    isInternal: true
  }
};

/**
 * Get section definition by type
 */
export function getSectionDefinition(type: SectionType): SectionDefinition {
  return SECTION_DEFINITIONS[type];
}

/**
 * Check if a section type uses fields
 */
export function sectionUsesFields(type: SectionType): boolean {
  return SECTION_DEFINITIONS[type]?.rendering.usesFields ?? false;
}

/**
 * Check if a section type uses items
 */
export function sectionUsesItems(type: SectionType): boolean {
  return SECTION_DEFINITIONS[type]?.rendering.usesItems ?? false;
}

/**
 * Get default column count for a section type
 */
export function getDefaultColumns(type: SectionType): number {
  return SECTION_DEFINITIONS[type]?.rendering.defaultColumns ?? 1;
}
