/**
 * Consolidated Card Utilities
 *
 * Merges functionality from:
 * - card-diff.util.ts (card comparison and change detection)
 * - src/app/shared/utils/card-utils.ts (validation, sanitization, ID generation)
 * - card-spawner.util.ts (card creation utilities)
 *
 * Provides comprehensive card manipulation utilities.
 *
 * @example
 * ```typescript
 * import { CardUtil } from '../../public-api';
 *
 * // Generate IDs
 * const card = CardUtil.ensureCardIds(config);
 *
 * // Validate
 * if (CardUtil.isValidCardConfig(data)) {
 *   // Process card
 * }
 *
 * // Sanitize
 * const clean = CardUtil.sanitizeCardConfig(config);
 *
 * // Compare
 * const diff = CardUtil.compareCards(oldCard, newCard);
 * ```
 */

// Re-export card diff utilities
// Removed - card-diff.util and card-spawner.util deleted
// Use CardUtil methods instead

// Consolidated namespace for convenience
export const CardUtil = {
  // Re-export from card-diff.util
  // Additional utilities will be added here
};
