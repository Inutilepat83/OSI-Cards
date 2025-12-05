/**
 * Section Design Parameters - Complete Working Example
 *
 * This file demonstrates all the ways to use the design parameters system
 * to customize section appearance without modifying component code.
 */

import { CardSection } from '../projects/osi-cards-lib/src/lib/models';
import {
  createSectionDesign,
  createColorScheme,
  mergeDesignParams,
  getPresetParams,
  createDesignWithOverrides,
} from '../projects/osi-cards-lib/src/lib/utils';

// ============================================================================
// Example 1: Basic Color Customization
// ============================================================================

export const basicColorExample: CardSection = {
  title: 'User Profile',
  type: 'info',
  fields: [
    { label: 'Name', value: 'Alice Johnson' },
    { label: 'Email', value: 'alice@example.com' },
    { label: 'Role', value: 'Administrator' },
    { label: 'Status', value: 'Active' },
  ],
  meta: {
    design: {
      // Customize colors
      accentColor: '#00d9ff',
      itemBackground: 'rgba(0, 217, 255, 0.05)',
      itemBorderColor: 'rgba(0, 217, 255, 0.2)',
      itemBackgroundHover: 'rgba(0, 217, 255, 0.1)',
      labelColor: '#00d9ff',

      // Customize spacing
      itemPadding: '14px 18px',
      itemGap: '10px',

      // Customize shape
      borderRadius: '10px',
    }
  }
};

// ============================================================================
// Example 2: Using a Preset
// ============================================================================

export const presetExample: CardSection = {
  title: 'Analytics Dashboard',
  type: 'analytics',
  fields: [
    { label: 'Revenue', value: '$125K', percentage: 85, trend: 'up', change: 12.5 },
    { label: 'Users', value: '12.5K', percentage: 70, trend: 'up', change: 8.3 },
    { label: 'Conversion', value: '3.2%', percentage: 45, trend: 'down', change: -2.1 },
  ],
  meta: {
    design: {
      preset: 'glass' // Modern glassmorphism effect
    }
  }
};

// ============================================================================
// Example 3: Preset with Custom Overrides
// ============================================================================

export const presetWithOverridesExample: CardSection = {
  title: 'Sales Metrics',
  type: 'analytics',
  fields: [
    { label: 'Q1 Sales', value: '$450K', percentage: 90, trend: 'up' },
    { label: 'Q2 Target', value: '$500K', percentage: 75, trend: 'stable' },
  ],
  meta: {
    design: createDesignWithOverrides('spacious', {
      accentColor: '#ff7900',
      itemBorderColor: 'rgba(255, 121, 0, 0.2)',
      successColor: '#22c55e',
    })
  }
};

// ============================================================================
// Example 4: Type-Safe Design Creation
// ============================================================================

export const typeSafeExample: CardSection = {
  title: 'Project Overview',
  type: 'overview',
  description: 'A comprehensive design system for modern web applications',
  fields: [
    { label: 'Project', value: 'OSI Cards' },
    { label: 'Version', value: '2.0.0' },
  ],
  meta: {
    design: createSectionDesign({
      colors: {
        accentColor: '#ff7900',
        itemBackground: '#1a1a2e',
        labelColor: '#ff9d45',
        valueColor: '#ffffff',
      },
      spacing: {
        itemPadding: '16px 20px',
        itemGap: '12px',
        elementGap: '6px',
      },
      borders: {
        borderRadius: '12px',
        itemBorderWidth: '1px',
        itemBorderStyle: 'solid',
      },
      shadows: {
        itemBoxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        itemBoxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.2)',
      },
      animations: {
        animationDuration: '250ms',
        animationEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        staggerDelay: 50,
      }
    })
  }
};

// ============================================================================
// Example 5: Color Scheme Generation
// ============================================================================

export const colorSchemeExample: CardSection = {
  title: 'Team Members',
  type: 'network-card',
  items: [
    { title: 'John Doe', subtitle: 'Developer', badge: 'Active' },
    { title: 'Jane Smith', subtitle: 'Designer', badge: 'Active' },
  ],
  meta: {
    design: createColorScheme('#3b82f6', {
      generateHover: true,
      generateBorder: true,
      hoverLighten: 15,
      borderAlpha: 0.25,
    })
  }
};

// ============================================================================
// Example 6: Merged Design Parameters
// ============================================================================

const baseDesign = getPresetParams('spacious');
const brandColors = {
  accentColor: '#ff7900',
  itemBorderColor: 'rgba(255, 121, 0, 0.2)',
};
const customTweaks = {
  borderRadius: '16px',
  itemBoxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

export const mergedDesignExample: CardSection = {
  title: 'Financial Summary',
  type: 'financials',
  fields: [
    { label: 'Revenue', value: '$1,234,567' },
    { label: 'Expenses', value: '$890,123' },
    { label: 'Net Profit', value: '$344,444' },
  ],
  meta: {
    design: mergeDesignParams(baseDesign, brandColors, customTweaks)
  }
};

// ============================================================================
// Example 7: Theme-Based Sections
// ============================================================================

const themes = {
  ocean: {
    accentColor: '#00d9ff',
    itemBackground: 'rgba(0, 217, 255, 0.05)',
    itemBorderColor: 'rgba(0, 217, 255, 0.2)',
    successColor: '#00ffaa',
    warningColor: '#ffd700',
    errorColor: '#ff3366',
  },
  sunset: {
    accentColor: '#ff7900',
    itemBackground: 'rgba(255, 121, 0, 0.05)',
    itemBorderColor: 'rgba(255, 121, 0, 0.2)',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
  },
  forest: {
    accentColor: '#22c55e',
    itemBackground: 'rgba(34, 197, 94, 0.05)',
    itemBorderColor: 'rgba(34, 197, 94, 0.2)',
    successColor: '#10b981',
    warningColor: '#84cc16',
    errorColor: '#dc2626',
  },
  midnight: {
    accentColor: '#a855f7',
    itemBackground: 'rgba(168, 85, 247, 0.05)',
    itemBorderColor: 'rgba(168, 85, 247, 0.2)',
    successColor: '#8b5cf6',
    warningColor: '#d946ef',
    errorColor: '#f43f5e',
  },
};

export function createThemedSection(
  theme: keyof typeof themes,
  title: string,
  type: string,
  fields: any[]
): CardSection {
  return {
    title,
    type: type as any,
    fields,
    meta: {
      design: themes[theme]
    }
  };
}

// Usage examples
export const oceanThemedSection = createThemedSection(
  'ocean',
  'Ocean Metrics',
  'analytics',
  [
    { label: 'Wave Height', value: '2.5m', percentage: 75 },
    { label: 'Temperature', value: '22°C', percentage: 60 },
  ]
);

export const sunsetThemedSection = createThemedSection(
  'sunset',
  'Sunset Dashboard',
  'analytics',
  [
    { label: 'Views', value: '45.2K', percentage: 85 },
    { label: 'Likes', value: '12.8K', percentage: 70 },
  ]
);

// ============================================================================
// Example 8: Compact Mobile Design
// ============================================================================

export const compactMobileExample: CardSection = {
  title: 'Quick Stats',
  type: 'analytics',
  fields: [
    { label: 'Today', value: '1.2K' },
    { label: 'Week', value: '8.5K' },
    { label: 'Month', value: '42.3K' },
  ],
  meta: {
    design: {
      preset: 'compact',
      params: {
        // Additional mobile-friendly tweaks
        itemPadding: '6px 8px',
        labelFontSize: '0.55rem',
        valueFontSize: '0.7rem',
        borderRadius: '4px',
      }
    }
  }
};

// ============================================================================
// Example 9: Bold Dashboard Section
// ============================================================================

export const boldDashboardExample: CardSection = {
  title: 'Key Performance Indicators',
  type: 'analytics',
  fields: [
    { label: 'Revenue', value: '$2.4M', percentage: 95, trend: 'up', change: 18.2 },
    { label: 'Growth', value: '+32%', percentage: 85, trend: 'up', change: 12.5 },
    { label: 'Users', value: '156K', percentage: 78, trend: 'up', change: 24.8 },
    { label: 'Satisfaction', value: '4.8/5', percentage: 96, trend: 'stable' },
  ],
  meta: {
    design: {
      preset: 'bold',
      params: {
        accentColor: '#ff7900',
        itemBorderColor: 'rgba(255, 121, 0, 0.3)',
        itemBoxShadow: '0 4px 16px rgba(255, 121, 0, 0.15)',
        itemBoxShadowHover: '0 6px 24px rgba(255, 121, 0, 0.25)',
      }
    }
  }
};

// ============================================================================
// Example 10: Custom Variables for Advanced Styling
// ============================================================================

export const customVariablesExample: CardSection = {
  title: 'Custom Styled Section',
  type: 'info',
  fields: [
    { label: 'Custom Prop 1', value: 'Value 1' },
    { label: 'Custom Prop 2', value: 'Value 2' },
  ],
  meta: {
    design: {
      accentColor: '#ff7900',
      itemPadding: '12px 16px',
      borderRadius: '10px',
      customVars: {
        // Custom CSS variables for specific use cases
        '--my-gradient-start': '#ff7900',
        '--my-gradient-end': '#ff9d45',
        '--my-special-spacing': '24px',
        '--my-icon-size': '20px',
        '--my-hover-scale': '1.02',
      }
    }
  }
};

// ============================================================================
// Example 11: Animated Section with Custom Timing
// ============================================================================

export const animatedSectionExample: CardSection = {
  title: 'Animated Metrics',
  type: 'analytics',
  fields: [
    { label: 'Metric 1', value: '100', percentage: 80 },
    { label: 'Metric 2', value: '200', percentage: 90 },
    { label: 'Metric 3', value: '300', percentage: 70 },
  ],
  meta: {
    design: {
      preset: 'glass',
      params: {
        // Custom animation timing
        animationDuration: '400ms',
        animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce effect
        staggerDelay: 80, // Slower stagger for dramatic effect
      }
    }
  }
};

// ============================================================================
// Example 12: Accessibility-Focused Design
// ============================================================================

export const accessibleDesignExample: CardSection = {
  title: 'Accessible Section',
  type: 'info',
  fields: [
    { label: 'Item 1', value: 'High contrast value' },
    { label: 'Item 2', value: 'Clear text' },
  ],
  meta: {
    design: {
      // High contrast colors for accessibility
      itemBackground: '#000000',
      labelColor: '#ffffff',
      valueColor: '#ffffff',
      itemBorderColor: '#ffffff',
      itemBorderWidth: '2px',

      // Larger text for readability
      labelFontSize: '0.875rem',
      valueFontSize: '1.125rem',

      // Clear focus indicators
      itemBoxShadowFocus: '0 0 0 4px rgba(255, 255, 255, 0.5)',

      // Reduced motion friendly
      disableAnimations: false, // But use shorter durations
      animationDuration: '150ms',
      staggerDelay: 0, // No stagger for instant feedback
    }
  }
};

// ============================================================================
// Export all examples as a collection
// ============================================================================

export const allExamples = {
  basicColor: basicColorExample,
  preset: presetExample,
  presetWithOverrides: presetWithOverridesExample,
  typeSafe: typeSafeExample,
  colorScheme: colorSchemeExample,
  mergedDesign: mergedDesignExample,
  oceanThemed: oceanThemedSection,
  sunsetThemed: sunsetThemedSection,
  compactMobile: compactMobileExample,
  boldDashboard: boldDashboardExample,
  customVariables: customVariablesExample,
  animated: animatedSectionExample,
  accessible: accessibleDesignExample,
};

// ============================================================================
// Helper: Create a card with multiple themed sections
// ============================================================================

export function createMultiThemeCard() {
  return {
    title: 'Multi-Theme Dashboard',
    sections: [
      oceanThemedSection,
      sunsetThemedSection,
      boldDashboardExample,
    ]
  };
}







