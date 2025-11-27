# OSI Cards Library - Theming Guide

This guide explains how to customize and theme the OSI Cards library to match your brand and design system.

## Overview

The OSI Cards library uses CSS custom properties (CSS variables) for theming, allowing for runtime theme switching and easy customization. The theme system supports:

- Built-in presets (light, dark, high-contrast)
- Custom themes via CSS variables
- Runtime theme switching
- Theme validation and builder utilities

## Quick Start

### Using Built-in Themes

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  template: `...`
})
export class MyComponent {
  private themeService = inject(ThemeService);
  
  switchToDark(): void {
    this.themeService.setTheme('night');
  }
  
  switchToLight(): void {
    this.themeService.setTheme('day');
  }
}
```

### Available Presets

- `'day'` - Light theme (default)
- `'night'` - Dark theme
- `'high-contrast'` - High contrast theme for accessibility

## Built-in Theme Presets

### Day Theme (Light)

```typescript
import { ThemeService, lightTheme } from 'osi-cards-lib';

const themeService = inject(ThemeService);
themeService.setTheme('day');
```

### Night Theme (Dark)

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);
themeService.setTheme('night');
```

### High Contrast Theme

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);
themeService.setTheme('high-contrast');
```

## Custom Themes

### Creating a Custom Theme

```typescript
import { ThemeService, OSICardsThemeConfig } from 'osi-cards-lib';

const themeService = inject(ThemeService);

const customTheme: OSICardsThemeConfig = {
  name: 'my-brand-theme',
  variables: {
    '--color-brand': '#ff0000',
    '--card-padding': '24px',
    '--card-border-radius': '16px',
    '--background': '#f5f5f5',
    '--foreground': '#333333'
  }
};

// Apply the custom theme
themeService.applyCustomTheme(customTheme);
```

### Using Theme Builder Utilities

Build a theme from a base with overrides:

```typescript
import { buildThemeFromBase, lightTheme } from 'osi-cards-lib';

const customTheme = buildThemeFromBase(lightTheme, {
  '--color-brand': '#ff0000',
  '--card-padding': '20px'
});

themeService.applyCustomTheme(customTheme);
```

### Generate Theme from Color Palette

```typescript
import { generateThemeFromPalette } from 'osi-cards-lib';

const theme = generateThemeFromPalette('my-brand', {
  primary: '#ff7900',
  background: '#ffffff',
  foreground: '#000000',
  muted: '#f5f5f5',
  border: '#e0e0e0'
});

themeService.applyCustomTheme(theme);
```

## CSS Variables Reference

### Brand Colors

```css
--color-brand: #ff7900;
--color-brand-dark: #CC5F00;
--color-brand-light: #FF9933;
```

### Card Variables

```css
--card-padding: 16px;
--card-gap: 10px;
--card-border-radius: 12px;
--card-background: rgba(...);
--card-background-hover: rgba(...);
```

### Section Variables

```css
--section-border: 1px solid rgba(...);
--section-background: rgba(...);
--section-item-background: rgba(...);
```

### Text Variables

```css
--card-text-primary: var(--foreground);
--card-text-secondary: var(--muted-foreground);
--card-label-font-size: 0.5rem;
--card-value-font-size: 1.0rem;
```

See the full variable list in `styles/core/_variables.scss` for all available customization points.

## Runtime Theme Switching

### Subscribe to Theme Changes

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);

themeService.currentTheme$.subscribe(theme => {
  console.log('Current theme:', theme);
});
```

### Programmatic Theme Switching

```typescript
// Switch between presets
themeService.setTheme('night');
themeService.setTheme('day');

// Apply custom theme
themeService.applyCustomTheme(myCustomTheme);
```

## Theme Configuration in App Config

You can configure the initial theme when the app starts:

```typescript
import { APP_INITIALIZER, inject } from '@angular/core';
import { ThemeService } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const themeService = inject(ThemeService);
        return () => {
          // Set initial theme based on user preference or config
          const savedTheme = localStorage.getItem('preferred-theme') || 'day';
          themeService.setTheme(savedTheme as any);
        };
      },
      multi: true
    }
  ]
};
```

## Advanced Theming

### Theme Validation

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);
const validation = themeService.validateTheme(customTheme);

if (!validation.valid) {
  console.error('Theme validation errors:', validation.errors);
}
```

### Register Multiple Themes

```typescript
// Register themes without applying them
themeService.registerTheme(theme1);
themeService.registerTheme(theme2);
themeService.registerTheme(theme3);

// Apply later
themeService.applyCustomTheme(themeService.getCustomTheme('my-theme'));
```

### Merge Themes

```typescript
import { mergeThemes, lightTheme, darkTheme } from 'osi-cards-lib';

const hybridTheme = mergeThemes(lightTheme, {
  name: 'hybrid',
  variables: {
    '--color-brand': '#00ff00'
  }
});
```

## CSS-Based Theming

You can also override themes using CSS in your application:

```scss
// Override specific variables
:root {
  --color-brand: #your-brand-color;
  --card-padding: 24px;
}

// Or override per theme
:root[data-theme='night'] {
  --color-brand: #ff9933;
}
```

## Accessibility

The library includes a high-contrast theme for better accessibility:

```typescript
themeService.setTheme('high-contrast');
```

This theme provides:
- Maximum contrast ratios
- Clearer borders
- Enhanced visibility
- WCAG AA compliance

## Best Practices

1. **Use CSS Variables**: Always use CSS custom properties for theming - they cascade properly
2. **Validate Themes**: Use `validateTheme()` before applying custom themes
3. **Store Preferences**: Save user theme preferences in localStorage
4. **Test Contrast**: Ensure sufficient contrast ratios for accessibility
5. **Use Presets**: Start with built-in presets and customize only what's needed

## Examples

See the examples directory for complete theming examples:
- `examples/theming/basic-theme-switching.example.ts`
- `examples/theming/custom-brand-theme.example.ts`
- `examples/theming/runtime-theme-switching.example.ts`

## Related Documentation

- [README.md](../README.md) - Library overview
- [SERVICES.md](./SERVICES.md) - Service documentation
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Advanced customization

