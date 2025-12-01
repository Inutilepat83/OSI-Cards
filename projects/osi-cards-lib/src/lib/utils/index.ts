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
export * from './layout-cache.util';
export * from './layout-debug.util';
export * from './layout-optimizer.util';
export * from './row-packer.util';
export * from './streaming-layout.util';
export * from './virtual-scroll.util';
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

// Performance monitoring
export * from './performance-monitor.util';

// Note: Additional utility files are available as separate imports if needed:
// - lru-cache.util.ts
// - grid-logger.util.ts
// - input-validation.util.ts
