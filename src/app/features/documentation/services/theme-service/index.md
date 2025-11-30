# ThemeService

Dynamic theming and CSS custom properties management.

## Overview

`ThemeService` manages themes and CSS custom properties for card styling.

## Import

```typescript
import { ThemeService } from 'osi-cards-lib';
```

## Methods

### setTheme(theme)

Apply a theme preset.

```typescript
themeService.setTheme('dark');
themeService.setTheme('orange');
themeService.setTheme('minimal');
```

### setCustomProperties(properties)

Set custom CSS properties.

```typescript
themeService.setCustomProperties({
  '--osi-card-bg': '#ffffff',
  '--osi-card-border': '#e0e0e0',
  '--osi-primary': '#FF7900'
});
```

### getTheme()

Get current theme name.

### resetTheme()

Reset to default theme.

## Built-in Themes

| Theme | Description |
|-------|-------------|
| `default` | Standard light theme |
| `dark` | Dark mode theme |
| `orange` | Orange brand theme |
| `minimal` | Minimal, clean theme |
| `high-contrast` | Accessibility theme |

## Custom Theme

```typescript
const customTheme = {
  name: 'corporate',
  properties: {
    '--osi-card-bg': '#f5f5f5',
    '--osi-primary': '#003366',
    '--osi-text': '#333333'
  }
};

themeService.registerTheme(customTheme);
themeService.setTheme('corporate');
```
