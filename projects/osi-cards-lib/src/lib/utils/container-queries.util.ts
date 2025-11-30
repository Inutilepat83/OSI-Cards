/**
 * Container Queries Utilities
 * 
 * Utilities for CSS Container Queries with fallback support.
 * Provides per-section responsive layouts without relying on viewport-based media queries.
 * 
 * @example
 * ```typescript
 * import { applyContainerQueryClasses, getContainerSize } from 'osi-cards-lib';
 * 
 * // Apply responsive classes based on container width
 * const classes = applyContainerQueryClasses(element, { compact: 280, medium: 400 });
 * ```
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Container size breakpoints (in pixels)
 */
export interface ContainerBreakpoints {
  /** Extra small: 0 - compact */
  xs?: number;
  /** Small: compact - small */
  sm?: number;
  /** Medium: small - medium */
  md?: number;
  /** Large: medium - large */
  lg?: number;
  /** Extra large: large+ */
  xl?: number;
}

/**
 * Default container breakpoints for sections
 */
export const DEFAULT_CONTAINER_BREAKPOINTS: Required<ContainerBreakpoints> = {
  xs: 0,
  sm: 200,
  md: 320,
  lg: 480,
  xl: 640,
};

/**
 * Container size result from measurement
 */
export interface ContainerSize {
  width: number;
  height: number;
  breakpoint: keyof ContainerBreakpoints;
}

/**
 * Container query class mapping
 */
export interface ContainerQueryClassMap {
  [breakpoint: string]: string[];
}

// ============================================================================
// CONTAINER SIZE DETECTION
// ============================================================================

/**
 * Gets the current size of a container element
 * 
 * @param element - The container element to measure
 * @param breakpoints - Custom breakpoints (defaults to DEFAULT_CONTAINER_BREAKPOINTS)
 * @returns ContainerSize with width, height, and current breakpoint
 */
export function getContainerSize(
  element: HTMLElement,
  breakpoints: ContainerBreakpoints = DEFAULT_CONTAINER_BREAKPOINTS
): ContainerSize {
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  const breakpoint = getContainerBreakpointFromWidth(width, breakpoints);
  
  return { width, height, breakpoint };
}

/**
 * Determines the container breakpoint for a given width
 * 
 * @param width - Container width in pixels
 * @param breakpoints - Breakpoint thresholds
 * @returns Breakpoint key
 */
export function getContainerBreakpointFromWidth(
  width: number,
  breakpoints: ContainerBreakpoints = DEFAULT_CONTAINER_BREAKPOINTS
): keyof ContainerBreakpoints {
  const bp = { ...DEFAULT_CONTAINER_BREAKPOINTS, ...breakpoints };
  
  if (width >= bp.xl) return 'xl';
  if (width >= bp.lg) return 'lg';
  if (width >= bp.md) return 'md';
  if (width >= bp.sm) return 'sm';
  return 'xs';
}

// ============================================================================
// CSS CLASS APPLICATION
// ============================================================================

/**
 * Applies container query-based CSS classes to an element
 * 
 * @param element - The element to apply classes to
 * @param classMap - Mapping of breakpoints to class names
 * @param breakpoints - Custom breakpoints
 * @returns The applied class names
 */
export function applyContainerQueryClasses(
  element: HTMLElement,
  classMap: ContainerQueryClassMap,
  breakpoints?: ContainerBreakpoints
): string[] {
  const { breakpoint } = getContainerSize(element, breakpoints);
  
  // Remove all possible classes first
  const allClasses = Object.values(classMap).flat();
  element.classList.remove(...allClasses);
  
  // Apply classes for current and smaller breakpoints
  const breakpointOrder: (keyof ContainerBreakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  const appliedClasses: string[] = [];
  
  for (let i = 0; i <= currentIndex; i++) {
    const bp = breakpointOrder[i];
    if (bp && classMap[bp]) {
      element.classList.add(...classMap[bp]);
      appliedClasses.push(...classMap[bp]);
    }
  }
  
  return appliedClasses;
}

/**
 * Creates a ResizeObserver that applies container query classes on resize
 * 
 * @param element - The element to observe
 * @param classMap - Mapping of breakpoints to class names
 * @param breakpoints - Custom breakpoints
 * @returns Cleanup function to disconnect observer
 */
export function observeContainerQueries(
  element: HTMLElement,
  classMap: ContainerQueryClassMap,
  breakpoints?: ContainerBreakpoints
): () => void {
  // Apply initial classes
  applyContainerQueryClasses(element, classMap, breakpoints);
  
  // Set up observer for changes
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  
  let lastBreakpoint: keyof ContainerBreakpoints | null = null;
  
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    
    const { breakpoint } = getContainerSize(element, breakpoints);
    
    // Only update if breakpoint changed
    if (breakpoint !== lastBreakpoint) {
      lastBreakpoint = breakpoint;
      applyContainerQueryClasses(element, classMap, breakpoints);
    }
  });
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

// ============================================================================
// CSS CUSTOM PROPERTY INJECTION
// ============================================================================

/**
 * Sets CSS custom properties for container size on an element
 * 
 * @param element - The element to set properties on
 * @param prefix - Prefix for custom property names (default: 'container')
 */
export function setContainerSizeProperties(
  element: HTMLElement,
  prefix: string = 'container'
): void {
  const { width, height, breakpoint } = getContainerSize(element);
  
  element.style.setProperty(`--${prefix}-width`, `${width}px`);
  element.style.setProperty(`--${prefix}-height`, `${height}px`);
  element.style.setProperty(`--${prefix}-breakpoint`, breakpoint);
  
  // Set boolean-like properties for each breakpoint
  const breakpointOrder: (keyof ContainerBreakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = 0; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    element.style.setProperty(
      `--${prefix}-${bp}`,
      i <= currentIndex ? '1' : '0'
    );
  }
}

/**
 * Creates a ResizeObserver that updates container size CSS properties
 * 
 * @param element - The element to observe
 * @param prefix - Prefix for custom property names
 * @returns Cleanup function to disconnect observer
 */
export function observeContainerSizeProperties(
  element: HTMLElement,
  prefix: string = 'container'
): () => void {
  // Set initial properties
  setContainerSizeProperties(element, prefix);
  
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  
  const observer = new ResizeObserver(() => {
    setContainerSizeProperties(element, prefix);
  });
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

// ============================================================================
// SECTION-SPECIFIC CONTAINER QUERIES
// ============================================================================

/**
 * Section orientation based on container width
 */
export type SectionOrientation = 'vertical' | 'horizontal' | 'grid';

/**
 * Determines optimal section orientation based on container width
 * 
 * @param containerWidth - Container width in pixels
 * @param itemCount - Number of items in the section
 * @returns Recommended orientation
 */
export function getSectionOrientation(
  containerWidth: number,
  itemCount: number
): SectionOrientation {
  // Narrow containers always stack vertically
  if (containerWidth < 280) {
    return 'vertical';
  }
  
  // Wide containers with few items go horizontal
  if (containerWidth >= 400 && itemCount <= 4) {
    return 'horizontal';
  }
  
  // Wide containers with many items use grid
  if (containerWidth >= 480 && itemCount > 4) {
    return 'grid';
  }
  
  // Medium containers with moderate items
  if (containerWidth >= 320 && itemCount <= 6) {
    return 'horizontal';
  }
  
  return 'vertical';
}

/**
 * Gets the optimal column count for items within a section
 * 
 * @param containerWidth - Container width in pixels
 * @param minItemWidth - Minimum width for each item
 * @param maxColumns - Maximum columns allowed
 * @returns Optimal column count
 */
export function getSectionItemColumns(
  containerWidth: number,
  minItemWidth: number = 160,
  maxColumns: number = 4
): number {
  if (containerWidth < minItemWidth) {
    return 1;
  }
  
  const possibleColumns = Math.floor(containerWidth / minItemWidth);
  return Math.min(possibleColumns, maxColumns);
}

// ============================================================================
// POLYFILL AND FALLBACK
// ============================================================================

/**
 * Checks if native CSS container queries are supported
 */
export function supportsContainerQueries(): boolean {
  if (typeof CSS === 'undefined') {
    return false;
  }
  return CSS.supports('container-type', 'inline-size');
}

/**
 * Creates a JavaScript-based container query fallback
 * Only needed when native container queries aren't supported
 * 
 * @param element - The container element
 * @param queries - Object mapping query conditions to callbacks
 * @returns Cleanup function
 */
export function createContainerQueryFallback(
  element: HTMLElement,
  queries: {
    [query: string]: (matches: boolean) => void;
  }
): () => void {
  // If native support, no fallback needed
  if (supportsContainerQueries()) {
    return () => {};
  }
  
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }
  
  // Parse queries and track states
  const queryStates = new Map<string, boolean>();
  
  const evaluateQueries = () => {
    const rect = element.getBoundingClientRect();
    
    for (const [query, callback] of Object.entries(queries)) {
      const matches = evaluateQuery(query, rect);
      const previousState = queryStates.get(query);
      
      if (matches !== previousState) {
        queryStates.set(query, matches);
        callback(matches);
      }
    }
  };
  
  const observer = new ResizeObserver(evaluateQueries);
  observer.observe(element);
  
  // Initial evaluation
  evaluateQueries();
  
  return () => observer.disconnect();
}

/**
 * Evaluates a simple container query string against element dimensions
 * Supports: min-width, max-width, min-height, max-height
 * 
 * @param query - Query string like "min-width: 400px"
 * @param rect - DOMRect of the element
 * @returns Whether the query matches
 */
function evaluateQuery(query: string, rect: DOMRect): boolean {
  const parts = query.trim().split(':');
  if (parts.length !== 2) return false;
  
  const property = parts[0]?.trim();
  const value = parseFloat(parts[1]?.trim() ?? '');
  
  if (isNaN(value)) return false;
  
  switch (property) {
    case 'min-width':
      return rect.width >= value;
    case 'max-width':
      return rect.width <= value;
    case 'min-height':
      return rect.height >= value;
    case 'max-height':
      return rect.height <= value;
    default:
      return false;
  }
}

// ============================================================================
// CONTENT VISIBILITY UTILITIES
// ============================================================================

/**
 * Applies content-visibility: auto to sections outside viewport
 * with appropriate contain-intrinsic-size for layout stability
 * 
 * @param element - The section element
 * @param estimatedHeight - Estimated height for intrinsic size
 */
export function applyContentVisibility(
  element: HTMLElement,
  estimatedHeight: number = 200
): void {
  if (!CSS.supports('content-visibility', 'auto')) {
    return;
  }
  
  element.style.contentVisibility = 'auto';
  element.style.containIntrinsicSize = `auto ${estimatedHeight}px`;
}

/**
 * Removes content-visibility from an element
 * Call when element should always be rendered (e.g., during streaming)
 * 
 * @param element - The section element
 */
export function removeContentVisibility(element: HTMLElement): void {
  element.style.contentVisibility = '';
  element.style.containIntrinsicSize = '';
}

/**
 * Creates an IntersectionObserver that manages content-visibility
 * Applies content-visibility to elements that leave the viewport
 * 
 * @param elements - Elements to observe
 * @param options - Observer options
 * @returns Cleanup function
 */
export function createContentVisibilityObserver(
  elements: HTMLElement[],
  options: {
    rootMargin?: string;
    estimatedHeight?: number;
  } = {}
): () => void {
  if (!CSS.supports('content-visibility', 'auto')) {
    return () => {};
  }
  
  if (typeof IntersectionObserver === 'undefined') {
    return () => {};
  }
  
  const { rootMargin = '100px', estimatedHeight = 200 } = options;
  
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        
        if (entry.isIntersecting) {
          // Element entering viewport - render fully
          removeContentVisibility(element);
        } else {
          // Element leaving viewport - skip rendering
          applyContentVisibility(element, estimatedHeight);
        }
      }
    },
    {
      rootMargin,
      threshold: 0,
    }
  );
  
  for (const element of elements) {
    observer.observe(element);
  }
  
  return () => observer.disconnect();
}

