/**
 * Migration Feature Flags Configuration
 * Used for gradual rollout of consolidated code
 */

export interface MigrationFlags {
  // Section flags
  USE_LIB_SECTIONS: boolean;
  USE_SECTION_REGISTRY: boolean;
  USE_LAZY_SECTIONS: boolean;

  // Service flags
  USE_LIB_SERVICES: boolean;
  USE_CONSOLIDATED_THEME_SERVICE: boolean;
  USE_CONSOLIDATED_EVENT_BUS: boolean;

  // Style flags
  USE_CONSOLIDATED_STYLES: boolean;
  USE_CSS_VARIABLES: boolean;

  // Component flags
  USE_LIB_CARD_RENDERER: boolean;
  USE_LIB_MASONRY_GRID: boolean;
  USE_LIB_SECTION_RENDERER: boolean;

  // Advanced flags
  ENABLE_SECTION_CACHING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
}

export const DEFAULT_MIGRATION_FLAGS: MigrationFlags = {
  // Section flags
  USE_LIB_SECTIONS: true,
  USE_SECTION_REGISTRY: true,
  USE_LAZY_SECTIONS: false, // Enable after testing

  // Service flags
  USE_LIB_SERVICES: true,
  USE_CONSOLIDATED_THEME_SERVICE: true,
  USE_CONSOLIDATED_EVENT_BUS: true,

  // Style flags
  USE_CONSOLIDATED_STYLES: true,
  USE_CSS_VARIABLES: true,

  // Component flags
  USE_LIB_CARD_RENDERER: true,
  USE_LIB_MASONRY_GRID: true,
  USE_LIB_SECTION_RENDERER: true,

  // Advanced flags
  ENABLE_SECTION_CACHING: true,
  ENABLE_PERFORMANCE_MONITORING: false,
};

/**
 * Migration status tracking
 */
export type MigrationStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface MigrationItem {
  name: string;
  status: MigrationStatus;
  srcPath?: string;
  libPath?: string;
  notes?: string;
}

export const MIGRATION_TRACKER: Record<string, MigrationItem[]> = {
  sections: [
    {
      name: 'analytics',
      status: 'completed',
      libPath: 'lib/components/sections/analytics-section',
    },
    {
      name: 'brand-colors',
      status: 'completed',
      libPath: 'lib/components/sections/brand-colors-section',
    },
    { name: 'chart', status: 'completed', libPath: 'lib/components/sections/chart-section' },
    {
      name: 'contact-card',
      status: 'completed',
      libPath: 'lib/components/sections/contact-card-section',
    },
    { name: 'event', status: 'completed', libPath: 'lib/components/sections/event-section' },
    { name: 'fallback', status: 'completed', libPath: 'lib/components/sections/fallback-section' },
    {
      name: 'financials',
      status: 'completed',
      libPath: 'lib/components/sections/financials-section',
    },
    { name: 'info', status: 'completed', libPath: 'lib/components/sections/info-section' },
    { name: 'list', status: 'completed', libPath: 'lib/components/sections/list-section' },
    { name: 'map', status: 'completed', libPath: 'lib/components/sections/map-section' },
    {
      name: 'network-card',
      status: 'completed',
      libPath: 'lib/components/sections/network-card-section',
    },
    { name: 'news', status: 'completed', libPath: 'lib/components/sections/news-section' },
    { name: 'overview', status: 'completed', libPath: 'lib/components/sections/overview-section' },
    { name: 'product', status: 'completed', libPath: 'lib/components/sections/product-section' },
    {
      name: 'quotation',
      status: 'completed',
      libPath: 'lib/components/sections/quotation-section',
    },
    {
      name: 'social-media',
      status: 'completed',
      libPath: 'lib/components/sections/social-media-section',
    },
    {
      name: 'solutions',
      status: 'completed',
      libPath: 'lib/components/sections/solutions-section',
    },
    {
      name: 'text-reference',
      status: 'completed',
      libPath: 'lib/components/sections/text-reference-section',
    },
  ],
  services: [
    { name: 'theme', status: 'completed', libPath: 'lib/themes/theme.service.ts' },
    { name: 'card-facade', status: 'completed', libPath: 'lib/services/card-facade.service.ts' },
    { name: 'event-bus', status: 'completed', libPath: 'lib/services/event-bus.service.ts' },
    {
      name: 'section-normalization',
      status: 'completed',
      libPath: 'lib/services/section-normalization.service.ts',
    },
    {
      name: 'section-utils',
      status: 'completed',
      libPath: 'lib/services/section-utils.service.ts',
    },
    { name: 'icon', status: 'completed', libPath: 'lib/services/icon.service.ts' },
    {
      name: 'magnetic-tilt',
      status: 'completed',
      libPath: 'lib/services/magnetic-tilt.service.ts',
    },
  ],
  components: [
    { name: 'ai-card-renderer', status: 'completed', libPath: 'lib/components/ai-card-renderer' },
    { name: 'masonry-grid', status: 'completed', libPath: 'lib/components/masonry-grid' },
    { name: 'section-renderer', status: 'completed', libPath: 'lib/components/section-renderer' },
    { name: 'card-skeleton', status: 'completed', libPath: 'lib/components/card-skeleton' },
  ],
};



