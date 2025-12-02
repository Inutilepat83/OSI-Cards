# Section Design - Comprehensive Guide

**Consolidated Guide**: This document merges all section design documentation into one comprehensive resource.

**Replaces**: `SECTION_DESIGN_PARAMETERS.md`, `SECTION_DESIGN_MIGRATION_GUIDE.md`, `SECTION_SPACING_GRID_GUIDE.md`, `SPACING_PARAMETERS_UPDATE.md`

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Design Parameters](#design-parameters)
4. [Spacing System](#spacing-system)
5. [Grid System](#grid-system)
6. [Presets](#presets)
7. [Migration Guide](#migration-guide)
8. [Best Practices](#best-practices)
9. [API Reference](#api-reference)

---

## Overview

OSI Cards provides a comprehensive design system for customizing section appearance through:
- **Design Parameters**: CSS custom properties for styling
- **Spacing System**: Consistent spacing using design tokens
- **Grid System**: Responsive layout with column spanning
- **Presets**: Pre-configured design themes

### Key Features
- ✅ Type-safe TypeScript support
- ✅ Flexible parameter system
- ✅ Consistent spacing tokens
- ✅ Responsive grid layout
- ✅ Non-invasive customization

---

## Quick Start

### Basic Customization

```typescript
const section: CardSection = {
  title: 'My Section',
  type: 'info',
  fields: [...],
  meta: {
    design: {
      itemBackground: '#1a1a2e',
      itemBorderColor: 'rgba(255, 121, 0, 0.3)',
      accentColor: '#ff7900',
      borderRadius: '12px'
    }
  }
};
```

### Using Presets

```typescript
const section: CardSection = {
  title: 'Analytics Dashboard',
  type: 'analytics',
  fields: [...],
  meta: {
    design: {
      preset: 'glass'
    }
  }
};
```

### Preset with Overrides

```typescript
const section: CardSection = {
  title: 'Sales Metrics',
  type: 'analytics',
  fields: [...],
  meta: {
    design: {
      preset: 'spacious',
      params: {
        accentColor: '#00d9ff'
      }
    }
  }
};
```

---

## Design Parameters

### Color Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `itemBackground` | color | Item background color | `'#1a1a1a'` |
| `itemBorderColor` | color | Item border color | `'rgba(255,121,0,0.2)'` |
| `accentColor` | color | Accent/highlight color | `'#ff7900'` |
| `labelColor` | color | Label text color | `'#aaa'` |
| `valueColor` | color | Value text color | `'#fff'` |

### Spacing Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `itemPadding` | spacing | Internal item padding | `'14px 18px'` |
| `itemGap` | spacing | Gap between items | `'10px'` |
| `sectionPadding` | spacing | Section container padding | `'16px'` |

### Border Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `borderRadius` | size | Corner radius | `'12px'` |
| `borderWidth` | size | Border thickness | `'1px'` |
| `borderStyle` | style | Border style | `'solid'` |

### Typography Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `labelFontSize` | size | Label text size | `'0.875rem'` |
| `valueFontSize` | size | Value text size | `'1rem'` |
| `labelFontWeight` | weight | Label font weight | `'500'` |
| `valueFontWeight` | weight | Value font weight | `'400'` |

---

## Spacing System

OSI Cards uses a consistent spacing scale based on design tokens:

### Spacing Scale

```typescript
const SPACING = {
  'xs':  '4px',
  'sm':  '8px',
  'md':  '12px',  // Default gap
  'lg':  '16px',
  'xl':  '24px',
  '2xl': '32px',
  '3xl': '48px',
};
```

### Usage in Sections

```typescript
meta: {
  design: {
    itemPadding: 'var(--osi-spacing-lg)',
    itemGap: 'var(--osi-spacing-md)',
    sectionPadding: 'var(--osi-spacing-xl)'
  }
}
```

### Grid Gap Configuration

The default grid gap is `12px` (md). You can customize it:

```typescript
<app-masonry-grid
  [sections]="sections"
  [gap]="16">  <!-- 16px gap -->
</app-masonry-grid>
```

---

## Grid System

### Column Spanning

Sections can span 1-4 columns based on:
1. **Preferred columns**: Section type default
2. **Content density**: Fields + items count
3. **Available space**: Grid column availability

### Column Preferences by Type

| Section Type | Preferred Columns | Rationale |
|-------------|-------------------|-----------|
| `overview` | 2 | Needs space for many fields |
| `chart` | 2 | Visualizations need width |
| `map` | 2 | Maps need width |
| `analytics` | 2 | Metrics display better wider |
| `contact-card` | 2 | Cards layout side-by-side |
| `info` | 1 | Key-value pairs stack well |
| `list` | 1 | Lists are naturally vertical |
| `quotation` | 1 | Text reads better narrow |

### Override Column Span

```typescript
const section: CardSection = {
  type: 'info',
  title: 'Extended Info',
  fields: [...],
  preferredColumns: 2,  // Override to span 2 columns
};
```

---

## Presets

### Available Presets

#### 1. `default`
System defaults with standard spacing and colors.

#### 2. `compact`
Tight spacing for dense information display.
```typescript
meta: { design: { preset: 'compact' } }
```

#### 3. `spacious`
Generous spacing for better readability.
```typescript
meta: { design: { preset: 'spacious' } }
```

#### 4. `minimal`
Borderless, clean aesthetic.
```typescript
meta: { design: { preset: 'minimal' } }
```

#### 5. `bold`
Strong borders and emphasis.
```typescript
meta: { design: { preset: 'bold' } }
```

#### 6. `glass`
Glassmorphism effect with backdrop blur.
```typescript
meta: { design: { preset: 'glass' } }
```

#### 7. `outlined`
Emphasis on borders, subtle backgrounds.
```typescript
meta: { design: { preset: 'outlined' } }
```

#### 8. `flat`
Solid backgrounds, no borders.
```typescript
meta: { design: { preset: 'flat' } }
```

---

## Migration Guide

### From Legacy System

**Before** (hardcoded styles):
```typescript
<div style="padding: 16px; background: #1a1a1a">
```

**After** (design parameters):
```typescript
meta: {
  design: {
    itemPadding: '16px',
    itemBackground: '#1a1a1a'
  }
}
```

### From Inline Styles to Presets

**Before**:
```typescript
meta: {
  design: {
    itemPadding: '20px 24px',
    itemGap: '14px',
    borderRadius: '16px'
  }
}
```

**After**:
```typescript
meta: {
  design: {
    preset: 'spacious'
  }
}
```

---

## Best Practices

### 1. Use Presets First
Start with a preset, override only what's needed:
```typescript
meta: {
  design: {
    preset: 'glass',
    params: {
      accentColor: '#ff7900'  // Brand color
    }
  }
}
```

### 2. Use Design Tokens
Use CSS custom properties for consistency:
```typescript
meta: {
  design: {
    itemPadding: 'var(--osi-spacing-lg)',
    accentColor: 'var(--osi-color-accent)'
  }
}
```

### 3. Keep It Simple
Don't over-customize. Trust the defaults.

### 4. Test Responsiveness
Design parameters work across all breakpoints.

### 5. Use Semantic Colors
Use named colors for better theming support:
```typescript
accentColor: 'var(--osi-color-accent)'  // Good
accentColor: '#ff7900'                   // Less flexible
```

---

## API Reference

### SectionDesignParams Interface

```typescript
interface SectionDesignParams {
  // Preset
  preset?: 'default' | 'compact' | 'spacious' | 'minimal' | 'bold' | 'glass' | 'outlined' | 'flat';
  params?: Partial<SectionDesignParams>;  // Preset overrides

  // Colors
  itemBackground?: string;
  itemBorderColor?: string;
  accentColor?: string;
  labelColor?: string;
  valueColor?: string;

  // Spacing
  itemPadding?: string;
  itemGap?: string;
  sectionPadding?: string;

  // Borders
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';

  // Typography
  labelFontSize?: string;
  valueFontSize?: string;
  labelFontWeight?: string | number;
  valueFontWeight?: string | number;

  // Effects
  boxShadow?: string;
  backdropFilter?: string;
}
```

### Usage in CardSection

```typescript
interface CardSection {
  // ... other properties
  meta?: {
    design?: SectionDesignParams;
    // ... other meta properties
  };
}
```

---

## Advanced Topics

### Custom Presets

Create your own preset:

```typescript
const customPreset: SectionDesignParams = {
  itemBackground: '#1a1a2e',
  itemBorderColor: 'rgba(15, 76, 117, 0.5)',
  accentColor: '#0f4c75',
  borderRadius: '16px',
  itemPadding: '20px 24px',
  itemGap: '14px'
};

// Apply to section
meta: {
  design: customPreset
}
```

### Dynamic Parameters

Calculate parameters based on data:

```typescript
const getDesignForValue = (value: number): SectionDesignParams => {
  if (value > 100) {
    return { accentColor: '#22c55e', preset: 'bold' };  // Green, bold
  } else if (value > 50) {
    return { accentColor: '#eab308' };  // Yellow
  } else {
    return { accentColor: '#ef4444' };  // Red
  }
};

const section: CardSection = {
  type: 'analytics',
  fields: [...],
  meta: {
    design: getDesignForValue(performanceScore)
  }
};
```

### Theme Integration

Design parameters integrate with the global theme:

```typescript
// Light theme
:root {
  --osi-color-accent: #ff7900;
}

// Dark theme
[data-theme="dark"] {
  --osi-color-accent: #ffa347;
}

// Use in section
meta: {
  design: {
    accentColor: 'var(--osi-color-accent)'  // Adapts to theme
  }
}
```

---

## Troubleshooting

### Parameters Not Applied?
- Check spelling of parameter names
- Ensure `meta.design` is properly structured
- Verify CSS custom properties are available

### Preset Not Working?
- Check preset name spelling
- Ensure preset is registered
- Try with explicit params instead

### Colors Look Wrong?
- Check contrast ratios for accessibility
- Test in both light/dark themes
- Use CSS custom properties for better theming

---

## Related Documentation

- [SECTION_REFERENCE.md](./SECTION_REFERENCE.md) - Quick reference for all section types
- [SECTION_REGISTRY.md](./SECTION_REGISTRY.md) - Section registry documentation
- [SECTION_COMPARISON.md](./SECTION_COMPARISON.md) - Comparison of section types
- [THEMING_GUIDE.md](./THEMING_GUIDE.md) - Global theming system

---

*Last Updated: December 2, 2025*
*Consolidated from 4 separate documents*
*Phase 5: Documentation Consolidation*

