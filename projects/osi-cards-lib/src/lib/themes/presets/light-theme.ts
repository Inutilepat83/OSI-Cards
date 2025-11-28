import { OSICardsThemeConfig } from '../theme.service';

/**
 * Light theme preset configuration
 * Based on the day theme from the design system
 */
export const lightTheme: OSICardsThemeConfig = {
  name: 'day',
  preset: true,
  variables: {
    '--background': '#ffffff',
    '--foreground': '#1c1c1f',
    '--muted': '#f4f4f6',
    '--muted-foreground': '#555861',
    '--card': 'color-mix(in srgb, var(--background) 99%, var(--surface-contrast-color) 1%)',
    '--card-foreground': '#1c1c1f',
    '--primary': '#FF7900',
    '--primary-foreground': '#ffffff',
    '--secondary': '#f5f5f5',
    '--secondary-foreground': '#1a1a1a',
    '--border': 'rgba(200, 200, 200, 0.5)',
    '--ring': 'rgba(255, 121, 0, 0.4)'
  }
};


