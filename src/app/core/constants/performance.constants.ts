/**
 * Performance Constants
 *
 * Configuration constants for performance optimizations including
 * image loading, CDN providers, and lazy loading.
 */

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Default image widths for responsive images
 */
export const DEFAULT_IMAGE_WIDTHS = [320, 640, 768, 1024, 1280, 1920] as const;

/**
 * Default aspect ratio for images (16:9)
 */
export const DEFAULT_ASPECT_RATIO = 16 / 9;

/**
 * Lazy loading configuration for Intersection Observer
 */
export const LAZY_LOAD_CONFIG = {
  rootMargin: '50px',
  threshold: 0.01,
} as const;

// ============================================================================
// CDN PROVIDERS
// ============================================================================

/**
 * CDN provider configuration
 */
export interface CDNProviderConfig {
  pattern: RegExp;
  generateUrl: (url: string, width: number, separator: string, format?: string) => string;
}

/**
 * CDN providers map with their URL patterns and optimization functions
 */
export const CDN_PROVIDERS = new Map<string, CDNProviderConfig>([
  [
    'cloudinary',
    {
      pattern: /res\.cloudinary\.com/i,
      generateUrl: (url: string, width: number, separator: string, format?: string) => {
        const params = [`w_${width}`, 'q_auto'];
        if (format) {
          params.push(`f_${format}`);
        }
        return `${url}${separator}${params.join(',')}`;
      },
    },
  ],
  [
    'imgix',
    {
      pattern: /\.imgix\.net/i,
      generateUrl: (url: string, width: number, separator: string, format?: string) => {
        const params = [`w=${width}`, 'auto=format'];
        if (format) {
          params.push(`fm=${format}`);
        }
        return `${url}${separator}${params.join('&')}`;
      },
    },
  ],
  [
    'unsplash',
    {
      pattern: /images\.unsplash\.com/i,
      generateUrl: (url: string, width: number, separator: string) => {
        return `${url}${separator}w=${width}`;
      },
    },
  ],
]);

/**
 * Generic CDN pattern for detecting external image URLs
 */
export const GENERIC_CDN_PATTERN = /^https?:\/\//i;
