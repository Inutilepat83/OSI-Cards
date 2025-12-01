export * from './card-diff.util';
export * from './responsive.util';
export * from './card-spawner.util';
export * from './style-validator.util';
export * from './grid-config.util';
export * from './smart-grid.util';
export * from './smart-grid-logger.util';
export * from './animation-optimization.util';
export * from './masonry-detection.util';
export * from './container-queries.util';
// Export skyline algorithm - rename conflicting types
export {
  SkylineSegment,
  PlacedSection as SkylinePlacedSection,
  SkylinePackerConfig,
  PackingResult as SkylinePackingResult,
  SkylinePacker,
  packWithSkyline,
  skylineResultToPositions,
  comparePacking
} from './skyline-algorithm.util';

// Export row packer - keep primary names
export * from './row-packer.util';
export * from './layout-cache.util';
export * from './incremental-layout.util';
export * from './virtual-scroll.util';
export * from './frame-budget.util';
export * from './web-animations.util';
export * from './flip-animation.util';
export * from './streaming-layout.util';
export * from './grid-accessibility.util';
export * from './layout-debug.util';
export * from './layout-optimizer.util';
// Note: column-span-optimizer, local-swap-optimizer, gap-filler-optimizer 
// have overlapping exports with layout-optimizer - import directly if needed
// export * from './column-span-optimizer.util';
// export * from './local-swap-optimizer.util';
// export * from './gap-filler-optimizer.util';
export * from './retry.util';
export * from './performance.util';
export * from './memory.util';
export * from './accessibility.util';

// New utilities (Improvements 1-100)
export * from './signals.util';
export * from './security.util';
export * from './analytics.util';
// Note: a11y-enhanced.util has overlapping exports with accessibility.util (createSkipLink)
// Import directly: import { FocusTrap, LiveAnnouncer } from './a11y-enhanced.util';
// export * from './a11y-enhanced.util';
// Note: performance-monitor.util has overlapping exports with analytics.util (PerformanceMetric)
// Import directly: import { PerformanceMonitor, WebVitals } from './performance-monitor.util';
// export * from './performance-monitor.util';

// Note: lru-cache has overlapping CacheStats with layout-cache - import directly if needed
// export * from './lru-cache.util';
// Note: grid-logger has overlapping exports with smart-grid-logger - import directly if needed
// export * from './grid-logger.util';
// Note: input-validation has overlapping exports with card-spawner - import directly if needed
// export * from './input-validation.util';

// Type Guards (Point 17)
export * from './type-guards.util';

// Structured Logging (Point 81)
// Note: structured-logging.util has overlapping LogLevel with smart-grid-logger - import directly if needed
// export * from './structured-logging.util';

// Deprecation Warnings (Point 87)
// Note: deprecation.util uses structured-logging - import directly if needed
export {
  DEPRECATIONS,
  warnDeprecated,
  deprecated,
  isDeprecatedVersion,
  type DeprecationInfo
} from './deprecation.util';

// Memory Budget (Point 43)
// Note: memory-budget.util has overlapping formatBytes with memory.util - import directly if needed
// export * from './memory-budget.util';

// Developer Diagnostics (Points 52, 90)
// Note: dev-diagnostics.util uses structured-logging - import directly if needed
export {
  DevDiagnostics,
  enableDevMode,
  disableDevMode,
  isDevMode,
  timed,
  type DiagnosticType,
  type DiagnosticEntry
} from './dev-diagnostics.util';

// ═══════════════════════════════════════════════════════════════════════════
// GRID ALGORITHM IMPROVEMENTS (100-Point Plan)
// ═══════════════════════════════════════════════════════════════════════════

// Advanced Bin-Packing Algorithms (Items 1-2)
export {
  GuillotinePacker,
  packWithGuillotine,
  guillotineResultToPositions,
  compareGuillotineHeuristics,
  findBestGuillotineConfig,
  type FreeRectangle,
  type GuillotinePlacement,
  type SplitHeuristic,
  type RectangleSelectionHeuristic,
  type GuillotinePackerConfig,
  type GuillotinePackingResult
} from './guillotine-algorithm.util';

export {
  MaxRectsPacker,
  packWithMaxRects,
  maxRectsResultToPositions,
  findBestMaxRectsHeuristic,
  compareAllMaxRectsHeuristics,
  type MaxRect,
  type MaxRectsPlacement,
  type MaxRectsHeuristic,
  type MaxRectsPackerConfig,
  type MaxRectsPackingResult
} from './maxrects-algorithm.util';

// Algorithm Selector (Item 3)
export {
  AlgorithmSelector,
  selectBestAlgorithm,
  packWithBestAlgorithm,
  comparePackingAlgorithms,
  analyzeSectionsForPacking,
  type ExtendedPackingAlgorithm,
  type AlgorithmSelectorConfig,
  type SectionAnalysis,
  type AlgorithmRecommendation,
  type UnifiedPackingResult,
  type AlgorithmComparisonResult
} from './algorithm-selector.util';

// Advanced Packing Strategies (Items 4-10)
export {
  packWithFFDH,
  packWithFFDHArea,
  packWithBFD,
  packWithStrips,
  optimizeStripPacking,
  packWithLevels,
  packWithBottomLeftFill,
  packWithWasteAwareness,
  packWithLookahead,
  advancedResultToPositions,
  type PackingSection,
  type PackingPlacement,
  type PackingLevel,
  type PackingStrip,
  type AdvancedPackingResult,
  type FFDHSortHeuristic,
  type BFDConfig
} from './advanced-packing.util';

// Column Span Optimization (Items 11-15)
export {
  optimizeSpansWithGlobalImpact,
  negotiateSpans,
  calculateMinViableSpan,
  applyMinViableSpans,
  SpanStabilityTracker,
  calculateSpanExpansion,
  applyExpansionHeuristics,
  type ExtendedOptimizableSection,
  type SpanNegotiationConfig,
  type SpanNegotiationResult,
  type SpanConflict,
  type SpanStabilityRecord
} from './column-span-optimizer.util';

// Gap Detection & Filling (Items 16-25)
export {
  GapAnalyzer,
  GapPriorityQueue,
  GapFiller,
  predictGaps,
  coalesceFragments,
  checkUtilization,
  type GapTopology,
  type GapMetrics,
  type GapAlert
} from './gap-filler-optimizer.util';

// Height Estimation (Items 26-35)
export {
  HeightEstimator,
  HeightCache,
  HeightRefiner,
  HeightHistogram,
  sampleHeights,
  estimateSectionHeightAdvanced,
  batchEstimateHeights,
  createHeightMap,
  type HeightEstimationConfig,
  type EstimationContext,
  type HeightCacheEntry,
  type HeightBucket,
  type HeightRefinementResult,
  DEFAULT_HEIGHT_CONFIG,
  TYPE_BASE_HEIGHTS
} from './height-estimation.util';

// Layout Performance (Items 36-50)
export {
  IncrementalLayout,
  LayoutDiff,
  BatchUpdateQueue,
  LayoutMemoizer,
  SegmentTree,
  SegmentTreePlacer,
  LayoutSnapshotManager,
  DebouncedResizeHandler,
  FrameScheduler,
  createEfficientLayout,
  type SectionPlacement,
  type LayoutDiffEntry,
  type LayoutSnapshot as PerformanceLayoutSnapshot
} from './layout-performance.util';

// Responsive Grid (Items 51-60)
export {
  getBreakpoint,
  calculateResponsiveColumns,
  getBreakpointConfig,
  calculateFluidColumns,
  ResponsiveTransitionManager,
  applyResponsiveSpan,
  applyResponsiveSpans,
  ContainerQueryObserver,
  generateContainerQueryCSS,
  calculateTouchFriendlyGaps,
  getMinTouchTargetSize,
  OrientationHandler,
  getDevicePixelRatio,
  adjustForHighDPI,
  getDPIAwareBreakpoints,
  calculateFluidFontSize,
  getFluidTypographyScale,
  getSectionsInViewport,
  createVirtualizedStrategy,
  calculateDynamicGap,
  generateResponsiveGapCSS,
  createResponsiveGridConfig,
  detectTouchDevice,
  type Breakpoint,
  type BreakpointConfig,
  type ResponsiveGridConfig,
  type ResponsiveSpanRule,
  type ContainerQueryState,
  type OrientationChange,
  type BreakpointTransitionState,
  DEFAULT_BREAKPOINTS,
  DEFAULT_RESPONSIVE_CONFIG,
  DEFAULT_SPAN_RULES
} from './responsive-grid.util';

// Animation & Streaming (Items 61-70)
export {
  AnimationOrchestrator,
  StreamingPlacer,
  ProgressiveReveal,
  generateSkeletonPlacements,
  generateSkeletonCSS,
  AnimationQueue,
  InterruptibleAnimation,
  createStaggeredDelays,
  createStaggeredEntryCSS,
  animateElement,
  prefersReducedMotion,
  easingToCss,
  type EasingFunction,
  type AnimationState,
  type SectionAnimation,
  type AnimationOrchestratorConfig,
  type StreamingPlacementOptions,
  type SkeletonConfig,
  type AnimationMetrics,
  DEFAULT_ANIMATION_CONFIG
} from './animation-streaming.util';

// Priority Ordering (Items 71-80)
export {
  PriorityManager,
  calculateImportanceScore,
  calculateImportanceScores,
  applyUserPreferences,
  applyContextPriorities,
  resolvePriorityConflicts,
  sortByPriority as sortSectionsByPriority,
  getTopPrioritySections,
  createPriorityManager,
  type PriorityLevel,
  type PrioritySource,
  type SectionPriority,
  type PriorityManagerConfig,
  type UserPreferenceProfile,
  type PriorityContext,
  type PriorityConflict,
  type PriorityVisualizationOptions,
  type PriorityVisualization,
  DEFAULT_PRIORITY_CONFIG,
  PRIORITY_LEVEL_WEIGHTS,
  TYPE_DEFAULT_PRIORITIES
} from './priority-ordering.util';

// Debug & Developer Experience (Items 81-90)
export {
  GridDebugger,
  LayoutProfiler,
  GridInspector,
  GridLogger,
  generateGridDashboard,
  exportLayoutState,
  importLayoutState,
  gridLogger,
  gridProfiler,
  type DebugMode,
  type DebugOverlayConfig,
  type PerformanceTiming,
  type ProfilerMetrics,
  type SectionInspection,
  type GridDashboardMetrics,
  type LayoutState,
  DEFAULT_DEBUG_CONFIG
} from './grid-debug.util';

// Accessibility & Testing (Items 91-100)
export {
  KeyboardNavigator,
  ScreenReaderAnnouncer,
  generateAriaAttributes,
  generateGridAriaAttributes,
  calculateContrastRatio,
  meetsContrastStandard,
  parseHexColor,
  validateLayoutConsistency,
  compareSnapshots,
  runBenchmark,
  LayoutTestRunner,
  createAccessibleGrid,
  createTestSuite,
  type NavigationDirection,
  type FocusState,
  type SectionAriaAttributes,
  type ScreenReaderAnnouncement,
  type KeyboardNavConfig,
  type TestResult,
  type LayoutSnapshot as TestLayoutSnapshot,
  type BenchmarkResult,
  DEFAULT_KEYBOARD_CONFIG
} from './accessibility-testing.util';

// Section Layout Registry (Section-level grid configuration)
export {
  registerSectionLayout,
  getSectionLayoutConfig,
  hasLayoutConfig,
  getRegisteredSectionTypes,
  calculateSmartColumns,
  SectionLayoutConfig,
  DEFAULT_LAYOUT_CONFIG
} from './section-layout-registry.util';

// ═══════════════════════════════════════════════════════════════════════════
// 50-POINT IMPROVEMENT PLAN UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

// Deferred Loading (Point #2, #6)
export {
  isHeavySection,
  isExpensiveSection,
  isIdleLoadSection,
  isDeferrableSection,
  getDeferTrigger,
  getPrefetchStrategy,
  getDefaultPlaceholder,
  createDeferObserver,
  DeferredSectionManager,
  createDeferredSectionState,
  OSI_DEFERRED_CONFIG,
  DEFAULT_DEFERRED_CONFIG,
  HEAVY_SECTION_TYPES,
  EXPENSIVE_SECTION_TYPES,
  IDLE_LOAD_SECTION_TYPES,
  DEFERRABLE_SECTION_TYPES,
  type DeferTrigger,
  type DeferredLoadingConfig,
  type DeferredSectionState,
  type DeferredPlaceholderConfig,
  type ViewportTriggerOptions
} from './deferred-loading.util';

// Lazy Section Renderer (Point #6)
export {
  LazySectionRenderer,
  LazySectionRendererService,
  createLazySectionRenderer,
  createVisibilityState,
  getSkeletonStyles,
  SKELETON_SHIMMER_CSS,
  OSI_LAZY_SECTION_CONFIG,
  DEFAULT_LAZY_CONFIG,
  type LazySectionConfig,
  type SectionVisibility,
  type OnSectionVisible,
  type OnSectionHidden
} from './lazy-section-renderer.util';

// OpenTelemetry Integration (Point #40)
export {
  CardTracer,
  initializeTracing,
  shutdownTracing,
  OSI_TRACING_CONFIG,
  DEFAULT_TRACING_CONFIG,
  SpanStatusCode,
  SpanKind,
  type TracingConfig,
  type Span,
  type Tracer,
  type SpanContext,
  type SpanAttributes,
  type SpanOptions,
  type SpanLink,
  type SpanStatus
} from './opentelemetry.util';
