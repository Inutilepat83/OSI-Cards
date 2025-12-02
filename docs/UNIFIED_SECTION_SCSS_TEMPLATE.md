# Unified Section SCSS Template

> **Standard SCSS structure for all sections - Compact, Responsive, Consistent Fonts**

---

## Universal Template

```scss
// =====================================================================
// {SECTION_NAME} SECTION - Compact, Responsive, Consistent
// =====================================================================

@use '../../../styles/design-system/tokens' as *;
@use '../../../styles/design-system/unified-sections' as unified;

:host {
  display: block;
  width: 100%;
}

// ═══════════════════════════════════════════════════════════════════
// CONTAINER
// ═══════════════════════════════════════════════════════════════════

.{section}-container {
  display: flex;
  flex-direction: column;
  gap: var(--osi-section-header-gap);
}

// ═══════════════════════════════════════════════════════════════════
// GRID/LIST LAYOUT (Choose appropriate pattern)
// ═══════════════════════════════════════════════════════════════════

// For grid layouts (analytics, contacts, gallery):
.{section}-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--osi-spacing-sm);

  @include mobile {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: var(--osi-spacing-xs);
  }
}

// For list layouts (info, list, news):
.{section}-list {
  background: var(--osi-surface);
  border: 1px solid var(--osi-border-muted);
  border-radius: var(--osi-radius-md);
  padding: var(--osi-spacing-xs);
  display: flex;
  flex-direction: column;
  gap: 0;
}

// ═══════════════════════════════════════════════════════════════════
// CARDS/ITEMS - Compact
// ═══════════════════════════════════════════════════════════════════

.{section}-card,
.{section}-item {
  padding: var(--osi-spacing-sm);
  gap: var(--osi-spacing-xs);
  border-radius: var(--osi-radius-sm);
  transition: all var(--osi-duration-normal) var(--osi-ease-out);

  // If not in a list, add border
  background: var(--osi-surface);
  border: 1px solid var(--osi-border-muted);

  // If in a list, use border-bottom
  &:not(:last-child) {
    border-bottom: 1px solid var(--osi-border-muted);
  }

  &:hover {
    background: var(--osi-surface-raised);
    transform: translateY(-2px);  // or translateX(4px) for lists
  }

  @include mobile {
    padding: var(--osi-spacing-xs);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY - Unified & Consistent
// ═══════════════════════════════════════════════════════════════════

.{element}-title {
  @include unified.unified-item-title;   // 14px, semibold, consistent
}

.{element}-label {
  @include unified.unified-item-label;   // 11.2px, uppercase, consistent
}

.{element}-value {
  @include unified.unified-item-value;   // 14px, semibold, consistent
}

.{element}-description {
  @include unified.unified-item-description;  // 12px, normal, consistent
}

// For numbers/metrics:
.{element}-number {
  @include unified.unified-number-display;  // 24px, bold, consistent
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSIVE (Unified breakpoints)
// ═══════════════════════════════════════════════════════════════════

@include mobile {
  // Container adjustments
  .{section}-container {
    gap: var(--osi-spacing-xs);
  }

  // Grid/list adjustments
  .{section}-grid {
    gap: var(--osi-spacing-xs);
  }

  .{section}-list {
    padding: 2px;
  }

  // Card/item adjustments
  .{section}-card,
  .{section}-item {
    padding: var(--osi-spacing-xs);
    gap: 2px;
  }
}

// Extra small devices
@media (max-width: 400px) {
  .{section}-grid {
    grid-template-columns: 1fr;  // Force single column
  }
}
```

---

## Key Principles

### 1. Compact by Default ✅
- Padding: `8px` (was 12-16px)
- Gap: `4-8px` (was 8-12px)
- Min-height: `90px` or auto (was 120px)
- Font sizes: Smaller, more compact

### 2. Unified Typography ✅
- All titles: `14px` semibold
- All labels: `11.2px` uppercase
- All values: `14px` semibold
- All descriptions: `12px` normal
- All numbers: `24px` bold

### 3. Responsive ✅
- Mobile breakpoint: `640px`
- Extra small: `400px`
- Tablets handled automatically
- Use unified mixins: `@include mobile`

### 4. Consistent Spacing ✅
- Use tokens: `--osi-spacing-*`
- No hardcoded values
- Mobile: Even more compact

---

*Template for all OSI-Cards sections*

