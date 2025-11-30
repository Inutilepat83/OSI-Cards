import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Theme configuration interface
 */
export interface OSICardsThemeConfig {
  /** Theme name (e.g., 'light', 'dark', 'high-contrast', 'custom') */
  name: string;
  /** CSS variable overrides */
  variables: Record<string, string>;
  /** Whether this theme is a built-in preset */
  preset?: boolean;
}

/**
 * Built-in theme presets
 */
export type ThemePreset = 'light' | 'dark' | 'night' | 'day' | 'osi-day' | 'osi-night' | 'custom';

/**
 * Theme Service
 * 
 * Manages theme configuration and runtime theme switching for OSI Cards library.
 * Supports built-in presets and custom themes via CSS custom properties.
 * 
 * @example
 * ```typescript
 * const themeService = inject(ThemeService);
 * 
 * // Switch to dark theme
 * themeService.setTheme('night');
 * 
 * // Apply custom theme
 * themeService.applyCustomTheme({
 *   name: 'my-brand',
 *   variables: {
 *     '--color-brand': '#ff0000',
 *     '--card-padding': '20px'
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  
  private currentThemeSubject = new BehaviorSubject<ThemePreset | string>('day');
  currentTheme$: Observable<ThemePreset | string> = this.currentThemeSubject.asObservable();

  private customThemes = new Map<string, OSICardsThemeConfig>();
  private readonly rootElement: HTMLElement | null;

  constructor() {
    this.rootElement = isPlatformBrowser(this.platformId) 
      ? this.document.documentElement 
      : null;
    
    // Initialize theme from document if in browser
    if (this.rootElement) {
      const initialTheme = this.rootElement.getAttribute('data-theme') || 'day';
      this.currentThemeSubject.next(initialTheme);
    }
  }

  /**
   * Get the current active theme
   */
  getCurrentTheme(): ThemePreset | string {
    return this.currentThemeSubject.value;
  }

  /**
   * Set theme to a built-in preset
   * 
   * @param preset - Built-in theme preset name
   */
  setTheme(preset: ThemePreset): void {
    if (!this.rootElement) {
      return;
    }

    // Set data-theme attribute which triggers CSS variable changes
    this.rootElement.setAttribute('data-theme', preset);
    this.currentThemeSubject.next(preset);
  }

  /**
   * Apply a custom theme configuration
   * 
   * @param config - Custom theme configuration
   */
  applyCustomTheme(config: OSICardsThemeConfig): void {
    if (!this.rootElement) {
      return;
    }

    // Store custom theme
    this.customThemes.set(config.name, config);

    // Set data-theme to custom
    this.rootElement.setAttribute('data-theme', 'custom');

    // Apply CSS variable overrides
    this.applyCSSVariables(config.variables);

    this.currentThemeSubject.next(config.name);
  }

  /**
   * Apply CSS variables to the document root
   * 
   * @param variables - Object mapping CSS variable names to values
   */
  applyCSSVariables(variables: Record<string, string>): void {
    if (!this.rootElement) {
      return;
    }

    Object.entries(variables).forEach(([key, value]) => {
      const varName = key.startsWith('--') ? key : `--${key}`;
      this.rootElement!.style.setProperty(varName, value);
    });
  }

  /**
   * Reset CSS variables (useful when switching themes)
   */
  resetCSSVariables(): void {
    if (!this.rootElement) {
      return;
    }

    // Remove all custom CSS variables by cloning the root element's style
    // In practice, we'll let the CSS cascade handle this when switching themes
    const computedStyle = window.getComputedStyle(this.rootElement);
    
    // Remove any custom properties that aren't in the default theme
    // This is a simplified approach - in production you might want to track which vars were set
  }

  /**
   * Get a custom theme configuration
   * 
   * @param name - Theme name
   * @returns Theme configuration or null if not found
   */
  getCustomTheme(name: string): OSICardsThemeConfig | null {
    return this.customThemes.get(name) ?? null;
  }

  /**
   * Register a custom theme (without applying it)
   * 
   * @param config - Custom theme configuration
   */
  registerTheme(config: OSICardsThemeConfig): void {
    this.customThemes.set(config.name, config);
  }

  /**
   * Remove a custom theme
   * 
   * @param name - Theme name to remove
   * @returns True if theme was removed, false if not found
   */
  unregisterTheme(name: string): boolean {
    return this.customThemes.delete(name);
  }

  /**
   * Get all registered custom themes
   * 
   * @returns Array of custom theme configurations
   */
  getCustomThemes(): OSICardsThemeConfig[] {
    return Array.from(this.customThemes.values());
  }

  /**
   * Validate a theme configuration
   * 
   * @param config - Theme configuration to validate
   * @returns Validation result with errors if any
   */
  validateTheme(config: OSICardsThemeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Theme name is required');
    }

    if (!config.variables || Object.keys(config.variables).length === 0) {
      errors.push('Theme must have at least one CSS variable');
    }

    // Validate CSS variable names
    Object.keys(config.variables).forEach(key => {
      if (!key.startsWith('--') && !key.match(/^[a-z-]+$/i)) {
        errors.push(`Invalid CSS variable name: ${key}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}








