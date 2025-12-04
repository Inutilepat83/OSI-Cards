/**
 * OSI Cards Factories
 *
 * Factory classes and builders for creating card configurations.
 *
 * @example
 * ```typescript
 * import { CardFactory, SectionFactory, FieldFactory } from 'osi-cards-lib';
 *
 * const card = CardFactory.create()
 *   .withTitle('My Card')
 *   .withSection(SectionFactory.info('Details', [
 *     FieldFactory.text('Name', 'John'),
 *     FieldFactory.currency('Revenue', '$1M')
 *   ]))
 *   .build();
 * ```
 *
 * @module factories
 */

export {
  CardFactory,
  SectionFactory as SectionConfigFactory,
  FieldFactory,
  ItemFactory,
  ActionFactory,
  type ICardBuilder,
  type ISectionBuilder,
} from './card.factory';

// Section Component Factory (for dynamic component loading)
export { SectionFactory, type SectionType, type SectionMetadata } from './section.factory';

// Type-Safe Card Builder DSL is planned for future implementation
// See: Improvement Plan Point #26
