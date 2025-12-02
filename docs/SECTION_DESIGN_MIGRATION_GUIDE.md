# Section Design Parameters - Migration Guide

Guide to update sections to support design parameters.

## Overview

Three steps to add design parameter support:
1. Import the directive
2. Apply it in template
3. Update styles to use CSS variables

---

## Quick Migration

### Step 1: Import Directive

```typescript
import { SectionDesignDirective } from '../../../directives';

@Component({
  imports: [
    CommonModule,
    SectionDesignDirective  // Add this
  ]
})
```

### Step 2: Apply in Template

```html
<div [libSectionDesign]="section.meta">
  <div class="section-grid">
    <div *ngFor="let item of items" class="section-item">
      <!-- Content -->
    </div>
  </div>
</div>
```

### Step 3: Update Styles

```scss
.section-item {
  // Use CSS variables with fallbacks
  background: var(--section-item-background, #1a1a1a);
  border: var(--section-item-border-width, 1px)
          solid
          var(--section-item-border-color, rgba(255, 255, 255, 0.06));
  border-radius: var(--section-border-radius, 8px);
  padding: var(--section-item-padding, 10px 12px);
  gap: var(--section-element-gap, 3px);
}
```

---

## Before & After Example

### Before (Hardcoded)

```typescript
styles: [`
  .metric-card {
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 10px 12px;
  }
`]
```

### After (Design Parameters)

```typescript
imports: [CommonModule, SectionDesignDirective],
styles: [`
  .metric-card {
    background: var(--section-item-background, #1a1a1a);
    border: var(--section-item-border-width, 1px)
            solid
            var(--section-item-border-color, rgba(255, 255, 255, 0.06));
    border-radius: var(--section-border-radius, 8px);
    padding: var(--section-item-padding, 10px 12px);
  }
`]
```

---

## Common CSS Variables

| Variable | Purpose |
|----------|---------|
| `--section-item-background` | Item background color |
| `--section-item-border-color` | Border color |
| `--section-border-radius` | Corner radius |
| `--section-item-padding` | Item padding |
| `--section-item-gap` | Gap between items |
| `--section-grid-gap` | Grid gap |
| `--section-accent-color` | Accent/brand color |

---

For complete variable list and advanced usage, see the full documentation.
