/**
 * Re-export all card models from the library.
 * This file ensures the app uses the same types as the library,
 * avoiding duplicate type definitions and potential mismatches.
 * 
 * @see projects/osi-cards-lib/src/lib/models/card.model.ts
 */

// Re-export all card-related types from the library
export {
  // Core card types
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
  getSectionMetadata
} from '../../../projects/osi-cards-lib/src/lib/models';
