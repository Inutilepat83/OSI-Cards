# Grid System Architecture

## Overview

The OSI Cards grid system uses a sophisticated layout engine that combines multiple packing algorithms with intelligent section placement to create optimal masonry layouts.

## Architecture Components

### Core Services

1. **MasonryGridLayoutService** (`masonry-grid-layout.service.ts`)
   - Main orchestrator for layout calculations
   - Delegates to packing algorithms (ColumnPacker, RowPacker)
   - Handles algorithm selection and configuration

2. **HeightEstimationService** (`height-estimation.service.ts`)
   - Centralized height estimation with caching
   - Learns from actual measurements
   - Provides consistent height estimates across the system

3. **SectionLayoutPreferenceService** (`section-layout-preference.service.ts`)
   - Manages section-specific layout preferences
   - Handles column span preferences and constraints

### Packing Algorithms

1. **ColumnPacker** (`column-packer.util.ts`)
   - FFDH (First Fit Decreasing Height) algorithm
   - Skyline algorithm for maximum compaction
   - Hybrid mode that switches based on gap count
   - Gap-aware placement with post-processing

2. **RowPacker** (`row-packer.util.ts`)
   - Row-first space-filling algorithm
   - Prioritizes filling rows completely
   - Allows section shrinking/expanding

### Layout Quality

- **LayoutQualityChecker** (`layout-quality-checker.util.ts`)
  - Validates layout quality
  - Provides quality scores and recommendations
  - Checks utilization, gap count, height variance

### Configuration

- **Layout Presets** (`layout-presets.config.ts`)
  - Pre-configured settings: performance, quality, balanced
  - Easy configuration with sensible defaults
  - Supports custom overrides

## Layout Flow

1. **Initial Calculation** (Phase 1)
   - Estimate section heights using HeightEstimationService
   - Calculate layout using selected packing algorithm
   - Apply positions to DOM

2. **Height Measurement** (Phase 2)
   - Measure actual section heights after render
   - Record measurements in HeightEstimationService
   - Detect significant differences

3. **Layout Refinement** (Phase 3)
   - Recalculate layout with actual heights
   - Only update if meaningful change detected
   - Smooth transition using requestAnimationFrame

## Key Features

### Two-Phase Layout
- Fast initial render with estimates
- Accurate final layout with actual heights
- Minimal layout shifts

### Adaptive Optimization
- Early exit when layout quality is excellent
- Adaptive pass limiting based on section count
- Performance metrics tracking

### Gap-Aware Placement
- Intelligent column selection
- Post-processing gap filling
- Section expansion/shrinking

### Caching
- Comprehensive cache key generation
- Selective cache invalidation
- Cache hit/miss metrics

## Configuration Presets

### Performance
- Minimal optimization
- Fast rendering
- Best for large datasets

### Quality
- Maximum optimization
- Best space utilization
- Best for static content

### Balanced (Default)
- Good balance
- Suitable for most use cases

## Migration Guide

### From Old API

The system maintains backward compatibility. Old inputs still work:

```typescript
// Old way (still works)
<app-masonry-grid
  [sections]="sections"
  [optimizeLayout]="true"
  [gap]="12"
/>

// New way (recommended)
<app-masonry-grid
  [sections]="sections"
  [preset]="'balanced'"
  [presetOverrides]="{ optimizationPasses: 3 }"
/>
```

### Breaking Changes

None - all changes are backward compatible.

## Performance Tips

1. Use `performance` preset for large datasets (>50 sections)
2. Enable virtual scrolling for very large lists
3. Disable two-phase layout if initial render speed is critical
4. Use `quality` preset only for static content

## Troubleshooting

### Poor Layout Quality

- Check layout quality validation warnings
- Try `quality` preset
- Increase `optimizationPasses`
- Enable `enableGapAwarePlacement`

### Performance Issues

- Use `performance` preset
- Enable virtual scrolling
- Reduce `optimizationPasses`
- Disable two-phase layout

### Layout Shifts

- Ensure two-phase layout is enabled
- Check height estimation accuracy
- Verify section content is stable




