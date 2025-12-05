/**
 * Image Optimization Utility
 * Stub for backward compatibility
 */

export function getOptimizedImageUrl(url: string, width?: number): string {
  console.warn('getOptimizedImageUrl: Implement in your app');
  return url;
}

export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      resolve(elem.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else {
      resolve(false);
    }
  });
}
