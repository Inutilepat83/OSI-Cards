# OSI Cards - Theming Guide

This guide explains how to customize the appearance of OSI Cards components using CSS custom properties and theme presets.

## Table of Contents

- [Quick Start](#quick-start)
- [CSS Custom Properties](#css-custom-properties)
- [Theme Presets](#theme-presets)
- [Dark Mode](#dark-mode)
- [Custom Themes](#custom-themes)
- [Component-Specific Styling](#component-specific-styling)
- [Responsive Theming](#responsive-theming)
- [Best Practices](#best-practices)

---

## Quick Start

The simplest way to customize OSI Cards is by overriding CSS custom properties:

```css
/* In your global styles */
:root {
  --osi-card-accent: #3b82f6; /* Blue accent */
  --osi-card-background: #ffffff;
  --osi-card-foreground: #1a1a1a;
  --osi-card-border-radius: 12px;
}
```

---

## CSS Custom Properties

### Color Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--osi-card-background` | `#ffffff` | Card background color |
| `--osi-card-foreground` | `#1a1a1a` | Primary text color |
| `--osi-card-muted` | `#6b7280` | Muted/secondary text |
| `--osi-card-accent` | `#6366f1` | Accent/highlight color |
| `--osi-card-accent-foreground` | `#ffffff` | Text on accent background |
| `--osi-card-border` | `#e5e7eb` | Border color |
| `--osi-card-destructive` | `#ef4444` | Error/destructive actions |
| `--osi-card-success` | `#22c55e` | Success indicators |
| `--osi-card-warning` | `#f59e0b` | Warning indicators |

### Spacing Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--osi-card-padding` | `1rem` | Internal padding |
| `--osi-card-gap` | `0.75rem` | Gap between elements |
| `--osi-card-section-gap` | `1rem` | Gap between sections |
| `--osi-card-border-radius` | `0.5rem` | Border radius |

### Typography Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--osi-card-font-family` | `system-ui, sans-serif` | Base font family |
| `--osi-card-title-size` | `1.25rem` | Card title size |
| `--osi-card-section-title-size` | `1rem` | Section title size |
| `--osi-card-body-size` | `0.875rem` | Body text size |
| `--osi-card-small-size` | `0.75rem` | Small text size |
| `--osi-card-font-weight-normal` | `400` | Normal weight |
| `--osi-card-font-weight-medium` | `500` | Medium weight |
| `--osi-card-font-weight-bold` | `600` | Bold weight |

### Shadow Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--osi-card-shadow` | `0 1px 3px rgba(0,0,0,0.1)` | Default shadow |
| `--osi-card-shadow-hover` | `0 4px 6px rgba(0,0,0,0.1)` | Hover shadow |
| `--osi-card-shadow-focus` | `0 0 0 3px rgba(99,102,241,0.3)` | Focus ring |

### Animation Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--osi-card-transition-fast` | `150ms` | Fast transitions |
| `--osi-card-transition-normal` | `200ms` | Normal transitions |
| `--osi-card-transition-slow` | `300ms` | Slow transitions |
| `--osi-card-easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing |

---

## Theme Presets

### Using Built-in Themes

```typescript
import { provideOSICards, OSI_THEMES } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      theme: OSI_THEMES.DARK // 'light' | 'dark' | 'corporate' | 'minimal'
    })
  ]
};
```

### Available Themes

#### Light Theme (Default)
Clean, professional appearance with subtle shadows.

```css
[data-theme="light"] {
  --osi-card-background: #ffffff;
  --osi-card-foreground: #1a1a1a;
  --osi-card-accent: #6366f1;
}
```

#### Dark Theme
Modern dark mode with reduced eye strain.

```css
[data-theme="dark"] {
  --osi-card-background: #1f2937;
  --osi-card-foreground: #f9fafb;
  --osi-card-accent: #818cf8;
  --osi-card-border: #374151;
}
```

#### Corporate Theme
Professional blue tones for enterprise applications.

```css
[data-theme="corporate"] {
  --osi-card-accent: #2563eb;
  --osi-card-background: #f8fafc;
  --osi-card-border-radius: 4px;
}
```

#### Minimal Theme
Ultra-clean with reduced visual noise.

```css
[data-theme="minimal"] {
  --osi-card-shadow: none;
  --osi-card-border: transparent;
  --osi-card-border-radius: 0;
}
```

---

## Dark Mode

### Automatic Dark Mode Detection

```css
/* Respects system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --osi-card-background: #1f2937;
    --osi-card-foreground: #f9fafb;
    --osi-card-border: #374151;
    --osi-card-muted: #9ca3af;
  }
}
```

### Manual Dark Mode Toggle

```typescript
@Component({
  // ...
})
export class AppComponent {
  isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.setAttribute(
      'data-theme', 
      this.isDarkMode ? 'dark' : 'light'
    );
  }
}
```

### Using ThemeService

```typescript
import { ThemeService } from 'osi-cards-lib';

export class AppComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

---

## Custom Themes

### Creating a Custom Theme

```css
/* my-theme.css */
[data-theme="ocean"] {
  /* Colors */
  --osi-card-background: #0a192f;
  --osi-card-foreground: #ccd6f6;
  --osi-card-accent: #64ffda;
  --osi-card-accent-foreground: #0a192f;
  --osi-card-border: #233554;
  --osi-card-muted: #8892b0;
  
  /* Status colors */
  --osi-card-success: #64ffda;
  --osi-card-warning: #ffd700;
  --osi-card-destructive: #ff6b6b;
  
  /* Shadows */
  --osi-card-shadow: 0 10px 30px -10px rgba(2, 12, 27, 0.7);
}
```

### Registering Custom Theme

```typescript
import { provideOSICards } from 'osi-cards-lib';

provideOSICards({
  themes: {
    ocean: {
      name: 'Ocean',
      properties: {
        '--osi-card-background': '#0a192f',
        '--osi-card-foreground': '#ccd6f6',
        '--osi-card-accent': '#64ffda'
      }
    }
  }
})
```

---

## Component-Specific Styling

### Card Header

```css
.osi-card-header {
  --header-padding: 1rem;
  --header-border-width: 0 0 1px 0;
}
```

### Section Styling

```css
/* Info section */
.ai-section--info {
  --section-grid-columns: 2;
  --field-gap: 0.5rem;
}

/* Analytics section */
.ai-section--analytics {
  --metric-background: var(--osi-card-accent);
  --metric-foreground: var(--osi-card-accent-foreground);
}
```

### Action Buttons

```css
.osi-action-button {
  --button-height: 2.5rem;
  --button-padding: 0 1rem;
  --button-border-radius: calc(var(--osi-card-border-radius) / 2);
}

.osi-action-button--primary {
  --button-background: var(--osi-card-accent);
  --button-foreground: var(--osi-card-accent-foreground);
}

.osi-action-button--secondary {
  --button-background: transparent;
  --button-foreground: var(--osi-card-foreground);
  --button-border: 1px solid var(--osi-card-border);
}
```

---

## Responsive Theming

### Breakpoint-Based Adjustments

```css
/* Mobile */
@media (max-width: 640px) {
  :root {
    --osi-card-padding: 0.75rem;
    --osi-card-title-size: 1rem;
    --osi-card-body-size: 0.8125rem;
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  :root {
    --osi-card-padding: 1rem;
    --osi-card-section-gap: 0.875rem;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  :root {
    --osi-card-padding: 1.25rem;
    --osi-card-shadow-hover: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
}
```

### Container Query Theming

```css
@container card (width < 400px) {
  .osi-card-container {
    --osi-card-title-size: 1rem;
    --section-grid-columns: 1;
  }
}
```

---

## Best Practices

### 1. Use CSS Custom Properties

Always use custom properties instead of hard-coded values:

```css
/* ✅ Good */
.my-element {
  color: var(--osi-card-foreground);
  padding: var(--osi-card-padding);
}

/* ❌ Avoid */
.my-element {
  color: #1a1a1a;
  padding: 16px;
}
```

### 2. Respect User Preferences

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --osi-card-transition-fast: 0ms;
    --osi-card-transition-normal: 0ms;
    --osi-card-transition-slow: 0ms;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  :root {
    --osi-card-border: currentColor;
    --osi-card-shadow: none;
  }
}
```

### 3. Maintain Accessibility

- Ensure color contrast ratio ≥ 4.5:1 for text
- Use visible focus indicators
- Don't rely solely on color for information

```css
/* Accessible focus ring */
.interactive-element:focus-visible {
  outline: 2px solid var(--osi-card-accent);
  outline-offset: 2px;
}
```

### 4. Test Across Themes

Always test your customizations in:
- Light mode
- Dark mode
- High contrast mode
- Various screen sizes

---

## SCSS Integration

If using SCSS, you can leverage the library's mixins:

```scss
@use 'osi-cards-lib/styles/tokens' as tokens;
@use 'osi-cards-lib/styles/mixins' as mixins;

.my-component {
  @include mixins.card-surface;
  padding: tokens.$spacing-md;
  border-radius: tokens.$radius-lg;
}
```

---

## Example: Complete Theme

```css
/* Purple Dream Theme */
[data-theme="purple-dream"] {
  /* Base colors */
  --osi-card-background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  --osi-card-foreground: #eaeaea;
  --osi-card-muted: #a0a0a0;
  
  /* Accent */
  --osi-card-accent: #9d4edd;
  --osi-card-accent-foreground: #ffffff;
  
  /* Borders */
  --osi-card-border: rgba(157, 78, 221, 0.3);
  --osi-card-border-radius: 16px;
  
  /* Typography */
  --osi-card-font-family: 'Inter', system-ui, sans-serif;
  
  /* Shadows */
  --osi-card-shadow: 0 8px 32px rgba(157, 78, 221, 0.15);
  --osi-card-shadow-hover: 0 12px 48px rgba(157, 78, 221, 0.25);
  
  /* Status colors */
  --osi-card-success: #00d9ff;
  --osi-card-warning: #ffbe0b;
  --osi-card-destructive: #ff006e;
}
```

---

For more examples and live demos, visit the [OSI Cards Storybook](https://osi-cards.dev/storybook).

