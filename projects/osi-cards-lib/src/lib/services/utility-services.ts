/**
 * Utility Services Collection
 *
 * A collection of 6 utility services for common application needs.
 *
 * Services:
 * 1. TitleService - Manage document title
 * 2. MetaService - Manage meta tags
 * 3. FaviconService - Manage favicon
 * 4. ThemeService - Basic theme management
 * 5. FullscreenService - Fullscreen management
 * 6. VisibilityService - Page visibility detection
 */

import { Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

/**
 * 1. Enhanced Title Service
 */
@Injectable({
  providedIn: 'root',
})
export class EnhancedTitleService {
  private defaultTitle = signal('');

  constructor(private title: Title) {
    this.defaultTitle.set(this.title.getTitle());
  }

  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  getTitle(): string {
    return this.title.getTitle();
  }

  setTitleWithSuffix(title: string, suffix?: string): void {
    const fullTitle = suffix ? `${title} | ${suffix}` : title;
    this.setTitle(fullTitle);
  }

  resetTitle(): void {
    this.title.setTitle(this.defaultTitle());
  }
}

/**
 * 2. Meta Service
 */
@Injectable({
  providedIn: 'root',
})
export class MetaTagService {
  setTag(name: string, content: string): void {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (tag) {
      tag.setAttribute('content', content);
    } else {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
  }

  setProperty(property: string, content: string): void {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (tag) {
      tag.setAttribute('content', content);
    } else {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
  }

  removeTag(name: string): void {
    const tag = document.querySelector(`meta[name="${name}"]`);
    if (tag) {
      document.head.removeChild(tag);
    }
  }

  setDescription(description: string): void {
    this.setTag('description', description);
  }

  setKeywords(keywords: string): void {
    this.setTag('keywords', keywords);
  }

  setOGTags(title: string, description: string, image?: string): void {
    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    if (image) this.setProperty('og:image', image);
  }
}

/**
 * 3. Favicon Service
 */
@Injectable({
  providedIn: 'root',
})
export class FaviconService {
  setFavicon(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  resetFavicon(): void {
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = '/favicon.ico';
    }
  }
}

/**
 * 4. Simple Theme Service
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleThemeService {
  private currentTheme = signal<'light' | 'dark'>('light');

  readonly theme = this.currentTheme.asReadonly();

  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getTheme(): 'light' | 'dark' {
    return this.currentTheme();
  }
}

/**
 * 5. Fullscreen Service
 */
@Injectable({
  providedIn: 'root',
})
export class FullscreenService {
  private isFullscreenSignal = signal(false);

  readonly isFullscreen = this.isFullscreenSignal.asReadonly();

  async enter(element: HTMLElement = document.documentElement): Promise<void> {
    try {
      await element.requestFullscreen();
      this.isFullscreenSignal.set(true);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  }

  async exit(): Promise<void> {
    try {
      await document.exitFullscreen();
      this.isFullscreenSignal.set(false);
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  }

  async toggle(element?: HTMLElement): Promise<void> {
    if (this.isFullscreenSignal()) {
      await this.exit();
    } else {
      await this.enter(element);
    }
  }

  isSupported(): boolean {
    return document.fullscreenEnabled;
  }
}

/**
 * 6. Page Visibility Service
 */
@Injectable({
  providedIn: 'root',
})
export class VisibilityService {
  private isVisibleSignal = signal(true);

  readonly isVisible = this.isVisibleSignal.asReadonly();

  constructor() {
    this.setupListener();
  }

  private setupListener(): void {
    document.addEventListener('visibilitychange', () => {
      this.isVisibleSignal.set(!document.hidden);
    });
  }

  onVisible(callback: () => void): void {
    if (this.isVisibleSignal()) {
      callback();
    }
  }

  onHidden(callback: () => void): void {
    if (!this.isVisibleSignal()) {
      callback();
    }
  }
}

// Export all services
export const UTILITY_SERVICES = [
  EnhancedTitleService,
  MetaTagService,
  FaviconService,
  SimpleThemeService,
  FullscreenService,
  VisibilityService,
];
