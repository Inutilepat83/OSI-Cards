import { Pipe, PipeTransform } from '@angular/core';
import { supportsWebP, getOptimizedImageUrl } from '../utils/image-optimization.util';
import { Observable, of, from } from 'rxjs';

/**
 * WebP Image Pipe
 * 
 * Automatically serves WebP images when supported, with fallback to original format.
 * 
 * @example
 * ```html
 * <img [src]="imageUrl | webpImage" alt="Image">
 * ```
 * 
 * @example
 * ```html
 * <img [src]="imageUrl | webpImage:webpUrl" alt="Image">
 * ```
 */
@Pipe({
  name: 'webpImage',
  standalone: true
})
export class WebPImagePipe implements PipeTransform {
  private webpSupported: boolean | null = null;
  private webpCheckPromise: Promise<boolean> | null = null;

  transform(originalUrl: string | null | undefined, webpUrl?: string): string {
    if (!originalUrl) {
      return '';
    }

    // If no WebP URL provided, return original
    if (!webpUrl) {
      return originalUrl;
    }

    // Check WebP support once and cache result
    if (this.webpSupported === null) {
      if (!this.webpCheckPromise) {
        this.webpCheckPromise = supportsWebP();
      }
      
      // For synchronous pipe, we'll use a simple check
      // In a real implementation, you might want to use async pipe
      this.webpCheckPromise.then(supported => {
        this.webpSupported = supported;
      });
      
      // Default to original until we know WebP is supported
      return originalUrl;
    }

    return this.webpSupported ? webpUrl : originalUrl;
  }
}

/**
 * Async WebP Image Pipe
 * 
 * Asynchronous version that properly waits for WebP support detection.
 * 
 * @example
 * ```html
 * <img [src]="(imageUrl | webpImageAsync:webpUrl | async)" alt="Image">
 * ```
 */
@Pipe({
  name: 'webpImageAsync',
  standalone: true
})
export class WebPImageAsyncPipe implements PipeTransform {
  transform(originalUrl: string | null | undefined, webpUrl?: string): Observable<string> {
    if (!originalUrl) {
      return of('');
    }

    if (!webpUrl) {
      return of(originalUrl);
    }

    return from(getOptimizedImageUrl(originalUrl, webpUrl).then(result => result.src).catch(() => originalUrl));
  }
}

