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
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') {
    return Breakpoint.LG; // Default to desktop
  }
  
  const width = window.innerWidth;
  
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

/**
 * Get optimal column count for grid based on viewport
 */
export function getOptimalColumns(minItemWidth: number = 200): number {
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

