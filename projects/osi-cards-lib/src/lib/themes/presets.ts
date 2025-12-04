/**
 * Theme Presets
 *
 * Pre-configured theme configurations for different use cases.
 * These presets match the demo app styling exactly.
 */

/**
 * CSS Variables for a theme preset
 */
export interface ThemePresetVariables {
  // AI Card Surface
  '--theme-ai-card-border': string;
  '--theme-ai-card-border-hover': string;
  '--theme-ai-card-background': string;
  '--theme-ai-card-background-hover': string;
  '--theme-ai-card-box-shadow': string;
  '--theme-ai-card-box-shadow-hover': string;
  '--theme-ai-card-backdrop-filter': string;
  '--theme-ai-card-transition': string;

  // Card Surface
  '--theme-card-border': string;
  '--theme-card-border-hover': string;
  '--theme-card-background': string;
  '--theme-card-background-hover': string;
  '--theme-card-box-shadow': string;
  '--theme-card-box-shadow-hover': string;

  // Section Surface
  '--theme-section-border': string;
  '--theme-section-border-hover': string;
  '--theme-section-box-shadow': string;
  '--theme-section-box-shadow-hover': string;
}

/**
 * Theme preset configuration with CSS variables for dark and light modes
 */
export interface ThemeStylePreset {
  name: string;
  description: string;
  dark: Partial<ThemePresetVariables>;
  light: Partial<ThemePresetVariables>;
}

/**
 * Default theme preset - matches the demo app exactly
 *
 * This is the default theme used by the library.
 * Features:
 * - Semi-transparent backgrounds with blur
 * - Orange brand accent colors
 * - Subtle glow effects on hover
 */
export const DEFAULT_THEME_PRESET: ThemeStylePreset = {
  name: 'default',
  description: 'Default theme matching the demo app styling',
  dark: {
    // AI Card - transparent with blur effect
    '--theme-ai-card-border': '1px solid rgba(255, 255, 255, 0.08)',
    '--theme-ai-card-border-hover': '1px solid rgba(255, 121, 0, 0.5)',
    '--theme-ai-card-background': 'rgba(20, 20, 20, 0.6)',
    '--theme-ai-card-background-hover': 'rgba(30, 30, 30, 0.8)',
    '--theme-ai-card-box-shadow': '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
    '--theme-ai-card-box-shadow-hover':
      '0 20px 40px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 121, 0, 0.2)',
    '--theme-ai-card-backdrop-filter': 'blur(12px)',
    '--theme-ai-card-transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',

    // Card
    '--theme-card-border': '1px solid rgba(255, 255, 255, 0.08)',
    '--theme-card-border-hover': 'var(--color-brand)',
    '--theme-card-background': 'var(--background)',
    '--theme-card-background-hover':
      'color-mix(in srgb, var(--background) 98%, var(--surface-contrast-color) 2%)',
    '--theme-card-box-shadow': '0 1px 3px rgba(0, 0, 0, 0.35)',
    '--theme-card-box-shadow-hover': '0 2px 4px rgba(0, 0, 0, 0.45)',

    // Section
    '--theme-section-border': '1px solid rgba(255, 255, 255, 0.1)',
    '--theme-section-border-hover': '1px solid rgba(255, 255, 255, 0.1)',
    '--theme-section-box-shadow': '0 1px 3px rgba(0, 0, 0, 0.4)',
    '--theme-section-box-shadow-hover': '0 2px 5px rgba(0, 0, 0, 0.5)',
  },
  light: {
    // AI Card - light theme with blur
    '--theme-ai-card-border': '1px solid rgba(0, 0, 0, 0.08)',
    '--theme-ai-card-border-hover': '1px solid rgba(255, 121, 0, 0.4)',
    '--theme-ai-card-background': 'rgba(255, 255, 255, 0.85)',
    '--theme-ai-card-background-hover': 'rgba(255, 255, 255, 0.92)',
    '--theme-ai-card-box-shadow':
      '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 0 18px rgba(255, 121, 0, 0.15)',
    '--theme-ai-card-box-shadow-hover':
      '0 20px 40px -5px rgba(0, 0, 0, 0.15), 0 0 24px rgba(255, 121, 0, 0.25), 0 0 0 1px rgba(255, 121, 0, 0.15)',
    '--theme-ai-card-backdrop-filter': 'blur(12px)',
    '--theme-ai-card-transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',

    // Card
    '--theme-card-border': '1px solid rgba(0, 0, 0, 0.08)',
    '--theme-card-border-hover': 'var(--color-brand)',
    '--theme-card-background': 'var(--background)',
    '--theme-card-background-hover':
      'color-mix(in srgb, var(--background) 98%, var(--surface-contrast-color) 2%)',
    '--theme-card-box-shadow': '0 1px 2px rgba(15, 15, 20, 0.04)',
    '--theme-card-box-shadow-hover': '0 1px 3px rgba(10, 10, 16, 0.06)',

    // Section
    '--theme-section-border': '1px solid rgba(0, 0, 0, 0.08)',
    '--theme-section-border-hover': '1px solid rgba(0, 0, 0, 0.1)',
    '--theme-section-box-shadow': '0 1px 3px rgba(0, 0, 0, 0.05)',
    '--theme-section-box-shadow-hover': '0 2px 4px rgba(0, 0, 0, 0.07)',
  },
};

/**
 * High contrast theme preset
 *
 * Designed for accessibility with stronger borders and higher contrast.
 */
export const HIGH_CONTRAST_THEME_PRESET: ThemeStylePreset = {
  name: 'high-contrast',
  description: 'High contrast theme for accessibility',
  dark: {
    '--theme-ai-card-border': '2px solid rgba(255, 255, 255, 0.3)',
    '--theme-ai-card-border-hover': '2px solid rgba(255, 121, 0, 0.8)',
    '--theme-ai-card-background': 'rgba(0, 0, 0, 0.9)',
    '--theme-ai-card-background-hover': 'rgba(10, 10, 10, 0.95)',
    '--theme-ai-card-box-shadow': '0 0 0 1px rgba(255, 255, 255, 0.2)',
    '--theme-ai-card-box-shadow-hover': '0 0 0 2px rgba(255, 121, 0, 0.5)',
    '--theme-ai-card-backdrop-filter': 'none',
    '--theme-ai-card-transition': 'all 0.2s ease',

    '--theme-card-border': '1px solid rgba(255, 255, 255, 0.2)',
    '--theme-card-border-hover': 'var(--color-brand)',
    '--theme-card-background': '#000000',
    '--theme-card-background-hover': '#0a0a0a',
    '--theme-card-box-shadow': 'none',
    '--theme-card-box-shadow-hover': '0 0 0 1px var(--color-brand)',

    '--theme-section-border': '1px solid rgba(255, 255, 255, 0.2)',
    '--theme-section-border-hover': '1px solid rgba(255, 255, 255, 0.4)',
    '--theme-section-box-shadow': 'none',
    '--theme-section-box-shadow-hover': 'none',
  },
  light: {
    '--theme-ai-card-border': '2px solid rgba(0, 0, 0, 0.3)',
    '--theme-ai-card-border-hover': '2px solid rgba(255, 121, 0, 0.8)',
    '--theme-ai-card-background': 'rgba(255, 255, 255, 0.98)',
    '--theme-ai-card-background-hover': '#ffffff',
    '--theme-ai-card-box-shadow': '0 0 0 1px rgba(0, 0, 0, 0.15)',
    '--theme-ai-card-box-shadow-hover': '0 0 0 2px rgba(255, 121, 0, 0.5)',
    '--theme-ai-card-backdrop-filter': 'none',
    '--theme-ai-card-transition': 'all 0.2s ease',

    '--theme-card-border': '1px solid rgba(0, 0, 0, 0.15)',
    '--theme-card-border-hover': 'var(--color-brand)',
    '--theme-card-background': '#ffffff',
    '--theme-card-background-hover': '#fafafa',
    '--theme-card-box-shadow': 'none',
    '--theme-card-box-shadow-hover': '0 0 0 1px var(--color-brand)',

    '--theme-section-border': '1px solid rgba(0, 0, 0, 0.15)',
    '--theme-section-border-hover': '1px solid rgba(0, 0, 0, 0.25)',
    '--theme-section-box-shadow': 'none',
    '--theme-section-box-shadow-hover': 'none',
  },
};

/**
 * All available theme style presets
 */
export const THEME_STYLE_PRESETS: Record<string, ThemeStylePreset> = {
  default: DEFAULT_THEME_PRESET,
  'high-contrast': HIGH_CONTRAST_THEME_PRESET,
};

/**
 * Apply a theme style preset's CSS variables to an element
 *
 * @param element - The element to apply the preset to
 * @param preset - The theme style preset to apply
 * @param isDark - Whether to use dark or light theme values
 */
export function applyThemeStylePreset(
  element: HTMLElement,
  preset: ThemeStylePreset,
  isDark: boolean = true
): void {
  const variables = isDark ? preset.dark : preset.light;
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      element.style.setProperty(key, value);
    }
  });
}

/**
 * Remove theme style preset CSS variables from an element
 *
 * @param element - The element to remove the preset from
 * @param preset - The theme style preset to remove
 */
export function removeThemeStylePreset(element: HTMLElement, preset: ThemeStylePreset): void {
  const allVariables = { ...preset.dark, ...preset.light };
  Object.keys(allVariables).forEach((key) => {
    element.style.removeProperty(key);
  });
}
