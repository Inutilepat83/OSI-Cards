/**
 * Masonry Grid Type Definitions
 *
 * Comprehensive type system for the production-ready masonry grid implementation.
 * These types support zero-gap layout, dynamic preferences, and content-responsive behavior.
 */

import { LayoutContext } from './layout-context';

// Breakpoint is exported from types/index.ts
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Section content orientation
 * - 'vertical': Stack items in a column (default for lists, overview)
 * - 'horizontal': Arrange items in a row (good for contact cards, metrics)
 * - 'squared': Square/equal aspect ratio layout (good for single items, card collections)
 * - 'auto': Let the system decide based on content shape and available space
 */
export type SectionOrientation = 'vertical' | 'horizontal' | 'squared' | 'auto';

/**
 * Section layout preferences calculated dynamically
 * These are HINTS to the grid, not strict requirements
 */
export interface SectionLayoutPreferences {
  /** Preferred column count (1-4) */
  preferredColumns: 1 | 2 | 3 | 4;
  /** Minimum columns the section should span */
  minColumns?: 1 | 2 | 3 | 4;
  /** Maximum columns the section can span */
  maxColumns?: 1 | 2 | 3 | 4;
  /** Content format/orientation preference */
  orientation?: SectionOrientation;
  /** Whether section can shrink below preferredColumns */
  canShrink?: boolean;
  /** Whether section can grow beyond preferredColumns */
  canGrow?: boolean;
  /** Prefer growing this section when space is available */
  flexGrow?: boolean;
  /** Content density score (items/fields count) - helps determine if section can expand */
  contentDensity?: number;
  /** Optional hint for initial layout (in pixels) */
  estimatedHeight?: number;
}

/**
 * Position data calculated by grid
 * Used to apply transforms that eliminate vertical gaps
 */
export interface MasonryItemPosition {
  /** Index of the item in the sections array */
  readonly index: number;
  /** CSS transform string to apply (e.g., "translateY(50px)") */
  readonly transform: string;
  /** Column span assigned to this item */
  readonly colSpan: number;
  /** Starting column index (0-based) */
  readonly columnIndex: number;
  /** Estimated top position in pixels */
  readonly estimatedTop: number;
  /** Measured height in pixels (read after render) */
  readonly measuredHeight: number;
}

/**
 * Preference calculator function signature
 * CRITICAL: This is a PURE function - no side effects, no Angular dependencies
 */
export type PreferenceCalculator = (
  section: import('../models/card.model').CardSection,
  availableColumns: number,
  context: LayoutContext
) => SectionLayoutPreferences;
