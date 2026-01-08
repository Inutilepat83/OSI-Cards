# Animation Guidelines

**Last Updated:** December 2024
**Status:** Standardized Animation System

## Overview

The OSI Cards design system uses a unified animation system for consistent, performant animations across all section items and fields.

## Standard Animation Mixin

### Primary Mixin: `@include item-animation`

Use this mixin for all item/field animations:

```scss
.my-item {
  @include item-animation;
}
```

**What it provides:**
- `.item-streaming` - Animation during streaming
- `.item-entered` - Completed state (animation removed)
- `.item-stagger-0` through `.item-stagger-15` - Staggered delays

## Animation Tokens

All animations use standardized timing tokens:

```scss
// Animation duration
--osi-section-item-animation-duration: 220ms;

// Animation easing
--osi-section-item-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);

// Stagger delay between items
--osi-section-item-stagger-delay: 30ms;

// Motion distance for transform animations
--osi-motion-distance-sm: 8px;
```

## Animation Keyframes

### Standard Keyframe: `item-stream`

Single unified keyframe for all item animations:

```scss
@keyframes item-stream {
  0% {
    opacity: 0;
    transform: translate3d(0, var(--osi-motion-distance-sm), 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
```

## Usage Examples

### Basic Item Animation

```scss
.list-item {
  @include item-animation;
}
```

### With Component Class

```scss
.info-field {
  @include item-animation;
}
```

## Class Naming Convention

### Standard Classes

- `.item-streaming` - Apply during animation
- `.item-entered` - Apply after animation completes
- `.item-stagger-0` to `.item-stagger-15` - Stagger delays

### Usage in TypeScript/HTML

```typescript
// Mark item as streaming
item.element.classList.add('item-streaming', 'item-stagger-0');

// After animation completes
item.element.classList.remove('item-streaming');
item.element.classList.add('item-entered');
```

## When to Use Animations

### Streaming Mode
- Use when content is being loaded/streamed incrementally
- Apply `.item-streaming` + stagger class when item appears
- Remove `.item-streaming` and add `.item-entered` when animation completes

### Initial Load
- Use for entrance animations when section first renders
- Apply same pattern as streaming mode

### User Interactions
- Do NOT use these animations for user interactions (clicks, hovers)
- Use CSS transitions via `--osi-section-item-transition` instead

## Reduced Motion Support

All animations automatically respect `prefers-reduced-motion`:

```scss
@media (prefers-reduced-motion: reduce) {
  animation: none !important;
}
```

Animations are disabled when user prefers reduced motion.

## Migration Guide

### Old Pattern (Deprecated)

```scss
// ❌ Old - Don't use
@include section-item-animation;
@include legacy-item-animation;
@include stream-animation;
```

### New Pattern (Standardized)

```scss
// ✅ New - Use this
@include item-animation;
```

### Class Name Changes

**Old class names** (deprecated but still supported):
- `.section-item-streaming` → `.item-streaming`
- `.section-item-entered` → `.item-entered`
- `.field-streaming` → `.item-streaming`
- `.field-entered` → `.item-entered`

**New class names** (standardized):
- `.item-streaming` ✅
- `.item-entered` ✅
- `.item-stagger-0` through `.item-stagger-15` ✅

## Best Practices

1. **Always use the mixin** - Don't write custom animation CSS
2. **Use standardized tokens** - Don't hardcode timing values
3. **Respect reduced motion** - Animations are automatically disabled
4. **One animation per item** - Don't stack multiple animations
5. **Clean up classes** - Remove animation classes after completion

## Troubleshooting

### Animation not working?
- Check that `@include item-animation` is applied
- Verify class names match: `.item-streaming`, not `.section-item-streaming`
- Ensure animation classes are added/removed at correct times

### Inconsistent timing?
- Use `--osi-section-item-animation-duration` token
- Don't override with custom timing values
- Check for conflicting transition/animation rules

### Stagger not working?
- Verify stagger class: `.item-stagger-0` through `.item-stagger-15`
- Check that `--osi-section-item-stagger-delay` token is defined
- Ensure items are being added sequentially

---

**See also:**
- [CARD_DESIGN_SYSTEM_ANALYSIS.md](./CARD_DESIGN_SYSTEM_ANALYSIS.md) - Full design system analysis
- [CONFLICT_MATRIX.md](./CONFLICT_MATRIX.md) - Conflict resolution guide
