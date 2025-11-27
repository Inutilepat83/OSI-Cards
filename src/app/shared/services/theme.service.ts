import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggingService } from '../../core/services/logging.service';

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Theme service for managing dark mode and theme switching
 * 
 * Provides comprehensive theme management with support for light, dark, and
 * automatic theme modes. Automatically syncs with system preferences and
 * persists user selections in localStorage.
 * 
 * Features:
 * - Three theme modes: light, dark, auto (system preference)
 * - Automatic system theme detection and syncing
 * - Persistent theme storage in localStorage
 * - Reactive theme stream for UI updates
 * - CSS class and data attribute management
 * 
 * @example
 * ```typescript
 * const themeService = inject(ThemeService);
 * 
 * // Get current theme
 * const currentTheme = themeService.getTheme();
 * 
 * // Set theme
 * themeService.setTheme('dark');
 * 
 * // Toggle between light and dark
 * themeService.toggleTheme();
 * 
 * // Check if dark mode is active
 * const isDark = themeService.isDarkMode();
 * 
 * // Subscribe to theme changes
 * themeService.theme$.subscribe(theme => {
 *   console.log('Theme changed to:', theme);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly logger = inject(LoggingService);
  private readonly themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme() || 'auto');
  readonly theme$: Observable<Theme> = this.themeSubject.asObservable();

  constructor() {
    // Initialize theme in constructor to ensure it's applied immediately
    this.applyTheme(this.themeSubject.value);
    this.watchSystemTheme();
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.storeTheme(theme);
    this.applyTheme(theme);
  }

  /**
   * Toggle between light and dark
   */
  toggleTheme(): void {
    const current = this.getTheme();
    if (current === 'auto') {
      this.setTheme(this.getSystemTheme() === 'dark' ? 'light' : 'dark');
    } else {
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    const theme = this.getTheme();
    if (theme === 'auto') {
      return this.getSystemTheme() === 'dark';
    }
    return theme === 'dark';
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const isDark = theme === 'auto' ? this.getSystemTheme() === 'dark' : theme === 'dark';
    const html = document.documentElement;
    
    if (isDark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  /**
   * Watch system theme changes
   */
  private watchSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.getTheme() === 'auto') {
          this.applyTheme('auto');
        }
      });
    }
  }

  /**
   * Store theme in localStorage
   */
  private storeTheme(theme: Theme): void {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      this.logger.error('Failed to store theme', 'ThemeService', error);
    }
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored as Theme;
      }
    } catch (error) {
      this.logger.error('Failed to get stored theme', 'ThemeService', error);
    }
    return null;
  }
}


