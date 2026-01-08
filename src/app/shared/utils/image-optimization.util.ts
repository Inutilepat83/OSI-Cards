/**
 * Image Optimization Utility
 *
 * Provides utilities for optimizing image loading, including:
 * - Responsive image srcset generation
 * - WebP format detection and fallback
 * - Lazy loading with Intersection Observer
 * - Image dimension calculation
 *
 * @module utils/image-optimization
 */

import {
  CDN_PROVIDERS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_WIDTHS,
  GENERIC_CDN_PATTERN,
  LAZY_LOAD_CONFIG,
} from '../../core/constants/performance.constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Image format types supported by the optimization utility
 */
export type ImageFormat = 'webp' | 'avif' | 'original';

/**
 * Responsive image sources with format fallbacks
 */
export interface ResponsiveImageSources {
  /** Original image source */
  src: string;
  /** Default srcset */
  srcset: string;
  /** WebP format srcset (if supported) */
  srcsetWebP?: string;
  /** AVIF format srcset (if supported) */
  srcsetAVIF?: string;
}

/**
 * Image dimension calculation result
 */
export interface ImageDimensions {
  /** Calculated width in pixels */
  width: number;
  /** Calculated height in pixels */
  height: number;
}

/**
 * Check if WebP format is supported by the browser
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      try {
        const dataURL = elem.toDataURL('image/webp');
        resolve(dataURL.indexOf('data:image/webp') === 0);
      } catch {
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

/**
 * Check if AVIF format is supported by the browser
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Generate responsive image srcset
 *
 * Creates a srcset string for responsive images with multiple width variants.
 * Uses default breakpoints if widths array is not provided.
 *
 * @param baseUrl Base image URL
 * @param widths Array of widths to generate srcset entries (defaults to standard breakpoints)
 * @param format Optional format (webp, avif, etc.)
 * @returns srcset string in format "url1 width1w, url2 width2w, ..."
 *
 * @example
 * ```typescript
 * const srcset = generateSrcSet('/images/hero.jpg', [320, 640, 1024]);
 * // Returns: "/images/hero.jpg?width=320 320w, /images/hero.jpg?width=640 640w, ..."
 * ```
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [...DEFAULT_IMAGE_WIDTHS],
  format?: ImageFormat
): string {
  if (!baseUrl || !Array.isArray(widths) || widths.length === 0) {
    return '';
  }

  // Validate widths are positive numbers
  const validWidths = widths.filter((w) => typeof w === 'number' && w > 0);
  if (validWidths.length === 0) {
    return '';
  }

  const entries = validWidths.map((width) => {
    const optimizedUrl = getOptimizedImageUrl(baseUrl, width, format);
    return `${optimizedUrl} ${width}w`;
  });

  return entries.join(', ');
}

/**
 * Get optimized image URL with width and optional format
 *
 * Optimizes image URLs for CDN providers (Cloudinary, Imgix, Unsplash) or
 * appends generic width parameters. Returns original URL for data/blob URLs.
 *
 * @param url Original image URL
 * @param width Desired width in pixels
 * @param format Optional format (webp, avif, etc.)
 * @returns Optimized image URL with width/format parameters
 *
 * @example
 * ```typescript
 * // Cloudinary CDN
 * getOptimizedImageUrl('https://res.cloudinary.com/image.jpg', 640, 'webp');
 * // Returns: "https://res.cloudinary.com/image.jpg?w_640,q_auto,f_webp"
 *
 * // Generic URL
 * getOptimizedImageUrl('https://example.com/image.jpg', 640);
 * // Returns: "https://example.com/image.jpg?width=640"
 * ```
 */
export function getOptimizedImageUrl(url: string, width?: number, format?: ImageFormat): string {
  if (!url) {
    return '';
  }

  // If it's a data URL or external URL without optimization support, return as-is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // For external URLs (CDN), try to append width parameter
  // Uses Map-based CDN provider lookup for O(1) performance
  if (GENERIC_CDN_PATTERN.test(url)) {
    // Check if URL already has query parameters
    const separator = url.includes('?') ? '&' : '?';

    if (width) {
      // Find matching CDN provider using Map for O(1) lookup
      for (const [, config] of CDN_PROVIDERS.entries()) {
        if (config.pattern.test(url)) {
          return config.generateUrl(url, width, separator, format);
        }
      }

      // Generic CDN fallback - append width parameter
      return `${url}${separator}width=${width}`;
    }

    return url;
  }

  // For local assets, assume they're already optimized or use a build-time optimization
  // In a real app, you might want to use a service worker or build-time image optimization
  return url;
}

/**
 * Get the best image format based on browser support
 * @returns Promise resolving to the best format
 */
export async function getBestImageFormat(): Promise<ImageFormat> {
  if (await supportsAVIF()) {
    return 'avif';
  }
  if (await supportsWebP()) {
    return 'webp';
  }
  return 'original';
}

/**
 * Generate responsive image sources with format fallbacks
 * @param baseUrl Base image URL
 * @param widths Array of widths
 * @returns Object with srcset for different formats
 */
export async function generateResponsiveSources(
  baseUrl: string,
  widths: number[] = [...DEFAULT_IMAGE_WIDTHS]
): Promise<ResponsiveImageSources> {
  const bestFormat = await getBestImageFormat();
  const src = getOptimizedImageUrl(baseUrl);
  const srcset = generateSrcSet(baseUrl, widths);

  const result: ResponsiveImageSources = {
    src,
    srcset,
  };

  if (bestFormat === 'avif' || bestFormat === 'webp') {
    result.srcsetWebP = generateSrcSet(baseUrl, widths, 'webp');
  }

  if (bestFormat === 'avif') {
    result.srcsetAVIF = generateSrcSet(baseUrl, widths, 'avif');
  }

  return result;
}

/**
 * Lazy load configuration for Intersection Observer
 */
export interface LazyLoadConfig {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Create an Intersection Observer for lazy loading images
 * @param callback Callback when element enters viewport
 * @param config Observer configuration
 * @returns IntersectionObserver instance
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  config: LazyLoadConfig = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }

  const defaultConfig: IntersectionObserverInit = {
    root: config.root ?? null,
    rootMargin: config.rootMargin ?? LAZY_LOAD_CONFIG.rootMargin,
    threshold: config.threshold ?? LAZY_LOAD_CONFIG.threshold,
  };

  return new IntersectionObserver(callback, defaultConfig);
}

/**
 * Setup lazy loading for an image element
 *
 * Uses native `loading="lazy"` if supported, otherwise falls back to
 * Intersection Observer for older browsers.
 *
 * @param imgElement Image element to lazy load
 * @param src Actual image source to load when element enters viewport
 * @param config Observer configuration (root, rootMargin, threshold)
 * @returns Cleanup function to disconnect observer
 *
 * @example
 * ```typescript
 * const cleanup = setupLazyImage(imgElement, '/images/large.jpg', {
 *   rootMargin: '100px',
 *   threshold: 0.1
 * });
 * // Later: cleanup() to disconnect
 * ```
 */
export function setupLazyImage(
  imgElement: HTMLImageElement,
  src: string,
  config: LazyLoadConfig = {}
): () => void {
  if (!imgElement) {
    return () => {};
  }

  // Use loading="lazy" if supported (modern browsers)
  if ('loading' in HTMLImageElement.prototype) {
    imgElement.loading = 'lazy';
    imgElement.src = src;
    return () => {};
  }

  // Fallback to Intersection Observer for older browsers
  const observer = createLazyLoadObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgElement.src = src;
        observer?.unobserve(imgElement);
      }
    });
  }, config);

  if (observer) {
    observer.observe(imgElement);
    return () => observer.disconnect();
  }

  // Final fallback: load immediately
  imgElement.src = src;
  return () => {};
}

/**
 * Calculate optimal image dimensions based on container
 * @param containerWidth Container width in pixels
 * @param aspectRatio Image aspect ratio (width/height)
 * @param maxWidth Maximum image width
 * @returns Object with width and height
 */
export function calculateImageDimensions(
  containerWidth: number,
  aspectRatio: number = DEFAULT_ASPECT_RATIO,
  maxWidth?: number
): ImageDimensions {
  let width = containerWidth;
  if (maxWidth && width > maxWidth) {
    width = maxWidth;
  }
  const height = Math.round(width / aspectRatio);
  return { width, height };
}
