# Layout Configuration Guide

## Quick Start

The simplest way to configure the grid layout is using presets:

```typescript
<app-masonry-grid
  [sections]="sections"
  [preset]="'balanced'"
/>
```

## Presets

### Balanced (Default)

Good balance between performance and quality. Suitable for most use cases.

```typescript
[preset]="'balanced'"
```

**Settings:**
- Optimization: Enabled
- Two-phase layout: Enabled
- Optimization passes: 2
- Gap-aware placement: Enabled
- Packing mode: FFDH

### Performance

Optimized for speed. Best for large datasets or real-time updates.

```typescript
[preset]="'performance'"
```

**Settings:**
- Optimization: Disabled
- Two-phase layout: Disabled
- Optimization passes: 1
- Gap-aware placement: Disabled
- Virtual scrolling: Enabled (threshold: 20)

### Quality

Maximum space utilization and layout quality. Best for static content.

```typescript
[preset]="'quality'"
```

**Settings:**
- Optimization: Enabled
- Two-phase layout: Enabled
- Optimization passes: 5
- Gap-aware placement: Enabled
- Packing mode: Hybrid (FFDH + Skyline)

## Custom Configuration

Override specific preset settings:

```typescript
<app-masonry-grid
  [sections]="sections"
  [preset]="'balanced'"
  [presetOverrides]="{
    optimizationPasses: 3,
    enableGapFilling: true
  }"
/>
```

## Advanced Configuration

For full control, use individual inputs:

```typescript
<app-masonry-grid
  [sections]="sections"
  [gap]="12"
  [minColumnWidth]="260"
  [maxColumns]="4"
  [optimizeLayout]="true"
  [enableTwoPhaseLayout]="true"
  [enableVirtualScroll]="false"
  [virtualThreshold]="50"
/>
```

## Input Reference

### Basic Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `sections` | `CardSection[]` | `[]` | Sections to display |
| `gap` | `number` | `12` | Gap between sections in pixels |
| `minColumnWidth` | `number` | `260` | Minimum column width in pixels |
| `maxColumns` | `number` | `4` | Maximum number of columns |

### Optimization Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `optimizeLayout` | `boolean` | `true` | Enable layout optimization |
| `enableTwoPhaseLayout` | `boolean` | `true` | Enable two-phase layout (estimate → measure → refine) |
| `preset` | `LayoutPreset` | `'balanced'` | Layout preset: 'performance' \| 'quality' \| 'balanced' \| 'custom' |
| `presetOverrides` | `Partial<LayoutPresetConfig>` | `undefined` | Override specific preset settings |

### Virtual Scrolling

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `enableVirtualScroll` | `boolean` | `false` | Enable virtual scrolling for large lists |
| `virtualThreshold` | `number` | `50` | Minimum sections before virtual scrolling activates |

### Streaming

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `isStreaming` | `boolean` | `false` | Enable streaming mode for incremental updates |

## Preset Configuration Details

### Performance Preset

```typescript
{
  optimizeLayout: false,
  enableTwoPhaseLayout: false,
  optimizationPasses: 1,
  enableGapAwarePlacement: false,
  enableGapFilling: false,
  packingMode: 'ffdh',
  allowReordering: false,
  sortByHeight: false,
  enableVirtualScroll: true,
  virtualThreshold: 20
}
```

### Quality Preset

```typescript
{
  optimizeLayout: true,
  enableTwoPhaseLayout: true,
  optimizationPasses: 5,
  enableGapAwarePlacement: true,
  enableGapFilling: true,
  packingMode: 'hybrid',
  allowReordering: true,
  sortByHeight: true,
  enableVirtualScroll: false,
  virtualThreshold: 100
}
```

### Balanced Preset

```typescript
{
  optimizeLayout: true,
  enableTwoPhaseLayout: true,
  optimizationPasses: 2,
  enableGapAwarePlacement: true,
  enableGapFilling: true,
  packingMode: 'ffdh',
  allowReordering: false,
  sortByHeight: true,
  enableVirtualScroll: false,
  virtualThreshold: 50
}
```

## Best Practices

1. **Start with presets**: Use `balanced` for most cases
2. **Override selectively**: Only override settings you need to change
3. **Performance first**: Use `performance` preset for large datasets
4. **Quality when needed**: Use `quality` preset for static, print-ready content
5. **Monitor quality**: Check layout quality warnings in console

## Examples

### Basic Usage

```typescript
<app-masonry-grid [sections]="sections" />
```

### Performance-Optimized

```typescript
<app-masonry-grid
  [sections]="sections"
  [preset]="'performance'"
/>
```

### High-Quality Layout

```typescript
<app-masonry-grid
  [sections]="sections"
  [preset]="'quality'"
/>
```

### Custom Configuration

```typescript
<app-masonry-grid
  [sections]="sections"
  [preset]="'balanced'"
  [presetOverrides]="{
    optimizationPasses: 3,
    packingMode: 'hybrid',
    enableGapFilling: true
  }"
/>
```




