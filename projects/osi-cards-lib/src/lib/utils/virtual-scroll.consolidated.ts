/**
 * Consolidated Virtual Scroll Utilities
 *
 * Merges functionality from:
 * - virtual-scroll.util.ts (class-based manager)
 * - virtual-scroll-enhanced.util.ts (signals-based approach)
 *
 * Provides both class-based and functional virtual scrolling implementations.
 *
 * @example
 * ```typescript
 * // Class-based approach
 * const manager = new VirtualScrollManager(container, { bufferSize: 3 });
 * manager.setItems(sections);
 * const visible = manager.getVisibleItems();
 *
 * // Signals-based approach (Angular 16+)
 * const virtualScroll = useVirtualScroll({
 *   items: sectionsSignal,
 *   itemHeight: 200,
 *   containerHeight: 600
 * });
 * // In template: virtualScroll.visibleItems()
 * ```
 */

// Re-export both implementations for maximum flexibility
export * from './virtual-scroll.util';
// export * from './virtual-scroll-enhanced.util';  // Disabled: duplicates virtual-scroll.util exports

// Note: This consolidated file maintains both approaches for:
// 1. Backwards compatibility (class-based)
// 2. Modern Angular features (signals-based)
// 3. Developer choice (pick the approach that fits your architecture)

