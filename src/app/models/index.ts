/**
 * Application Models Barrel Export
 *
 * This file re-exports all model types from the library as the single source of truth.
 * The library provides canonical type definitions; app-specific types extend or augment these.
 *
 * For most use cases, import directly from this barrel:
 * ```typescript
 * import { AICardConfig, CardSection, CardField } from '@app/models';
 * ```
 */

// ============================================================================
// RE-EXPORTS FROM LIBRARY (Canonical definitions)
// ============================================================================

// Note: Using relative imports since the library isn't published as npm package

// Core card models
export {
  // Card types
  CardType,
  AICardConfig,
  CardSection,
  CardField,
  CardItem,

  // Action types
  CardActionButtonType,
  EmailContact,
  EmailConfig,
  MailCardAction,
  WebsiteCardAction,
  AgentCardAction,
  QuestionCardAction,
  LegacyCardAction,
  CardAction,

  // Type guards and utilities
  CardTypeGuards,
  CardUtils,

  // Generated section types
  SectionType,
  SectionTypeAlias,
  SectionTypeInput,
  SectionMetadata,
  SECTION_METADATA,
  SECTION_TYPE_ALIASES,
  resolveSectionType,
  isValidSectionType,
  getSectionMetadata,
} from '../../../projects/osi-cards-lib/src/lib/models';

// Discriminated section unions (type-safe section handling)
export {
  DiscriminatedSection,
  isOverviewSection,
  isInfoSection,
  isAnalyticsSection,
  isListSection,
  isChartSection,
  isContactCardSection,
  isNetworkCardSection,
  isMapSection,
  isFinancialsSection,
  isEventSection,
  isProductSection,
  isSolutionsSection,
  isQuotationSection,
  isTextReferenceSection,
  isBrandColorsSection,
  isNewsSection,
  isSocialMediaSection,
  isFallbackSection,
} from '../../../projects/osi-cards-lib/src/lib/models';

// Alias for backward compatibility
export { isContactCardSection as isContactSection } from '../../../projects/osi-cards-lib/src/lib/models';
export { isNetworkCardSection as isNetworkSection } from '../../../projects/osi-cards-lib/src/lib/models';

// Theme types
export { ThemePreset, ThemeMode } from '../../../projects/osi-cards-lib/src/lib/types';

// Additional types from library - excluding duplicates from other modules
export {
  TrendDirection,
  ChartType,
  LayoutState,
  PackingAlgorithm,
  Breakpoint,
  PreferredColumns,
  PriorityBand,
  SectionOrientation,
  FieldStatus,
  FieldPriority,
  PerformanceLevel,
  CardActionVariant,
  AnimationState,
  AnimationTrigger,
  FieldValue,
  FieldFormat,
  ComplexityLevel,
} from '../../../projects/osi-cards-lib/src/lib/types';

// ============================================================================
// APP-SPECIFIC TYPE EXTENSIONS
// ============================================================================

// Removed - use library version from 'osi-cards-lib'
// export * from './branded-types';
// Removed - use library version from 'osi-cards-lib'
