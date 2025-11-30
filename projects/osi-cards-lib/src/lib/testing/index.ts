/**
 * OSI Cards Testing Utilities
 * 
 * Provides testing helpers, mocks, and fixtures for testing OSI Cards components.
 * 
 * @example
 * ```typescript
 * import { 
 *   createMockCard, 
 *   createMockSection, 
 *   setupExternalMocks 
 * } from 'osi-cards-lib/testing';
 * 
 * beforeEach(() => {
 *   setupExternalMocks();
 * });
 * 
 * it('should render card', () => {
 *   const card = createMockCard({ cardTitle: 'Test' });
 * });
 * ```
 * 
 * @module testing
 */

// ============================================================================
// MOCKS
// ============================================================================
export * from './mocks/external-libs.mock';

// ============================================================================
// TEST FIXTURES
// ============================================================================
export * from './fixtures/card.fixtures';
export * from './fixtures/section.fixtures';

// ============================================================================
// TEST UTILITIES
// ============================================================================
export * from './utils/test-helpers';

