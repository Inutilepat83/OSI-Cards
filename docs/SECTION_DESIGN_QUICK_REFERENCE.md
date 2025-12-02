# Section Design Parameters - Quick Reference

Quick reference for common design parameter use cases.

## Quick Start

### Inline Parameters

```typescript
const section: CardSection = {
  title: 'My Section',
  type: 'info',
  fields: [...],
  meta: {
    design: {
      accentColor: '#ff7900',
      itemBackground: '#1a1a1a',
      borderRadius: '12px'
    }
  }
};
```

### Use a Preset

```typescript
meta: {
  design: { preset: 'glass' }
}
```

### Preset with Overrides

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

---

## Common Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `accentColor` | `'#ff7900'` | Brand color |
| `itemBackground` | `'#1a1a1a'` | Item background |
| `itemBorderColor` | `'rgba(255,121,0,0.2)'` | Border color |
| `borderRadius` | `'12px'` | Corner radius |
| `itemPadding` | `'14px 18px'` | Internal padding |
| `itemGap` | `'10px'` | Gap between items |
| `labelColor` | `'#aaa'` | Label text color |
| `valueColor` | `'#fff'` | Value text color |

---

## Available Presets

| Preset | Style |
|--------|-------|
| `default` | System defaults |
| `compact` | Tight spacing |
| `spacious` | Generous spacing |
| `minimal` | Borderless, clean |
| `bold` | Strong borders |
| `glass` | Glassmorphism |
| `outlined` | Emphasis on borders |
| `flat` | Solid backgrounds |

---

## Common Scenarios

### Dark Theme Section
```typescript
meta: {
  design: {
    itemBackground: '#1a1a1a',
    itemBorderColor: '#333',
    labelColor: '#aaa',
    valueColor: '#fff'
  }
}
```

### Accent Highlight
```typescript
meta: {
  design: {
    accentColor: '#ff7900',
    itemBorderColor: 'rgba(255, 121, 0, 0.3)'
  }
}
```

### Compact Display
```typescript
meta: {
  design: {
    preset: 'compact'
  }
}
```

### Glassmorphism Effect
```typescript
meta: {
  design: {
    preset: 'glass'
  }
}
```

---

For complete parameter list and advanced usage, see the full documentation.
