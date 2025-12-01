# OSI Cards Presets & Themes

This document covers the preset system and comprehensive theming capabilities of the OSI Cards library. It includes card presets for quick card generation, theme presets for consistent styling, and advanced theme composition utilities.

---

## Table of Contents

- [Card Presets](#card-presets)
  - [PresetFactory](#presetfactory)
  - [Company Card Preset](#company-card-preset)
  - [Analytics Dashboard Preset](#analytics-dashboard-preset)
  - [Contact Card Preset](#contact-card-preset)
- [Theme System](#theme-system)
  - [ThemeService](#themeservice)
  - [Theme Configuration](#theme-configuration)
  - [Built-in Theme Presets](#built-in-theme-presets)
  - [System Preference Detection](#system-preference-detection)
  - [Theme Persistence](#theme-persistence)
- [Theme Composition](#theme-composition)
  - [Theme Builder Utilities](#theme-builder-utilities)
  - [Theme Composer Utilities](#theme-composer-utilities)
  - [Color Utilities](#color-utilities)
- [Design Tokens](#design-tokens)
  - [Color Tokens](#color-tokens)
  - [Theme-Specific Colors](#theme-specific-colors)
  - [CSS Variable Names](#css-variable-names)
- [Theme Style Presets](#theme-style-presets)
  - [Default Theme Preset](#default-theme-preset)
  - [High Contrast Preset](#high-contrast-preset)

---

## Card Presets

Card presets provide factory functions for creating pre-configured card configurations. They simplify the creation of common card types.

### PresetFactory

Centralized factory class for creating card presets with common configurations.

**Location:** `projects/osi-cards-lib/src/lib/presets/preset-factory.ts`

```typescript
import { PresetFactory } from 'osi-cards-lib';

// Create a company card
const companyCard = PresetFactory.createCompany({
  name: 'Acme Corp',
  industry: 'Technology',
  employees: '500+'
});

// Create a contact card
const contactCard = PresetFactory.createContact({
  name: 'John Doe',
  email: 'john@example.com'
});

// Create an analytics dashboard
const analyticsCard = PresetFactory.createAnalytics({
  title: 'Sales Performance',
  kpis: [
    { label: 'Revenue', value: '$1.2M', percentage: 105, trend: 'up' }
  ]
});

// Create a custom card from a template
const customCard = PresetFactory.createCustom(
  (config) => ({ ...config, cardType: 'custom' }),
  { cardTitle: 'My Custom Card' }
);
```

#### Available Methods

| Method | Description |
|--------|-------------|
| `createCompany(options)` | Create a basic company profile card |
| `createEnhancedCompany(options)` | Create an enhanced company card with financials and products |
| `createContact(options)` | Create a contact information card |
| `createAnalytics(options)` | Create an analytics dashboard card |
| `createCustom(template, config)` | Create a custom card from a template function |

### Company Card Preset

Creates company profile cards with overview, metrics, and optional sections.

**Location:** `projects/osi-cards-lib/src/lib/presets/company-card.preset.ts`

```typescript
import { createCompanyCard, createEnhancedCompanyCard } from 'osi-cards-lib';

// Basic company card
const basicCard = createCompanyCard({
  name: 'Acme Corp',
  subtitle: 'Leading Innovation',
  industry: 'Technology',
  founded: '2015',
  employees: '500+',
  headquarters: 'San Francisco, CA',
  revenue: '$50M ARR',
  growthRate: 35,
  marketShare: 12,
  websiteUrl: 'https://acme.com'
});

// Enhanced company card with additional sections
const enhancedCard = createEnhancedCompanyCard({
  name: 'Acme Corp',
  industry: 'Technology',
  growthRate: 35,
  websiteUrl: 'https://acme.com',
  financials: [
    { label: 'Q1 Revenue', value: '$12.5M' },
    { label: 'EBITDA', value: '$2.3M' },
    { label: 'Operating Margin', value: '18.4%' }
  ],
  products: [
    { name: 'Enterprise Suite', description: 'Complete business solution' },
    { name: 'Cloud Platform', description: 'Scalable infrastructure' }
  ]
});
```

#### CompanyCardOptions Interface

```typescript
interface CompanyCardOptions {
  name: string;              // Company name (required)
  subtitle?: string;         // Company subtitle/description
  industry?: string;         // Industry category
  founded?: string;          // Founded year
  employees?: string;        // Number of employees
  headquarters?: string;     // Headquarters location
  revenue?: string;          // Annual revenue
  growthRate?: number;       // Growth rate percentage
  marketShare?: number;      // Market share percentage
  websiteUrl?: string;       // Company website URL
  customSections?: CardSection[];  // Additional custom sections
  customActions?: CardAction[];    // Custom action buttons
}
```

### Analytics Dashboard Preset

Creates analytics dashboard cards with KPIs and optional charts.

**Location:** `projects/osi-cards-lib/src/lib/presets/analytics-dashboard.preset.ts`

```typescript
import { createAnalyticsDashboard } from 'osi-cards-lib';

const dashboardCard = createAnalyticsDashboard({
  title: 'Sales Performance',
  subtitle: 'Q1 2024 Analysis',
  dashboardType: 'Executive Summary',
  dataSource: 'Salesforce CRM',
  updateFrequency: 'Real-time',
  timeRange: 'Last 30 days',
  kpis: [
    {
      label: 'Total Revenue',
      value: '$1.2M',
      percentage: 105,
      performance: 'excellent',
      trend: 'up'
    },
    {
      label: 'Conversion Rate',
      value: '32%',
      percentage: 32,
      performance: 'good',
      trend: 'up'
    },
    {
      label: 'Customer Acquisition Cost',
      value: '$45',
      percentage: 85,
      performance: 'fair',
      trend: 'down'
    }
  ],
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Revenue',
      data: [150000, 180000, 220000, 250000, 320000]
    }]
  },
  dashboardUrl: 'https://analytics.example.com/dashboard'
});
```

#### AnalyticsDashboardOptions Interface

```typescript
interface AnalyticsDashboardOptions {
  title: string;              // Dashboard title (required)
  subtitle?: string;          // Dashboard subtitle
  dashboardType?: string;     // Type of dashboard
  dataSource?: string;        // Data source name
  updateFrequency?: string;   // How often data updates
  timeRange?: string;         // Time range displayed
  kpis?: Array<{
    label: string;
    value: string | number;
    percentage?: number;
    performance?: 'excellent' | 'good' | 'fair' | 'poor';
    trend?: 'up' | 'down' | 'stable' | 'neutral';
  }>;
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  dashboardUrl?: string;       // Link to full dashboard
  customSections?: CardSection[];
  customActions?: CardAction[];
}
```

### Contact Card Preset

Creates contact information cards.

**Location:** `projects/osi-cards-lib/src/lib/presets/contact-card.preset.ts`

```typescript
import { createContactCard } from 'osi-cards-lib';

const contactCard = createContactCard({
  name: 'John Doe',
  title: 'Senior Engineer',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  company: 'Acme Corp'
});
```

---

## Theme System

The theme system provides comprehensive theming capabilities including system preference detection, persistence, and dynamic theme switching.

### ThemeService

The central service for managing themes at runtime.

**Location:** `projects/osi-cards-lib/src/lib/themes/theme.service.ts`

```typescript
import { ThemeService, OSI_THEME_CONFIG } from 'osi-cards-lib';

@Component({
  // ...
})
export class AppComponent {
  private themeService = inject(ThemeService);

  constructor() {
    // Follow system preference
    this.themeService.setTheme('system');

    // Switch to specific theme
    this.themeService.setTheme('dark');

    // Toggle between light and dark
    this.themeService.toggleTheme();

    // Apply custom theme
    this.themeService.applyCustomTheme({
      name: 'my-brand',
      variables: {
        '--osi-card-accent': '#ff0000',
        '--osi-card-background': '#1a1a1a'
      }
    });

    // Watch resolved theme changes
    this.themeService.resolvedTheme$.subscribe(theme => {
      console.log('Current theme:', theme);
    });
  }
}
```

#### Configuration with Dependency Injection

```typescript
import { ApplicationConfig } from '@angular/core';
import { OSI_THEME_CONFIG } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: OSI_THEME_CONFIG,
      useValue: {
        defaultTheme: 'system',
        persistKey: 'my-app-theme',
        enablePersistence: true,
        enableTransitions: true,
        transitionDuration: 200,
        followSystemPreference: true,
        updateColorSchemeMeta: true,
        customThemes: {
          'corporate': {
            name: 'corporate',
            colorScheme: 'light',
            variables: {
              '--osi-card-accent': '#0066cc',
              '--osi-card-background': '#f5f5f5'
            }
          }
        }
      }
    }
  ]
};
```

#### ThemeService API

| Method | Description |
|--------|-------------|
| `getCurrentTheme()` | Get current theme setting (may be 'system') |
| `getResolvedTheme()` | Get resolved/effective theme (never 'system') |
| `isDarkTheme()` | Check if currently using dark theme |
| `isFollowingSystem()` | Check if following system preference |
| `setTheme(theme)` | Set theme to a preset or custom theme |
| `toggleTheme()` | Toggle between light and dark themes |
| `followSystem()` | Reset to system preference |
| `applyCustomTheme(config)` | Apply a custom theme configuration |
| `registerTheme(config)` | Register a custom theme without applying |
| `unregisterTheme(name)` | Remove a registered custom theme |
| `getCustomTheme(name)` | Get a registered custom theme |
| `getCustomThemes()` | Get all registered custom themes |
| `getAvailableThemes()` | Get all available theme names |
| `applyCSSVariables(vars)` | Apply CSS variables to document root |
| `removeCSSVariables(names)` | Remove specific CSS variables |
| `getCSSVariable(name)` | Get current value of a CSS variable |
| `savePreference(key?)` | Save current theme to localStorage |
| `loadPreference(key?)` | Load theme from localStorage |
| `clearPreference(key?)` | Clear stored theme preference |
| `enableTransitions(duration?)` | Enable smooth theme transitions |
| `disableTransitions()` | Disable theme transitions |
| `validateTheme(config)` | Validate a theme configuration |
| `detectSystemPreference()` | Detect current system color scheme |
| `watchSystemPreference()` | Get observable of system preference changes |

#### Observable Properties

```typescript
// Observable of the current theme setting (may be 'system')
themeService.currentTheme$.subscribe(theme => console.log(theme));

// Observable of the resolved/effective theme (never 'system')
themeService.resolvedTheme$.subscribe(theme => console.log(theme));

// Observable of system color scheme preference
themeService.systemPreference$.subscribe(pref => console.log(pref));
```

### Theme Configuration

```typescript
interface OSICardsThemeConfig {
  name: string;                          // Theme name (required)
  variables: Record<string, string>;     // CSS variable overrides
  preset?: boolean;                      // Whether this is a built-in preset
  extends?: string;                      // Base theme to extend from
  colorScheme?: 'light' | 'dark' | 'light dark'; // Browser UI color scheme
}

interface ThemeServiceConfig {
  defaultTheme: ThemePreset | string;    // Default theme to use
  persistKey: string;                    // localStorage key
  enablePersistence: boolean;            // Whether to persist preference
  enableTransitions: boolean;            // Enable smooth transitions
  transitionDuration: number;            // Transition duration in ms
  followSystemPreference: boolean;       // Follow system when 'system'
  updateColorSchemeMeta: boolean;        // Update color-scheme meta tag
  customThemes?: Record<string, OSICardsThemeConfig>; // Custom themes
}
```

### Built-in Theme Presets

The following theme presets are available out of the box:

| Preset | Description | Color Scheme |
|--------|-------------|--------------|
| `light` | Default light theme | Light |
| `dark` | Default dark theme | Dark |
| `system` | Follow system preference | Auto |
| `midnight` | Deep blue dark theme | Dark |
| `corporate` | Professional light theme | Light |
| `nature` | Green-focused theme | Light |
| `sunset` | Warm orange/red theme | Dark |
| `ocean` | Blue dark theme | Dark |
| `rose` | Pink accent theme | Light |
| `minimal` | Clean, minimal styling | Light |
| `high-contrast` | Accessibility-focused | Both |

### System Preference Detection

```typescript
// Get current system preference
const preference = themeService.detectSystemPreference(); // 'light' | 'dark'

// Watch for system preference changes
themeService.watchSystemPreference().subscribe(pref => {
  console.log('System preference changed to:', pref);
});

// Automatically follow system preference
themeService.setTheme('system');
```

### Theme Persistence

Themes are automatically persisted to localStorage when `enablePersistence` is true:

```typescript
// Manual persistence
themeService.savePreference(); // Uses default key 'osi-cards-theme'
themeService.savePreference('custom-key');

// Load saved preference
const savedTheme = themeService.loadPreference();

// Clear saved preference
themeService.clearPreference();
```

---

## Theme Composition

Advanced utilities for building and composing themes programmatically.

### Theme Builder Utilities

**Location:** `projects/osi-cards-lib/src/lib/themes/theme-builder.util.ts`

```typescript
import {
  buildThemeFromBase,
  mergeThemes,
  createPartialTheme,
  validateCSSVariableNames,
  generateThemeFromPalette
} from 'osi-cards-lib';

// Build from a base theme
const customTheme = buildThemeFromBase(lightTheme, {
  '--color-brand': '#ff0000',
  '--card-padding': '24px'
});

// Merge multiple themes
const merged = mergeThemes(theme1, theme2, theme3);

// Create partial theme with specific variables
const partial = createPartialTheme('accent-only', {
  '--osi-card-accent': '#6366f1'
});

// Validate CSS variable names
const invalidNames = validateCSSVariableNames({
  '--valid-name': '#000',
  'InvalidName': '#fff' // Will be flagged
});

// Generate theme from color palette
const brandTheme = generateThemeFromPalette('my-brand', {
  primary: '#ff7900',
  background: '#ffffff',
  foreground: '#000000'
});
```

### Theme Composer Utilities

**Location:** `projects/osi-cards-lib/src/lib/themes/theme-composer.util.ts`

```typescript
import {
  extendTheme,
  mergeThemes,
  createThemeFromColors,
  deriveColorScale,
  createThemeFromScale,
  createThemePair,
  pickThemeVariables,
  omitThemeVariables
} from 'osi-cards-lib';

// Extend a base theme
const customDark = extendTheme(darkTheme, {
  '--osi-card-accent': '#ff6b6b',
  '--osi-card-background': '#1a1a2e'
}, 'custom-dark');

// Create complete theme from colors
const brandTheme = createThemeFromColors({
  primary: '#6366f1',
  background: '#ffffff',
  foreground: '#1a1a1a',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
}, 'brand-light', false);

// Generate color scale from base color
const blueScale = deriveColorScale('#3b82f6');
// blueScale = { 50: '...', 100: '...', ..., 900: '...', 950: '...' }

// Create theme from color scale
const blueTheme = createThemeFromScale(blueScale, 'blue-theme', false);

// Create light and dark variants
const { light, dark } = createThemePair({
  primary: '#6366f1'
}, 'indigo');

// Pick specific variables
const accentOnly = pickThemeVariables(fullTheme, [
  '--osi-card-accent',
  '--osi-card-accent-foreground'
]);

// Omit specific variables
const withoutShadows = omitThemeVariables(fullTheme, [
  '--osi-card-shadow',
  '--osi-card-shadow-md'
]);
```

### Color Utilities

```typescript
import {
  hexToRgbString,
  rgbToHex,
  adjustLightness,
  getContrastColor,
  mixColors,
  withAlpha
} from 'osi-cards-lib';

// Convert hex to RGB string
hexToRgbString('#ff7900'); // '255, 121, 0'

// Convert RGB to hex
rgbToHex(255, 121, 0); // '#ff7900'

// Adjust lightness
adjustLightness('#3b82f6', 20);  // Lighter
adjustLightness('#3b82f6', -20); // Darker

// Get contrasting text color
getContrastColor('#ff7900'); // '#000000' or '#ffffff'

// Mix two colors
mixColors('#ff0000', '#0000ff', 0.5); // Purple

// Add alpha to color
withAlpha('#ff7900', 0.5); // 'rgba(255, 121, 0, 0.5)'
```

#### ColorPalette Interface

```typescript
interface ColorPalette {
  primary: string;       // Primary/accent color (required)
  secondary?: string;    // Secondary color
  background?: string;   // Background color
  foreground?: string;   // Foreground/text color
  muted?: string;        // Muted/subtle color
  border?: string;       // Border color
  success?: string;      // Success state color
  warning?: string;      // Warning state color
  error?: string;        // Error/destructive color
  info?: string;         // Info color
}
```

#### ColorScale Interface

```typescript
interface ColorScale {
  50: string;   // Lightest
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Base color
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;  // Darkest
}
```

---

## Design Tokens

TypeScript constants that mirror the SCSS master tokens for runtime theming.

**Location:** `projects/osi-cards-lib/src/lib/themes/tokens.constants.ts`

### Color Tokens

```typescript
import { OSI_COLORS } from 'osi-cards-lib';

// Brand colors
OSI_COLORS.brand       // '#ff7900'
OSI_COLORS.brandDark   // '#cc5f00'
OSI_COLORS.brandLight  // '#ff9933'
OSI_COLORS.brandPale   // '#ffe6cc'

// Neutrals
OSI_COLORS.white       // '#ffffff'
OSI_COLORS.black       // '#000000'

// Grayscale (50-900)
OSI_COLORS.gray50      // '#ffffff'
OSI_COLORS.gray100     // '#fcfcfc'
OSI_COLORS.gray200     // '#f0f0f1'
// ... through ...
OSI_COLORS.gray900     // '#000000'

// Status colors
OSI_COLORS.success     // '#22c55e'
OSI_COLORS.warning     // '#f59e0b'
OSI_COLORS.error       // '#ef4444'
OSI_COLORS.info        // '#3b82f6'
OSI_COLORS.neutral     // '#6b7280'
```

### Theme-Specific Colors

```typescript
import { OSI_THEME_COLORS } from 'osi-cards-lib';

// Light theme colors
OSI_THEME_COLORS.light.background        // '#ffffff'
OSI_THEME_COLORS.light.foreground        // '#1c1c1f'
OSI_THEME_COLORS.light.muted             // '#f4f4f6'
OSI_THEME_COLORS.light.mutedForeground   // '#555861'
OSI_THEME_COLORS.light.border            // 'rgba(200, 200, 200, 0.5)'

// Dark theme colors
OSI_THEME_COLORS.dark.background         // '#0a0a0a'
OSI_THEME_COLORS.dark.foreground         // '#ffffff'
OSI_THEME_COLORS.dark.muted              // '#242424'
OSI_THEME_COLORS.dark.mutedForeground    // '#aaaaaa'
OSI_THEME_COLORS.dark.border             // 'rgba(200, 200, 200, 0.3)'
```

### CSS Variable Names

```typescript
import { CSS_VAR_NAMES, cssVar, colorMix, hexToRgba } from 'osi-cards-lib';

// Reference CSS variables
CSS_VAR_NAMES.background           // '--background'
CSS_VAR_NAMES.foreground           // '--foreground'
CSS_VAR_NAMES.colorBrand           // '--color-brand'
CSS_VAR_NAMES.cardPadding          // '--card-padding'
CSS_VAR_NAMES.cardBorderRadius     // '--card-border-radius'

// Helper functions
cssVar('--background');                      // 'var(--background)'
cssVar('--background', '#fff');              // 'var(--background, #fff)'
colorMix('red', 50, 'blue');                 // 'color-mix(in srgb, red 50%, blue 50%)'
hexToRgba('#ff7900', 0.5);                   // 'rgba(255, 121, 0, 0.5)'
```

---

## Theme Style Presets

Pre-configured CSS variable sets for consistent card styling.

**Location:** `projects/osi-cards-lib/src/lib/themes/presets.ts`

### Default Theme Preset

The default theme matches the demo app styling with semi-transparent backgrounds and blur effects.

```typescript
import {
  DEFAULT_THEME_PRESET,
  applyThemeStylePreset,
  removeThemeStylePreset
} from 'osi-cards-lib';

// Apply preset to an element
applyThemeStylePreset(element, DEFAULT_THEME_PRESET, true);  // Dark mode
applyThemeStylePreset(element, DEFAULT_THEME_PRESET, false); // Light mode

// Remove preset from element
removeThemeStylePreset(element, DEFAULT_THEME_PRESET);
```

#### Default Theme Variables

**Dark Mode:**
```css
--theme-ai-card-border: 1px solid rgba(255, 255, 255, 0.08);
--theme-ai-card-border-hover: 1px solid rgba(255, 121, 0, 0.5);
--theme-ai-card-background: rgba(20, 20, 20, 0.6);
--theme-ai-card-background-hover: rgba(30, 30, 30, 0.8);
--theme-ai-card-box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
--theme-ai-card-box-shadow-hover: 0 20px 40px -5px rgba(0, 0, 0, 0.4),
                                   0 0 0 1px rgba(255, 121, 0, 0.2);
--theme-ai-card-backdrop-filter: blur(12px);
--theme-ai-card-transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

**Light Mode:**
```css
--theme-ai-card-border: 1px solid rgba(0, 0, 0, 0.08);
--theme-ai-card-border-hover: 1px solid rgba(255, 121, 0, 0.4);
--theme-ai-card-background: rgba(255, 255, 255, 0.85);
--theme-ai-card-background-hover: rgba(255, 255, 255, 0.92);
--theme-ai-card-box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.1),
                             0 0 18px rgba(255, 121, 0, 0.15);
--theme-ai-card-backdrop-filter: blur(12px);
```

### High Contrast Preset

Designed for accessibility with stronger borders and higher contrast.

```typescript
import { HIGH_CONTRAST_THEME_PRESET } from 'osi-cards-lib';

// Apply high contrast theme
applyThemeStylePreset(element, HIGH_CONTRAST_THEME_PRESET, true);
```

#### High Contrast Variables

**Dark Mode:**
```css
--theme-ai-card-border: 2px solid rgba(255, 255, 255, 0.3);
--theme-ai-card-border-hover: 2px solid rgba(255, 121, 0, 0.8);
--theme-ai-card-background: rgba(0, 0, 0, 0.9);
--theme-ai-card-backdrop-filter: none;
```

### Available Presets

```typescript
import { THEME_STYLE_PRESETS } from 'osi-cards-lib';

// Access all presets
const defaultPreset = THEME_STYLE_PRESETS['default'];
const highContrastPreset = THEME_STYLE_PRESETS['high-contrast'];
```

### ThemePresetVariables Interface

```typescript
interface ThemePresetVariables {
  // AI Card Surface
  '--theme-ai-card-border': string;
  '--theme-ai-card-border-hover': string;
  '--theme-ai-card-background': string;
  '--theme-ai-card-background-hover': string;
  '--theme-ai-card-box-shadow': string;
  '--theme-ai-card-box-shadow-hover': string;
  '--theme-ai-card-backdrop-filter': string;
  '--theme-ai-card-transition': string;

  // Card Surface
  '--theme-card-border': string;
  '--theme-card-border-hover': string;
  '--theme-card-background': string;
  '--theme-card-background-hover': string;
  '--theme-card-box-shadow': string;
  '--theme-card-box-shadow-hover': string;

  // Section Surface
  '--theme-section-border': string;
  '--theme-section-border-hover': string;
  '--theme-section-box-shadow': string;
  '--theme-section-box-shadow-hover': string;
}
```

---

## Complete Example

Here's a comprehensive example combining card presets with custom theming:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import {
  OsiCardsComponent,
  PresetFactory,
  ThemeService,
  createThemeFromColors,
  createThemePair
} from 'osi-cards-lib';

@Component({
  selector: 'app-themed-dashboard',
  standalone: true,
  imports: [OsiCardsComponent],
  template: `
    <div class="dashboard">
      <button (click)="toggleTheme()">Toggle Theme</button>
      <osi-cards [card]="companyCard" />
      <osi-cards [card]="analyticsCard" />
    </div>
  `
})
export class ThemedDashboardComponent implements OnInit {
  private themeService = inject(ThemeService);

  // Create card presets
  companyCard = PresetFactory.createCompany({
    name: 'TechCorp',
    industry: 'Software',
    growthRate: 45,
    websiteUrl: 'https://techcorp.io'
  });

  analyticsCard = PresetFactory.createAnalytics({
    title: 'Performance Metrics',
    kpis: [
      { label: 'Users', value: '10K', percentage: 120, trend: 'up' },
      { label: 'Revenue', value: '$500K', percentage: 95, trend: 'up' }
    ]
  });

  ngOnInit() {
    // Create and register custom brand themes
    const { light, dark } = createThemePair({
      primary: '#6366f1',
      background: '#ffffff',
      foreground: '#1a1a1a'
    }, 'brand');

    this.themeService.registerTheme(light);
    this.themeService.registerTheme(dark);

    // Apply based on system preference
    this.themeService.setTheme('system');
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

---

## See Also

- [THEMING_GUIDE.md](./THEMING_GUIDE.md) - Detailed theming guide with CSS custom properties
- [CSS_ENCAPSULATION.md](./CSS_ENCAPSULATION.md) - How theming works with Shadow DOM
- [SERVICES.md](./SERVICES.md) - Service documentation including ThemeService details
- [API.md](./API.md) - Complete API reference



