import { Injectable, inject, Inject, PLATFORM_ID, OnDestroy, InjectionToken, Optional } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, Subject, fromEvent, map, takeUntil, startWith } from 'rxjs';
import { EventBusService, ThemeChangedPayload } from '../services/event-bus.service';

// ============================================
// Types & Interfaces
// ============================================

/**
 * Theme configuration interface
 */
export interface OSICardsThemeConfig {
  /** Theme name (e.g., 'light', 'dark', 'ocean', 'custom') */
  name: string;
  /** CSS variable overrides */
  variables: Record<string, string>;
  /** Whether this theme is a built-in preset */
  preset?: boolean;
  /** Base theme to extend from */
  extends?: string;
  /** Color scheme for browser UI ('light' | 'dark' | 'light dark') */
  colorScheme?: 'light' | 'dark' | 'light dark';
}

/**
 * Built-in theme presets
 */
export type ThemePreset = 
  | 'light' 
  | 'dark' 
  | 'system'
  | 'midnight'
  | 'corporate'
  | 'nature'
  | 'sunset'
  | 'ocean'
  | 'rose'
  | 'minimal'
  | 'high-contrast';

/**
 * System color scheme preference
 */
export type ColorSchemePreference = 'light' | 'dark';

/**
 * Theme service configuration options
 */
export interface ThemeServiceConfig {
  /** Default theme to use */
  defaultTheme: ThemePreset | string;
  /** localStorage key for persisting theme preference */
  persistKey: string;
  /** Whether to persist theme preference */
  enablePersistence: boolean;
  /** Whether to enable smooth transitions between themes */
  enableTransitions: boolean;
  /** Transition duration in milliseconds */
  transitionDuration: number;
  /** Whether to follow system color scheme when set to 'system' */
  followSystemPreference: boolean;
  /** Whether to update the color-scheme meta tag */
  updateColorSchemeMeta: boolean;
  /** Custom themes to register */
  customThemes?: Record<string, OSICardsThemeConfig>;
}

/**
 * Injection token for theme configuration
 */
export const OSI_THEME_CONFIG = new InjectionToken<Partial<ThemeServiceConfig>>('OSI_THEME_CONFIG');

/**
 * Default theme service configuration
 */
export const DEFAULT_THEME_CONFIG: ThemeServiceConfig = {
  defaultTheme: 'system',
  persistKey: 'osi-cards-theme',
  enablePersistence: true,
  enableTransitions: true,
  transitionDuration: 200,
  followSystemPreference: true,
  updateColorSchemeMeta: true
};

// ============================================
// Theme Service
// ============================================

/**
 * Enhanced Theme Service
 * 
 * Manages theme configuration and runtime theme switching for OSI Cards library.
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - Theme persistence to localStorage
 * - Smooth transitions between themes
 * - Color scheme meta tag management
 * - Event bus integration for theme change notifications
 * - Scoped theme support
 * 
 * @example
 * ```typescript
 * const themeService = inject(ThemeService);
 * 
 * // Follow system preference
 * themeService.setTheme('system');
 * 
 * // Switch to specific theme
 * themeService.setTheme('dark');
 * 
 * // Toggle between light and dark
 * themeService.toggleTheme();
 * 
 * // Apply custom theme
 * themeService.applyCustomTheme({
 *   name: 'my-brand',
 *   variables: {
 *     '--osi-card-accent': '#ff0000',
 *     '--osi-card-background': '#1a1a1a'
 *   }
 * });
 * 
 * // Watch system preference changes
 * themeService.systemPreference$.subscribe(pref => {
 *   console.log('System prefers:', pref);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly eventBus = inject(EventBusService);
  private readonly config: ThemeServiceConfig;
  
  private readonly destroy$ = new Subject<void>();
  private readonly currentThemeSubject = new BehaviorSubject<ThemePreset | string>('system');
  private readonly resolvedThemeSubject = new BehaviorSubject<string>('light');
  private readonly systemPreferenceSubject = new BehaviorSubject<ColorSchemePreference>('light');
  
  private customThemes = new Map<string, OSICardsThemeConfig>();
  private readonly rootElement: HTMLElement | null;
  private colorSchemeMetaTag: HTMLMetaElement | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Observable of the current theme setting (may be 'system') */
  readonly currentTheme$: Observable<ThemePreset | string> = this.currentThemeSubject.asObservable();
  
  /** Observable of the resolved/effective theme (never 'system', always the actual theme) */
  readonly resolvedTheme$: Observable<string> = this.resolvedThemeSubject.asObservable();
  
  /** Observable of system color scheme preference */
  readonly systemPreference$: Observable<ColorSchemePreference> = this.systemPreferenceSubject.asObservable();

  constructor(@Optional() @Inject(OSI_THEME_CONFIG) providedConfig?: Partial<ThemeServiceConfig>) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_THEME_CONFIG, ...providedConfig };
    
    this.rootElement = isPlatformBrowser(this.platformId) 
      ? this.document.documentElement 
      : null;
    
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSystemPreferenceWatcher();
      this.initializeColorSchemeMeta();
      this.registerCustomThemes(this.config.customThemes);
      this.initializeTheme();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.transitionTimeoutId) {
      clearTimeout(this.transitionTimeoutId);
    }
  }

  // ============================================
  // Theme Getters
  // ============================================

  /**
   * Get the current theme setting (may be 'system')
   */
  getCurrentTheme(): ThemePreset | string {
    return this.currentThemeSubject.value;
  }

  /**
   * Get the resolved/effective theme (never 'system')
   */
  getResolvedTheme(): string {
    return this.resolvedThemeSubject.value;
  }

  /**
   * Check if currently using dark theme
   */
  isDarkTheme(): boolean {
    const resolved = this.getResolvedTheme();
    return this.isThemeDark(resolved);
  }

  /**
   * Check if currently following system preference
   */
  isFollowingSystem(): boolean {
    return this.getCurrentTheme() === 'system';
  }

  // ============================================
  // System Preference
  // ============================================

  /**
   * Detect current system color scheme preference
   */
  detectSystemPreference(): ColorSchemePreference {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Get system preference as observable that updates on OS changes
   */
  watchSystemPreference(): Observable<ColorSchemePreference> {
    return this.systemPreference$;
  }

  // ============================================
  // Theme Setting
  // ============================================

  /**
   * Set theme to a preset or custom theme
   * @param theme Theme preset name or custom theme name
   */
  setTheme(theme: ThemePreset | string): void {
    if (!this.rootElement) {
      return;
    }

    const previousTheme = this.currentThemeSubject.value;
    
    if (previousTheme === theme) {
      return; // No change needed
    }

    // Enable transitions if configured
    if (this.config.enableTransitions) {
      this.enableTransitions();
    }

    this.currentThemeSubject.next(theme);
    
    // Resolve the actual theme
    const resolvedTheme = this.resolveTheme(theme);
    this.applyTheme(resolvedTheme);
    
    // Persist preference
    if (this.config.enablePersistence) {
      this.savePreference();
    }

    // Emit event
    this.eventBus.emitThemeChanged(previousTheme, theme, 'ThemeService');
  }

  /**
   * Toggle between light and dark themes
   * If currently following system, switches to explicit light/dark
   */
  toggleTheme(): void {
    const current = this.getResolvedTheme();
    const newTheme = this.isThemeDark(current) ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Reset to system preference
   */
  followSystem(): void {
    this.setTheme('system');
  }

  // ============================================
  // Custom Themes
  // ============================================

  /**
   * Apply a custom theme configuration
   * @param config Custom theme configuration
   */
  applyCustomTheme(config: OSICardsThemeConfig): void {
    if (!this.rootElement) {
      return;
    }

    const validation = this.validateTheme(config);
    if (!validation.valid) {
      console.warn('Invalid theme configuration:', validation.errors);
      return;
    }

    const previousTheme = this.currentThemeSubject.value;

    // Register and store custom theme
    this.customThemes.set(config.name, config);

    if (this.config.enableTransitions) {
      this.enableTransitions();
    }

    // Apply the theme
    this.rootElement.setAttribute('data-theme', config.name);
    this.applyCSSVariables(config.variables);
    
    // Update color scheme
    const colorScheme = config.colorScheme || (this.inferColorScheme(config) ? 'dark' : 'light');
    this.updateColorScheme(colorScheme);

    this.currentThemeSubject.next(config.name);
    this.resolvedThemeSubject.next(config.name);

    if (this.config.enablePersistence) {
      this.savePreference();
    }

    this.eventBus.emitThemeChanged(previousTheme, config.name, 'ThemeService');
  }

  /**
   * Register a custom theme without applying it
   * @param config Custom theme configuration
   */
  registerTheme(config: OSICardsThemeConfig): void {
    this.customThemes.set(config.name, config);
  }

  /**
   * Unregister a custom theme
   * @param name Theme name to remove
   * @returns True if theme was removed
   */
  unregisterTheme(name: string): boolean {
    return this.customThemes.delete(name);
  }

  /**
   * Get a registered custom theme
   * @param name Theme name
   */
  getCustomTheme(name: string): OSICardsThemeConfig | null {
    return this.customThemes.get(name) ?? null;
  }

  /**
   * Get all registered custom themes
   */
  getCustomThemes(): OSICardsThemeConfig[] {
    return Array.from(this.customThemes.values());
  }

  /**
   * Get all available theme names (presets + custom)
   */
  getAvailableThemes(): string[] {
    const presets: ThemePreset[] = [
      'light', 'dark', 'system', 'midnight', 'corporate', 
      'nature', 'sunset', 'ocean', 'rose', 'minimal', 'high-contrast'
    ];
    const customNames = Array.from(this.customThemes.keys());
    return [...presets, ...customNames];
  }

  // ============================================
  // CSS Variables
  // ============================================

  /**
   * Apply CSS variables to document root
   * @param variables Object mapping CSS variable names to values
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
   * Remove specific CSS variables
   * @param variableNames Array of variable names to remove
   */
  removeCSSVariables(variableNames: string[]): void {
    if (!this.rootElement) {
      return;
    }

    variableNames.forEach(name => {
      const varName = name.startsWith('--') ? name : `--${name}`;
      this.rootElement!.style.removeProperty(varName);
    });
  }

  /**
   * Get current value of a CSS variable
   * @param name Variable name
   */
  getCSSVariable(name: string): string {
    if (!this.rootElement) {
      return '';
    }
    
    const varName = name.startsWith('--') ? name : `--${name}`;
    return getComputedStyle(this.rootElement).getPropertyValue(varName).trim();
  }

  // ============================================
  // Persistence
  // ============================================

  /**
   * Save current theme preference to localStorage
   * @param key Optional custom storage key
   */
  savePreference(key?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storageKey = key || this.config.persistKey;
    const theme = this.currentThemeSubject.value;
    
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }

  /**
   * Load theme preference from localStorage
   * @param key Optional custom storage key
   * @returns Stored theme or null
   */
  loadPreference(key?: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const storageKey = key || this.config.persistKey;
    
    try {
      return localStorage.getItem(storageKey);
    } catch (e) {
      console.warn('Failed to load theme preference:', e);
      return null;
    }
  }

  /**
   * Clear stored theme preference
   * @param key Optional custom storage key
   */
  clearPreference(key?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storageKey = key || this.config.persistKey;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear theme preference:', e);
    }
  }

  // ============================================
  // Transitions
  // ============================================

  /**
   * Enable smooth transitions for theme changes
   * @param duration Optional duration in ms (uses config if not provided)
   */
  enableTransitions(duration?: number): void {
    if (!this.rootElement || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const transitionDuration = duration ?? this.config.transitionDuration;
    
    // Add transitioning class
    this.rootElement.classList.add('theme-transitioning');
    this.rootElement.setAttribute('data-theme-transition', 'true');

    // Clear any existing timeout
    if (this.transitionTimeoutId) {
      clearTimeout(this.transitionTimeoutId);
    }

    // Remove class after transition completes
    this.transitionTimeoutId = setTimeout(() => {
      this.disableTransitions();
    }, transitionDuration + 50); // Small buffer
  }

  /**
   * Disable theme transition animations
   */
  disableTransitions(): void {
    if (!this.rootElement) {
      return;
    }

    this.rootElement.classList.remove('theme-transitioning');
    this.rootElement.removeAttribute('data-theme-transition');
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate a theme configuration
   * @param config Theme configuration to validate
   */
  validateTheme(config: OSICardsThemeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Theme name is required');
    }

    if (config.name && /[^a-zA-Z0-9-_]/.test(config.name)) {
      errors.push('Theme name must only contain alphanumeric characters, hyphens, and underscores');
    }

    if (!config.variables || Object.keys(config.variables).length === 0) {
      errors.push('Theme must have at least one CSS variable');
    }

    if (config.variables) {
      Object.entries(config.variables).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          errors.push(`CSS variable value for "${key}" must be a string`);
        }
      });
    }

    if (config.extends && !this.customThemes.has(config.extends) && !this.isBuiltInTheme(config.extends)) {
      errors.push(`Base theme "${config.extends}" not found`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  private initializeTheme(): void {
    // Try to load persisted preference first
    const savedTheme = this.config.enablePersistence ? this.loadPreference() : null;
    
    // Determine initial theme
    const initialTheme = savedTheme || this.config.defaultTheme;
    
    // Get initial data-theme from document if set
    const documentTheme = this.rootElement?.getAttribute('data-theme');
    
    // Use document theme if set and no saved preference
    const themeToApply = savedTheme || documentTheme || initialTheme;
    
    this.currentThemeSubject.next(themeToApply);
    
    const resolvedTheme = this.resolveTheme(themeToApply);
    this.applyTheme(resolvedTheme);
  }

  private initializeSystemPreferenceWatcher(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial value
    this.systemPreferenceSubject.next(this.mediaQueryList.matches ? 'dark' : 'light');

    // Watch for changes
    fromEvent<MediaQueryListEvent>(this.mediaQueryList, 'change').pipe(
      takeUntil(this.destroy$),
      map(event => event.matches ? 'dark' as const : 'light' as const)
    ).subscribe(preference => {
      this.systemPreferenceSubject.next(preference);
      
      // If following system, update theme
      if (this.isFollowingSystem() && this.config.followSystemPreference) {
        const resolvedTheme = preference;
        this.applyTheme(resolvedTheme);
      }
    });
  }

  private initializeColorSchemeMeta(): void {
    if (!isPlatformBrowser(this.platformId) || !this.config.updateColorSchemeMeta) {
      return;
    }

    // Find or create color-scheme meta tag
    this.colorSchemeMetaTag = this.document.querySelector('meta[name="color-scheme"]');
    
    if (!this.colorSchemeMetaTag) {
      this.colorSchemeMetaTag = this.document.createElement('meta');
      this.colorSchemeMetaTag.name = 'color-scheme';
      this.document.head.appendChild(this.colorSchemeMetaTag);
    }
  }

  private registerCustomThemes(themes?: Record<string, OSICardsThemeConfig>): void {
    if (!themes) {
      return;
    }

    Object.entries(themes).forEach(([name, config]) => {
      this.customThemes.set(name, { ...config, name });
    });
  }

  private resolveTheme(theme: ThemePreset | string): string {
    if (theme === 'system') {
      return this.detectSystemPreference();
    }
    return theme;
  }

  private applyTheme(theme: string): void {
    if (!this.rootElement) {
      return;
    }

    // Set data-theme attribute
    this.rootElement.setAttribute('data-theme', theme);
    
    // Update resolved theme subject
    this.resolvedThemeSubject.next(theme);

    // Check if custom theme with variables
    const customTheme = this.customThemes.get(theme);
    if (customTheme) {
      this.applyCSSVariables(customTheme.variables);
    }

    // Update color scheme meta tag
    const colorScheme = this.isThemeDark(theme) ? 'dark' : 'light';
    this.updateColorScheme(colorScheme);
  }

  private updateColorScheme(scheme: 'light' | 'dark' | 'light dark'): void {
    if (this.colorSchemeMetaTag && this.config.updateColorSchemeMeta) {
      this.colorSchemeMetaTag.content = scheme;
    }
  }

  private isThemeDark(theme: string): boolean {
    const darkThemes = ['dark', 'midnight', 'ocean', 'sunset', 'high-contrast'];
    
    // Check built-in dark themes
    if (darkThemes.includes(theme)) {
      return true;
    }

    // Check custom theme color scheme
    const customTheme = this.customThemes.get(theme);
    if (customTheme?.colorScheme === 'dark') {
      return true;
    }

    // Infer from custom theme variables
    if (customTheme) {
      return this.inferColorScheme(customTheme);
    }

    return false;
  }

  private inferColorScheme(config: OSICardsThemeConfig): boolean {
    // Try to infer if theme is dark based on background color
    const bgVar = config.variables['--osi-card-background'] || 
                  config.variables['--background'] ||
                  config.variables['background'];
    
    if (bgVar) {
      // Simple heuristic: if background contains 'dark' values
      const darkPatterns = ['#0', '#1', '#2', 'rgb(0', 'rgb(1', 'rgb(2', 'rgba(0', 'rgba(1', 'rgba(2'];
      return darkPatterns.some(pattern => bgVar.toLowerCase().startsWith(pattern));
    }

    return false;
  }

  private isBuiltInTheme(name: string): boolean {
    const builtIn: ThemePreset[] = [
      'light', 'dark', 'system', 'midnight', 'corporate',
      'nature', 'sunset', 'ocean', 'rose', 'minimal', 'high-contrast'
    ];
    return builtIn.includes(name as ThemePreset);
  }
}
