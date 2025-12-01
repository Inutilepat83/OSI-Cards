import { OSICardsThemeConfig } from '../theme.service';

/**
 * Additional Theme Presets for OSI Cards
 *
 * A collection of beautiful, opinionated theme presets for different use cases.
 */

// ============================================
// CORPORATE THEMES
// ============================================

/**
 * Corporate Blue Theme
 * Professional look for business applications
 */
export const corporateBlueTheme: OSICardsThemeConfig = {
  name: 'corporate-blue',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#f8fafc',
    '--foreground': '#0f172a',
    '--muted': '#e2e8f0',
    '--muted-foreground': '#64748b',
    '--card': '#ffffff',
    '--card-foreground': '#1e293b',
    '--primary': '#1e40af',
    '--primary-foreground': '#ffffff',
    '--secondary': '#e0e7ff',
    '--secondary-foreground': '#3730a3',
    '--border': '#cbd5e1',
    '--ring': 'rgba(30, 64, 175, 0.3)',
    '--osi-card-accent': '#1e40af',
    '--osi-card-accent-rgb': '30, 64, 175',
    '--section-card-border-radius': '8px',
    '--osi-card-shadow': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  },
};

/**
 * Corporate Dark Theme
 * Sophisticated dark mode for enterprise apps
 */
export const corporateDarkTheme: OSICardsThemeConfig = {
  name: 'corporate-dark',
  preset: true,
  colorScheme: 'dark',
  variables: {
    '--background': '#0f172a',
    '--foreground': '#f1f5f9',
    '--muted': '#1e293b',
    '--muted-foreground': '#94a3b8',
    '--card': '#1e293b',
    '--card-foreground': '#f8fafc',
    '--primary': '#3b82f6',
    '--primary-foreground': '#ffffff',
    '--secondary': '#334155',
    '--secondary-foreground': '#e2e8f0',
    '--border': '#334155',
    '--ring': 'rgba(59, 130, 246, 0.4)',
    '--osi-card-accent': '#3b82f6',
    '--osi-card-accent-rgb': '59, 130, 246',
    '--section-card-border-radius': '8px',
    '--osi-card-shadow': '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
};

// ============================================
// CREATIVE THEMES
// ============================================

/**
 * Sunset Gradient Theme
 * Warm, vibrant colors inspired by sunset
 */
export const sunsetTheme: OSICardsThemeConfig = {
  name: 'sunset',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#fef7f0',
    '--foreground': '#44403c',
    '--muted': '#fef3c7',
    '--muted-foreground': '#78716c',
    '--card': '#ffffff',
    '--card-foreground': '#292524',
    '--primary': '#ea580c',
    '--primary-foreground': '#ffffff',
    '--secondary': '#fed7aa',
    '--secondary-foreground': '#9a3412',
    '--border': '#fdba74',
    '--ring': 'rgba(234, 88, 12, 0.3)',
    '--osi-card-accent': '#ea580c',
    '--osi-card-accent-rgb': '234, 88, 12',
    '--section-card-border-radius': '12px',
    '--osi-card-shadow': '0 4px 15px rgba(234, 88, 12, 0.15)',
  },
};

/**
 * Ocean Breeze Theme
 * Cool, calming blues and teals
 */
export const oceanTheme: OSICardsThemeConfig = {
  name: 'ocean',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#f0fdfa',
    '--foreground': '#134e4a',
    '--muted': '#ccfbf1',
    '--muted-foreground': '#5eead4',
    '--card': '#ffffff',
    '--card-foreground': '#0f766e',
    '--primary': '#0d9488',
    '--primary-foreground': '#ffffff',
    '--secondary': '#99f6e4',
    '--secondary-foreground': '#115e59',
    '--border': '#5eead4',
    '--ring': 'rgba(13, 148, 136, 0.3)',
    '--osi-card-accent': '#0d9488',
    '--osi-card-accent-rgb': '13, 148, 136',
    '--section-card-border-radius': '16px',
    '--osi-card-shadow': '0 4px 20px rgba(13, 148, 136, 0.12)',
  },
};

/**
 * Forest Theme
 * Natural greens inspired by nature
 */
export const forestTheme: OSICardsThemeConfig = {
  name: 'forest',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#f0fdf4',
    '--foreground': '#14532d',
    '--muted': '#dcfce7',
    '--muted-foreground': '#4ade80',
    '--card': '#ffffff',
    '--card-foreground': '#166534',
    '--primary': '#16a34a',
    '--primary-foreground': '#ffffff',
    '--secondary': '#bbf7d0',
    '--secondary-foreground': '#15803d',
    '--border': '#86efac',
    '--ring': 'rgba(22, 163, 74, 0.3)',
    '--osi-card-accent': '#16a34a',
    '--osi-card-accent-rgb': '22, 163, 74',
    '--section-card-border-radius': '10px',
    '--osi-card-shadow': '0 2px 10px rgba(22, 163, 74, 0.1)',
  },
};

// ============================================
// MODERN THEMES
// ============================================

/**
 * Minimal Theme
 * Clean, distraction-free design
 */
export const minimalTheme: OSICardsThemeConfig = {
  name: 'minimal',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#ffffff',
    '--foreground': '#171717',
    '--muted': '#fafafa',
    '--muted-foreground': '#737373',
    '--card': '#ffffff',
    '--card-foreground': '#171717',
    '--primary': '#171717',
    '--primary-foreground': '#ffffff',
    '--secondary': '#f5f5f5',
    '--secondary-foreground': '#262626',
    '--border': '#e5e5e5',
    '--ring': 'rgba(23, 23, 23, 0.2)',
    '--osi-card-accent': '#171717',
    '--osi-card-accent-rgb': '23, 23, 23',
    '--section-card-border-radius': '4px',
    '--osi-card-shadow': '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
};

/**
 * Neon Dark Theme
 * Cyberpunk-inspired dark theme with vibrant accents
 */
export const neonDarkTheme: OSICardsThemeConfig = {
  name: 'neon-dark',
  preset: true,
  colorScheme: 'dark',
  variables: {
    '--background': '#09090b',
    '--foreground': '#fafafa',
    '--muted': '#18181b',
    '--muted-foreground': '#a1a1aa',
    '--card': '#18181b',
    '--card-foreground': '#fafafa',
    '--primary': '#a855f7',
    '--primary-foreground': '#ffffff',
    '--secondary': '#27272a',
    '--secondary-foreground': '#e4e4e7',
    '--border': '#3f3f46',
    '--ring': 'rgba(168, 85, 247, 0.5)',
    '--osi-card-accent': '#a855f7',
    '--osi-card-accent-rgb': '168, 85, 247',
    '--section-card-border-radius': '12px',
    '--osi-card-shadow': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
  },
};

/**
 * Rose Gold Theme
 * Elegant pink and gold tones
 */
export const roseGoldTheme: OSICardsThemeConfig = {
  name: 'rose-gold',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': '#fff1f2',
    '--foreground': '#4c0519',
    '--muted': '#fecdd3',
    '--muted-foreground': '#be123c',
    '--card': '#ffffff',
    '--card-foreground': '#881337',
    '--primary': '#e11d48',
    '--primary-foreground': '#ffffff',
    '--secondary': '#fda4af',
    '--secondary-foreground': '#9f1239',
    '--border': '#fda4af',
    '--ring': 'rgba(225, 29, 72, 0.3)',
    '--osi-card-accent': '#e11d48',
    '--osi-card-accent-rgb': '225, 29, 72',
    '--section-card-border-radius': '16px',
    '--osi-card-shadow': '0 4px 15px rgba(225, 29, 72, 0.12)',
  },
};

/**
 * Midnight Theme
 * Deep dark theme for night owls
 */
export const midnightTheme: OSICardsThemeConfig = {
  name: 'midnight',
  preset: true,
  colorScheme: 'dark',
  variables: {
    '--background': '#020617',
    '--foreground': '#f8fafc',
    '--muted': '#0f172a',
    '--muted-foreground': '#64748b',
    '--card': '#0f172a',
    '--card-foreground': '#e2e8f0',
    '--primary': '#6366f1',
    '--primary-foreground': '#ffffff',
    '--secondary': '#1e293b',
    '--secondary-foreground': '#cbd5e1',
    '--border': '#1e293b',
    '--ring': 'rgba(99, 102, 241, 0.4)',
    '--osi-card-accent': '#6366f1',
    '--osi-card-accent-rgb': '99, 102, 241',
    '--section-card-border-radius': '10px',
    '--osi-card-shadow': '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
};

/**
 * Glassmorphism Theme
 * Modern frosted glass effect
 */
export const glassmorphismTheme: OSICardsThemeConfig = {
  name: 'glassmorphism',
  preset: true,
  colorScheme: 'light',
  variables: {
    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--foreground': '#1a1a2e',
    '--muted': 'rgba(255, 255, 255, 0.1)',
    '--muted-foreground': 'rgba(26, 26, 46, 0.7)',
    '--card': 'rgba(255, 255, 255, 0.25)',
    '--card-foreground': '#1a1a2e',
    '--primary': '#667eea',
    '--primary-foreground': '#ffffff',
    '--secondary': 'rgba(255, 255, 255, 0.3)',
    '--secondary-foreground': '#1a1a2e',
    '--border': 'rgba(255, 255, 255, 0.3)',
    '--ring': 'rgba(102, 126, 234, 0.4)',
    '--osi-card-accent': '#667eea',
    '--osi-card-accent-rgb': '102, 126, 234',
    '--section-card-border-radius': '20px',
    '--osi-card-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
    '--osi-card-backdrop-filter': 'blur(10px)',
  },
};

// ============================================
// EXPORTS
// ============================================

/**
 * All additional theme presets
 */
export const ADDITIONAL_THEMES = {
  'corporate-blue': corporateBlueTheme,
  'corporate-dark': corporateDarkTheme,
  'sunset': sunsetTheme,
  'ocean': oceanTheme,
  'forest': forestTheme,
  'minimal': minimalTheme,
  'neon-dark': neonDarkTheme,
  'rose-gold': roseGoldTheme,
  'midnight': midnightTheme,
  'glassmorphism': glassmorphismTheme,
} as const;

/**
 * Array of all additional theme configs
 */
export const ADDITIONAL_THEME_LIST: OSICardsThemeConfig[] = Object.values(ADDITIONAL_THEMES);

/**
 * Theme names for type safety
 */
export type AdditionalThemeName = keyof typeof ADDITIONAL_THEMES;

