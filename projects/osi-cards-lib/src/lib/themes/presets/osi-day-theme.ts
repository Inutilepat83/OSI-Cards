import { OSICardsThemeConfig } from '../theme.service';
import { OSI_COLORS } from '../tokens.constants';

/**
 * OSI Deployment Day Theme (Light Mode)
 * 
 * This theme replicates the styling from the Orange Sales Assistance application
 * in light mode. It includes both OSI Cards core variables and app-specific
 * variables for full integration compatibility.
 */
export const osiDayTheme: OSICardsThemeConfig = {
  name: 'osi-day',
  preset: true,
  variables: {
    // === OSI Cards Core Variables ===
    '--background': '#ffffff',
    '--foreground': '#1c1c1f',
    '--muted': '#f4f4f6',
    '--muted-foreground': 'rgba(85, 88, 97, 0.6)',
    '--card': '#ffffff',
    '--card-foreground': '#1c1c1f',
    '--primary': OSI_COLORS.brand,
    '--primary-foreground': OSI_COLORS.white,
    '--secondary': '#f5f5f5',
    '--secondary-foreground': '#1a1a1a',
    '--border': 'rgba(200, 200, 200, 0.5)',
    '--ring': 'rgba(255, 121, 0, 0.4)',
    '--color-brand': OSI_COLORS.brand,
    '--section-card-border-radius': '10px',

    // === Orange Sales Assistance App Variables ===
    '--text-color': 'black',
    '--bkg-color': '#F7F7F7',
    '--btn-txt-color': 'black',
    '--btn-bg-color': '#FFFFFF',
    
    // Chat-related variables
    '--chat-border-color': '#ECECEC',
    '--chat-content-bg-color': '#FFFFFF',
    '--chat-content-sources-bg-color': '#F7F7F7',
    
    // Treeview
    '--ngx-treeview-maxwidth': '230px',
    
    // Content button
    '--content-btn-border': 'black',
    
    // History panel
    '--history-border-color': '#ECECEC',
    '--history-tab-active-bg-color': '#ffffff',
    '--history-tab-active-color': '#000000',
    '--history-tab-active-border-color': '#000000',
    
    // Star/favorite
    '--star-bg-color': '#E9E9E9',
    '--star-hover': '#5A5F62',
  },
};







