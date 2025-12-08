# 🎯 OSI Cards - Grid System Guide

**Version:** 1.5.5
**Last Updated:** December 4, 2025
**Status:** Complete

---

## 📋 Overview

The OSI Cards grid system uses an intelligent masonry layout that automatically arranges sections for optimal visual balance and space utilization.

**Key Features:**
- ✅ Responsive (1-4 columns based on width)
- ✅ Zero gaps (perfect bin packing)
- ✅ Smart column spanning
- ✅ Streaming support
- ✅ Virtual scrolling (for 50+ sections)
- ✅ FLIP animations

---

## 🏗️ Architecture

### Components

**MasonryGridComponent** - Main grid component (2,739 lines)
- Handles layout calculation
- Manages responsive behavior
- Supports streaming mode
- Virtual scrolling for large lists

**SimpleGridComponent** - Example implementation (250 lines)
- Shows how to use LayoutCalculationService
- Clean, testable pattern
- Recommended for new custom grids

### Services

**LayoutCalculationService** - Layout calculations
- Calculate optimal columns
- Position sections
- Estimate heights
- Get statistics

**LayoutStateManager** - State management
- Track layout state
- Manage positions
- Observable streams
- History support

---

## 🎨 Usage

### Basic Usage

```typescript
import { MasonryGridComponent } from 'osi-cards-lib';

@Component({
  template: `
    <app-masonry-grid
      [sections]="sections"
      [gap]="16"
      [optimizeLayout]="true">
    </app-masonry-grid>
  `
})
export class MyComponent {
  sections: CardSection[] = [...];
}
```

### With Streaming

```typescript
<app-masonry-grid
  [sections]="sections"
  [isStreaming]="true"
  [optimizeLayout]="true"
  (layoutChange)="onLayoutChange($event)">
</app-masonry-grid>
```

### With Virtual Scrolling

```typescript
<app-masonry-grid
  [sections]="sections"
  [enableVirtualScroll]="true"
  [virtualThreshold]="50"
  [virtualBuffer]="5">
</app-masonry-grid>
```

---

## ⚙️ Configuration

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sections` | `CardSection[]` | `[]` | Sections to display |
| `gap` | `number` | `12` | Gap between sections (px) |
| `minColumnWidth` | `number` | `260` | Minimum column width (px) |
| `maxColumns` | `number` | `4` | Maximum columns |
| `containerWidth` | `number?` | `undefined` | Explicit width (auto-detected if not provided) |
| `isStreaming` | `boolean` | `false` | Enable streaming mode |
| `optimizeLayout` | `boolean` | `true` | Enable optimization |
| `enableVirtualScroll` | `boolean` | `false` | Enable virtual scrolling |
| `virtualThreshold` | `number` | `50` | Min sections for virtual scroll |
| `virtualBuffer` | `number` | `5` | Buffer size for virtual scroll |
| `debug` | `boolean` | `false` | Enable debug logging |

### Output Events

| Event | Type | Description |
|-------|------|-------------|
| `layoutChange` | `MasonryLayoutInfo` | Emitted when layout changes |
| `sectionEvent` | `SectionRenderEvent` | Emitted on section interactions |
| `layoutLog` | `LayoutLogEntry` | Detailed layout logs |

---

## 📐 Layout Algorithms

### Algorithm Selection

The grid uses multiple layout algorithms:

**1. Skyline Algorithm** (Default)
- Maintains skyline of column heights
- Places sections in shortest column
- Good for mixed content

**2. Bin Packing** (With `optimizeLayout: true`)
- Perfect bin packing algorithm
- Zero gaps
- Optimal space utilization

**3. Row-First** (Legacy)
- Fills rows left-to-right
- Simple and predictable

---

## 🎯 Column Calculation

### Responsive Breakpoints

```typescript
containerWidth < 640px   → 1 column (mobile)
containerWidth < 900px   → 2 columns (tablet)
containerWidth < 1200px  → 3 columns (desktop)
containerWidth ≥ 1200px  → 4 columns (wide)
```

### Column Spanning

Sections can span multiple columns based on content:

```typescript
info, list sections       → 1 column (prefer narrow)
analytics, chart sections → 2 columns (prefer wide)
map, image sections       → 3-4 columns (prefer full width)
```

---

## ⚡ Performance

### Virtual Scrolling

For cards with 50+ sections, enable virtual scrolling:

```typescript
<app-masonry-grid
  [sections]="manySections"
  [enableVirtualScroll]="true"
  [virtualThreshold]="50"
  [virtualBuffer]="5">
</app-masonry-grid>
```

**Benefits:**
- Only renders visible sections
- Smooth scrolling
- Handles 1000+ sections easily

### Optimization

Enable layout optimization for better results:

```typescript
<app-masonry-grid
  [sections]="sections"
  [optimizeLayout]="true">
</app-masonry-grid>
```

**Features:**
- 5-pass compaction algorithm
- Visual balance optimization
- Gap minimization
- Content-aware placement

---

## 🎬 Animations

### Streaming Animations

Sections animate in as they appear:

```typescript
<app-masonry-grid
  [sections]="sections"
  [isStreaming]="true">
</app-masonry-grid>
```

**Animation:**
- Fade in + slide up
- Staggered timing
- Only new sections animate
- Smooth transitions

### FLIP Animations

Layout changes use FLIP technique:
- First: Record initial positions
- Last: Apply changes
- Invert: Calculate delta
- Play: Smooth animation

**Result:** 60fps smooth transitions

---

## 🐛 Troubleshooting

### Sections Not Displaying

**Problem:** Sections array is empty
**Solution:** Verify data is loaded

**Problem:** Container width is 0
**Solution:** Ensure parent has width, use `containerWidth` input

### Layout Flickering

**Problem:** Rapid recalculation
**Solution:** Use `isStreaming` flag during streaming

### Performance Issues

**Problem:** Slow with many sections
**Solution:** Enable virtual scrolling

```typescript
[enableVirtualScroll]="true"
[virtualThreshold]="50"
```

---

## 📊 Advanced Features

### Layout Statistics

```typescript
@ViewChild(MasonryGridComponent) grid!: MasonryGridComponent;

ngAfterViewInit() {
  this.grid.layoutChange.subscribe(info => {
    console.log('Columns:', info.columns);
    console.log('Container width:', info.containerWidth);
  });
}
```

### Debug Mode

```typescript
<app-masonry-grid
  [sections]="sections"
  [debug]="true">
</app-masonry-grid>
```

**Output:** Detailed console logs of layout calculations

---

## 🎯 Best Practices

### 1. Provide Container Width

```typescript
// ✅ Good - Explicit width
<app-masonry-grid [containerWidth]="1200">

// ⚠️ OK - Auto-detected (may cause initial flicker)
<app-masonry-grid>
```

### 2. Use Streaming Flag

```typescript
// ✅ Good - Smooth streaming
<app-masonry-grid [isStreaming]="true">

// ❌ Bad - May cause flickering during streaming
<app-masonry-grid>
```

### 3. Enable Virtual Scrolling for Large Lists

```typescript
// ✅ Good - 100+ sections
<app-masonry-grid [enableVirtualScroll]="true">

// ❌ Bad - Performance issues with 100+ sections
<app-masonry-grid>
```

### 4. Optimize Layout

```typescript
// ✅ Good - Better visual balance
<app-masonry-grid [optimizeLayout]="true">

// ⚠️ OK - Faster but less optimal
<app-masonry-grid [optimizeLayout]="false">
```

---

## 📚 Related Documentation

- [Architecture Documentation](../ARCHITECTURE_DOCUMENTATION.md)
- [Layout Services](../architecture/ARCHITECTURE_SERVICES.md)
- [Utilities Guide](../utilities/UTILITIES_GUIDE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)

---

## 🔧 Advanced Configuration

### Custom Layout Service

```typescript
import { LayoutCalculationService } from 'osi-cards-lib';

@Component({...})
export class CustomGridComponent {
  private layoutService = inject(LayoutCalculationService);

  calculateCustomLayout() {
    const result = this.layoutService.calculateLayout(
      this.sections,
      {
        containerWidth: 1200,
        gap: 16,
        columns: 3, // Force 3 columns
        optimize: true
      }
    );

    // Get statistics
    const stats = this.layoutService.getLayoutStatistics(result);
    console.log('Column utilization:', stats.columnUtilization);
  }
}
```

---

**Last Updated:** December 4, 2025
**Status:** Production Ready
**Version:** 1.5.5








