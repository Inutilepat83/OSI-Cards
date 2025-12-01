/**
 * Public API Surface of OSI Cards Library
 *
 * @example
 * ```typescript
 * import { AICardRendererComponent, provideOSICards } from 'osi-cards-lib';
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES (Primary source for all type literals)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// MODELS (Card configuration types - excluding duplicate type literals)
// ═══════════════════════════════════════════════════════════════════════════
export {
  // Card interfaces
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  MailCardAction,
  EmailConfig,
  EmailContact,

  // Type guards
  CardTypeGuards,
} from './lib/models/card.model';

// Re-export section types from factories (single source of truth)
export { SectionMetadata, SectionType } from './lib/factories';

// Generated section types
export * from './lib/models/generated-section-types';
export * from './lib/models/discriminated-sections';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS (Animation, layout, streaming configuration - excluding duplicate types)
// ═══════════════════════════════════════════════════════════════════════════
export {
  // Animation constants
  ANIMATION_TIMING,
  STAGGER_DELAYS,
  EASING,
  ANIMATION_PRESETS,
  TILT_CONFIG,
  prefersReducedMotion,
  getAnimationTiming,
  getEasing,

  // Layout constants
  GRID_CONFIG,
  MASONRY_CONFIG,
  SPACING,
  CARD_SPACING,
  BREAKPOINTS,
  COLUMNS_BY_BREAKPOINT,
  BORDER_RADIUS,
  SHADOWS,
  Z_INDEX,
  CARD_SIZES,
  getCurrentBreakpoint,
  getColumnsForBreakpoint,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,

  // Streaming constants
  STREAMING_CONFIG,
  STREAMING_STAGES,
  STREAMING_PROGRESS,
  PLACEHOLDER_TEXT,
  DEFAULT_LOADING_MESSAGES,
  calculateChunkDelay,
  generateStreamingId,
  isStreamingPlaceholder,
  getRandomLoadingMessage,

  // UI constants
  PARTICLE_CONFIG,
  EMPTY_STATE_CONFIG,
  CONTAINER_CONFIG,
  ICON_SIZE,
  SKELETON_CONFIG,
} from './lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// FACTORIES (Card and section builders)
// ═══════════════════════════════════════════════════════════════════════════
export {
  // Card factory
  CardFactory,
  SectionConfigFactory,
  FieldFactory,
  ItemFactory,
  ActionFactory,
  
  // Section factory
  SectionFactory,
} from './lib/factories';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATORS (Validation and section component decorators)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/decorators/section-component.decorator';
export {
  validateSection,
  validateField,
  LogValidationErrors,
} from './lib/decorators/validation.decorator';

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

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES (Plugin architecture, event middleware)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/interfaces';

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES (Layout, animation, performance, accessibility)
// Note: Utilities are available via direct import: import { ... } from 'osi-cards-lib/lib/utils'
// Core utilities exported here to avoid duplicate type conflicts
// ═══════════════════════════════════════════════════════════════════════════
export {
  // Layout utilities
  SkylinePacker,
  StreamingLayoutManager,

  // Animation utilities
  FlipAnimator,

  // Accessibility
  GridAccessibilityManager,

  // Component composition hooks
  useToggleState,
  useHoverState,
  useFocusState,
  useLoadingState,
  useAsyncState,
  usePagination,
  useSelectionState,
  useKeyboardNavigation,
  useVisibility,
  useExpandableState,
  useDebouncedValue,
  useCounter,

  // Error boundary
  useErrorBoundary,

  // Input coercion
  coerceBoolean,
  coerceNumber,

  // Memoization
  memoize,
  layoutKeyGenerator,
  createDebouncedLayout,
  createRAFScheduler,
  createBatchProcessor,

  // Sanitization
  sanitizeHtml,
  sanitizeUrl,

  // Virtual scroll
  useVirtualScroll,
  useIntersectionObserver,
  createInfiniteScrollTrigger,
  createLazyLoadTrigger,

  // Layout optimization
  optimizeLayout,
  quickOptimize,
  analyzeLayout,
  findLayoutGaps,
  fillLayoutGaps,
  optimizeColumnSpans,

  // Performance monitoring
  PerformanceMonitor,
  performanceMonitor,
  renderTracker,
  fpsMonitor,
} from './lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/errors';

// ═══════════════════════════════════════════════════════════════════════════
// TESTING UTILITIES
// Note: Testing utilities available via direct import from the testing module
// import { ... } from 'osi-cards-lib/lib/testing' for mock factories and fixtures
// ═══════════════════════════════════════════════════════════════════════════
// Testing exports temporarily disabled to resolve build issues
// Re-enable after fixing testing module TypeScript errors

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
