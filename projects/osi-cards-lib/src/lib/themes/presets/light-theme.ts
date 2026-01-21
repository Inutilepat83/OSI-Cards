import { OSICardsThemeConfig } from '..';
import { OSI_COLORS, OSI_THEME_COLORS, colorMix, cssVar } from '..';

/**
 * Light theme preset configuration
 * Based on the day theme from the design system
 *
 * Uses shared token constants for consistency with SCSS tokens.
 */
export const lightTheme: OSICardsThemeConfig = {
  name: 'day',
  preset: true,
  variables: {
    '--background': OSI_THEME_COLORS.light.background,
    '--foreground': OSI_THEME_COLORS.light.foreground,
    '--muted': OSI_THEME_COLORS.light.muted,
    '--muted-foreground': OSI_THEME_COLORS.light.mutedForeground,
    '--card': colorMix(cssVar('--background'), 99, cssVar('--surface-contrast-color'), 1),
    '--card-foreground': OSI_THEME_COLORS.light.cardForeground,
    '--primary': OSI_COLORS.brand,
    '--primary-foreground': OSI_COLORS.white,
    '--secondary': OSI_THEME_COLORS.light.secondary,
    '--secondary-foreground': OSI_THEME_COLORS.light.secondaryForeground,
    '--border': OSI_THEME_COLORS.light.border,
    '--ring': OSI_THEME_COLORS.light.ring,
  },
};
