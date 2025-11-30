/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images including:
 * - WebP format detection and conversion
 * - Lazy loading support
 * - Responsive image generation
 * - Image compression hints
 */

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get optimized image URL with WebP fallback
 * 
 * @param originalUrl - Original image URL
 * @param webpUrl - Optional WebP version URL
 * @returns Object with src and srcset for responsive images
 */
export async function getOptimizedImageUrl(
  originalUrl: string,
  webpUrl?: string
): Promise<{ src: string; srcset?: string; type?: string }> {
  const supports = await supportsWebP();
  
  if (supports && webpUrl) {
    return {
      src: webpUrl,
      srcset: `${webpUrl} 1x, ${originalUrl} 1x`,
      type: 'image/webp'
    };
  }
  
  return {
    src: originalUrl
  };
}

/**
 * Generate responsive image srcset
 * 
 * @param baseUrl - Base image URL
 * @param sizes - Array of sizes (e.g., [400, 800, 1200])
 * @param format - Image format ('webp' | 'jpg' | 'png')
 * @returns srcset string
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[]
): string {
  return sizes
    .map(size => {
      // Assuming URL pattern supports size parameter
      // Adjust based on your image CDN/service
      const url = baseUrl.replace(/(\.[^.]+)$/, `_${size}w$1`);
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Generate picture element sources for WebP with fallback
 * 
 * @param originalUrl - Original image URL
 * @param webpUrl - WebP version URL
 * @param sizes - Optional sizes attribute
 * @returns Object with source and img attributes
 */
export function generatePictureSources(
  originalUrl: string,
  webpUrl: string,
  sizes?: string
): {
  sources: { srcset: string; type: string; sizes?: string }[];
  img: { src: string; alt?: string };
} {
  const sources: { srcset: string; type: string; sizes?: string }[] = [
    {
      srcset: webpUrl,
      type: 'image/webp'
    },
    {
      srcset: originalUrl,
      type: 'image/jpeg'
    }
  ];
  
  if (sizes) {
    const firstSource = sources[0];
    const secondSource = sources[1];
    if (firstSource) firstSource.sizes = sizes;
    if (secondSource) secondSource.sizes = sizes;
  }
  
  return {
    sources,
    img: {
      src: originalUrl // Fallback for browsers that don't support picture
    }
  };
}

/**
 * Lazy load image with intersection observer
 * 
 * @param element - Image element
 * @param src - Image source URL
 * @param options - IntersectionObserver options
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  src: string,
  options: IntersectionObserverInit = {}
): () => void {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load immediately
    element.src = src;
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px', // Start loading 50px before image enters viewport
    ...options
  });

  // Add loading placeholder
  element.classList.add('lazy-load');
  element.setAttribute('data-src', src);
  
  observer.observe(element);

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}

/**
 * Preload critical images
 * 
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload ${url}`));
        document.head.appendChild(link);
      });
    })
  );
}

/**
 * Get image dimensions without loading full image
 * 
 * @param url - Image URL
 * @returns Promise with width and height
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
}

/**
 * Convert image to WebP format (client-side, for small images)
 * 
 * @param file - Image file
 * @param quality - Quality (0-1, default 0.8)
 * @returns Promise with WebP blob
 */
export function convertToWebP(
  file: File,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert to WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

