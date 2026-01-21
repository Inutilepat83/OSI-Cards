/**
 * Masonry Detection Utilities
 *
 * Runtime detection for CSS Grid Level 2 masonry support and progressive enhancement.
 * Provides feature detection, fallback strategies, and layout mode selection.
 *
 * @example
 * ```typescript
 * import { detectMasonrySupport, getOptimalLayoutMode } from '../../public-api';
 *
 * const support = detectMasonrySupport();
 * const layoutMode = getOptimalLayoutMode(support);
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Feature support detection results
 */
export interface MasonrySupportResult {
  /** Native CSS masonry support (grid-template-rows: masonry) */
  nativeMasonry: boolean;

  /** CSS Subgrid support (grid-template-rows: subgrid) */
  subgrid: boolean;

  /** CSS Container Queries support */
  containerQueries: boolean;

  /** CSS content-visibility support */
  contentVisibility: boolean;

  /** CSS Anchor Positioning support */
  anchorPositioning: boolean;

  /** CSS aspect-ratio support */
  aspectRatio: boolean;

  /** CSS scroll-snap support */
  scrollSnap: boolean;

  /** View Transitions API support */
  viewTransitions: boolean;

  /** Web Animations API support */
  webAnimations: boolean;

  /** ResizeObserver support */
  resizeObserver: boolean;

  /** IntersectionObserver support */
  intersectionObserver: boolean;

  /** requestIdleCallback support */
  requestIdleCallback: boolean;
}

/**
 * Layout mode based on feature support
 */
export type LayoutMode =
  | 'native-masonry' // CSS Grid Level 2 masonry
  | 'subgrid-aligned' // CSS Subgrid for aligned sections
  | 'css-grid-dense' // CSS Grid with dense packing
  | 'js-masonry'; // JavaScript-based masonry (fallback)

/**
 * Animation mode based on feature support
 */
export type AnimationMode =
  | 'web-animations' // Web Animations API
  | 'css-animations' // CSS keyframe animations
  | 'reduced-motion'; // Reduced motion alternatives

/**
 * Layout engine configuration
 */
export interface LayoutEngineConfig {
  layoutMode: LayoutMode;
  animationMode: AnimationMode;
  features: MasonrySupportResult;
  useVirtualScrolling: boolean;
  useWebWorker: boolean;
  useContentVisibility: boolean;
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Cache for feature detection results
 */
let cachedSupport: MasonrySupportResult | null = null;

/**
 * Detects CSS and API feature support for masonry layouts
 * Results are cached for performance
 *
 * @returns MasonrySupportResult with all detected features
 */
export function detectMasonrySupport(): MasonrySupportResult {
  // Return cached result if available
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  // SSR check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedSupport = getServerSideDefaults();
    return cachedSupport;
  }

  cachedSupport = {
    nativeMasonry: detectNativeMasonry(),
    subgrid: detectSubgrid(),
    containerQueries: detectContainerQueries(),
    contentVisibility: detectContentVisibility(),
    anchorPositioning: detectAnchorPositioning(),
    aspectRatio: detectAspectRatio(),
    scrollSnap: detectScrollSnap(),
    viewTransitions: detectViewTransitions(),
    webAnimations: detectWebAnimations(),
    resizeObserver: detectResizeObserver(),
    intersectionObserver: detectIntersectionObserver(),
    requestIdleCallback: detectRequestIdleCallback(),
  };

  return cachedSupport;
}

/**
 * Clears the cached feature detection results
 * Useful for testing or when features may have changed
 */
export function clearMasonrySupportCache(): void {
  cachedSupport = null;
}

/**
 * Server-side rendering defaults (conservative)
 */
function getServerSideDefaults(): MasonrySupportResult {
  return {
    nativeMasonry: false,
    subgrid: false,
    containerQueries: false,
    contentVisibility: false,
    anchorPositioning: false,
    aspectRatio: true, // Widely supported
    scrollSnap: true, // Widely supported
    viewTransitions: false,
    webAnimations: true,
    resizeObserver: true,
    intersectionObserver: true,
    requestIdleCallback: false,
  };
}

/**
 * Detects native CSS masonry support
 * Uses @supports check for grid-template-rows: masonry
 */
function detectNativeMasonry(): boolean {
  try {
    return CSS.supports('grid-template-rows', 'masonry');
  } catch {
    return false;
  }
}

/**
 * Detects CSS Subgrid support
 */
function detectSubgrid(): boolean {
  try {
    return CSS.supports('grid-template-rows', 'subgrid');
  } catch {
    return false;
  }
}

/**
 * Detects CSS Container Queries support
 */
function detectContainerQueries(): boolean {
  try {
    return CSS.supports('container-type', 'inline-size');
  } catch {
    return false;
  }
}

/**
 * Detects CSS content-visibility support
 */
function detectContentVisibility(): boolean {
  try {
    return CSS.supports('content-visibility', 'auto');
  } catch {
    return false;
  }
}

/**
 * Detects CSS Anchor Positioning support
 */
function detectAnchorPositioning(): boolean {
  try {
    return CSS.supports('anchor-name', '--anchor');
  } catch {
    return false;
  }
}

/**
 * Detects CSS aspect-ratio support
 */
function detectAspectRatio(): boolean {
  try {
    return CSS.supports('aspect-ratio', '1 / 1');
  } catch {
    return false;
  }
}

/**
 * Detects CSS scroll-snap support
 */
function detectScrollSnap(): boolean {
  try {
    return CSS.supports('scroll-snap-type', 'x mandatory');
  } catch {
    return false;
  }
}

/**
 * Detects View Transitions API support
 */
function detectViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Detects Web Animations API support
 */
function detectWebAnimations(): boolean {
  return typeof Element !== 'undefined' && 'animate' in Element.prototype;
}

/**
 * Detects ResizeObserver support
 */
function detectResizeObserver(): boolean {
  return typeof ResizeObserver !== 'undefined';
}

/**
 * Detects IntersectionObserver support
 */
function detectIntersectionObserver(): boolean {
  return typeof IntersectionObserver !== 'undefined';
}

/**
 * Detects requestIdleCallback support
 */
function detectRequestIdleCallback(): boolean {
  return typeof requestIdleCallback !== 'undefined';
}

// ============================================================================
// LAYOUT MODE SELECTION
// ============================================================================

/**
 * Determines the optimal layout mode based on feature support
 *
 * Priority:
 * 1. Native CSS masonry (best performance, native browser support)
 * 2. Subgrid-aligned (aligned headers, better visual consistency)
 * 3. CSS Grid dense (decent gap handling)
 * 4. JS masonry (fallback, full control)
 *
 * @param support - Feature support detection results
 * @returns Optimal layout mode
 */
export function getOptimalLayoutMode(support?: MasonrySupportResult): LayoutMode {
  const features = support ?? detectMasonrySupport();

  // Native masonry is the gold standard
  if (features.nativeMasonry) {
    return 'native-masonry';
  }

  // Subgrid provides aligned headers across columns
  if (features.subgrid) {
    return 'subgrid-aligned';
  }

  // CSS Grid with dense packing is a good intermediate
  // Always available in modern browsers
  if (typeof CSS !== 'undefined' && CSS.supports('display', 'grid')) {
    return 'css-grid-dense';
  }

  // JavaScript masonry as ultimate fallback
  return 'js-masonry';
}

/**
 * Determines the optimal animation mode based on feature support and user preferences
 *
 * @param support - Feature support detection results
 * @returns Optimal animation mode
 */
export function getOptimalAnimationMode(support?: MasonrySupportResult): AnimationMode {
  // Check for reduced motion preference
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return 'reduced-motion';
    }
  }

  const features = support ?? detectMasonrySupport();

  // Web Animations API provides best control
  if (features.webAnimations) {
    return 'web-animations';
  }

  // CSS animations as fallback
  return 'css-animations';
}

/**
 * Gets the complete layout engine configuration based on feature detection
 *
 * @param options - Optional overrides for specific features
 * @returns Complete layout engine configuration
 */
export function getLayoutEngineConfig(options?: {
  forceLayoutMode?: LayoutMode;
  forceAnimationMode?: AnimationMode;
  disableVirtualScrolling?: boolean;
  disableWebWorker?: boolean;
}): LayoutEngineConfig {
  const features = detectMasonrySupport();

  return {
    layoutMode: options?.forceLayoutMode ?? getOptimalLayoutMode(features),
    animationMode: options?.forceAnimationMode ?? getOptimalAnimationMode(features),
    features,
    useVirtualScrolling: !options?.disableVirtualScrolling && features.intersectionObserver,
    useWebWorker: !options?.disableWebWorker && typeof Worker !== 'undefined',
    useContentVisibility: features.contentVisibility,
  };
}

// ============================================================================
// CSS CLASS GENERATION
// ============================================================================

/**
 * Generates CSS classes based on detected features and layout mode
 *
 * @param config - Layout engine configuration
 * @returns Array of CSS class names to apply to the container
 */
export function generateLayoutClasses(config: LayoutEngineConfig): string[] {
  const classes: string[] = [];

  // Layout mode class
  switch (config.layoutMode) {
    case 'native-masonry':
      classes.push('masonry-container--native');
      break;
    case 'subgrid-aligned':
      classes.push('masonry-container--subgrid');
      break;
    case 'css-grid-dense':
      classes.push('masonry-container--grid');
      break;
    case 'js-masonry':
      classes.push('masonry-grid-container');
      break;
  }

  // Feature enhancement classes
  if (config.features.containerQueries) {
    classes.push('masonry-container--container-queries');
  }

  if (config.useContentVisibility) {
    classes.push('masonry-container--content-visibility');
  }

  // Animation mode class
  switch (config.animationMode) {
    case 'web-animations':
      classes.push('masonry-container--web-animations');
      break;
    case 'reduced-motion':
      classes.push('masonry-container--reduced-motion');
      break;
  }

  // Virtual scrolling class
  if (config.useVirtualScrolling) {
    classes.push('masonry-container--virtual');
  }

  return classes;
}

// ============================================================================
// FEATURE CAPABILITY QUERIES
// ============================================================================

/**
 * Checks if native masonry layout can be used
 */
export function canUseNativeMasonry(): boolean {
  return detectMasonrySupport().nativeMasonry;
}

/**
 * Checks if subgrid layout can be used
 */
export function canUseSubgrid(): boolean {
  return detectMasonrySupport().subgrid;
}

/**
 * Checks if container queries can be used
 */
export function canUseContainerQueries(): boolean {
  return detectMasonrySupport().containerQueries;
}

/**
 * Checks if content-visibility can be used for performance
 */
export function canUseContentVisibility(): boolean {
  return detectMasonrySupport().contentVisibility;
}

/**
 * Checks if View Transitions API can be used
 */
export function canUseViewTransitions(): boolean {
  return detectMasonrySupport().viewTransitions;
}

/**
 * Checks if Web Animations API can be used
 */
export function canUseWebAnimations(): boolean {
  return detectMasonrySupport().webAnimations;
}

// ============================================================================
// RUNTIME POLYFILL LOADING
// ============================================================================

/**
 * Dynamically loads polyfills for missing features
 * Only loads what's needed based on detection
 *
 * @returns Promise that resolves when all polyfills are loaded
 */
export async function loadMasonryPolyfills(): Promise<void> {
  const support = detectMasonrySupport();

  // requestIdleCallback polyfill (inline, no external dependency)
  if (!support.requestIdleCallback) {
    (window as any).requestIdleCallback = (callback: IdleRequestCallback) => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
    (window as any).cancelIdleCallback = (id: number) => clearTimeout(id);
  }

  // Note: ResizeObserver and IntersectionObserver polyfills should be loaded
  // at the application level if needed, as they require external packages.
  // Modern browsers (2020+) support both natively.

  // Clear cache to re-detect with polyfills
  clearMasonrySupportCache();
}

// ============================================================================
// FEATURE CHANGE LISTENERS
// ============================================================================

/**
 * Listens for changes to reduced motion preference
 *
 * @param callback - Function to call when preference changes
 * @returns Cleanup function to remove listener
 */
export function onReducedMotionChange(
  callback: (prefersReducedMotion: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', handler);

  // Call immediately with current value
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Listens for changes to color scheme preference
 *
 * @param callback - Function to call when preference changes
 * @returns Cleanup function to remove listener
 */
export function onColorSchemeChange(callback: (prefersDark: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', handler);

  // Call immediately with current value
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Listens for forced colors mode (high contrast)
 *
 * @param callback - Function to call when preference changes
 * @returns Cleanup function to remove listener
 */
export function onForcedColorsChange(callback: (forcedColors: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(forced-colors: active)');

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', handler);

  // Call immediately with current value
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}
