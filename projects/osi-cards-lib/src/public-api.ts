/**
 * Public API Surface of OSI Cards Library
 * 
 * AUTO-GENERATED FILE - Edits will be preserved in marked sections
 * Generated from section-registry.json
 * Run: npm run generate:public-api
 * 
 * @example
 * ```typescript
 * import { AICardRendererComponent, CardDataService } from 'osi-cards-lib';
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/models';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/decorators';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION MANIFEST (Generated)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/section-manifest.generated';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/services';
export * from './lib/services/section-utils.service';

// Streaming Service (explicitly exported for convenience)
export { 
  OSICardsStreamingService,
  StreamingStage,
  StreamingState,
  CardUpdate,
  StreamingConfig
} from './lib/services/streaming.service';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/interfaces';

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS (Shadow DOM compatible event system)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/events';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/icons';

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/providers';

// ═══════════════════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/themes';

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/presets';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/osi-cards';
export * from './lib/components/ai-card-renderer/ai-card-renderer.component';
export * from './lib/components/section-renderer/section-renderer.component';
export * from './lib/components/section-renderer/dynamic-section-loader.service';
export * from './lib/components/masonry-grid/masonry-grid.component';
export * from './lib/components/card-skeleton/card-skeleton.component';
export * from './lib/components/card-preview/card-preview.component';
export * from './lib/components/osi-cards-container';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/card-header/card-header.component';
export * from './lib/components/card-body/card-body.component';
export * from './lib/components/card-footer/card-footer.component';
export * from './lib/components/card-actions/card-actions.component';
export * from './lib/components/card-section-list/card-section-list.component';
export * from './lib/components/card-streaming-indicator/card-streaming-indicator.component';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (Generated from section-registry.json)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/sections/base-section.component';
export * from './lib/components/sections/info-section.component';
export * from './lib/components/sections/analytics-section/analytics-section.component';
export * from './lib/components/sections/contact-card-section/contact-card-section.component';
export * from './lib/components/sections/network-card-section/network-card-section.component';
export * from './lib/components/sections/map-section/map-section.component';
export * from './lib/components/sections/financials-section/financials-section.component';
export * from './lib/components/sections/event-section/event-section.component';
export * from './lib/components/sections/list-section/list-section.component';
export * from './lib/components/sections/chart-section/chart-section.component';
export * from './lib/components/sections/product-section/product-section.component';
export * from './lib/components/sections/solutions-section/solutions-section.component';
export * from './lib/components/sections/overview-section/overview-section.component';
export * from './lib/components/sections/quotation-section/quotation-section.component';
export * from './lib/components/sections/text-reference-section/text-reference-section.component';
export * from './lib/components/sections/brand-colors-section/brand-colors-section.component';
export * from './lib/components/sections/news-section/news-section.component';
export * from './lib/components/sections/social-media-section/social-media-section.component';

/**
 * Note: For full functionality including:
 * - CardDataService and other core services
 * - NgRx store (actions, selectors, reducers, effects)
 * - Additional utilities and providers
 * 
 * You may need to import from the main application source or
 * extend the library exports. See integration documentation for details.
 * 
 * Styles entry points:
 * - 'osi-cards-lib/styles/_styles.scss' (global styles - may affect host app)
 * - 'osi-cards-lib/styles/_styles-scoped.scss' (scoped styles - recommended for integration)
 * 
 * For scoped styles, wrap components in <osi-cards-container> or use class="osi-cards-container"
 */
