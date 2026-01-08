/**
 * Image Loading Utilities
 *
 * Utilities for image loading, placeholder generation, and optimization.
 */

/**
 * Generate a placeholder image URL
 *
 * @param width Image width
 * @param height Image height
 * @param text Optional text to display on placeholder
 * @returns Placeholder image URL
 */
export function generatePlaceholderUrl(width = 400, height = 300, text = ''): string {
  // Use a simple data URI placeholder or a placeholder service
  // For now, return a simple SVG data URI
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial, sans-serif" font-size="14">
        ${text || `${width}x${height}`}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
