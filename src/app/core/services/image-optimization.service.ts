import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  lazy?: boolean;
  placeholder?: string;
}

export interface OptimizedImage {
  src: string;
  srcSet: string;
  placeholder: string;
  aspectRatio: number;
  loaded: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  private imageCache = new Map<string, OptimizedImage>();

  /**
   * Optimize image configuration for web delivery
   */
  optimizeImage(config: ImageConfig): Observable<OptimizedImage> {
    const cacheKey = this.generateCacheKey(config);

    if (this.imageCache.has(cacheKey)) {
      return new BehaviorSubject(this.imageCache.get(cacheKey)!);
    }

    const optimized = this.processImageConfig(config);
    this.imageCache.set(cacheKey, optimized);

    return new BehaviorSubject(optimized);
  }

  /**
   * Generate responsive image srcSet
   */
  generateSrcSet(src: string, widths: number[] = [480, 768, 1024, 1280, 1920]): string {
    return widths.map(width => `${this.resizeImageUrl(src, width)} ${width}w`).join(', ');
  }

  /**
   * Preload critical images
   */
  preloadImage(src: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }

  /**
   * Generate blur placeholder
   */
  generatePlaceholder(width: number = 10, height: number = 6): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a simple gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f0f0f0');
      gradient.addColorStop(1, '#e0e0e0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL('image/jpeg', 0.1);
  }

  private processImageConfig(config: ImageConfig): OptimizedImage {
    const srcSet = this.generateSrcSet(config.src);
    const aspectRatio = config.width && config.height ? config.width / config.height : 1.6;
    const placeholder = config.placeholder || this.generatePlaceholder();

    return {
      src: this.optimizeImageUrl(config.src, config),
      srcSet,
      placeholder,
      aspectRatio,
      loaded: false,
    };
  }

  private optimizeImageUrl(src: string, config: ImageConfig): string {
    // In a real implementation, this would integrate with a CDN like Cloudinary or Imgix
    // For now, we'll simulate optimization parameters
    const params = new URLSearchParams();

    if (config.quality) params.set('q', config.quality.toString());
    if (config.format) params.set('f', config.format);
    if (config.width) params.set('w', config.width.toString());
    if (config.height) params.set('h', config.height.toString());

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}${params.toString()}`;
  }

  private resizeImageUrl(src: string, width: number): string {
    return this.optimizeImageUrl(src, { src, alt: '', width, quality: 80, format: 'webp' });
  }

  private generateCacheKey(config: ImageConfig): string {
    return `${config.src}-${config.width || 'auto'}-${config.height || 'auto'}-${config.quality || 'auto'}`;
  }
}
