/**
 * OSI Cards Type Definitions
 * 
 * Centralized type definitions for string literals and common types
 * used across the OSI Cards library.
 * 
 * @module types
 */

// ============================================================================
// BRANDED TYPES
// ============================================================================
export * from './branded.types';

// ============================================================================
// UTILITY TYPES
// ============================================================================
export * from './utility.types';

// ============================================================================
// STREAMING TYPES
// ============================================================================

/**
 * Streaming stage - represents the current state of card streaming
 */
export type StreamingStage = 
  | 'idle'        // No streaming active
  | 'thinking'    // LLM is thinking/processing
  | 'streaming'   // Actively receiving chunks
  | 'complete'    // Streaming finished successfully
  | 'aborted'     // Streaming was cancelled
  | 'error';      // An error occurred

/**
 * Card change type - indicates what kind of change occurred
 */
export type CardChangeType = 'structural' | 'content';

// ============================================================================
// LAYOUT TYPES
// ============================================================================

/**
 * Layout state for tracking layout progress
 */
export type LayoutState = 'idle' | 'measuring' | 'calculating' | 'ready';

/**
 * Packing algorithm options
 */
export type PackingAlgorithm = 'legacy' | 'row-first' | 'skyline';

/**
 * Breakpoint names for responsive design
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Preferred column count for sections
 */
export type PreferredColumns = 1 | 2 | 3 | 4;

/**
 * Layout priority - numeric priority for space-filling algorithm
 * 1 = Highest priority (placed first, resized last)
 * 2 = Medium priority
 * 3 = Lowest priority (placed last, resized first)
 */
export type LayoutPriority = 1 | 2 | 3;

/**
 * Priority band for layout ordering
 */
export type PriorityBand = 'critical' | 'important' | 'standard' | 'optional';

// ============================================================================
// SECTION TYPES
// ============================================================================

/**
 * Section orientation
 */
export type SectionOrientation = 'vertical' | 'horizontal' | 'auto';

/**
 * Field status types
 */
export type FieldStatus = 
  | 'completed' 
  | 'in-progress' 
  | 'pending' 
  | 'cancelled' 
  | 'active' 
  | 'inactive' 
  | 'warning';

/**
 * Field priority types
 */
export type FieldPriority = 'high' | 'medium' | 'low';

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'stable' | 'neutral';

/**
 * Performance indicator
 */
export type PerformanceLevel = 'excellent' | 'good' | 'fair' | 'poor';

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Card action button behavior type
 */
export type CardActionButtonType = 'mail' | 'website' | 'agent' | 'question';

/**
 * Card action button style variant
 */
export type CardActionVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Animation state
 */
export type AnimationState = 'entering' | 'entered' | 'exiting' | 'none';

/**
 * Animation trigger events
 */
export type AnimationTrigger = 'appear' | 'hover' | 'click' | 'focus';

// ============================================================================
// CHART TYPES
// ============================================================================

/**
 * Chart type options
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme preset names
 */
export type ThemePreset = 'night' | 'day' | 'dusk' | 'ocean' | 'forest';

// ============================================================================
// MISC TYPES
// ============================================================================

/**
 * Generic value types for card fields
 */
export type FieldValue = string | number | boolean | null;

/**
 * Card format types
 */
export type FieldFormat = 'currency' | 'percentage' | 'number' | 'text';

/**
 * Card type categories (for demo examples)
 */
export type CardType = 'all' | 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' | 'project' | 'sko';

/**
 * Complexity level
 */
export type ComplexityLevel = 'low' | 'medium' | 'high';

