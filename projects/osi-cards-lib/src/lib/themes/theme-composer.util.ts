import { OSICardsThemeConfig } from './theme.service';

// ============================================
// Color Utilities
// ============================================

/**
 * Color palette for generating themes
 */
export interface ColorPalette {
  /** Primary/accent color */
  primary: string;
  /** Secondary color */
  secondary?: string;
  /** Background color */
  background?: string;
  /** Foreground/text color */
  foreground?: string;
  /** Muted/subtle color */
  muted?: string;
  /** Border color */
  border?: string;
  /** Success state color */
  success?: string;
  /** Warning state color */
  warning?: string;
  /** Error/destructive color */
  error?: string;
  /** Info color */
  info?: string;
}

/**
 * Color scale with light to dark variants
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// ============================================
// Theme Composition Functions
// ============================================

/**
 * Extend a base theme with overrides
 * 
 * @param base Base theme configuration
 * @param overrides CSS variable overrides
 * @param name Optional new theme name (defaults to base-extended)
 * @returns New theme configuration with overrides applied
 * 
 * @example
 * ```typescript
 * const customDark = extendTheme(darkTheme, {
 *   '--osi-card-accent': '#ff6b6b',
 *   '--osi-card-background': '#1a1a2e'
 * }, 'custom-dark');
 * ```
 */
export function extendTheme(
  base: OSICardsThemeConfig,
  overrides: Record<string, string>,
  name?: string
): OSICardsThemeConfig {
  return {
    name: name || `${base.name}-extended`,
    preset: false,
    extends: base.name,
    colorScheme: base.colorScheme,
    variables: {
      ...base.variables,
      ...overrides
    }
  };
}

/**
 * Merge multiple theme configurations
 * Later themes override earlier ones
 * 
 * @param themes Array of theme configurations to merge
 * @param name Name for the merged theme
 * @returns Merged theme configuration
 * 
 * @example
 * ```typescript
 * const merged = mergeThemes(
 *   [baseTheme, brandOverrides, seasonalOverrides],
 *   'merged-theme'
 * );
 * ```
 */
export function mergeThemes(
  themes: OSICardsThemeConfig[],
  name: string
): OSICardsThemeConfig {
  if (themes.length === 0) {
    throw new Error('At least one theme is required for merging');
  }

  const mergedVariables = themes.reduce(
    (acc, theme) => ({ ...acc, ...theme.variables }),
    {} as Record<string, string>
  );

  // Use the last theme's color scheme, or infer from merged variables
  const lastTheme = themes[themes.length - 1];

  return {
    name,
    preset: false,
    colorScheme: lastTheme.colorScheme,
    variables: mergedVariables
  };
}

/**
 * Create a complete theme from a color palette
 * 
 * @param palette Color palette to use
 * @param name Theme name
 * @param isDark Whether this is a dark theme
 * @returns Complete theme configuration
 * 
 * @example
 * ```typescript
 * const brandTheme = createThemeFromColors({
 *   primary: '#6366f1',
 *   background: '#ffffff',
 *   foreground: '#1a1a1a'
 * }, 'brand-light', false);
 * ```
 */
export function createThemeFromColors(
  palette: ColorPalette,
  name: string,
  isDark = false
): OSICardsThemeConfig {
  const {
    primary,
    secondary = adjustLightness(primary, isDark ? 20 : -20),
    background = isDark ? '#0f172a' : '#ffffff',
    foreground = isDark ? '#f1f5f9' : '#1a1a2e',
    muted = isDark ? '#94a3b8' : '#64748b',
    border = isDark ? '#334155' : '#e2e8f0',
    success = '#10b981',
    warning = '#f59e0b',
    error = '#ef4444',
    info = '#3b82f6'
  } = palette;

  const accentForeground = getContrastColor(primary);
  const primaryRgb = hexToRgb(primary);

  return {
    name,
    preset: false,
    colorScheme: isDark ? 'dark' : 'light',
    variables: {
      // Core colors
      '--osi-card-background': background,
      '--osi-card-foreground': foreground,
      '--osi-card-muted': muted,
      '--osi-card-muted-foreground': adjustLightness(muted, isDark ? 30 : -30),
      
      // Accent
      '--osi-card-accent': primary,
      '--osi-card-accent-rgb': primaryRgb,
      '--osi-card-accent-foreground': accentForeground,
      '--osi-card-accent-hover': adjustLightness(primary, isDark ? 10 : -10),
      
      // Secondary
      '--osi-card-secondary': secondary,
      '--osi-card-secondary-foreground': getContrastColor(secondary),
      
      // Borders
      '--osi-card-border': border,
      '--osi-card-border-hover': adjustLightness(border, isDark ? 10 : -10),
      '--osi-card-ring': `rgba(${primaryRgb}, 0.3)`,
      
      // Surfaces
      '--osi-card-surface': adjustLightness(background, isDark ? 5 : -3),
      '--osi-card-surface-hover': adjustLightness(background, isDark ? 10 : -5),
      '--osi-card-surface-active': adjustLightness(background, isDark ? 15 : -8),
      
      // Status colors
      '--osi-card-success': success,
      '--osi-card-success-bg': `rgba(${hexToRgb(success)}, 0.1)`,
      '--osi-card-warning': warning,
      '--osi-card-warning-bg': `rgba(${hexToRgb(warning)}, 0.1)`,
      '--osi-card-destructive': error,
      '--osi-card-destructive-bg': `rgba(${hexToRgb(error)}, 0.1)`,
      '--osi-card-info': info,
      '--osi-card-info-bg': `rgba(${hexToRgb(info)}, 0.1)`,
      
      // Shadows
      '--osi-card-shadow': isDark 
        ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
        : '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
      '--osi-card-shadow-md': isDark
        ? '0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15)'
        : '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04)',
      '--osi-card-shadow-lg': isDark
        ? '0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.15)'
        : '0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.03)',
      '--osi-card-shadow-glow': `0 0 20px rgba(${primaryRgb}, ${isDark ? 0.2 : 0.15})`
    }
  };
}

/**
 * Generate a color scale from a base color
 * 
 * @param baseColor Base color in hex format
 * @returns Color scale object with 50-950 variants
 * 
 * @example
 * ```typescript
 * const blueScale = deriveColorScale('#3b82f6');
 * // blueScale.500 === '#3b82f6'
 * // blueScale.100 === lighter variant
 * // blueScale.900 === darker variant
 * ```
 */
export function deriveColorScale(baseColor: string): ColorScale {
  return {
    50: adjustLightness(baseColor, 45),
    100: adjustLightness(baseColor, 40),
    200: adjustLightness(baseColor, 30),
    300: adjustLightness(baseColor, 20),
    400: adjustLightness(baseColor, 10),
    500: baseColor,
    600: adjustLightness(baseColor, -10),
    700: adjustLightness(baseColor, -20),
    800: adjustLightness(baseColor, -30),
    900: adjustLightness(baseColor, -40),
    950: adjustLightness(baseColor, -45)
  };
}

/**
 * Create a theme using a color scale
 * 
 * @param scale Color scale to use as primary
 * @param name Theme name
 * @param isDark Whether this is a dark theme
 * @returns Theme configuration
 */
export function createThemeFromScale(
  scale: ColorScale,
  name: string,
  isDark = false
): OSICardsThemeConfig {
  return createThemeFromColors(
    {
      primary: scale[500],
      secondary: scale[isDark ? 400 : 600],
      background: isDark ? scale[950] : '#ffffff',
      foreground: isDark ? scale[50] : scale[900],
      muted: scale[isDark ? 400 : 500],
      border: scale[isDark ? 700 : 200]
    },
    name,
    isDark
  );
}

/**
 * Create light and dark variants of a theme from a palette
 * 
 * @param palette Color palette
 * @param baseName Base name for the themes
 * @returns Object with light and dark theme configs
 */
export function createThemePair(
  palette: ColorPalette,
  baseName: string
): { light: OSICardsThemeConfig; dark: OSICardsThemeConfig } {
  return {
    light: createThemeFromColors(palette, `${baseName}-light`, false),
    dark: createThemeFromColors(palette, `${baseName}-dark`, true)
  };
}

/**
 * Pick specific variables from a theme
 * 
 * @param theme Theme configuration
 * @param keys Variable names to pick
 * @returns New theme with only specified variables
 */
export function pickThemeVariables(
  theme: OSICardsThemeConfig,
  keys: string[]
): OSICardsThemeConfig {
  const picked: Record<string, string> = {};
  
  keys.forEach(key => {
    const varKey = key.startsWith('--') ? key : `--${key}`;
    if (theme.variables[varKey]) {
      picked[varKey] = theme.variables[varKey];
    } else if (theme.variables[key]) {
      picked[key] = theme.variables[key];
    }
  });

  return {
    ...theme,
    name: `${theme.name}-partial`,
    variables: picked
  };
}

/**
 * Omit specific variables from a theme
 * 
 * @param theme Theme configuration
 * @param keys Variable names to omit
 * @returns New theme without specified variables
 */
export function omitThemeVariables(
  theme: OSICardsThemeConfig,
  keys: string[]
): OSICardsThemeConfig {
  const normalizedKeys = keys.map(k => k.startsWith('--') ? k : `--${k}`);
  const filtered: Record<string, string> = {};

  Object.entries(theme.variables).forEach(([key, value]) => {
    if (!normalizedKeys.includes(key)) {
      filtered[key] = value;
    }
  });

  return {
    ...theme,
    name: `${theme.name}-filtered`,
    variables: filtered
  };
}

// ============================================
// Color Utility Functions
// ============================================

/**
 * Convert hex color to RGB string
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return '0, 0, 0';
  }
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * Convert RGB values to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Adjust the lightness of a color
 * 
 * @param hex Hex color
 * @param amount Amount to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
export function adjustLightness(hex: string, amount: number): string {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Get a contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Mix two colors
 */
export function mixColors(color1: string, color2: string, weight = 0.5): string {
  const rgb1 = hexToRgbValues(color1);
  const rgb2 = hexToRgbValues(color2);
  
  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r * weight + rgb2.r * (1 - weight));
  const g = Math.round(rgb1.g * weight + rgb2.g * (1 - weight));
  const b = Math.round(rgb1.b * weight + rgb2.b * (1 - weight));

  return rgbToHex(r, g, b);
}

/**
 * Generate an alpha variant of a color
 */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb}, ${alpha})`;
}

// ============================================
// Internal Helper Functions
// ============================================

function hexToRgbValues(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: r * 255, g: g * 255, b: b * 255 };
}

