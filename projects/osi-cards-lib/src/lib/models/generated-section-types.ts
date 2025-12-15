/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:from-registry
 */

/**
 * All valid section type identifiers
 */
export type SectionType =
  | 'analytics'
  | 'brand-colors'
  | 'chart'
  | 'contact-card'
  | 'event'
  | 'fallback'
  | 'faq'
  | 'financials'
  | 'gallery'
  | 'info'
  | 'list'
  | 'map'
  | 'network-card'
  | 'news'
  | 'overview'
  | 'product'
  | 'quotation'
  | 'social-media'
  | 'solutions'
  | 'table'
  | 'text-reference'
  | 'timeline'
  | 'video';

/**
 * Section type aliases (alternative names that resolve to canonical types)
 */
export type SectionTypeAlias =
  | 'metrics'
  | 'stats'
  | 'kpi'
  | 'brands'
  | 'colors'
  | 'palette'
  | 'graph'
  | 'visualization'
  | 'calendar'
  | 'schedule'
  | 'questions'
  | 'help'
  | 'photos'
  | 'images'
  | 'checklist'
  | 'data-table'
  | 'grid'
  | 'locations'
  | 'press'
  | 'articles'
  | 'summary'
  | 'executive'
  | 'quote'
  | 'testimonial'
  | 'social'
  | 'socials'
  | 'services'
  | 'offerings'
  | 'reference'
  | 'text-ref'
  | 'documentation'
  | 'history'
  | 'milestones'
  | 'videos'
  | 'media';

/**
 * All accepted section type values (canonical + aliases)
 */
export type SectionTypeInput = SectionType | SectionTypeAlias;

/**
 * Section metadata for runtime use
 */
export interface SectionMetadata {
  name: string;
  usesFields: boolean;
  usesItems: boolean;
  usesChartData: boolean;
  defaultColumns: number;
  supportsCollapse: boolean;
  supportsEmoji: boolean;
  requiresExternalLib: string | undefined;
  selector: string;
}

/**
 * Metadata map for all section types
 */
export const SECTION_METADATA: Record<SectionType, SectionMetadata> = {
  analytics: {
    name: 'Analytics Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-analytics-section',
  },
  'brand-colors': {
    name: 'Brand Colors Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-brand-colors-section',
  },
  chart: {
    name: 'Chart Section',
    usesFields: false,
    usesItems: false,
    usesChartData: true,
    defaultColumns: 2,
    supportsCollapse: false,
    supportsEmoji: false,
    requiresExternalLib: 'chart.js',
    selector: 'lib-chart-section',
  },
  'contact-card': {
    name: 'Contact Card Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-contact-card-section',
  },
  event: {
    name: 'Event Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-event-section',
  },
  fallback: {
    name: 'Fallback Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-fallback-section',
  },
  faq: {
    name: 'FAQ Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-faq-section',
  },
  financials: {
    name: 'Financials Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-financials-section',
  },
  gallery: {
    name: 'Gallery Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-gallery-section',
  },
  info: {
    name: 'Info Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-info-section',
  },
  list: {
    name: 'List Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-list-section',
  },
  map: {
    name: 'Map Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: false,
    supportsEmoji: false,
    requiresExternalLib: 'leaflet',
    selector: 'lib-map-section',
  },
  'network-card': {
    name: 'Network Card Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-network-card-section',
  },
  news: {
    name: 'News Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-news-section',
  },
  overview: {
    name: 'Overview Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: false,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-overview-section',
  },
  product: {
    name: 'Product Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-product-section',
  },
  quotation: {
    name: 'Quotation Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-quotation-section',
  },
  'social-media': {
    name: 'Social Media Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-social-media-section',
  },
  solutions: {
    name: 'Solutions Section',
    usesFields: true,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-solutions-section',
  },
  table: {
    name: 'Table Section',
    usesFields: false,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: false,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-table-section',
  },
  'text-reference': {
    name: 'Text Reference Section',
    usesFields: true,
    usesItems: false,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: false,
    requiresExternalLib: undefined,
    selector: 'lib-text-reference-section',
  },
  timeline: {
    name: 'Timeline Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 1,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-timeline-section',
  },
  video: {
    name: 'Video Section',
    usesFields: false,
    usesItems: true,
    usesChartData: false,
    defaultColumns: 2,
    supportsCollapse: true,
    supportsEmoji: true,
    requiresExternalLib: undefined,
    selector: 'lib-video-section',
  },
};

/**
 * Map of type aliases to canonical types
 */
export const SECTION_TYPE_ALIASES: Record<SectionTypeAlias, SectionType> = {
  metrics: 'analytics',
  stats: 'analytics',
  kpi: 'analytics',
  brands: 'brand-colors',
  colors: 'brand-colors',
  palette: 'brand-colors',
  graph: 'chart',
  visualization: 'chart',
  calendar: 'event',
  schedule: 'event',
  questions: 'faq',
  help: 'faq',
  photos: 'gallery',
  images: 'gallery',
  checklist: 'list',
  'data-table': 'table',
  grid: 'table',
  locations: 'map',
  press: 'news',
  articles: 'news',
  summary: 'overview',
  executive: 'overview',
  quote: 'quotation',
  testimonial: 'quotation',
  social: 'social-media',
  socials: 'social-media',
  services: 'solutions',
  offerings: 'solutions',
  reference: 'text-reference',
  'text-ref': 'text-reference',
  documentation: 'text-reference',
  history: 'timeline',
  milestones: 'timeline',
  videos: 'video',
  media: 'video',
};

/**
 * Resolve a section type input to its canonical type
 */
export function resolveSectionType(type: SectionTypeInput): SectionType {
  if (type in SECTION_TYPE_ALIASES) {
    return SECTION_TYPE_ALIASES[type as SectionTypeAlias];
  }
  return type as SectionType;
}

/**
 * Check if a string is a valid section type
 */
export function isValidSectionType(type: string): type is SectionTypeInput {
  return type in SECTION_METADATA || type in SECTION_TYPE_ALIASES;
}

/**
 * Get metadata for a section type
 */
export function getSectionMetadata(type: SectionTypeInput): SectionMetadata | undefined {
  const resolved = resolveSectionType(type);
  return SECTION_METADATA[resolved];
}

/**
 * All public section types (excluding internal ones)
 */
export const PUBLIC_SECTION_TYPES: SectionType[] = [
  'analytics',
  'brand-colors',
  'chart',
  'contact-card',
  'event',
  'faq',
  'financials',
  'gallery',
  'info',
  'list',
  'map',
  'network-card',
  'news',
  'overview',
  'product',
  'quotation',
  'social-media',
  'solutions',
  'table',
  'text-reference',
  'timeline',
  'video',
];

/**
 * All section types (including internal)
 */
export const ALL_SECTION_TYPES: SectionType[] = [
  'analytics',
  'brand-colors',
  'chart',
  'contact-card',
  'event',
  'fallback',
  'faq',
  'financials',
  'gallery',
  'info',
  'list',
  'map',
  'network-card',
  'news',
  'overview',
  'product',
  'quotation',
  'social-media',
  'solutions',
  'table',
  'text-reference',
  'timeline',
  'video',
];
