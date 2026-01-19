/**
 * Card PDF Styles Utility
 *
 * Returns minimal PDF-specific overrides only.
 * Actual card styles should come from the rendered card element itself.
 * This file does NOT duplicate card styles - it only provides PDF-specific adjustments.
 */

/**
 * Generate minimal PDF-specific style overrides only
 * Returns CSS with only PDF-specific adjustments (no card style duplication)
 * @param theme - Theme to use ('day' or 'night') - currently unused but kept for API consistency
 * @returns CSS string with minimal PDF overrides only
 */
export function generateCardPdfStyles(theme: 'day' | 'night' = 'day'): string {
  // Return minimal overrides only - actual card styles come from the card element
  // This ensures no duplication of card styles
  return `
    <style>
      /* PDF-specific overrides only - card styles come from actual card element */
      .card-pdf-container {
        /* Ensure proper rendering context for PDF */
        position: relative;
        width: 100%;
        box-sizing: border-box;
      }
    </style>
  `;
}
