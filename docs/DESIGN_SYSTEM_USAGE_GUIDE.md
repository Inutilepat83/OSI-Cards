# Design System Usage Guide

> **How to use the OSI-Cards design system for consistent, maintainable sections**
>
> **Purpose**: Ensure all sections look consistent while making them easy to maintain
> **Key Principle**: Define common patterns in the design system, allow section-specific features when needed

---

## 📐 Design System Architecture

### Three-Layer Approach

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Design Tokens (Variables)            │
│  - Colors, spacing, typography, etc.           │
│  - CSS custom properties                        │
│  - Defined once, used everywhere                │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: Base Patterns (Mixins)               │
│  - Grid layouts, card styles, typography       │
│  - Reusable SCSS mixins                         │
│  - Common structural patterns                   │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Section-Specific Styles              │
│  - Unique section features                      │
│  - Built on top of base patterns                │
│  - Minimal custom code                           │
└─────────────────────────────────────────────────┘
```

---

## 🎨 What Goes in the Design System

### ✅ **ALWAYS** Use Design System For:

#### 1. **Spacing** (Gap, Padding, Margin)
```scss
// ✅ DO: Use design tokens
gap: var(--osi-spacing-md);
padding: var(--osi-item-padding);
margin-bottom: var(--osi-section-gap);

// ❌ DON'T: Hardcode values
gap: 12px;
padding: 16px;
margin-bottom: 24px;
```

#### 2. **Colors** (Text, Background, Borders)
```scss
// ✅ DO: Use semantic tokens
color: var(--osi-foreground);
background: var(--osi-surface);
border-color: var(--osi-border-muted);

// ❌ DON'T: Hardcode colors
color: #f2f2f2;
background: #1a1a1a;
border-color: rgba(255, 255, 255, 0.06);
```

#### 3. **Typography** (Font Size, Weight, Line Height)
```scss
// ✅ DO: Use typography mixins
.item-title {
  @include item-title;  // Predefined style
}

.item-label {
  @include item-label;  // Uppercase, small, medium weight
}

// ❌ DON'T: Define from scratch
.item-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.375;
}
```

#### 4. **Layout Patterns** (Grid, List, Flexbox)
```scss
// ✅ DO: Use layout mixins
.contacts-grid {
  @include grid-medium-cards;  // Auto-responsive grid
}

.info-list {
  @include list-layout;  // Vertical stack with gap
}

// ❌ DON'T: Recreate layouts
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
```

#### 5. **Card & Item Styles**
```scss
// ✅ DO: Use card mixins
.metric-card {
  @include card-elevated;  // Card with hover effect
}

.list-item {
  @include item-hoverable;  // Item with hover animation
}

// ❌ DON'T: Recreate card styles
.metric-card {
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all 200ms ease-out;
}
```

#### 6. **Animations & Transitions**
```scss
// ✅ DO: Use animation tokens
transition: all var(--osi-duration-normal) var(--osi-ease-out);
animation: fadeIn var(--osi-duration-medium) var(--osi-ease-out);

// ❌ DON'T: Hardcode timings
transition: all 200ms cubic-bezier(0, 0, 0.2, 1);
animation: fadeIn 300ms ease-out;
```

---

## 🔧 What Can Be Section-Specific

### ✅ **Section-Specific Features** (When Design System Doesn't Cover It)

#### 1. **Unique Visual Elements**
```scss
// Example: Chart section's graph container
.chart-canvas-wrapper {
  position: relative;
  height: 300px;  // Specific to charts
  min-height: 200px;

  // But still use design tokens for other properties
  padding: var(--osi-spacing-md);
  background: var(--osi-surface);
  border-radius: var(--osi-radius-md);
}
```

#### 2. **Specialized Layouts**
```scss
// Example: Map section's marker positioning
.map-marker {
  position: absolute;
  // Custom positioning logic
  left: calc(var(--marker-x) * 1%);
  top: calc(var(--marker-y) * 1%);

  // But use design system for appearance
  @include avatar(32px);
  border: 2px solid var(--osi-accent);
}
```

#### 3. **Interactive Behaviors**
```scss
// Example: Gallery section's lightbox
.gallery-item {
  @include card-interactive;  // Base interactive card

  // Section-specific: full-screen mode
  &.fullscreen {
    position: fixed;
    inset: 0;
    z-index: var(--osi-z-modal);
    border-radius: 0;
  }
}
```

---

## 📋 Step-by-Step: Creating a New Section

### Example: Creating a "Reviews Section"

#### Step 1: Structure the HTML (Use Shared Components)

```html
<div class="reviews-container">
  <!-- Use shared header component -->
  <lib-section-header
    [title]="section.title"
    [description]="section.description">
  </lib-section-header>

  <!-- Content grid/list -->
  <div class="reviews-grid" *ngIf="section.items?.length">
    <div class="review-card" *ngFor="let review of section.items">
      <!-- Use shared badge component -->
      <lib-badge [variant]="getRatingVariant(review.rating)">
        ⭐ {{ review.rating }}/5
      </lib-badge>

      <!-- Content structure -->
      <p class="review-text">{{ review.text }}</p>
      <span class="review-author">{{ review.author }}</span>
    </div>
  </div>

  <!-- Use shared empty state -->
  <lib-empty-state
    *ngIf="!section.items?.length"
    message="No reviews yet"
    icon="💬">
  </lib-empty-state>
</div>
```

#### Step 2: Style with Design System

```scss
@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/section-base' as base;

:host {
  display: block;
  width: 100%;
}

// Container - use design system
.reviews-container {
  @include base.section-container;
}

// Grid - use design system
.reviews-grid {
  @include base.grid-medium-cards;
}

// Card - use design system
.review-card {
  @include base.card-elevated;
  display: flex;
  flex-direction: column;
  gap: var(--osi-spacing-sm);
}

// Text - use design system typography
.review-text {
  @include base.item-description;
  font-style: italic;
  flex: 1;
}

.review-author {
  @include base.item-label;
  text-transform: none;  // Override for names
}

// Section-specific: star rating display (if needed)
.rating-stars {
  // Custom feature specific to reviews
  display: flex;
  gap: 2px;
  font-size: var(--osi-text-sm);  // Still use design tokens!
  color: var(--osi-warning);      // Use semantic color
}
```

---

## 🎯 Decision Matrix: Design System vs Custom

| Feature | Use Design System | Custom Implementation | Reasoning |
|---------|-------------------|----------------------|-----------|
| **Spacing/Gap** | ✅ Always | ❌ Never | Consistency critical |
| **Colors** | ✅ Always | ⚠️ Rarely (theming) | Consistency critical |
| **Typography** | ✅ Always | ❌ Never | Consistency critical |
| **Grid Layout** | ✅ Usually | ⚠️ If very unique | Consistency preferred |
| **Card Style** | ✅ Usually | ⚠️ If very unique | Consistency preferred |
| **Hover Effects** | ✅ Usually | ⚠️ If specialized | Consistency preferred |
| **Animations** | ✅ Timing/Easing | ✅ Custom keyframes | Timing consistent, behavior custom |
| **Chart Display** | ⚠️ Container only | ✅ Chart logic | Charts are specialized |
| **Map Markers** | ⚠️ Appearance | ✅ Positioning logic | Visual consistent, logic custom |
| **Modal Behavior** | ⚠️ Appearance | ✅ Open/close logic | Visual consistent, logic custom |

**Legend:**
- ✅ Recommended approach
- ⚠️ Use judgment, prefer design system when possible
- ❌ Avoid unless absolutely necessary

---

## 📦 Available Design Tokens

### Spacing Scale
```scss
--osi-spacing-xs: 4px    // Tight gaps
--osi-spacing-sm: 8px    // Item gaps
--osi-spacing-md: 12px   // Default (most common)
--osi-spacing-lg: 16px   // Section padding
--osi-spacing-xl: 24px   // Large spacing
--osi-spacing-2xl: 32px  // Major spacing
```

### Typography Scale
```scss
--osi-text-xs: 0.75rem   // 12px - Labels, captions
--osi-text-sm: 0.875rem  // 14px - Body small
--osi-text-base: 1rem    // 16px - Body default
--osi-text-md: 1.125rem  // 18px - Values, emphasis
--osi-text-lg: 1.25rem   // 20px - Section titles
--osi-text-xl: 1.5rem    // 24px - Page titles
--osi-text-2xl: 1.875rem // 30px - Large numbers
```

### Color System
```scss
// Surface (Backgrounds)
--osi-surface           // Base background
--osi-surface-raised    // Elevated/hover
--osi-surface-hover     // Light hover
--osi-surface-subtle    // Alternate rows

// Text
--osi-foreground        // Primary text
--osi-muted-foreground  // Secondary text
--osi-disabled-foreground // Disabled

// Brand
--osi-accent            // Primary brand color
--osi-accent-bright     // Hover state
--osi-accent-muted      // Subtle variant

// Status
--osi-success / --osi-success-bg
--osi-error / --osi-error-bg
--osi-warning / --osi-warning-bg
--osi-info / --osi-info-bg
```

---

## 🔨 Available Mixins

### Layout Mixins
```scss
@include section-container        // Standard section wrapper
@include grid-small-cards         // 140px min cards (analytics)
@include grid-medium-cards        // 200px min cards (contacts)
@include grid-large-cards         // 300px min cards (gallery)
@include grid-two-column          // 2-column layout
@include grid-three-column        // 3-column layout
@include list-layout              // Vertical stacking
```

### Card & Item Mixins
```scss
@include card-base                // Basic card appearance
@include card-elevated            // Card with shadow + hover
@include card-interactive         // Clickable card with effects
@include item-base                // Basic item appearance
@include item-hoverable           // Item with hover slide
@include item-with-border         // Item with border
```

### Typography Mixins
```scss
@include item-title               // Item headings (h4-h6)
@include item-label               // Uppercase labels
@include item-value               // Prominent values
@include item-description         // Secondary text
@include number-display           // Large numbers/metrics
```

### Content Structure Mixins
```scss
@include content-header           // Header with title + badges
@include content-body             // Main content area
@include content-footer           // Footer with actions
@include metadata-row             // Icons + text row
@include badge-container          // Badges wrapper
```

### Utility Mixins
```scss
@include avatar($size)            // Circular avatar
@include icon-wrapper($size)      // Icon container
@include divider                  // Horizontal line
@include sr-only                  // Screen reader only
@include focus-visible            // Keyboard focus style
```

---

## 💡 Real-World Examples

### Example 1: Analytics Section (Mostly Design System)

```scss
@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/section-base' as base;

.analytics-container {
  @include base.section-container;  // ✅ Design system
}

.analytics-grid {
  @include base.grid-small-cards;    // ✅ Design system
}

.metric-card {
  @include base.card-elevated;       // ✅ Design system
  min-height: 120px;                 // ✅ Section-specific
}

.metric-value {
  @include base.number-display;      // ✅ Design system
}
```

**Result**: ~90% design system, ~10% section-specific

---

### Example 2: Map Section (Hybrid Approach)

```scss
@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/section-base' as base;

.map-container {
  @include base.section-container;   // ✅ Design system
}

.map-canvas {
  // ✅ Section-specific: map positioning logic
  position: relative;
  height: 400px;

  // ✅ But use design system for appearance
  background: var(--osi-surface);
  border-radius: var(--osi-radius-md);
  border: 1px solid var(--osi-border-muted);
}

.map-marker {
  // ✅ Section-specific: absolute positioning
  position: absolute;

  // ✅ Design system: appearance
  @include base.avatar(32px);
  border: 2px solid var(--osi-accent);
}
```

**Result**: ~70% design system, ~30% section-specific

---

## 🚫 Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding Values

```scss
// ❌ BAD
.card {
  padding: 12px;
  gap: 8px;
  border-radius: 8px;
}

// ✅ GOOD
.card {
  padding: var(--osi-spacing-md);
  gap: var(--osi-spacing-sm);
  border-radius: var(--osi-radius-md);
}
```

### ❌ Mistake 2: Recreating Existing Patterns

```scss
// ❌ BAD
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

// ✅ GOOD
.contact-grid {
  @include grid-medium-cards;  // Already handles everything
}
```

### ❌ Mistake 3: Inconsistent Typography

```scss
// ❌ BAD (different sections using different sizes)
.info-title { font-size: 14px; }
.contact-title { font-size: 15px; }
.product-title { font-size: 16px; }

// ✅ GOOD (all use same mixin)
.info-title,
.contact-title,
.product-title {
  @include item-title;  // Consistent across all sections
}
```

---

## ✅ Checklist for New Sections

Before submitting a new section, verify:

- [ ] Uses `section-container` mixin for wrapper
- [ ] Uses shared components (SectionHeader, EmptyState, etc.)
- [ ] All spacing uses design tokens (`--osi-spacing-*`)
- [ ] All colors use semantic tokens (`--osi-*`)
- [ ] Typography uses mixins (`item-title`, `item-label`, etc.)
- [ ] Grid/list layout uses design system mixins
- [ ] Cards/items use design system mixins
- [ ] Animations use design system timing/easing
- [ ] Responsive behavior uses design system breakpoints
- [ ] Section-specific code is minimal and well-documented
- [ ] No hardcoded values (except truly unique features)
- [ ] Accessibility patterns followed (`focus-visible`, ARIA, etc.)

---

## 🎓 Learning Path

### Level 1: Beginner
1. Read design token reference
2. Use shared components (Header, EmptyState, Badge)
3. Copy existing section as template
4. Replace content, keep structure

### Level 2: Intermediate
1. Understand available mixins
2. Use layout mixins for grid/list patterns
3. Use typography mixins for text styles
4. Customize with design tokens

### Level 3: Advanced
1. Create section-specific features
2. Build on design system foundation
3. Know when to use custom code vs design system
4. Contribute new patterns back to design system

---

## 📚 Quick Reference

### Import Statements

```scss
// Always import these two
@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/section-base' as base;
```

### Most Common Patterns

```scss
// Container
.my-section-container {
  @include base.section-container;
}

// Grid
.my-grid {
  @include base.grid-medium-cards;
}

// Card
.my-card {
  @include base.card-elevated;
}

// Typography
.my-title { @include base.item-title; }
.my-label { @include base.item-label; }
.my-value { @include base.item-value; }
```

### Design Tokens Cheat Sheet

```scss
// Most used spacing
gap: var(--osi-spacing-md);        // 12px - Default
gap: var(--osi-spacing-sm);        // 8px - Items
padding: var(--osi-item-padding);  // 12px - Items

// Most used colors
color: var(--osi-foreground);            // Text
color: var(--osi-muted-foreground);      // Secondary text
background: var(--osi-surface);           // Background
background: var(--osi-surface-raised);    // Hover
border-color: var(--osi-border-muted);   // Border

// Most used typography
font-size: var(--osi-text-base);   // 16px - Body
font-size: var(--osi-text-sm);     // 14px - Small
font-size: var(--osi-text-xs);     // 12px - Labels
```

---

## 🔗 Related Documentation

- **SECTION_DESIGN_PATTERN_ANALYSIS.md** - Pattern analysis
- **SECTION_DESIGN_SYSTEM_SPEC.md** - Complete specifications
- **SECTION_CONSOLIDATION_QUICK_REFERENCE.md** - Quick lookup

---

*Design System Usage Guide v1.0 - December 2, 2025*
*Keep sections consistent, make them easy to maintain*
*Use design system for common patterns, custom code for unique features*

