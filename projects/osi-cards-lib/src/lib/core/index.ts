/**
 * OSI Cards Core Module
 *
 * Smart, reusable primitives for building card components.
 *
 * @module @osi-cards/core
 */

// Grid Layout Engine - Pure layout calculations
export {
  GridLayoutEngine,
  GridSection,
  PositionedGridSection,
  GridLayout,
  GridGap,
  LayoutMetrics,
  GridLayoutConfig,
  createGridLayoutEngine,
} from './grid-layout-engine';

// Resize Manager - Smart resize observation
export {
  ResizeManager,
  ResizeEvent,
  ResizeManagerConfig,
  observeResize,
  createGridResizeManager,
} from './resize-manager';

// Card State Engine - Centralized state management
export {
  CardStateEngine,
  CardData,
  SectionData,
  FieldData,
  ItemData,
  CardStateConfig,
  createCardStateEngine,
  createPersistentCardStateEngine,
} from './card-state-engine';

// Normalization Engine - Unified data normalization with caching
export {
  NormalizationEngine,
  NormalizationResult,
  NormalizationError,
  NormalizationWarning,
  NormalizationConfig,
  NormalizedCard,
  NormalizedSection,
  NormalizedField,
  NormalizedItem,
  NormalizedAction,
  createNormalizer,
  createStrictNormalizer,
} from './normalization-engine';

// Animation Controller - Unified animation management
export {
  AnimationController,
  AnimationType,
  AnimationOptions,
  StaggerOptions,
  FlipOptions,
  AnimationState,
  getAnimationController,
  createAnimationController,
} from './animation-controller';

// Event Emitter - Type-safe event system
export {
  EventEmitter,
  EventHandler,
  EventMiddleware,
  EventLog,
  CardEvents,
  createCardEventEmitter,
} from './event-emitter';

// Configuration - Centralized config management
export {
  ConfigurationManager,
  OSICardsConfig,
  ThemeConfig,
  LayoutConfig,
  AnimationConfig,
  AccessibilityConfig,
  FeatureFlags,
  DEFAULT_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG,
  DEFAULT_FEATURE_FLAGS,
  getConfiguration,
  createConfiguration,
  initConfiguration,
} from './configuration';
