/**
 * Responsive utility functions for breakpoint detection and responsive behavior
 */

export enum Breakpoint {
  XS = 0,
  SM = 640,
  MD = 768,
  LG = 1024,
  XL = 1280,
  '2XL' = 1536
}

/**
 * Get current breakpoint based on window width
 * 
 * Determines the current responsive breakpoint by checking window.innerWidth.
 * Returns a default desktop breakpoint if window is not available (SSR).
 * 
 * @returns The current breakpoint enum value
 * 
 * @example
 * ```typescript
 * const breakpoint = getCurrentBreakpoint();
 * if (breakpoint >= Breakpoint.LG) {
 *   // Desktop layout
 * }
 * ```
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') {
    return Breakpoint.LG; // Default to desktop
  }

  return getBreakpointFromWidth(window.innerWidth);
}

/**
 * Get breakpoint enum value from a specific width in pixels
 * 
 * Maps a numeric width to the appropriate breakpoint enum value.
 * Useful for testing or when working with element dimensions rather than window width.
 * 
 * @param width - The width in pixels to determine breakpoint for
 * @returns The breakpoint enum value corresponding to the width
 * 
 * @example
 * ```typescript
 * const breakpoint = getBreakpointFromWidth(1200); // Returns Breakpoint.XL
 * ```
 */
export function getBreakpointFromWidth(width: number): Breakpoint {
  if (width >= Breakpoint['2XL']) return Breakpoint['2XL'];
  if (width >= Breakpoint.XL) return Breakpoint.XL;
  if (width >= Breakpoint.LG) return Breakpoint.LG;
  if (width >= Breakpoint.MD) return Breakpoint.MD;
  if (width >= Breakpoint.SM) return Breakpoint.SM;
  return Breakpoint.XS;
}

/**
 * Check if current viewport matches breakpoint
 */
export function isBreakpoint(breakpoint: Breakpoint): boolean {
  return getCurrentBreakpoint() === breakpoint;
}

/**
 * Check if current viewport is at least breakpoint
 */
export function isAtLeastBreakpoint(breakpoint: Breakpoint): boolean {
  return getCurrentBreakpoint() >= breakpoint;
}

/**
 * Check if current viewport is mobile (< 768px)
 */
export function isMobile(): boolean {
  return getCurrentBreakpoint() < Breakpoint.MD;
}

/**
 * Check if current viewport is tablet (768px - 1024px)
 */
export function isTablet(): boolean {
  const bp = getCurrentBreakpoint();
  return bp >= Breakpoint.MD && bp < Breakpoint.LG;
}

/**
 * Check if current viewport is desktop (>= 1024px)
 */
export function isDesktop(): boolean {
  return getCurrentBreakpoint() >= Breakpoint.LG;
}

export function breakpointToName(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case Breakpoint['2XL']:
      return '2XL';
    case Breakpoint.XL:
      return 'XL';
    case Breakpoint.LG:
      return 'LG';
    case Breakpoint.MD:
      return 'MD';
    case Breakpoint.SM:
      return 'SM';
    case Breakpoint.XS:
    default:
      return 'XS';
  }
}

/**
 * Get optimal column count for grid based on viewport
 * 
 * Calculates the optimal number of columns for a grid layout based on viewport
 * width and minimum item width. Enforces reasonable limits based on device type.
 * 
 * @param minItemWidth - Minimum width for each grid item in pixels (default: 200)
 * @returns Optimal column count (1-4, limited by device type)
 * 
 * @example
 * ```typescript
 * const columns = getOptimalColumns(250); // Returns 1-4 based on viewport
 * // Mobile: always 1
 * // Tablet: max 2
 * // Desktop: max 4
 * ```
 */
export function getOptimalColumns(minItemWidth = 200): number {
  if (typeof window === 'undefined') {
    return 2;
  }
  
  const width = window.innerWidth;
  const columns = Math.floor(width / minItemWidth);
  
  // Enforce reasonable limits
  if (isMobile()) return 1;
  if (isTablet()) return Math.min(columns, 2);
  return Math.min(columns, 4);
}

