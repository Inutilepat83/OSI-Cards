export * from './animation-optimization.util';
export * from './card-diff.util';
export * from './card-spawner.util';
export * from './container-queries.util';
export * from './grid-config.util';
export * from './masonry-detection.util';
export * from './responsive.util';
export * from './smart-grid-logger.util';
export * from './smart-grid.util';
export * from './style-validator.util';
// Export skyline algorithm - rename conflicting types
export {
  SkylinePacker,
  SkylinePackerConfig,
  PackingResult as SkylinePackingResult,
  PlacedSection as SkylinePlacedSection,
  SkylineSegment,
  comparePacking,
  packWithSkyline,
  skylineResultToPositions,
} from './skyline-algorithm.util';

// Export row packer - keep primary names
export * from './flip-animation.util';
export * from './frame-budget.util';
export * from './grid-accessibility.util';
export * from './incremental-layout.util';
// Export layout-cache with renamed CacheStats to avoid conflict with memo.util
export {
  CachedCardLayout,
  CachedSectionLayout,
  DirtyCheckResult,
  LayoutCache,
  CacheStats as LayoutCacheStats,
  clearLayoutCache,
  computeCardHash,
  computeSectionHash,
  computeStructureHash,
  createDebouncedLayoutUpdate,
  getLayoutCache,
  memoizeLayoutComputation,
} from './layout-cache.util';
export * from './layout-debug.util';
export * from './layout-optimizer.util';
export * from './row-packer.util';
export * from './streaming-layout.util';
export * from './virtual-scroll.util';
// Export virtual-scroll.utils with renamed types to avoid conflict with virtual-scroll.util
export {
  VirtualScrollConfig as SimpleVirtualScrollConfig,
  VirtualScrollResult as SimpleVirtualScrollResult,
  VariableHeightItem,
  VariableVirtualScrollConfig,
  VariableVirtualScrollResult,
  calculateVirtualScroll as calculateSimpleVirtualScroll,
  calculateVariableVirtualScroll,
  createLazyLoadObserver,
  createResizeObserver,
  createScrollHandler,
} from './virtual-scroll.utils';
export * from './web-animations.util';
// Note: column-span-optimizer, local-swap-optimizer, gap-filler-optimizer
// have overlapping exports with layout-optimizer - import directly if needed
// export * from './column-span-optimizer.util';
// export * from './local-swap-optimizer.util';
// export * from './gap-filler-optimizer.util';
export * from './accessibility.util';
export * from './memory.util';
export * from './performance.util';
export * from './retry.util';
// Export component-composition with renamed FocusState to avoid conflict with grid-accessibility.util
export {
  AsyncState,
  FocusState as ComponentFocusState,
  CounterState,
  DebouncedValueState,
  ExpandableState,
  HoverState,
  KeyboardNavigationOptions,
  KeyboardNavigationState,
  LoadingState,
  PaginationOptions,
  PaginationState,
  SelectionState,
  ToggleState,
  VisibilityState,
  useAsyncState,
  useCounter,
  useDebouncedValue,
  useExpandableState,
  useFocusState,
  useHoverState,
  useKeyboardNavigation,
  useLoadingState,
  usePagination,
  useSelectionState,
  useToggleState,
  useVisibility,
} from './component-composition.util';
export * from './error-boundary.util';
export * from './input-coercion.util';
export * from './memo.util';
export * from './sanitization.util';
// Export virtual-scroll-enhanced with renamed VirtualScrollConfig to avoid conflict with virtual-scroll.util
export {
  VirtualScrollConfig as EnhancedVirtualScrollConfig,
  IntersectionOptions,
  IntersectionState,
  VirtualScrollState,
  createInfiniteScrollTrigger,
  createLazyLoadTrigger,
  useIntersectionObserver,
  useVirtualScroll,
} from './virtual-scroll-enhanced.util';

// Layout Memoization utilities
export {
  BatchedUpdates,
  DebouncedLayoutUpdate,
  MemoOptions,
  MemoStats,
  MemoizedFunction,
  createBatchProcessor,
  createDebouncedLayout,
  createRAFScheduler,
  heightKeyGenerator,
  layoutKeyGenerator,
  memoize,
} from './layout-memoization.util';

// Unified Layout Optimizer - consolidated layout optimization module
export {
  DEFAULT_OPTIMIZER_CONFIG as DEFAULT_UNIFIED_OPTIMIZER_CONFIG,
  FullyOptimizableSection,
  LayoutGap,
  OptimizableLayoutSection,
  OptimizationMetrics,
  OptimizationResult,
  OptimizationStrategy,
  PreferredColumns,
  UnifiedLayoutOptimizerConfig,
  analyzeLayout,
  fillLayoutGaps,
  findLayoutGaps,
  localSwapOptimization,
  optimizeColumnSpans,
  optimizeGapsOnly,
  optimizeLayout,
  quickOptimize,
} from './unified-layout-optimizer.util';

// Performance monitoring - rename getMemoryUsage to avoid conflict with memory.util
export {
  ComponentRenderTracker,
  FPSMonitor,
  Measure,
  MeasureAsync,
  PerformanceMark,
  PerformanceMonitor,
  PerformanceReport,
  fpsMonitor,
  getMemoryUsage as getPerformanceMemoryUsage,
  observeLongTasks,
  performanceMonitor,
  renderTracker,
} from './performance-monitor.util';

// Note: Additional utility files are available as separate imports if needed:
// - lru-cache.util.ts
// - grid-logger.util.ts
// - input-validation.util.ts
