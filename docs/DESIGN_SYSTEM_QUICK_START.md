# Design System - Quick Start Guide

> **Get started with the OSI-Cards design system in 5 minutes**

---

## 🚀 Quick Start

### Creating a New Section

```typescript
// 1. Import shared components
import {
  SectionHeaderComponent,
  EmptyStateComponent,
  BadgeComponent
} from 'osi-cards-lib';

// 2. Add to component
@Component({
  selector: 'lib-my-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './my-section.component.html',
  styleUrl: './my-section.component.scss'
})

// 3. Use in template
<div class="my-section-container">
  <lib-section-header
    [title]="section.title"
    [description]="section.description">
  </lib-section-header>

  <!-- Your content here -->

  <lib-empty-state
    *ngIf="!hasData"
    message="No data available"
    icon="📝">
  </lib-empty-state>
</div>

// 4. Style with design system
@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/section-base' as base;

.my-section-container {
  @include base.section-container;  // ✅ Consistent spacing
}

.my-grid {
  @include base.grid-medium-cards;   // ✅ Responsive grid
}

.my-card {
  @include base.card-elevated;       // ✅ Elevated card style
}
```

**Time**: 15 minutes
**Result**: Production-ready, consistent section ✨

---

## 📦 Available Components

### SectionHeaderComponent
```html
<lib-section-header
  [title]="'My Title'"
  [description]="'Optional description'"
  [level]="3">
</lib-section-header>
```

### EmptyStateComponent
```html
<lib-empty-state
  message="No data available"
  icon="📭"
  actionLabel="Add Item"
  variant="minimal"
  size="medium"
  (action)="onAddItem()">
</lib-empty-state>
```

### BadgeComponent
```html
<lib-badge variant="success" size="sm">Completed</lib-badge>
<lib-badge variant="error" [pill]="true">High Priority</lib-badge>
```

### TrendIndicatorComponent
```html
<lib-trend-indicator
  trend="up"
  [value]="23.5"
  size="small">
</lib-trend-indicator>
```

### ProgressBarComponent
```html
<lib-progress-bar
  [value]="75"
  variant="success"
  [shimmer]="true">
</lib-progress-bar>
```

---

## 🎨 Design Tokens Cheat Sheet

### Most Used Spacing
```scss
gap: var(--osi-spacing-md);           // 12px (default)
gap: var(--osi-spacing-sm);           // 8px (items)
padding: var(--osi-item-padding);     // 12px (items)
padding: var(--osi-section-padding);  // 12px (sections)
```

### Most Used Colors
```scss
color: var(--osi-foreground);            // Primary text
color: var(--osi-muted-foreground);      // Secondary text
background: var(--osi-surface);          // Background
background: var(--osi-surface-raised);   // Hover state
border-color: var(--osi-border-muted);   // Borders
```

### Most Used Typography
```scss
font-size: var(--osi-text-base);  // 16px (default)
font-size: var(--osi-text-sm);    // 14px (small)
font-size: var(--osi-text-xs);    // 12px (labels)
```

---

## 📋 Common Patterns

### Grid Layout
```scss
.my-grid {
  @include base.grid-medium-cards;  // Auto-responsive, 200px min
}
```

### List Layout
```scss
.my-list {
  @include base.list-layout;  // Vertical stack with gap
}
```

### Card Style
```scss
.my-card {
  @include base.card-elevated;  // Card with shadow + hover
}
```

### Item Style
```scss
.my-item {
  @include base.item-hoverable;  // Item with hover slide
}
```

### Typography
```scss
.my-title { @include base.item-title; }
.my-label { @include base.item-label; }
.my-value { @include base.item-value; }
```

---

## ✅ Checklist

When creating a new section:

- [ ] Import shared components
- [ ] Use `<lib-section-header>`
- [ ] Use `<lib-empty-state>`
- [ ] Use `<lib-badge>` for status/priority
- [ ] Import design system in SCSS
- [ ] Use `@include section-container`
- [ ] Use design tokens for all spacing
- [ ] Use design tokens for all colors
- [ ] Use typography mixins for text
- [ ] Test accessibility (keyboard nav)

---

## 📖 Documentation

- **Full Guide**: `DESIGN_SYSTEM_USAGE_GUIDE.md`
- **All Patterns**: `SECTION_CONSOLIDATION_QUICK_REFERENCE.md`
- **Complete Spec**: `SECTION_DESIGN_SYSTEM_SPEC.md`
- **Navigation**: `SECTION_PATTERN_INDEX.md`

---

*Quick Start Guide - December 2, 2025*
*Get productive in 5 minutes!*

