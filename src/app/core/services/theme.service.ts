import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme$ = new BehaviorSubject<Theme>('auto');
  private appliedTheme$ = new BehaviorSubject<'light' | 'dark'>('light');

  // CSS custom properties for themes - aligned with styles.css
  private lightTheme = {
    // Core theme variables
    '--background': '#ffffff',
    '--foreground': '#000000',
    '--card': '#f8f9fa',
    '--card-foreground': '#000000',
    '--popover': '#ffffff',
    '--popover-foreground': '#000000',
    '--primary': '#ff7900',
    '--primary-foreground': '#ffffff',
    '--secondary': '#e9ecef',
    '--secondary-foreground': '#000000',
    '--muted': '#f1f3f4',
    '--muted-foreground': '#5f6368',
    '--accent': '#ff7900',
    '--accent-foreground': '#ffffff',
    '--destructive': '#dc3545',
    '--destructive-foreground': '#ffffff',
    '--border': 'rgba(0, 0, 0, 0.1)',
    '--input': 'transparent',
    '--input-background': '#ffffff',
    '--switch-background': '#e9ecef',
    '--ring': 'rgba(255, 121, 0, 0.6)',

    // Enhanced theme variables
    '--surface-card': '#f8f9fa',
    '--surface-section': '#f1f3f4',
    '--surface-hover': 'rgba(255, 121, 0, 0.1)',
    '--surface-hover-dark': 'rgba(0, 0, 0, 0.05)',
    '--surface-border': 'rgba(0, 0, 0, 0.1)',
    '--surface-border-dark': 'rgba(0, 0, 0, 0.15)',
    '--text-color-secondary': '#5f6368',
    '--primary-color-light': 'rgba(255, 121, 0, 0.2)',
    '--primary-color-hover': '#e66a00',
    '--primary-color-text': '#ff7900',
    '--background-overlay': 'rgba(255, 255, 255, 0.9)',
    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--glow-color': 'rgba(255, 121, 0, 0.2)',

    // Chart colors
    '--chart-1': '#ff7900',
    '--chart-2': '#ff9933',
    '--chart-3': '#cc5f00',
    '--chart-4': '#ffe6cc',
    '--chart-5': '#ff4500',
  };

  private darkTheme = {
    // Core theme variables
    '--background': '#0a0a0a',
    '--foreground': '#ffffff',
    '--card': '#1a1a1a',
    '--card-foreground': '#ffffff',
    '--popover': '#1a1a1a',
    '--popover-foreground': '#ffffff',
    '--primary': '#ff7900',
    '--primary-foreground': '#000000',
    '--secondary': '#2a2a2a',
    '--secondary-foreground': '#ffffff',
    '--muted': '#1a1a1a',
    '--muted-foreground': '#a3a3a3',
    '--accent': '#ff7900',
    '--accent-foreground': '#000000',
    '--destructive': '#ef4444',
    '--destructive-foreground': '#ffffff',
    '--border': 'rgba(255, 255, 255, 0.1)',
    '--input': 'transparent',
    '--input-background': '#2a2a2a',
    '--switch-background': '#3a3a3a',
    '--ring': 'rgba(255, 121, 0, 0.6)',

    // Enhanced theme variables
    '--surface-card': '#1a1a1a',
    '--surface-section': '#1a1a1a',
    '--surface-hover': 'rgba(255, 255, 255, 0.1)',
    '--surface-hover-dark': 'rgba(255, 255, 255, 0.15)',
    '--surface-border': 'rgba(255, 255, 255, 0.1)',
    '--surface-border-dark': 'rgba(255, 255, 255, 0.2)',
    '--text-color-secondary': '#a3a3a3',
    '--primary-color-light': 'rgba(255, 121, 0, 0.3)',
    '--primary-color-hover': '#ff9933',
    '--primary-color-text': '#ff7900',
    '--background-overlay': 'rgba(0, 0, 0, 0.9)',
    '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    '--glow-color': 'rgba(255, 121, 0, 0.4)',

    // Chart colors
    '--chart-1': '#ff7900',
    '--chart-2': '#ff9933',
    '--chart-3': '#cc5f00',
    '--chart-4': '#ffe6cc',
    '--chart-5': '#ff4500',
  };

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Get current theme setting
   */
  getCurrentTheme(): Theme {
    return this.currentTheme$.value;
  }

  /**
   * Get current theme as observable
   */
  getCurrentTheme$(): Observable<Theme> {
    return this.currentTheme$.asObservable();
  }

  /**
   * Get applied theme (resolved from auto)
   */
  getAppliedTheme$(): Observable<'light' | 'dark'> {
    return this.appliedTheme$.asObservable();
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme$.next(theme);
    localStorage.setItem('preferred-theme', theme);
    this.applyTheme(theme);
  }

  /**
   * Toggle between light and dark
   */
  toggleTheme(): void {
    const current = this.getAppliedTheme();
    const newTheme: Theme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get applied theme (resolves auto to actual theme)
   */
  getAppliedTheme(): 'light' | 'dark' {
    return this.appliedTheme$.value;
  }

  /**
   * Check if dark theme is applied
   */
  isDarkTheme(): boolean {
    return this.getAppliedTheme() === 'dark';
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    return [
      { value: 'light', label: 'Light', icon: 'pi pi-sun' },
      { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
      { value: 'auto', label: 'Auto', icon: 'pi pi-circle' },
    ];
  }

  /**
   * Get theme configuration by value
   */
  getThemeConfig(themeValue: Theme): ThemeConfig | undefined {
    return this.getAvailableThemes().find(theme => theme.value === themeValue);
  }

  private initializeTheme(): void {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem('preferred-theme') as Theme;
    const initialTheme = savedTheme || 'auto';
    this.currentTheme$.next(initialTheme);
    this.applyTheme(initialTheme);
  }

  private applyTheme(theme: Theme): void {
    const resolvedTheme = this.resolveTheme(theme);
    this.appliedTheme$.next(resolvedTheme);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Apply CSS custom properties
    this.applyThemeVariables(resolvedTheme);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(resolvedTheme);
  }

  private applyThemeVariables(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    const themeVars = theme === 'dark' ? this.darkTheme : this.lightTheme;

    // Apply CSS custom properties
    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  private resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  private updateMetaThemeColor(theme: 'light' | 'dark'): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }

  /**
   * Listen for system theme changes when in auto mode
   */
  private setupSystemThemeListener(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.getCurrentTheme() === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        this.appliedTheme$.next(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        this.applyThemeVariables(newTheme);
        this.updateMetaThemeColor(newTheme);
      }
    });
  }

  /**
   * Get theme-specific class for components
   */
  getThemeClass(): string {
    const theme = this.getAppliedTheme();
    return `theme-${theme}`;
  }

  /**
   * Get contrast color for a given background color
   */
  getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}
