/**
 * Feature Flag Service - Re-export from Library
 *
 * This file re-exports the canonical FeatureFlagsService from the library.
 * The library version is the single source of truth.
 *
 * @deprecated Import directly from '@osi-cards/services' instead
 */

// Re-export from library
export { FeatureFlagsService } from '@osi-cards/services';

// Type alias for backwards compatibility
export { FeatureFlagsService as FeatureFlagService } from '@osi-cards/services';
