# Section Design Parameters

A comprehensive system for customizing section appearance without modifying component code.

## 🎯 What is This?

The Section Design Parameters system allows you to customize the visual appearance of section items including:

- **Colors** - Item backgrounds, borders, text, and accents
- **Borders** - Width, style, and radius
- **Spacing** - Padding and gaps
- **Animations** - Transitions and timing
- **Shadows** - Elevation and depth
- **Typography** - Font sizes and weights

All customizable through a simple, type-safe API.

## ⚡ Quick Start

```typescript
import { CardSection } from 'osi-cards-lib';

const section: CardSection = {
  title: 'My Custom Section',
  type: 'info',
  fields: [
    { label: 'Name', value: 'John Doe' },
    { label: 'Email', value: 'john@example.com' }
  ],
  meta: {
    design: {
      accentColor: '#ff7900',
      itemBackground: '#1a1a1a',
      borderRadius: '12px',
      itemPadding: '16px 20px'
    }
  }
};
```

## 📚 Documentation

### For Users

1. **[Quick Reference](../SECTION_DESIGN_QUICK_REFERENCE.md)** - One-page cheat sheet
2. **[Complete Guide](../SECTION_DESIGN_PARAMETERS.md)** - Full documentation with examples
3. **[Working Examples](../../examples/section-design-parameters-example.ts)** - 12 complete examples

### For Developers

1. **[Migration Guide](../SECTION_DESIGN_MIGRATION_GUIDE.md)** - How to update existing sections
2. **[Implementation Summary](../../SECTION_DESIGN_SYSTEM_SUMMARY.md)** - Technical overview
3. **[Analytics Example](../../projects/osi-cards-lib/src/lib/components/sections/analytics-section/analytics-section-design-example.md)** - Real component example

## 🎨 Key Features

### 1. Simple API

```typescript
meta: {
  design: {
    accentColor: '#ff7900',
    itemPadding: '12px 16px'
  }
}
```

### 2. Built-in Presets

```typescript
meta: {
  design: { preset: 'glass' }
}
```

Available presets: `default`, `compact`, `spacious`, `minimal`, `bold`, `glass`, `outlined`, `flat`

### 3. Type-Safe

```typescript
import { createSectionDesign } from 'osi-cards-lib/utils';

meta: {
  design: createSectionDesign({
    colors: { accentColor: '#ff7900' },
    spacing: { itemPadding: '16px' }
  })
}
```

### 4. Helper Functions

```typescript
import {
  createColorScheme,
  mergeDesignParams,
  getPresetParams
} from 'osi-cards-lib/utils';

// Generate color scheme from base color
const scheme = createColorScheme('#3b82f6');

// Merge multiple configurations
const design = mergeDesignParams(preset, colors, tweaks);
```

## 🔧 Available Parameters

### Colors (12 parameters)
`itemColor`, `itemBackground`, `itemBackgroundHover`, `itemBorderColor`, `itemBorderHover`, `accentColor`, `labelColor`, `valueColor`, `mutedColor`, `successColor`, `warningColor`, `errorColor`

### Borders (4 parameters)
`itemBorderWidth`, `itemBorderStyle`, `borderRadius`, `borderRadiusSmall`

### Spacing (4 parameters)
`itemGap`, `itemPadding`, `itemPaddingSmall`, `elementGap`

### Animation (4 parameters)
`animationDuration`, `animationEasing`, `disableAnimations`, `staggerDelay`

### Shadows (3 parameters)
`itemBoxShadow`, `itemBoxShadowHover`, `itemBoxShadowFocus`

### Typography (8 parameters)
`labelFontSize`, `valueFontSize`, `titleFontSize`, `labelFontWeight`, `valueFontWeight`, `fontFamily`, `letterSpacing`, `lineHeight`

### Custom Variables
`customVars` - Unlimited custom CSS variables

**Total: 35+ built-in parameters**

## 📖 Common Use Cases

### Brand Colors

```typescript
meta: {
  design: {
    accentColor: '#ff7900',
    itemBorderColor: 'rgba(255, 121, 0, 0.2)',
    labelColor: '#ff9d45'
  }
}
```

### Compact Mobile Layout

```typescript
meta: {
  design: {
    preset: 'compact',
    params: {
      itemPadding: '6px 8px',
      itemGap: '4px'
    }
  }
}
```

### Glass Effect

```typescript
meta: {
  design: {
    preset: 'glass'
  }
}
```

### Custom Animations

```typescript
meta: {
  design: {
    animationDuration: '400ms',
    animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    staggerDelay: 80
  }
}
```

## 🚀 Implementation (For Section Developers)

### 3 Simple Steps

#### 1. Import Directive

```typescript
import { SectionDesignDirective } from 'osi-cards-lib/directives';

@Component({
  imports: [CommonModule, SectionDesignDirective]
})
```

#### 2. Apply in Template

```html
<div [libSectionDesign]="section.meta">
  <!-- Your content -->
</div>
```

#### 3. Use CSS Variables

```scss
.item {
  background: var(--section-item-background, #fallback);
  border-color: var(--section-item-border-color, #fallback);
  padding: var(--section-item-padding, 12px);
}
```

See [Migration Guide](../SECTION_DESIGN_MIGRATION_GUIDE.md) for details.

## 🎓 Examples

### Basic

```typescript
meta: {
  design: {
    accentColor: '#00d9ff',
    itemBackground: '#1a1a2e',
    borderRadius: '10px'
  }
}
```

### With Preset

```typescript
meta: {
  design: {
    preset: 'spacious',
    params: {
      accentColor: '#ff7900'
    }
  }
}
```

### Type-Safe

```typescript
import { createSectionDesign } from 'osi-cards-lib/utils';

meta: {
  design: createSectionDesign({
    colors: { accentColor: '#ff7900' },
    spacing: { itemPadding: '16px' },
    animations: { staggerDelay: 50 }
  })
}
```

### Color Scheme

```typescript
import { createColorScheme } from 'osi-cards-lib/utils';

meta: {
  design: createColorScheme('#3b82f6', {
    generateHover: true,
    generateBorder: true
  })
}
```

See [examples/section-design-parameters-example.ts](../../examples/section-design-parameters-example.ts) for 12 complete examples.

## 🎨 Presets

| Preset | Description |
|--------|-------------|
| `default` | System defaults |
| `compact` | Tight spacing for dense layouts |
| `spacious` | Generous spacing for comfort |
| `minimal` | Borderless, clean design |
| `bold` | Strong visual presence |
| `glass` | Modern glassmorphism |
| `outlined` | Emphasis on borders |
| `flat` | Solid backgrounds, no shadows |

## 🔗 API Reference

### Types

```typescript
SectionDesignParams
SectionDesignConfig
SectionDesignPreset
```

### Functions

```typescript
getSectionDesignParams()
createSectionDesign()
createColorScheme()
mergeDesignParams()
validateDesignParams()
getPresetParams()
getAvailablePresets()
```

See [Complete Guide](../SECTION_DESIGN_PARAMETERS.md) for full API documentation.

## ✅ Benefits

- **Easy to Use** - Simple, intuitive API
- **Easy to Maintain** - Centralized, organized, typed
- **Type-Safe** - Full TypeScript support
- **Flexible** - Presets, custom params, or both
- **Consistent** - CSS variables throughout
- **Non-Breaking** - Optional, backward compatible
- **Extensible** - Easy to add parameters
- **Performant** - CSS variables are fast

## 📁 File Organization

```
docs/
  ├── SECTION_DESIGN_PARAMETERS.md          # Complete guide
  ├── SECTION_DESIGN_QUICK_REFERENCE.md     # Quick reference
  └── SECTION_DESIGN_MIGRATION_GUIDE.md     # Migration guide

projects/osi-cards-lib/src/lib/
  ├── models/section-design-params.model.ts # Types & presets
  ├── directives/section-design.directive.ts # Auto-apply directive
  └── utils/section-design.utils.ts         # Helper functions

examples/
  └── section-design-parameters-example.ts   # 12 working examples
```

## 🆘 Troubleshooting

### Design not applying?

1. Check directive is imported and applied
2. Verify `meta: { design: {...} }` structure
3. Check CSS variables have fallbacks

### Colors not visible?

1. Ensure valid color format
2. Check color contrast
3. Verify CSS variable names

See [Quick Reference](../SECTION_DESIGN_QUICK_REFERENCE.md) for more troubleshooting tips.

## 🤝 Contributing

To add new design parameters:

1. Add to `SectionDesignParams` interface
2. Add CSS variable mapping to directive
3. Update documentation
4. Add example usage

See [Implementation Summary](../../SECTION_DESIGN_SYSTEM_SUMMARY.md) for architecture details.

## 📄 License

Part of the OSI Cards library.

---

**Ready to customize your sections?** Start with the [Quick Reference](../SECTION_DESIGN_QUICK_REFERENCE.md)!



