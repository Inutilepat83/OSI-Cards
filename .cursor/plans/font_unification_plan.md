# Font Unification Plan

## Issues Found

### 1. Font Size Inconsistencies
- **Hardcoded fallbacks**: `var(--text-xl, 1.125rem)`, `var(--text-2xl, 1.0625rem)`, `var(--text-2xl, 1.5rem)`
- **Custom variables with hardcoded fallbacks**: `var(--card-value-font-size-xl, 1.25rem)`, `var(--card-value-font-size-large, 1.2rem)`, `var(--card-value-font-size, 1rem)`
- **Hardcoded values**: `0.65rem`, `1.25rem`, `1.2rem`, `1rem`, `1.5rem`

### 2. Color Inconsistencies
- **Fallback chains**: `var(--accent-foreground, var(--primary-foreground))`
- **Section-specific with fallbacks**: `var(--osi-section-item-label-color, var(--muted-foreground))`
- **Inconsistent color tokens**: Some use `--foreground`, some use `--osi-section-item-value-color`

### 3. Letter-Spacing Inconsistencies
- **Different values**: `0.05em`, `-0.015em`, `-0.02em`
- **Missing letter-spacing**: Some elements don't have it defined

### 4. Line-Height Inconsistencies
- **Hardcoded values**: `line-height: 1` (should use tokens)
- **Inconsistent usage**: Some use tokens, some use hardcoded

## Unified Typography System

### Standard Font Sizes (from design tokens)
- `--text-xs`: 0.6875rem (11px) - Labels, captions
- `--text-sm`: 0.75rem (12px) - Secondary text, metadata
- `--text-base`: 0.8125rem (13px) - Body text, item titles
- `--text-md`: 0.875rem (14px) - Emphasized text
- `--text-lg`: 1.0625rem (17px) - Sub-headers
- `--text-xl`: 1.1875rem (19px) - Section headers
- `--text-2xl`: 1.375rem (22px) - Large values, metrics
- `--text-3xl`: 1.625rem (26px) - Large headers

### Standard Font Weights
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700

### Standard Line Heights
- `--leading-tight`: 1.2
- `--leading-snug`: 1.3
- `--leading-normal`: 1.4
- `--leading-relaxed`: 1.5

### Standard Letter Spacing
- Labels: `0.05em`
- Numbers: `-0.02em`
- Body text: `normal` (0)

### Standard Colors
- Primary text: `var(--foreground)`
- Secondary text: `var(--muted-foreground)`
- Accent: `var(--accent)`
- Accent foreground: `var(--accent-foreground)`

## Implementation Plan

1. Remove all hardcoded fallback values
2. Replace custom variables with standard tokens
3. Standardize letter-spacing values
4. Ensure all colors use standard tokens
5. Apply unified mixins consistently
