/**
 * Layout Context
 *
 * Provides contextual information to section layout preference calculations.
 * This context allows sections to make intelligent decisions based on the
 * current grid state, container dimensions, and overall layout requirements.
 */

/**
 * Context information passed to layout preference calculations
 */
export interface LayoutContext {
  /** Container width in pixels */
  containerWidth: number;
  /** Gap between grid items in pixels */
  gridGap: number;
  /** Current responsive breakpoint */
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Total number of sections in the grid */
  totalSections: number;
  /** Current number of columns in the grid */
  columnCount: number;
}

