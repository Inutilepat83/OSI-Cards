import { OSICardsThemeConfig } from '@osi-cards/themes';
import { OSI_COLORS, OSI_THEME_COLORS, colorMix, cssVar } from '@osi-cards/themes';

/**
 * Dark theme preset configuration
 * Based on the night theme from the design system
 *
 * Uses shared token constants for consistency with SCSS tokens.
 */
export const darkTheme: OSICardsThemeConfig = {
  name: 'night',
  preset: true,
  variables: {
    '--background': OSI_THEME_COLORS.dark.background,
    '--foreground': OSI_THEME_COLORS.dark.foreground,
    '--muted': OSI_THEME_COLORS.dark.muted,
    '--muted-foreground': OSI_THEME_COLORS.dark.mutedForeground,
    '--card': colorMix(cssVar('--background'), 99, cssVar('--surface-contrast-color'), 1),
    '--card-foreground': OSI_THEME_COLORS.dark.cardForeground,
    '--primary': OSI_COLORS.brand,
    '--primary-foreground': OSI_THEME_COLORS.dark.foreground,
    '--secondary': OSI_THEME_COLORS.dark.secondary,
    '--secondary-foreground': OSI_THEME_COLORS.dark.secondaryForeground,
    '--border': OSI_THEME_COLORS.dark.border,
    '--ring': OSI_THEME_COLORS.dark.ring,
  },
};
