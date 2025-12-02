/**
 * Design Tokens Constants
 *
 * TypeScript constants that mirror the SCSS master tokens.
 * Use these for runtime theming and TypeScript-based customization.
 *
 * Source of truth: styles/tokens/_master.scss
 */

// ============================================
// PRIMITIVE TOKENS
// ============================================

export const OSI_COLORS = {
  // Brand
  brand: '#ff7900',
  brandDark: '#cc5f00',
  brandLight: '#ff9933',
  brandPale: '#ffe6cc',

  // Neutrals
  white: '#ffffff',
  black: '#000000',

  // Grayscale
  gray50: '#ffffff',
  gray100: '#fcfcfc',
  gray150: '#f7f7f7',
  gray200: '#f0f0f1',
  gray300: '#e9e9e9',
  gray400: '#92999e',
  gray500: '#5a5f62',
  gray600: '#343541',
  gray700: '#2a2a2a',
  gray800: '#232323',
  gray850: '#171717',
  gray900: '#000000',

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  neutral: '#6b7280',
} as const;

// ============================================
// THEME-SPECIFIC COLORS
// ============================================

export const OSI_THEME_COLORS = {
  // Light Theme
  light: {
    background: '#ffffff',
    foreground: '#1c1c1f',
    muted: '#f4f4f6',
    mutedForeground: '#555861',
    cardForeground: '#1c1c1f',
    popover: '#ffffff',
    popoverForeground: '#1a1a1a',
    secondary: '#f5f5f5',
    secondaryForeground: '#1a1a1a',
    border: 'rgba(200, 200, 200, 0.5)',
    inputBackground: '#f9f9f9',
    switchBackground: '#e5e5e5',
    ring: 'rgba(255, 121, 0, 0.4)',
  },

  // Dark Theme
  dark: {
    background: '#0a0a0a',
    backgroundScoped: '#030303',
    foreground: '#ffffff',
    muted: '#242424',
    mutedForeground: '#aaaaaa',
    cardForeground: '#ffffff',
    popover: '#111111',
    popoverForeground: '#ffffff',
    secondary: '#333333',
    secondaryForeground: '#ffffff',
    border: 'rgba(200, 200, 200, 0.3)',
    inputBackground: '#222222',
    switchBackground: '#333333',
    ring: 'rgba(255, 121, 0, 0.6)',
  },
} as const;

// ============================================
// SHARED CSS VARIABLE NAMES
// ============================================

export const CSS_VAR_NAMES = {
  // Core
  background: '--background',
  foreground: '--foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  border: '--border',
  ring: '--ring',

  // Brand
  colorBrand: '--color-brand',
  colorBrandDark: '--color-brand-dark',
  colorBrandLight: '--color-brand-light',

  // Status
  statusSuccess: '--status-success',
  statusWarning: '--status-warning',
  statusError: '--status-error',
  statusInfo: '--status-info',

  // Card
  cardPadding: '--card-padding',
  cardGap: '--card-gap',
  cardBorderRadius: '--card-border-radius',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate CSS variable reference
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`;
}

/**
 * Generate color-mix expression for surface calculations
 */
export function colorMix(
  color1: string,
  percent1: number,
  color2: string,
  percent2?: number
): string {
  const p2 = percent2 ?? 100 - percent1;
  return `color-mix(in srgb, ${color1} ${percent1}%, ${color2} ${p2}%)`;
}

/**
 * Generate RGBA color from hex and opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}









