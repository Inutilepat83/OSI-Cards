import { OSICardsThemeConfig } from '../theme.service';

/**
 * High contrast theme preset for accessibility
 * Provides maximum contrast for better visibility
 */
export const highContrastTheme: OSICardsThemeConfig = {
  name: 'high-contrast',
  preset: true,
  variables: {
    '--background': '#ffffff',
    '--foreground': '#000000',
    '--muted': '#f0f0f0',
    '--muted-foreground': '#000000',
    '--card': '#ffffff',
    '--card-foreground': '#000000',
    '--primary': '#0066cc',
    '--primary-foreground': '#ffffff',
    '--secondary': '#e0e0e0',
    '--secondary-foreground': '#000000',
    '--border': '#000000',
    '--ring': '#0066cc',
    '--card-border': '2px solid #000000',
    '--section-border': '2px solid #000000',
    '--section-item-border': '2px solid #000000'
  }
};

