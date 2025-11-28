import { OSICardsThemeConfig } from '../theme.service';

/**
 * Dark theme preset configuration
 * Based on the night theme from the design system
 */
export const darkTheme: OSICardsThemeConfig = {
  name: 'night',
  preset: true,
  variables: {
    '--background': '#0a0a0a',
    '--foreground': '#ffffff',
    '--muted': '#242424',
    '--muted-foreground': '#aaaaaa',
    '--card': 'color-mix(in srgb, var(--background) 99%, var(--surface-contrast-color) 1%)',
    '--card-foreground': '#ffffff',
    '--primary': '#FF7900',
    '--primary-foreground': '#ffffff',
    '--secondary': '#333333',
    '--secondary-foreground': '#ffffff',
    '--border': 'rgba(200, 200, 200, 0.3)',
    '--ring': 'rgba(255, 121, 0, 0.6)'
  }
};


