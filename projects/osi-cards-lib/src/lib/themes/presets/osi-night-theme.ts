import { OSICardsThemeConfig } from '../theme.service';
import { OSI_COLORS } from '../tokens.constants';

/**
 * OSI Deployment Night Theme (Dark Mode)
 * 
 * This theme replicates the styling from the Orange Sales Assistance application
 * in dark mode. It includes both OSI Cards core variables and app-specific
 * variables for full integration compatibility.
 */
export const osiNightTheme: OSICardsThemeConfig = {
  name: 'osi-night',
  preset: true,
  variables: {
    // === OSI Cards Core Variables ===
    '--background': '#1a1a1a',
    '--foreground': '#ffffff',
    '--muted': '#242424',
    '--muted-foreground': 'rgba(200, 200, 200, 0.6)',
    '--card': '#27272B',
    '--card-foreground': '#ffffff',
    '--primary': OSI_COLORS.brand,
    '--primary-foreground': '#ffffff',
    '--secondary': '#333333',
    '--secondary-foreground': '#ffffff',
    '--border': 'rgba(200, 200, 200, 0.3)',
    '--ring': 'rgba(255, 121, 0, 0.6)',
    '--color-brand': OSI_COLORS.brand,
    '--section-card-border-radius': '10px',

    // === Orange Sales Assistance App Variables ===
    '--text-color': 'white',
    '--bkg-color': '#1B1B1D',
    '--btn-txt-color': 'white',
    '--btn-bg-color': '#27272B',
    
    // Chat-related variables
    '--chat-border-color': '#27272B',
    '--chat-content-bg-color': '#27272B',
    '--chat-content-sources-bg-color': '#1B1B1D',
    
    // Treeview
    '--ngx-treeview-maxwidth': '230px',
    
    // Content button (uses Bootstrap warning variable reference in original)
    '--content-btn-border': OSI_COLORS.brand,
    
    // History panel
    '--history-border-color': '#343541',
    '--history-tab-active-bg-color': '#232323',
    '--history-tab-active-color': '#FFFFFF',
    '--history-tab-active-border-color': '#343541',
    
    // Star/favorite
    '--star-bg-color': '#343541',
    '--star-hover': '#E9E9E9',
    
    // Bootstrap body overrides for dark theme
    '--bs-body-bg': '#27272B',
    '--bs-emphasis-color': 'white',
    '--bs-body-color': 'white',
  },
};

