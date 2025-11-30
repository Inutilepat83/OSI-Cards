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
  SectionFactory,
  FieldFactory,
  ItemFactory,
  ActionFactory,
  type ICardBuilder,
  type ISectionBuilder,
} from './card.factory';

