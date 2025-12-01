/**
 * OSI Cards Layout Constants
 * 
 * Centralized layout configuration values for grid, spacing, and responsive design.
 * 
 * @example
 * ```typescript
 * import { GRID_CONFIG, SPACING, BREAKPOINTS } from 'osi-cards-lib';
 * 
 * const columns = GRID_CONFIG.DEFAULT_COLUMNS;
 * const gap = SPACING.MD;
 * ```
 */

// ============================================================================
// GRID CONFIGURATION
// ============================================================================

/**
 * Default grid configuration values
 */
export const GRID_CONFIG = {
  /** Minimum column count */
  MIN_COLUMNS: 1,
  
  /** Maximum column count */
  MAX_COLUMNS: 4,
  
  /** Default column count */
  DEFAULT_COLUMNS: 3,
  
  /** Minimum column width in pixels */
  MIN_COLUMN_WIDTH: 260,
  
  /** Maximum column width in pixels */
  MAX_COLUMN_WIDTH: 500,
  
  /** Default column width in pixels */
  DEFAULT_COLUMN_WIDTH: 320,
  
  /** Gap between grid items in pixels */
  DEFAULT_GAP: 16,
  
  /** Larger gap for spacious layouts */
  LARGE_GAP: 24,
  
  /** Smaller gap for compact layouts */
  SMALL_GAP: 8,
} as const;

/**
 * Masonry layout configuration
 */
export const MASONRY_CONFIG = {
  /** Default column count for masonry grid */
  DEFAULT_COLUMNS: 3,
  
  /** Gap between masonry items */
  ITEM_GAP: 16,
  
  /** Minimum section height in pixels */
  MIN_SECTION_HEIGHT: 100,
  
  /** Maximum section height before scroll */
  MAX_SECTION_HEIGHT: 600,
  
  /** Resize debounce delay in milliseconds */
  RESIZE_DEBOUNCE: 150,
  
  /** Layout calculation debounce in milliseconds */
  LAYOUT_DEBOUNCE: 50,
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

/**
 * Consistent spacing scale (in pixels)
 * Based on 4px base unit
 */
export const SPACING = {
  /** 0px - No spacing */
  NONE: 0,
  
  /** 4px - Extra extra small */
  XXS: 4,
  
  /** 8px - Extra small */
  XS: 8,
  
  /** 12px - Small */
  SM: 12,
  
  /** 16px - Medium (default) */
  MD: 16,
  
  /** 20px - Medium large */
  ML: 20,
  
  /** 24px - Large */
  LG: 24,
  
  /** 32px - Extra large */
  XL: 32,
  
  /** 48px - Extra extra large */
  XXL: 48,
  
  /** 64px - Huge */
  HUGE: 64,
  
  /** 96px - Massive */
  MASSIVE: 96,
} as const;

/**
 * Card-specific spacing
 */
export const CARD_SPACING = {
  /** Card padding */
  PADDING: SPACING.MD,
  
  /** Card padding on mobile */
  PADDING_MOBILE: SPACING.SM,
  
  /** Gap between sections */
  SECTION_GAP: SPACING.MD,
  
  /** Gap between fields */
  FIELD_GAP: SPACING.XS,
  
  /** Gap between items */
  ITEM_GAP: SPACING.SM,
  
  /** Header bottom margin */
  HEADER_MARGIN: SPACING.MD,
  
  /** Footer top margin */
  FOOTER_MARGIN: SPACING.MD,
  
  /** Action button gap */
  ACTION_GAP: SPACING.XS,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Responsive breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  /** Extra small: < 640px (mobile phones) */
  XS: 0,
  
  /** Small: >= 640px (large phones, small tablets) */
  SM: 640,
  
  /** Medium: >= 768px (tablets) */
  MD: 768,
  
  /** Large: >= 1024px (small laptops, tablets landscape) */
  LG: 1024,
  
  /** Extra large: >= 1280px (desktops) */
  XL: 1280,
  
  /** 2XL: >= 1536px (large desktops) */
  XXL: 1536,
} as const;

/**
 * Column configuration per breakpoint
 */
export const COLUMNS_BY_BREAKPOINT = {
  XS: 1,
  SM: 1,
  MD: 2,
  LG: 3,
  XL: 4,
  XXL: 4,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

/**
 * Border radius scale (in pixels)
 */
export const BORDER_RADIUS = {
  /** No radius */
  NONE: 0,
  
  /** Small radius */
  SM: 4,
  
  /** Medium radius (default) */
  MD: 8,
  
  /** Large radius */
  LG: 12,
  
  /** Extra large radius */
  XL: 16,
  
  /** Full radius (for circular elements) */
  FULL: 9999,
} as const;

/**
 * Card-specific border radius
 */
export const CARD_BORDER_RADIUS = {
  /** Card container radius */
  CARD: BORDER_RADIUS.LG,
  
  /** Section radius */
  SECTION: BORDER_RADIUS.MD,
  
  /** Button radius */
  BUTTON: BORDER_RADIUS.MD,
  
  /** Input radius */
  INPUT: BORDER_RADIUS.SM,
  
  /** Badge radius */
  BADGE: BORDER_RADIUS.FULL,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

/**
 * Box shadow presets
 */
export const SHADOWS = {
  /** No shadow */
  NONE: 'none',
  
  /** Subtle shadow */
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  /** Default shadow */
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  
  /** Prominent shadow */
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  
  /** Large shadow */
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  
  /** Elevated shadow */
  XXL: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  /** Inner shadow */
  INNER: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  /** Focus ring shadow */
  FOCUS: '0 0 0 3px rgba(99, 102, 241, 0.3)',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  /** Below everything */
  BELOW: -1,
  
  /** Base level */
  BASE: 0,
  
  /** Raised content */
  RAISED: 10,
  
  /** Dropdown menus */
  DROPDOWN: 100,
  
  /** Sticky elements */
  STICKY: 200,
  
  /** Fixed elements */
  FIXED: 300,
  
  /** Modal backdrop */
  MODAL_BACKDROP: 400,
  
  /** Modal content */
  MODAL: 500,
  
  /** Popover */
  POPOVER: 600,
  
  /** Tooltip */
  TOOLTIP: 700,
  
  /** Toast notifications */
  TOAST: 800,
  
  /** Maximum (emergency use only) */
  MAX: 9999,
} as const;

// ============================================================================
// SIZE CONSTRAINTS
// ============================================================================

/**
 * Card size constraints
 */
export const CARD_SIZES = {
  /** Minimum card width */
  MIN_WIDTH: 280,
  
  /** Maximum card width */
  MAX_WIDTH: 600,
  
  /** Default card width */
  DEFAULT_WIDTH: 400,
  
  /** Minimum card height */
  MIN_HEIGHT: 200,
  
  /** Maximum card height (before scroll) */
  MAX_HEIGHT: 800,
  
  /** Fullscreen card padding from viewport */
  FULLSCREEN_PADDING: 40,
} as const;

/**
 * Section size constraints
 */
export const SECTION_SIZES = {
  /** Minimum section width */
  MIN_WIDTH: 200,
  
  /** Minimum section height */
  MIN_HEIGHT: 80,
  
  /** Maximum items before scroll */
  MAX_VISIBLE_ITEMS: 10,
  
  /** Maximum fields before scroll */
  MAX_VISIBLE_FIELDS: 15,
  
  /** Collapsed section height */
  COLLAPSED_HEIGHT: 48,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (typeof window === 'undefined') return 'LG';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS.XXL) return 'XXL';
  if (width >= BREAKPOINTS.XL) return 'XL';
  if (width >= BREAKPOINTS.LG) return 'LG';
  if (width >= BREAKPOINTS.MD) return 'MD';
  if (width >= BREAKPOINTS.SM) return 'SM';
  return 'XS';
}

/**
 * Get column count for current breakpoint
 */
export function getColumnsForBreakpoint(breakpoint?: keyof typeof BREAKPOINTS): number {
  const bp = breakpoint ?? getCurrentBreakpoint();
  return COLUMNS_BY_BREAKPOINT[bp];
}

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.MD;
}

/**
 * Check if current viewport is tablet
 */
export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG;
}

/**
 * Check if current viewport is desktop
 */
export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= BREAKPOINTS.LG;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type ZIndexKey = keyof typeof Z_INDEX;







