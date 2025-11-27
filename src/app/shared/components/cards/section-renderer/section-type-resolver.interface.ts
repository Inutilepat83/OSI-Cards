import { CardSection } from '../../../../models';

/**
 * Interface for section type resolution strategies
 */
export interface ISectionTypeResolver {
  /**
   * Resolve section type from section data
   */
  resolve(section: CardSection): string;
}



