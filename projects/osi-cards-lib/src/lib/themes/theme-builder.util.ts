import { OSICardsThemeConfig } from './theme.service';

/**
 * Theme Builder Utility
 * 
 * Helper functions for building and modifying theme configurations
 */

/**
 * Create a theme configuration from a base theme with overrides
 * 
 * @param baseTheme - Base theme configuration
 * @param overrides - Variable overrides to apply
 * @returns New theme configuration with overrides applied
 * 
 * @example
 * ```typescript
 * const customTheme = buildThemeFromBase(lightTheme, {
 *   '--color-brand': '#ff0000',
 *   '--card-padding': '24px'
 * });
 * ```
 */
export function buildThemeFromBase(
  baseTheme: OSICardsThemeConfig,
  overrides: Record<string, string>
): OSICardsThemeConfig {
  return {
    ...baseTheme,
    name: baseTheme.name + '-custom',
    preset: false,
    variables: {
      ...baseTheme.variables,
      ...overrides
    }
  };
}

/**
 * Merge multiple theme configurations
 * Later themes override earlier ones
 * 
 * @param themes - Array of theme configurations to merge
 * @returns Merged theme configuration
 */
export function mergeThemes(...themes: OSICardsThemeConfig[]): OSICardsThemeConfig {
  if (themes.length === 0) {
    throw new Error('At least one theme is required');
  }

  const firstTheme = themes[0];
  if (!firstTheme) {
    throw new Error('At least one theme is required');
  }
  
  const merged: OSICardsThemeConfig = {
    name: firstTheme.name,
    preset: false,
    variables: {}
  };

  themes.forEach(theme => {
    merged.variables = {
      ...merged.variables,
      ...theme.variables
    };
  });

  return merged;
}

/**
 * Create a theme with only specific CSS variables
 * Useful for partial theme customization
 * 
 * @param name - Theme name
 * @param variables - CSS variables to include
 * @returns Theme configuration with only specified variables
 */
export function createPartialTheme(
  name: string,
  variables: Record<string, string>
): OSICardsThemeConfig {
  return {
    name,
    preset: false,
    variables
  };
}

/**
 * Validate CSS variable names
 * 
 * @param variables - Object with CSS variable names as keys
 * @returns Array of invalid variable names
 */
export function validateCSSVariableNames(
  variables: Record<string, string>
): string[] {
  const invalid: string[] = [];

  Object.keys(variables).forEach(key => {
    // CSS custom properties should start with --
    if (!key.startsWith('--')) {
      invalid.push(key);
      return;
    }

    // Validate format: --property-name (kebab-case)
    const withoutPrefix = key.substring(2);
    if (!/^[a-z][a-z0-9-]*$/.test(withoutPrefix)) {
      invalid.push(key);
    }
  });

  return invalid;
}

/**
 * Generate a theme from a color palette
 * Automatically generates related CSS variables from base colors
 * 
 * @param name - Theme name
 * @param colors - Color palette object
 * @returns Theme configuration with generated variables
 * 
 * @example
 * ```typescript
 * const theme = generateThemeFromPalette('my-brand', {
 *   primary: '#ff7900',
 *   background: '#ffffff',
 *   foreground: '#000000'
 * });
 * ```
 */
export function generateThemeFromPalette(
  name: string,
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    border?: string;
  }
): OSICardsThemeConfig {
  const variables: Record<string, string> = {};

  if (colors.primary) {
    variables['--color-brand'] = colors.primary;
    variables['--primary'] = colors.primary;
    variables['--accent'] = colors.primary;
  }

  if (colors.background) {
    variables['--background'] = colors.background;
  }

  if (colors.foreground) {
    variables['--foreground'] = colors.foreground;
    variables['--card-foreground'] = colors.foreground;
  }

  if (colors.muted) {
    variables['--muted'] = colors.muted;
  }

  if (colors.border) {
    variables['--border'] = colors.border;
  }

  if (colors.secondary) {
    variables['--secondary'] = colors.secondary;
  }

  return {
    name,
    preset: false,
    variables
  };
}

