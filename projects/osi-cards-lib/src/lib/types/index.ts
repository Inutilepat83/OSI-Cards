/**
 * Types Module
 *
 * Exports all type definitions for OSI Cards.
 */

// Branded types (ID types, value types)
export * from './branded.types';

// Utility types (all enum types, helper types, etc.)
export * from './utility.types';

// Re-export commonly needed types from other modules
export type { ThemePreset } from '../themes/theme.service';
// Removed - grid-logger.util deleted
export type LayoutPhase = 'initial' | 'optimization' | 'finalization';
export type PackingAlgorithm = 'skyline' | 'bin-packer' | 'row-packer';
// Removed - responsive.util deleted
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type { AnimationState } from '../utils/web-animations.util';

// ThemeMode type
export type ThemeMode = 'light' | 'dark' | 'auto' | 'system';

// Additional enums and types
export type TrendDirection = 'up' | 'down' | 'neutral' | 'stable';
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polar';
export type LayoutState = 'idle' | 'measuring' | 'calculating' | 'rendering' | 'complete';
export type PreferredColumns = 1 | 2 | 3 | 4;
export type PriorityBand = 'critical' | 'important' | 'standard' | 'optional';
export type SectionOrientation = 'vertical' | 'horizontal' | 'auto';
export type FieldStatus =
  | 'completed'
  | 'in-progress'
  | 'pending'
  | 'cancelled'
  | 'active'
  | 'inactive'
  | 'warning'
  | 'confirmed'
  | 'planned'
  | 'tentative'
  | 'available'
  | 'coming-soon'
  | 'deprecated'
  | 'out-of-stock';
export type FieldPriority = 'high' | 'medium' | 'low';
export type PerformanceLevel = 'high' | 'medium' | 'low';
export type CardActionVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link';
export type AnimationTrigger = 'load' | 'hover' | 'click' | 'scroll' | 'manual';
export type FieldValue = string | number | boolean | null | undefined;
export type FieldFormat = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'time' | 'ratio';
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very-complex';
export type CardChangeType = 'structural' | 'content' | 'style' | 'none';
