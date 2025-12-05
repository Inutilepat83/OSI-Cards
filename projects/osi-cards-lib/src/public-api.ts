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
  CardAction,
  CardField,
  CardItem,
  CardSection,
  // Type guards
  CardTypeGuards,
  EmailConfig,
  EmailContact,
  MailCardAction,
} from './lib/models/card.model';

// Re-export section types from factories (single source of truth)
export { SectionMetadata, SectionType } from './lib/factories';

// Generated section types
export * from './lib/models/discriminated-sections';
export * from './lib/models/generated-section-types';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS (Animation, layout, streaming configuration - excluding duplicate types)
// ═══════════════════════════════════════════════════════════════════════════
export {
  ANIMATION_PRESETS,
  // Animation constants
  ANIMATION_TIMING,
  BORDER_RADIUS,
  BREAKPOINTS,
  CARD_SIZES,
  CARD_SPACING,
  COLUMNS_BY_BREAKPOINT,
  CONTAINER_CONFIG,
  DEFAULT_LOADING_MESSAGES,
  EASING,
  EMPTY_STATE_CONFIG,
  // Layout constants
  GRID_CONFIG,
  ICON_SIZE,
  MASONRY_CONFIG,
  // UI constants
  PARTICLE_CONFIG,
  PLACEHOLDER_TEXT,
  SHADOWS,
  SKELETON_CONFIG,
  SPACING,
  STAGGER_DELAYS,
  // Streaming constants
  STREAMING_CONFIG,
  STREAMING_PROGRESS,
  STREAMING_STAGES,
  TILT_CONFIG,
  Z_INDEX,
  calculateChunkDelay,
  generateStreamingId,
  getAnimationTiming,
  getColumnsForBreakpoint,
  getCurrentBreakpoint,
  getEasing,
  getRandomLoadingMessage,
  isDesktopViewport,
  isMobileViewport,
  isStreamingPlaceholder,
  isTabletViewport,
  prefersReducedMotion,
} from './lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// FACTORIES (Card and section builders)
// ═══════════════════════════════════════════════════════════════════════════
export {
  ActionFactory,
  // Card factory
  CardFactory,
  FieldFactory,
  ItemFactory,
  SectionConfigFactory,
  // Section factory
  SectionFactory,
} from './lib/factories';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATORS (Validation and section component decorators)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/decorators/section-component.decorator';
export {
  LogValidationErrors,
  validateField,
  validateSection,
} from './lib/decorators/validation.decorator';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION MANIFEST (Generated)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/section-manifest.generated';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════
export {
  AccessibilityService,
  CachedSectionNormalizationService,
  CardBusEvent,
  // AnimationOrchestratorService,  // Not exported from services
  // SectionAnimationService,  // Not exported from services
  CardFacadeService,
  CardUpdate,
  DynamicSectionLoaderService,
  EmailHandlerService,
  // EmptyStateService, // Removed - implement in your app
  ErrorSeverity,
  // Error & Logging Services
  ErrorTrackingService,
  EventBusService,
  EventHandler,
  EventMiddlewareService,
  FEATURE_FLAG_META,
  FeatureFlagKey,
  FeatureFlagsConfig,
  FeatureFlagsService,
  I18nService,
  IconService,
  KeyboardShortcut,
  KeyboardShortcutsService,
  // Layout Services (NEW - Architecture Improvement Dec 2025)
  LayoutCalculationService,
  LayoutStateManager,
  LayoutWorkerService,
  LogEntry,
  LogLevel,
  LoggerService,
  MagneticTiltService,
  MousePosition,
  OSICardsStreamingService,
  OSI_FEATURE_FLAGS,
  SectionNormalizationService,
  SectionPluginRegistry,
  SectionUtilsService,
  StreamingConfig,
  StreamingState,
  SupportedLocale,
  TiltCalculations,
  Toast,
  ToastService,
  TrackedError,
  createLogger,
  type LayoutConfig,
  type LayoutResult,
  type LayoutState,
  type LayoutStatistics,
  type Position,
  type PositionedSection,
  type StateSnapshot,
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
  ColorSchemePreference,
  DEFAULT_THEME_CONFIG,
  OSICardsThemeConfig,
  OSI_THEME_CONFIG,
  ThemePreset,
  ThemeService,
  ThemeServiceConfig,
  provideOSICardsTheme,
} from './lib/themes';

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/presets';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export { AICardRendererComponent } from './lib/components/ai-card-renderer/ai-card-renderer.component';
export * from './lib/components/card-preview/card-preview.component';
export * from './lib/components/card-skeleton/card-skeleton.component';
export * from './lib/components/masonry-grid/masonry-grid.component';
export * from './lib/components/osi-cards';
export * from './lib/components/osi-cards-container';
export * from './lib/components/section-renderer/section-renderer.component';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS (Reusable components for sections)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/shared';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/card-actions/card-actions.component';
export * from './lib/components/card-body/card-body.component';
export * from './lib/components/card-footer/card-footer.component';
export * from './lib/components/card-header/card-header.component';
export * from './lib/components/card-section-list/card-section-list.component';
export { CardStreamingIndicatorComponent } from './lib/components/card-streaming-indicator/card-streaming-indicator.component';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════
export { ErrorBoundaryComponent } from './lib/components/error-boundary/error-boundary.component';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (Generated from section-registry.json)
// ═══════════════════════════════════════════════════════════════════════════
export { AnalyticsSectionComponent } from './lib/components/sections/analytics-section/analytics-section.component';
export { BaseSectionComponent } from './lib/components/sections/base-section.component';
export { BrandColorsSectionComponent } from './lib/components/sections/brand-colors-section/brand-colors-section.component';
export { ChartSectionComponent } from './lib/components/sections/chart-section/chart-section.component';
export { ContactCardSectionComponent } from './lib/components/sections/contact-card-section/contact-card-section.component';
export { EventSectionComponent } from './lib/components/sections/event-section/event-section.component';
export { FinancialsSectionComponent } from './lib/components/sections/financials-section/financials-section.component';
export * from './lib/components/sections/info-section/info-section.component';
export { ListSectionComponent } from './lib/components/sections/list-section/list-section.component';
export { MapSectionComponent } from './lib/components/sections/map-section/map-section.component';
export { NetworkCardSectionComponent } from './lib/components/sections/network-card-section/network-card-section.component';
export { NewsSectionComponent } from './lib/components/sections/news-section/news-section.component';
export { OverviewSectionComponent } from './lib/components/sections/overview-section/overview-section.component';
export { ProductSectionComponent } from './lib/components/sections/product-section/product-section.component';
export { QuotationSectionComponent } from './lib/components/sections/quotation-section/quotation-section.component';
export { SocialMediaSectionComponent } from './lib/components/sections/social-media-section/social-media-section.component';
export { SolutionsSectionComponent } from './lib/components/sections/solutions-section/solutions-section.component';
export { TextReferenceSectionComponent } from './lib/components/sections/text-reference-section/text-reference-section.component';

// ═══════════════════════════════════════════════════════════════════════════
// DIRECTIVES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/directives';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES (Plugin architecture, event middleware)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/interfaces';

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-VALUE UTILITIES (Curated exports for card rendering excellence)
// Note: Only exporting utilities that compile without errors and provide real value
// ═══════════════════════════════════════════════════════════════════════════

// Performance Optimization
export { Memoize, MemoizeLRU, MemoizeTTL } from './lib/utils/advanced-memoization.util';
export { ObjectPool } from './lib/utils/object-pool.util';

// Layout & Grid
export { PerfectBinPacker } from './lib/utils/perfect-bin-packer.util';

// Animation & Interactions
export { debounce, throttle } from './lib/utils/debounce-throttle.util';
export {
  FlipAnimator,
  createFlipList,
  recordPositions,
  type FlipConfig,
  type FlipState,
} from './lib/utils/flip-animation.util';

// Developer Experience
export { CardUtil } from './lib/utils/card.util';
export {
  createSafeAsyncFunction,
  createSafeFunction,
  tryCatch,
  useErrorBoundary,
  type ErrorBoundaryOptions,
  type ErrorBoundaryState,
} from './lib/utils/error-boundary.util';
export { AutoUnsubscribe, SubscriptionTracker } from './lib/utils/subscription-tracker.util';

// Grid Configuration (Core utilities)
export {
  DEFAULT_GRID_CONFIG,
  calculateColumnWidth,
  calculateColumns,
  getPreferredColumns,
  resolveColumnSpan,
  type GridConfig,
} from './lib/utils/grid-config.util';

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
