/**
 * Section Registry Library
 * 
 * Single source of truth for all section type definitions, test fixtures,
 * documentation examples, and demo configurations.
 * 
 * ALL section-related data should be imported from this module to ensure
 * consistency across tests, documentation, and demos.
 * 
 * @example
 * ```typescript
 * import { 
 *   SectionRegistry,
 *   getTestFixture,
 *   getSampleSection,
 *   SECTION_FIXTURES
 * } from 'osi-cards-lib';
 * 
 * // Get a complete test fixture for info section
 * const infoSection = getTestFixture('info', 'complete');
 * 
 * // Get all sample sections
 * const allSamples = SECTION_FIXTURES.complete;
 * ```
 */

export * from './section-registry';
export * from './fixtures.generated';
export * from './registry-utils';

