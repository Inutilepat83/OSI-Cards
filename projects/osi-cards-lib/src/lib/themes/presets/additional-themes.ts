/**
 * Additional Theme Presets (Improvements #56-65)
 * 
 * Comprehensive collection of additional theme presets for OSI Cards.
 * Includes corporate, vibrant, minimal, and specialized themes.
 * 
 * @example
 * ```typescript
 * import { THEME_PRESETS, applyThemePreset } from 'osi-cards-lib';
 * 
 * // Apply a preset
 * themeService.applyCustomTheme(THEME_PRESETS.neonCyber);
 * ```
 */

import { OSICardsThemeConfig } from '../theme.service';

// ============================================================================
// CORPORATE THEMES
// ============================================================================

/**
 * Professional Blue - Classic corporate theme
 */
export const professionalBlueTheme: OSICardsThemeConfig = {
  name: 'professional-blue',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#ffffff',
    '--osi-card-foreground': '#1e293b',
    '--osi-card-accent': '#0066cc',
    '--osi-card-accent-hover': '#0052a3',
    '--osi-card-border': '#e2e8f0',
    '--osi-card-border-radius': '8px',
    '--osi-card-shadow': '0 2px 4px rgba(0, 0, 0, 0.08)',
    '--osi-section-background': '#f8fafc',
    '--osi-section-foreground': '#334155',
    '--osi-field-label-color': '#64748b',
    '--osi-field-value-color': '#0f172a',
    '--osi-button-primary-bg': '#0066cc',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#059669',
    '--osi-warning-color': '#d97706',
    '--osi-error-color': '#dc2626',
    '--osi-font-family': '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

/**
 * Executive Dark - Premium dark corporate theme
 */
export const executiveDarkTheme: OSICardsThemeConfig = {
  name: 'executive-dark',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': '#18181b',
    '--osi-card-foreground': '#fafafa',
    '--osi-card-accent': '#60a5fa',
    '--osi-card-accent-hover': '#93c5fd',
    '--osi-card-border': '#3f3f46',
    '--osi-card-border-radius': '12px',
    '--osi-card-shadow': '0 4px 6px rgba(0, 0, 0, 0.4)',
    '--osi-section-background': '#27272a',
    '--osi-section-foreground': '#e4e4e7',
    '--osi-field-label-color': '#a1a1aa',
    '--osi-field-value-color': '#ffffff',
    '--osi-button-primary-bg': '#3b82f6',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#4ade80',
    '--osi-warning-color': '#fbbf24',
    '--osi-error-color': '#f87171',
    '--osi-font-family': '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

/**
 * Enterprise Gray - Neutral professional theme
 */
export const enterpriseGrayTheme: OSICardsThemeConfig = {
  name: 'enterprise-gray',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#f9fafb',
    '--osi-card-foreground': '#111827',
    '--osi-card-accent': '#4b5563',
    '--osi-card-accent-hover': '#374151',
    '--osi-card-border': '#d1d5db',
    '--osi-card-border-radius': '6px',
    '--osi-card-shadow': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--osi-section-background': '#ffffff',
    '--osi-section-foreground': '#374151',
    '--osi-field-label-color': '#6b7280',
    '--osi-field-value-color': '#111827',
    '--osi-button-primary-bg': '#4b5563',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#10b981',
    '--osi-warning-color': '#f59e0b',
    '--osi-error-color': '#ef4444',
    '--osi-font-family': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

// ============================================================================
// VIBRANT THEMES
// ============================================================================

/**
 * Neon Cyber - Futuristic cyberpunk theme
 */
export const neonCyberTheme: OSICardsThemeConfig = {
  name: 'neon-cyber',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': '#0a0a0f',
    '--osi-card-foreground': '#e0e0e0',
    '--osi-card-accent': '#00ffff',
    '--osi-card-accent-hover': '#00cccc',
    '--osi-card-border': '#1a1a2e',
    '--osi-card-border-radius': '0',
    '--osi-card-shadow': '0 0 20px rgba(0, 255, 255, 0.2)',
    '--osi-section-background': '#0d0d14',
    '--osi-section-foreground': '#c0c0c0',
    '--osi-field-label-color': '#00ffff',
    '--osi-field-value-color': '#ffffff',
    '--osi-button-primary-bg': '#ff00ff',
    '--osi-button-primary-fg': '#000000',
    '--osi-success-color': '#00ff00',
    '--osi-warning-color': '#ffff00',
    '--osi-error-color': '#ff0055',
    '--osi-font-family': '"JetBrains Mono", "Fira Code", monospace',
  }
};

/**
 * Sunset Gradient - Warm gradient theme
 */
export const sunsetGradientTheme: OSICardsThemeConfig = {
  name: 'sunset-gradient',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': 'linear-gradient(135deg, #fff5f5 0%, #fef3e2 100%)',
    '--osi-card-foreground': '#44403c',
    '--osi-card-accent': '#ea580c',
    '--osi-card-accent-hover': '#c2410c',
    '--osi-card-border': '#fed7aa',
    '--osi-card-border-radius': '16px',
    '--osi-card-shadow': '0 10px 40px rgba(234, 88, 12, 0.15)',
    '--osi-section-background': 'rgba(255, 255, 255, 0.7)',
    '--osi-section-foreground': '#57534e',
    '--osi-field-label-color': '#a8a29e',
    '--osi-field-value-color': '#292524',
    '--osi-button-primary-bg': 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#65a30d',
    '--osi-warning-color': '#eab308',
    '--osi-error-color': '#dc2626',
    '--osi-font-family': '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

/**
 * Aurora Borealis - Northern lights inspired theme
 */
export const auroraBorealisTheme: OSICardsThemeConfig = {
  name: 'aurora-borealis',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
    '--osi-card-foreground': '#e2e8f0',
    '--osi-card-accent': '#22d3ee',
    '--osi-card-accent-hover': '#67e8f9',
    '--osi-card-border': '#4338ca',
    '--osi-card-border-radius': '20px',
    '--osi-card-shadow': '0 20px 60px rgba(34, 211, 238, 0.2)',
    '--osi-section-background': 'rgba(30, 27, 75, 0.8)',
    '--osi-section-foreground': '#c7d2fe',
    '--osi-field-label-color': '#a78bfa',
    '--osi-field-value-color': '#f1f5f9',
    '--osi-button-primary-bg': 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#34d399',
    '--osi-warning-color': '#fcd34d',
    '--osi-error-color': '#fb7185',
    '--osi-font-family': '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

// ============================================================================
// MINIMAL THEMES
// ============================================================================

/**
 * Swiss Design - Ultra-minimal clean theme
 */
export const swissDesignTheme: OSICardsThemeConfig = {
  name: 'swiss-design',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#ffffff',
    '--osi-card-foreground': '#000000',
    '--osi-card-accent': '#ff0000',
    '--osi-card-accent-hover': '#cc0000',
    '--osi-card-border': '#000000',
    '--osi-card-border-radius': '0',
    '--osi-card-shadow': 'none',
    '--osi-section-background': '#ffffff',
    '--osi-section-foreground': '#000000',
    '--osi-field-label-color': '#666666',
    '--osi-field-value-color': '#000000',
    '--osi-button-primary-bg': '#000000',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#000000',
    '--osi-warning-color': '#ff0000',
    '--osi-error-color': '#ff0000',
    '--osi-font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  }
};

/**
 * Paper Light - Soft paper-like theme
 */
export const paperLightTheme: OSICardsThemeConfig = {
  name: 'paper-light',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#fefefe',
    '--osi-card-foreground': '#2d2d2d',
    '--osi-card-accent': '#6366f1',
    '--osi-card-accent-hover': '#4f46e5',
    '--osi-card-border': '#e5e5e5',
    '--osi-card-border-radius': '4px',
    '--osi-card-shadow': '0 1px 3px rgba(0, 0, 0, 0.04)',
    '--osi-section-background': '#fafafa',
    '--osi-section-foreground': '#404040',
    '--osi-field-label-color': '#737373',
    '--osi-field-value-color': '#171717',
    '--osi-button-primary-bg': '#525252',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#22c55e',
    '--osi-warning-color': '#eab308',
    '--osi-error-color': '#ef4444',
    '--osi-font-family': '"Source Serif Pro", Georgia, serif',
  }
};

/**
 * Ink Dark - Dark minimal theme with high contrast
 */
export const inkDarkTheme: OSICardsThemeConfig = {
  name: 'ink-dark',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': '#000000',
    '--osi-card-foreground': '#ffffff',
    '--osi-card-accent': '#ffffff',
    '--osi-card-accent-hover': '#e5e5e5',
    '--osi-card-border': '#333333',
    '--osi-card-border-radius': '2px',
    '--osi-card-shadow': 'none',
    '--osi-section-background': '#0a0a0a',
    '--osi-section-foreground': '#f5f5f5',
    '--osi-field-label-color': '#a3a3a3',
    '--osi-field-value-color': '#ffffff',
    '--osi-button-primary-bg': '#ffffff',
    '--osi-button-primary-fg': '#000000',
    '--osi-success-color': '#ffffff',
    '--osi-warning-color': '#ffffff',
    '--osi-error-color': '#ffffff',
    '--osi-font-family': '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

// ============================================================================
// NATURE THEMES
// ============================================================================

/**
 * Forest Green - Natural forest theme
 */
export const forestGreenTheme: OSICardsThemeConfig = {
  name: 'forest-green',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#f0fdf4',
    '--osi-card-foreground': '#14532d',
    '--osi-card-accent': '#16a34a',
    '--osi-card-accent-hover': '#15803d',
    '--osi-card-border': '#bbf7d0',
    '--osi-card-border-radius': '12px',
    '--osi-card-shadow': '0 4px 12px rgba(22, 163, 74, 0.1)',
    '--osi-section-background': '#dcfce7',
    '--osi-section-foreground': '#166534',
    '--osi-field-label-color': '#4ade80',
    '--osi-field-value-color': '#052e16',
    '--osi-button-primary-bg': '#22c55e',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#16a34a',
    '--osi-warning-color': '#ca8a04',
    '--osi-error-color': '#dc2626',
    '--osi-font-family': '"Merriweather Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

/**
 * Ocean Deep - Deep ocean theme
 */
export const oceanDeepTheme: OSICardsThemeConfig = {
  name: 'ocean-deep',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': '#0c1929',
    '--osi-card-foreground': '#e0f2fe',
    '--osi-card-accent': '#0ea5e9',
    '--osi-card-accent-hover': '#38bdf8',
    '--osi-card-border': '#1e3a5f',
    '--osi-card-border-radius': '16px',
    '--osi-card-shadow': '0 8px 32px rgba(14, 165, 233, 0.15)',
    '--osi-section-background': '#0f2942',
    '--osi-section-foreground': '#bae6fd',
    '--osi-field-label-color': '#7dd3fc',
    '--osi-field-value-color': '#f0f9ff',
    '--osi-button-primary-bg': '#0284c7',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#2dd4bf',
    '--osi-warning-color': '#fbbf24',
    '--osi-error-color': '#f87171',
    '--osi-font-family': '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
  }
};

// ============================================================================
// ACCESSIBILITY THEMES
// ============================================================================

/**
 * High Contrast Light - WCAG AAA compliant light theme
 */
export const highContrastLightTheme: OSICardsThemeConfig = {
  name: 'high-contrast-light',
  colorScheme: 'light',
  variables: {
    '--osi-card-background': '#ffffff',
    '--osi-card-foreground': '#000000',
    '--osi-card-accent': '#0000cc',
    '--osi-card-accent-hover': '#000099',
    '--osi-card-border': '#000000',
    '--osi-card-border-radius': '4px',
    '--osi-card-shadow': '0 0 0 2px #000000',
    '--osi-section-background': '#ffffff',
    '--osi-section-foreground': '#000000',
    '--osi-field-label-color': '#000000',
    '--osi-field-value-color': '#000000',
    '--osi-button-primary-bg': '#0000cc',
    '--osi-button-primary-fg': '#ffffff',
    '--osi-success-color': '#006600',
    '--osi-warning-color': '#996600',
    '--osi-error-color': '#cc0000',
    '--osi-font-family': 'system-ui, -apple-system, sans-serif',
  }
};

/**
 * High Contrast Dark - WCAG AAA compliant dark theme
 */
export const highContrastDarkTheme: OSICardsThemeConfig = {
  name: 'high-contrast-dark',
  colorScheme: 'dark',
  variables: {
    '--osi-card-background': '#000000',
    '--osi-card-foreground': '#ffffff',
    '--osi-card-accent': '#ffff00',
    '--osi-card-accent-hover': '#ffff66',
    '--osi-card-border': '#ffffff',
    '--osi-card-border-radius': '4px',
    '--osi-card-shadow': '0 0 0 2px #ffffff',
    '--osi-section-background': '#000000',
    '--osi-section-foreground': '#ffffff',
    '--osi-field-label-color': '#ffff00',
    '--osi-field-value-color': '#ffffff',
    '--osi-button-primary-bg': '#ffff00',
    '--osi-button-primary-fg': '#000000',
    '--osi-success-color': '#00ff00',
    '--osi-warning-color': '#ffff00',
    '--osi-error-color': '#ff6666',
    '--osi-font-family': 'system-ui, -apple-system, sans-serif',
  }
};

// ============================================================================
// THEME COLLECTION
// ============================================================================

/**
 * All additional theme presets
 */
export const ADDITIONAL_THEME_PRESETS = {
  // Corporate
  professionalBlue: professionalBlueTheme,
  executiveDark: executiveDarkTheme,
  enterpriseGray: enterpriseGrayTheme,
  
  // Vibrant
  neonCyber: neonCyberTheme,
  sunsetGradient: sunsetGradientTheme,
  auroraBorealis: auroraBorealisTheme,
  
  // Minimal
  swissDesign: swissDesignTheme,
  paperLight: paperLightTheme,
  inkDark: inkDarkTheme,
  
  // Nature
  forestGreen: forestGreenTheme,
  oceanDeep: oceanDeepTheme,
  
  // Accessibility
  highContrastLight: highContrastLightTheme,
  highContrastDark: highContrastDarkTheme,
} as const;

/**
 * Get all theme names
 */
export function getAdditionalThemeNames(): string[] {
  return Object.keys(ADDITIONAL_THEME_PRESETS);
}

/**
 * Get a theme by name
 */
export function getAdditionalTheme(name: keyof typeof ADDITIONAL_THEME_PRESETS): OSICardsThemeConfig {
  return ADDITIONAL_THEME_PRESETS[name];
}

/**
 * Create a custom theme by extending an existing one
 */
export function extendTheme(
  baseTheme: OSICardsThemeConfig,
  overrides: Partial<OSICardsThemeConfig>
): OSICardsThemeConfig {
  return {
    ...baseTheme,
    ...overrides,
    name: overrides.name || `${baseTheme.name}-extended`,
    variables: {
      ...baseTheme.variables,
      ...(overrides.variables || {})
    }
  };
}

