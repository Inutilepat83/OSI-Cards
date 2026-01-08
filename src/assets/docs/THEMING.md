# Theming Guide

OSI Cards provides a flexible theming system that allows you to customize the appearance of cards to match your brand and design system.

## **Overview**

The OSI Cards library uses CSS custom properties (CSS variables) for theming, allowing for runtime theme switching and easy customization. The theme system supports:

- Built-in presets (day, night, osi-day, osi-night)
- Custom themes via CSS variables
- Runtime theme switching
- Theme validation and builder utilities

## **Quick Start**

### **Using Built-in Themes**

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

### **Available Presets**

- `'day'` - Light theme (default)
- `'night'` - Dark theme
- `'osi-day'` - OSI Deployment light theme (Orange Sales Assistance styling)
- `'osi-night'` - OSI Deployment dark theme (Orange Sales Assistance styling)

## **Container-Scoped Theming**

For library integration, prefer container-scoped theming to avoid global document mutations:

```typescript
import { Component } from '@angular/core';
import { OsiCardsContainerComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [OsiCardsContainerComponent],
  template: `
    <osi-cards-container [theme]="'day'">
      <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
    </osi-cards-container>
  `
})
export class MyComponent {
  card = { /* card config */ };
}
```

## **Custom Themes**

You can create custom themes by defining CSS custom properties:

```typescript
import { ThemeService } from 'osi-cards-lib';

const themeService = inject(ThemeService);

themeService.setCustomProperties({
  '--osi-card-bg': '#1a1a1a',
  '--osi-card-text': '#ffffff',
  '--osi-primary': '#FF7900'
});
```

## **Theme Variables**

The theme system uses CSS custom properties for all styling. Key variables include:

- `--background` - Main background color
- `--foreground` - Main text color
- `--primary` - Primary brand color
- `--secondary` - Secondary brand color
- `--accent` - Accent color
- `--muted` - Muted text color
- `--border` - Border color

For a complete list of theme variables, see the [Theme Service documentation](../docs/services/theme-service/).

## **System Preference Detection**

The theme service can automatically detect and follow the user's system color scheme preference:

```typescript
themeService.setTheme('system'); // Follows prefers-color-scheme
```

## **Additional Resources**

- [Theme Service API Reference](../docs/services/theme-service/)
- [Design System Documentation](../docs/design-system/)
- [Advanced Theming Guide](../docs/advanced/theming-overview/)
