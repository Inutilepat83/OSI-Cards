import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  Optional,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, map, takeUntil } from 'rxjs';
import { EventBusService } from '../services/event-bus.service';
import { DEFAULT_THEME_PRESET } from './presets';

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
  /**
   * Target element for theme application (container-scoped theming)
   * If not provided, defaults to document.documentElement (global theming - demo app only)
   * @deprecated For library integration, use container-scoped theming via [attr.data-theme] or OsiThemeDirective
   */
  targetElement?: HTMLElement | null;
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
  updateColorSchemeMeta: true,
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
 * @deprecated For library integration, prefer container-scoped theming:
 * - Use `<osi-cards-container [theme]="'day'">` component input
 * - Use `[attr.data-theme]="theme"` attribute binding
 * - Use `OsiThemeDirective` for scoped theming
 *
 * This service is primarily for demo app use where global theming is acceptable.
 * When used in library mode, it mutates document.documentElement which breaks library independence.
 *
 * @example
 * ```typescript
 * // Demo app usage (acceptable)
 * const themeService = inject(ThemeService);
 * themeService.setTheme('system');
 *
 * // Library integration (preferred)
 * <osi-cards-container [theme]="'day'">
 *   <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
 * </osi-cards-container>
 * ```
 */
@Injectable({
  providedIn: 'root',
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
  readonly currentTheme$: Observable<ThemePreset | string> =
    this.currentThemeSubject.asObservable();

  /** Observable of the resolved/effective theme (never 'system', always the actual theme) */
  readonly resolvedTheme$: Observable<string> = this.resolvedThemeSubject.asObservable();

  /** Observable of system color scheme preference */
  readonly systemPreference$: Observable<ColorSchemePreference> =
    this.systemPreferenceSubject.asObservable();

  constructor(@Optional() @Inject(OSI_THEME_CONFIG) providedConfig?: Partial<ThemeServiceConfig>) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_THEME_CONFIG, ...providedConfig };

    // Use targetElement if provided (container-scoped), otherwise default to documentElement (global - demo only)
    if (this.config.targetElement !== undefined) {
      this.rootElement = this.config.targetElement;
    } else {
      this.rootElement = isPlatformBrowser(this.platformId) ? this.document.documentElement : null;

      // Warn in development if using global theming (library mode should use container-scoped)
      if (
        isPlatformBrowser(this.platformId) &&
        typeof console !== 'undefined' &&
        !this.isProduction()
      ) {
        console.warn(
          '[ThemeService] Using global document.documentElement for theming. ' +
            'For library integration, prefer container-scoped theming via <osi-cards-container [theme]="..."> or OsiThemeDirective.'
        );
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      this.initializeSystemPreferenceWatcher();
      // Only initialize color scheme meta if using global theming
      if (this.rootElement === this.document.documentElement) {
        this.initializeColorSchemeMeta();
      }
      this.registerCustomThemes(this.config.customThemes);
      this.initializeTheme();
    }
  }

  /**
   * Check if running in production mode
   */
  private isProduction(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ===
        false
    );
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
    const newTheme = this.isThemeDark(current) ? 'day' : 'night';
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
    const presets: string[] = [
      'light',
      'dark',
      'day',
      'night',
      'osi-day',
      'osi-night',
      'system',
      'midnight',
      'corporate',
      'nature',
      'sunset',
      'ocean',
      'rose',
      'minimal',
      'high-contrast',
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

    variableNames.forEach((name) => {
      const varName = name.startsWith('--') ? name : `--${name}`;
      this.rootElement!.style.removeProperty(varName);
    });
  }

  /**
   * Apply theme style preset to the root element
   * @param isDark Whether to apply dark or light theme
   */
  private applyThemeStylePreset(isDark: boolean): void {
    if (!this.rootElement) {
      return;
    }

    // Apply preset variables - inline styles have higher specificity than CSS rules
    const variables = isDark ? DEFAULT_THEME_PRESET.dark : DEFAULT_THEME_PRESET.light;
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        // Inline styles override CSS rules, so these will take precedence
        this.rootElement!.style.setProperty(key, value);
      }
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

    if (
      config.extends &&
      !this.customThemes.has(config.extends) &&
      !this.isBuiltInTheme(config.extends)
    ) {
      errors.push(`Base theme "${config.extends}" not found`);
    }

    return {
      valid: errors.length === 0,
      errors,
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
    // Apply theme immediately on initialization
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
    fromEvent<MediaQueryListEvent>(this.mediaQueryList, 'change')
      .pipe(
        takeUntil(this.destroy$),
        map((event) => (event.matches ? ('dark' as const) : ('light' as const)))
      )
      .subscribe((preference) => {
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
      const systemPref = this.detectSystemPreference();
      // Map 'light'/'dark' to 'day'/'night' for consistency
      return systemPref === 'dark' ? 'night' : 'day';
    }
    // Map 'light'/'dark' to 'day'/'night' for consistency
    if (theme === 'light') {
      return 'day';
    }
    if (theme === 'dark') {
      return 'night';
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

    // Apply theme style preset (DEFAULT_THEME_PRESET for day/night themes)
    const isDark = this.isThemeDark(theme);
    if (theme === 'day' || theme === 'night' || theme === 'light' || theme === 'dark') {
      // Apply preset immediately - inline styles have higher specificity than CSS rules
      this.applyThemeStylePreset(isDark);
    }

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
    // Only update meta tag when using global theming (documentElement)
    if (
      this.colorSchemeMetaTag &&
      this.config.updateColorSchemeMeta &&
      this.rootElement === this.document.documentElement
    ) {
      this.colorSchemeMetaTag.content = scheme;
    }
  }

  private isThemeDark(theme: string): boolean {
    const darkThemes = [
      'dark',
      'night',
      'osi-night',
      'midnight',
      'ocean',
      'sunset',
      'high-contrast',
    ];

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
    const bgVar =
      config.variables['--osi-card-background'] ||
      config.variables['--background'] ||
      config.variables['background'];

    if (bgVar) {
      // Simple heuristic: if background contains 'dark' values
      const darkPatterns = [
        '#0',
        '#1',
        '#2',
        'rgb(0',
        'rgb(1',
        'rgb(2',
        'rgba(0',
        'rgba(1',
        'rgba(2',
      ];
      return darkPatterns.some((pattern) => bgVar.toLowerCase().startsWith(pattern));
    }

    return false;
  }

  private isBuiltInTheme(name: string): boolean {
    const builtIn: string[] = [
      'light',
      'dark',
      'day',
      'night',
      'osi-day',
      'osi-night',
      'system',
      'midnight',
      'corporate',
      'nature',
      'sunset',
      'ocean',
      'rose',
      'minimal',
      'high-contrast',
    ];
    return builtIn.includes(name);
  }
}
