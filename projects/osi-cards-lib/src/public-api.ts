/**
 * Public API Surface of OSI Cards Library
 * 
 * @example
 * ```typescript
 * import { AICardRendererComponent, provideOSICards } from 'osi-cards-lib';
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODELS (primary source for types)
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
export {
  IconService,
  SectionNormalizationService,
  MagneticTiltService,
  SectionUtilsService,
  SectionPluginRegistry,
  EventMiddlewareService,
  OSICardsStreamingService,
  StreamingState,
  CardUpdate,
  StreamingConfig,
  LayoutWorkerService,
  AnimationOrchestratorService,
  SectionAnimationService,
  CardFacadeService,
  FeatureFlagsService,
  AccessibilityService,
  EmptyStateService,
  EmailHandlerService,
  EventBusService,
  CardBusEvent,
  EventHandler,
  DynamicSectionLoaderService,
  CachedSectionNormalizationService
} from './lib/services';

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
// THEMES (ThemePreset is re-exported from models)
// ═══════════════════════════════════════════════════════════════════════════
export { 
  provideOSICardsTheme, 
  OSI_THEME_CONFIG,
  DEFAULT_THEME_CONFIG
} from './lib/themes';

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/presets';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/osi-cards';
export { AICardRendererComponent } from './lib/components/ai-card-renderer/ai-card-renderer.component';
export * from './lib/components/section-renderer/section-renderer.component';
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
export { CardStreamingIndicatorComponent } from './lib/components/card-streaming-indicator/card-streaming-indicator.component';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (Generated from section-registry.json)
// ═══════════════════════════════════════════════════════════════════════════
export { BaseSectionComponent } from './lib/components/sections/base-section.component';
export * from './lib/components/sections/info-section.component';
export { AnalyticsSectionComponent } from './lib/components/sections/analytics-section/analytics-section.component';
export { ContactCardSectionComponent } from './lib/components/sections/contact-card-section/contact-card-section.component';
export { NetworkCardSectionComponent } from './lib/components/sections/network-card-section/network-card-section.component';
export { MapSectionComponent } from './lib/components/sections/map-section/map-section.component';
export { FinancialsSectionComponent } from './lib/components/sections/financials-section/financials-section.component';
export { EventSectionComponent } from './lib/components/sections/event-section/event-section.component';
export { ListSectionComponent } from './lib/components/sections/list-section/list-section.component';
export { ChartSectionComponent } from './lib/components/sections/chart-section/chart-section.component';
export { ProductSectionComponent } from './lib/components/sections/product-section/product-section.component';
export { SolutionsSectionComponent } from './lib/components/sections/solutions-section/solutions-section.component';
export { OverviewSectionComponent } from './lib/components/sections/overview-section/overview-section.component';
export { QuotationSectionComponent } from './lib/components/sections/quotation-section/quotation-section.component';
export { TextReferenceSectionComponent } from './lib/components/sections/text-reference-section/text-reference-section.component';
export { BrandColorsSectionComponent } from './lib/components/sections/brand-colors-section/brand-colors-section.component';
export { NewsSectionComponent } from './lib/components/sections/news-section/news-section.component';
export { SocialMediaSectionComponent } from './lib/components/sections/social-media-section/social-media-section.component';

// ═══════════════════════════════════════════════════════════════════════════
// DIRECTIVES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/directives';

/**
 * Note: For full functionality including:
 * - CardDataService and other core services
 * - NgRx store (actions, selectors, reducers, effects)
 * - Additional utilities and providers
 * 
 * Styles entry points:
 * - 'osi-cards-lib/styles/_styles.scss' (global styles - may affect host app)
 * - 'osi-cards-lib/styles/_styles-scoped.scss' (scoped styles - recommended for integration)
 * 
 * For scoped styles, wrap components in <osi-cards-container> or use class="osi-cards-container"
 */
