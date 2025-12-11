# Style Encapsulation Audit & Fixes

## Issues Found

### 1. **:root Selectors in Shadow DOM Context**
Many SCSS files use `:root` selectors which don't work inside Shadow DOM. These need to be converted to `:host` or properly scoped.

**Affected Files:**
- `styles/non-critical.scss` - Uses `:root`
- `styles/micro-interactions.scss` - Uses `:root`
- `styles/critical.scss` - Uses `:root`
- `styles/components/sections/_enhanced-design-variables.scss` - Multiple `:root` selectors
- `styles/components/sections/_minimalistic-design.scss` - Uses `:root`
- `styles/_osi-cards-tokens.scss` - Multiple `:root` selectors
- And many more...

### 2. **ViewEncapsulation.None Components**
Several child components use `ViewEncapsulation.None`, which means they rely on styles being available within the Shadow DOM boundary:

- `masonry-grid.component.ts` - `ViewEncapsulation.None`
- `section-renderer.component.ts` - `ViewEncapsulation.None`
- `card-actions.component.ts` - `ViewEncapsulation.None`
- `card-streaming-indicator.component.ts` - `ViewEncapsulation.None`
- And others...

These components need all their styles to be included in the parent Shadow DOM's style bundle.

### 3. **Style Bundle Completeness**
The `_ai-card.scss` bundle imports many files, but we need to verify:
- All component styles are included
- All section styles are included
- No styles are missing that child components depend on

### 4. **Global Style Leakage**
Some utility classes in `src/styles.css` might leak if not properly scoped.

## Fixes Applied

### Fix 1: Created Component Styles Bundle ✅
**File:** `styles/components/_component-styles.scss`

Created a dedicated file that includes all styles from components using `ViewEncapsulation.None`:
- `masonry-grid.component` styles (`.masonry-container`, `.masonry-item`, animations)
- `section-renderer.component` minimal styles
- `card-streaming-indicator.component` styles
- Shared utility classes (`.sr-only`)

**Why:** Components with `ViewEncapsulation.None` rely on styles being available within the parent Shadow DOM. These styles must be included in the Shadow DOM bundle.

### Fix 2: Updated AI Card Bundle ✅
**File:** `styles/bundles/_ai-card.scss`

Added import for component-specific styles:
```scss
// 5b. Component-specific styles (for ViewEncapsulation.None components)
@import "../components/_component-styles";
```

This ensures all child component styles are available in the Shadow DOM.

### Fix 3: Style Encapsulation Strategy
The library uses a multi-layer approach:
1. **Shadow DOM** (`ai-card-renderer`) - Main encapsulation boundary
2. **ViewEncapsulation.None** (child components) - Styles inherited from Shadow DOM
3. **CSS Layers** - For easy overrides by consumers

### Windows-Specific Considerations

Windows may have issues with:
1. **CSS Variable Inheritance**: Ensure all CSS variables are explicitly set on `:host`
2. **Font Rendering**: Explicitly set font-family, font-size, line-height
3. **Box Model**: Use `box-sizing: border-box` explicitly
4. **Shadow DOM Polyfills**: Some older Windows browsers may need polyfills

**Recommendations:**
- All styles should explicitly set required properties (don't rely on inheritance)
- Use `!important` sparingly, only for critical overrides
- Test on Windows with different browsers (Edge, Chrome, Firefox)
- Verify CSS variables work correctly in Shadow DOM context

## Testing Checklist

- [ ] Styles work correctly in Shadow DOM
- [ ] No style leakage to host application
- [ ] All child components (ViewEncapsulation.None) have their styles
- [ ] CSS variables are properly scoped
- [ ] Windows-specific issues are resolved
- [ ] Cross-browser compatibility maintained

## Windows-Specific Considerations

Windows may have different behavior with:
- CSS variable inheritance
- Shadow DOM polyfills
- Font rendering
- Box model calculations

Ensure all styles explicitly set required properties rather than relying on inheritance.

---

# Style Consistency & Cross-Browser Reliability Audit (December 2025)

## Executive Summary

This audit evaluates the OSI Cards library's style architecture for **consistency**, **independence** (container-scoped theming), and **cross-browser/platform reliability**. The library should be fully independent—receiving theme information via `data-theme` attributes and CSS variables on the container element, without mutating global document state.

**Audit Scope:**
- Style entrypoints and shipping surface
- Library independence (no global theme mutation)
- Token system consistency (single source of truth)
- Cross-browser compatibility (stricter baseline: Safari/iOS 15.4+, Chrome 109+, Firefox ESR)

**Key Findings:**
- **P0 (Critical)**: `ThemeService` mutates `document.documentElement` globally—breaks library independence
- **P0 (Critical)**: `color-mix()` used without fallbacks—fails in Safari <16.2 (targeting 15.4+)
- **P1 (High)**: Multiple token sources with duplication—violates single-source-of-truth
- **P1 (High)**: `themes.scss` contains `:root` selectors—leaks globally if imported
- **P2 (Medium)**: Some `@supports` guards missing for modern CSS features

---

## 1. Style Entrypoints & Shipping Surface

### 1.1 Library Style Assets

**Location:** `projects/osi-cards-lib/ng-package.json`

All SCSS files from `src/lib/styles` are shipped as assets to consumers:
- **Input:** `./src/lib/styles/**/*.scss`
- **Output:** `/styles` in published package

**Finding:** ✅ **Correct** - Library styles are properly packaged for consumer import.

### 1.2 Style Entrypoints

#### Demo App (`src/styles.scss`)
```scss
@import "../projects/osi-cards-lib/src/lib/styles/styles";
```
- Uses **global** entrypoint (`_styles.scss`)
- Applies styles to `:root` via `@layer osi-cards`
- **Classification:** ✅ **Acceptable for demo** - Demo app can use global styles

#### Library Integration (Recommended)
```scss
@import "osi-cards-lib/styles/_styles-scoped";
```
- Uses **scoped** entrypoint (`_styles-scoped.scss`)
- Wraps all styles in `.osi-cards-container { }`
- **Classification:** ✅ **Correct for library mode** - Container-scoped, no global leakage

#### Storybook
- **Finding:** ⚠️ **Needs verification** - Storybook configuration doesn't explicitly import library styles
- **Recommendation:** Document which style entrypoint Storybook should use (likely scoped)

### 1.3 Style Bundle Structure

**Bundles Available:**
- `bundles/_all.scss` - Complete bundle (Shadow DOM context)
- `bundles/_ai-card.scss` - AI card-specific bundle
- `bundles/_sections.scss` - Section styles only
- `bundles/_tokens-only.scss` - Design tokens only
- `bundles/_base.scss` - Base styles

**Finding:** ✅ **Well-organized** - Multiple bundle options for different use cases.

---

## 2. Library Independence (No Global Theme Mutation)

### 2.1 JavaScript/TypeScript Global Side-Effects

#### P0: ThemeService Mutates `document.documentElement`

**File:** `projects/osi-cards-lib/src/lib/themes/theme.service.ts`

**Issues:**
1. **Line 84:** `this.rootElement = isPlatformBrowser(this.platformId) ? this.document.documentElement : null;`
2. **Line 720:** `this.rootElement.setAttribute('data-theme', theme);` - Sets global `data-theme`
3. **Line 423:** `this.rootElement!.style.setProperty(varName, value);` - Applies CSS vars to `<html>`
4. **Line 456:** `this.rootElement!.style.setProperty(key, value);` - Inline styles on `<html>`
5. **Lines 482-494:** `localStorage.setItem(storageKey, theme);` - Persists to global storage

**Impact:**
- ❌ **Breaks library independence** - Library mutates host app's document root
- ❌ **Causes conflicts** - Multiple library instances would overwrite each other
- ❌ **Not container-scoped** - Theme changes affect entire page

**Classification:** 🔴 **P0 - Not acceptable for library mode**

**Recommendation:**
- Refactor `ThemeService` to accept a target element (container) instead of defaulting to `documentElement`
- Make `ThemeService` opt-in or mark as "demo-only" utility
- Provide container-scoped alternative: `OsiThemeDirective` (already exists) should be the primary API

#### P0: ThemeService Exported in Public API

**File:** `projects/osi-cards-lib/src/public-api.ts` (Lines 198-200)

```typescript
export {
  ThemeService,
  ThemeServiceConfig,
  provideOSICardsTheme,
} from './lib/themes';
```

**Impact:**
- ❌ **Encourages global theming** - Consumers may inject `ThemeService` and use it globally
- ❌ **Not aligned with container-scoped model** - Library should receive theme via props/attributes

**Classification:** 🔴 **P0 - Public API issue**

**Recommendation:**
- Deprecate `ThemeService` export (or mark as "demo-only")
- Document that theming should be done via:
  - `<osi-cards-container [theme]="'day'">` (component input)
  - `[attr.data-theme]="theme"` (attribute binding)
  - CSS variables set on container element

#### Other Global DOM Access

**Files with `document.*` usage:**
- `theme.service.ts` - ✅ **Already flagged above**
- `testing/visual-regression-utils.ts` - ✅ **Acceptable** (test utilities)
- `core/configuration.ts` - ⚠️ **Needs review** - May access `window`/`document` for feature detection
- `services/utility-services.ts` - ⚠️ **Needs review** - May have global side-effects

**Finding:** Most global access is in test utilities (acceptable) or ThemeService (flagged above).

### 2.2 CSS Global Leakage

#### P1: `themes.scss` Contains `:root` Selectors

**File:** `projects/osi-cards-lib/src/lib/styles/themes.scss`

**Issues:**
- **Line 12:** `:root { ... }` - Global selector
- **Lines 328-352:** `:root:not([data-theme])` - Global fallback
- **Lines 359-362:** `:root { --osi-theme-transition-duration: ... }` - Global variables

**Impact:**
- ❌ **Leaks globally** - If consumer imports `themes.scss`, styles apply to entire page
- ❌ **Not container-scoped** - Defeats purpose of scoped integration

**Classification:** 🟠 **P1 - High priority**

**Recommendation:**
- Move `themes.scss` to demo-only directory OR
- Refactor to use `.osi-cards-container` selector instead of `:root`
- Document that `themes.scss` is for demo app only, not for library integration

#### Other `:root` Usage

**Files with `:root` selectors (31 files found):**
- `styles/themes.scss` - ✅ **Flagged above**
- `styles/_osi-cards-tokens.scss` - ⚠️ **Needs review** - May be used in demo only
- `styles/core/_variables.scss` - ✅ **Acceptable** - Used in demo app (`_styles.scss`)
- `styles/components/sections/_enhanced-design-variables.scss` - ⚠️ **Needs review**
- `styles/design-system/_tokens.scss` - ⚠️ **Needs review**

**Finding:** Most `:root` usage is in demo entrypoint (`_styles.scss`), which is acceptable. However, some files may be imported in scoped context—need verification.

**Recommendation:**
- Audit which files are imported by `_styles-scoped.scss` vs `_styles.scss`
- Ensure scoped entrypoint doesn't import files with `:root` selectors

---

## 3. Token System Consistency (Single Source of Truth)

### 3.1 Token Source Inventory

#### Primary Token Sources

1. **SCSS Mixins** (`styles/tokens/_master.scss`)
   - **Lines 608-722:** `@mixin osi-card-tokens()` - Defines `--osi-card-*` variables
   - **Lines 726-858:** `@mixin osi-section-tokens()` - Defines `--osi-section-*` variables
   - **Lines 862-933:** `@mixin osi-section-item-tokens()` - Defines `--osi-section-item-*` variables
   - **Status:** ✅ **Single source of truth for component tokens**

2. **JavaScript Presets** (`themes/presets.ts`)
   - **Lines 67-151:** `DEFAULT_THEME_PRESET` - Defines `--theme-*` variables
   - **Lines 158-227:** `HIGH_CONTRAST_THEME_PRESET` - High contrast variant
   - **Status:** ⚠️ **Separate source** - Applied via `ThemeService.applyThemeStylePreset()`

3. **Global Theme File** (`styles/themes.scss`)
   - **Lines 11-50:** Light theme `--osi-card-*` variables
   - **Lines 56-94:** Dark theme `--osi-card-*` variables
   - **Status:** ⚠️ **Potential duplication** - May overlap with SCSS mixins

#### Token Naming Patterns

**Patterns Found:**
- `--osi-card-*` (2,088 matches) - Core component tokens ✅
- `--theme-*` (194 matches) - Theme preset variables ✅
- `--ai-card-*` - Legacy aliases (backward compatibility) ✅
- `--section-*` - Legacy aliases (backward compatibility) ✅

**Finding:** ✅ **Naming is consistent** - Clear prefixes, no collisions detected.

### 3.2 Token Duplication Issues

#### P1: Theme Values Duplicated Across Sources

**Issue:** Same theme values defined in multiple places:

1. **SCSS Mixin** (`_master.scss` lines 1114-1122):
   ```scss
   --theme-ai-card-background: rgba(20, 20, 20, 0.6);
   ```

2. **JS Preset** (`presets.ts` line 74):
   ```typescript
   '--theme-ai-card-background': 'rgba(20, 20, 20, 0.6)',
   ```

3. **Global Theme** (`themes.scss` line 58):
   ```scss
   --osi-card-background: #0f172a; // Different value!
   ```

**Impact:**
- ❌ **Inconsistency risk** - Values may drift if updated in one place but not others
- ❌ **Maintenance burden** - Changes require updates in multiple files
- ⚠️ **Different values** - `themes.scss` uses different color values than presets

**Classification:** 🟠 **P1 - High priority**

**Recommendation:**
- **Option A:** Make SCSS mixins the single source, generate JS presets from SCSS
- **Option B:** Make JS presets the single source, generate SCSS variables from JS
- **Option C:** Create a shared token definition file (JSON/YAML) that both SCSS and JS consume
- **Immediate:** Document which source is authoritative for each token category

#### P2: Legacy Aliases Create Confusion

**Issue:** Multiple naming patterns for same concepts:
- `--osi-card-background` vs `--ai-card-background` vs `--card-background`
- `--osi-section-border` vs `--section-border`

**Finding:** ✅ **Aliases are intentional** - Used for backward compatibility, but adds complexity.

**Recommendation:**
- Document alias mapping clearly
- Consider deprecation path for legacy names
- Use TypeScript/SCSS to generate aliases automatically from primary names

### 3.3 Cascade/Layering Consistency

#### CSS Layers Usage

**Files using `@layer osi-cards`:**
- `_styles.scss` (line 17) - ✅ **Correct**
- `_styles-scoped.scss` (line 29) - ✅ **Correct**
- `bundles/_all.scss` - ✅ **Correct** (Shadow DOM context)

**Finding:** ✅ **Consistent** - All entrypoints use CSS layers correctly.

**Browser Support:** ✅ **Safari 15.4+ supports `@layer`** - No compatibility issues.

---

## 4. Cross-Browser/Platform Reliability

### 4.1 Browser Support Baseline

**Target Baseline (Stricter than `.browserslistrc`):**
- Safari/iOS 15.4+
- Chrome 109+ (Android WebView)
- Firefox ESR
- Edge 109+

**Current `.browserslistrc`:**
```
last 2 Chrome versions
last 1 Firefox version
last 2 Edge major versions
last 2 Safari major versions
last 2 iOS major versions
Firefox ESR
```

**Gap:** `.browserslistrc` allows newer Safari, but we're targeting 15.4+ (older).

### 4.2 CSS Feature Compatibility Matrix

#### P0: `color-mix()` Without Fallbacks

**Feature:** CSS `color-mix()` function

**Browser Support:**
- ✅ Safari 16.2+ (Dec 2022)
- ❌ Safari 15.4 (Mar 2022) - **NOT SUPPORTED**
- ✅ Chrome 111+
- ✅ Firefox 113+

**Usage Found:**
1. **JS Presets** (`presets.ts` lines 87, 128):
   ```typescript
   '--theme-card-background-hover': 'color-mix(in srgb, var(--background) 98%, var(--surface-contrast-color) 2%)',
   ```
   - ❌ **No fallback** - Applied via inline styles, no `@supports` guard possible

2. **SCSS Mixins** (`_master.scss` lines 1034-1040, 1058-1062):
   ```scss
   @supports (color: color-mix(in srgb, black 50%, white)) {
     --theme-card-background-hover: color-mix(...);
   }
   ```
   - ✅ **Has fallback** - Uses `@supports` guard

**Impact:**
- ❌ **Fails in Safari 15.4-16.1** - `color-mix()` in JS-applied variables will be invalid
- ❌ **Visual regression** - Hover states may not work correctly

**Classification:** 🔴 **P0 - Critical**

**Recommendation:**
- **Option A:** Remove `color-mix()` from JS presets, use static fallback colors
- **Option B:** Detect browser support in JS, conditionally apply `color-mix()` or fallback
- **Option C:** Always provide fallback variable: `--theme-card-background-hover-fallback: var(--background);`

#### P1: `backdrop-filter` Without Fallbacks

**Feature:** CSS `backdrop-filter: blur()`

**Browser Support:**
- ✅ Safari 9+ (iOS 9+)
- ✅ Chrome 76+
- ✅ Firefox 103+
- ⚠️ **Requires `-webkit-` prefix** in older Safari

**Usage Found:**
- `presets.ts` line 79: `'--theme-ai-card-backdrop-filter': 'blur(12px)'`
- `_master.scss` line 1052: `--theme-ai-card-backdrop-filter: blur(12px);`

**Finding:** ✅ **Generally safe** - Well-supported, but missing `-webkit-` prefix for older Safari.

**Recommendation:**
- Add `-webkit-backdrop-filter` fallback in SCSS
- Document that backdrop-filter may be ignored in very old browsers (graceful degradation)

#### P2: `container-type` / Container Queries

**Feature:** CSS Container Queries

**Browser Support:**
- ✅ Safari 16+ (Sep 2022)
- ❌ Safari 15.4 - **NOT SUPPORTED**
- ✅ Chrome 105+
- ✅ Firefox 110+

**Usage Found:**
- `scoped-theme.directive.ts` line 260: `container-type: inline-size;`
- `themes.scss` line 426: `container-type: inline-size;`

**Impact:**
- ⚠️ **Feature enhancement** - Not critical, but won't work in Safari 15.4
- ✅ **Graceful degradation** - Layout still works without container queries

**Classification:** 🟡 **P2 - Medium priority**

**Recommendation:**
- Add `@supports (container-type: inline-size)` guard
- Document that container queries are progressive enhancement

#### Other Modern CSS Features

| Feature | Safari 15.4 | Risk | Status |
|---------|-------------|------|--------|
| `@layer` | ✅ Yes | Low | ✅ Safe |
| `:host-context()` | ✅ Yes | Low | ✅ Safe (Shadow DOM) |
| `contain: content` | ✅ Yes | Low | ✅ Safe |
| `isolation: isolate` | ✅ Yes | Low | ✅ Safe |
| `prefers-color-scheme` | ✅ Yes | Low | ✅ Safe |
| `prefers-reduced-motion` | ✅ Yes | Low | ✅ Safe |
| `forced-colors` | ⚠️ Partial | Medium | ⚠️ Needs testing |

### 4.3 JavaScript Feature Compatibility

#### Media Query List API

**Usage:** `theme.service.ts` line 651:
```typescript
this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
fromEvent<MediaQueryListEvent>(this.mediaQueryList, 'change')
```

**Browser Support:**
- ✅ Safari 6+ (well-supported)
- ✅ All modern browsers

**Finding:** ✅ **Safe** - `matchMedia` and `MediaQueryList` are well-supported.

---

## 5. Demo vs Library Divergence

### 5.1 Style Entrypoint Differences

| Aspect | Demo App | Library Integration |
|--------|----------|---------------------|
| Entrypoint | `_styles.scss` | `_styles-scoped.scss` |
| Scope | `:root` (global) | `.osi-cards-container` (scoped) |
| Theme Application | `ThemeService` (global) | `[attr.data-theme]` (container) |
| CSS Variables | Applied to `<html>` | Applied to container element |

**Finding:** ✅ **Clear separation** - Demo and library have distinct entrypoints.

**Risk:** ⚠️ **Drift potential** - If demo-only styles leak into scoped bundle, consumers get unwanted styles.

**Recommendation:**
- Verify `_styles-scoped.scss` doesn't import demo-only files
- Add build-time check to ensure scoped bundle has no `:root` selectors

### 5.2 Theme Value Divergence

**Issue:** `themes.scss` (demo) uses different color values than `presets.ts` (library):

- `themes.scss` line 58: `--osi-card-background: #0f172a;` (dark theme)
- `presets.ts` line 74: `--theme-ai-card-background: rgba(20, 20, 20, 0.6);` (different!)

**Finding:** ⚠️ **Values differ** - Demo and library may render differently.

**Recommendation:**
- Align values between `themes.scss` and `presets.ts`
- Or document that they serve different purposes (demo vs library)

---

## 6. Prioritized Findings & Recommendations

### P0 (Critical) - Must Fix

1. **ThemeService Global Mutation**
   - **File:** `themes/theme.service.ts`
   - **Fix:** Refactor to accept container element, or mark as demo-only
   - **Impact:** Breaks library independence

2. **color-mix() Without Fallbacks in JS**
   - **File:** `themes/presets.ts`
   - **Fix:** Remove `color-mix()` from JS presets, use static fallback colors
   - **Impact:** Fails in Safari 15.4-16.1

3. **ThemeService Exported in Public API**
   - **File:** `public-api.ts`
   - **Fix:** Deprecate export or mark as demo-only
   - **Impact:** Encourages global theming pattern

### P1 (High) - Should Fix

4. **themes.scss Contains :root Selectors**
   - **File:** `styles/themes.scss`
   - **Fix:** Refactor to `.osi-cards-container` or move to demo-only
   - **Impact:** Leaks globally if imported

5. **Token Value Duplication**
   - **Files:** `tokens/_master.scss`, `themes/presets.ts`, `styles/themes.scss`
   - **Fix:** Establish single source of truth, generate others
   - **Impact:** Maintenance burden, inconsistency risk

### P2 (Medium) - Nice to Have

6. **Missing -webkit- Prefix for backdrop-filter**
   - **File:** `tokens/_master.scss`
   - **Fix:** Add `-webkit-backdrop-filter` fallback
   - **Impact:** May not work in very old Safari

7. **Container Queries Without @supports Guard**
   - **Files:** `directives/scoped-theme.directive.ts`, `styles/themes.scss`
   - **Fix:** Add `@supports` guard (progressive enhancement)
   - **Impact:** Feature enhancement, not critical

---

## 7. Implementation Roadmap

### Phase 1: Critical Fixes (P0)
1. Refactor `ThemeService` to be container-scoped or demo-only
2. Remove `color-mix()` from JS presets, add fallback colors
3. Deprecate `ThemeService` export or add clear documentation

### Phase 2: High Priority (P1)
4. Refactor `themes.scss` to use container selector
5. Consolidate token sources (choose single source of truth)

### Phase 3: Polish (P2)
6. Add `-webkit-` prefixes where needed
7. Add `@supports` guards for progressive enhancement

---

## 8. Testing Recommendations

### Cross-Browser Testing Matrix

| Browser | Version | OS | Status |
|---------|---------|----|--------|
| Safari | 15.4 | iOS 15.4 | ⚠️ Test `color-mix()` fallback |
| Safari | 16.2+ | iOS 16.2+ | ✅ Full support |
| Chrome | 109+ | Android | ✅ Full support |
| Firefox | ESR | Desktop | ✅ Full support |
| Edge | 109+ | Windows | ✅ Full support |

### Test Scenarios
1. **Container-scoped theming:** Verify theme applies only to `.osi-cards-container`
2. **No global mutation:** Verify `document.documentElement` is not modified
3. **Fallback colors:** Test in Safari 15.4, verify hover states work
4. **Multiple instances:** Test multiple cards with different themes on same page

---

## 9. Documentation Updates Needed

1. **Integration Guide:**
   - Document container-scoped theming pattern
   - Show example: `<osi-cards-container [theme]="'day'">`
   - Warn against using `ThemeService` in library mode

2. **Browser Support:**
   - Update browser support matrix
   - Document Safari 15.4 limitations (`color-mix()`)
   - List progressive enhancements

3. **Token System:**
   - Document token naming conventions
   - Explain alias system
   - Specify which source is authoritative

---

**Audit Date:** December 11, 2025
**Auditor:** AI Assistant (Auto)
**Next Review:** After P0 fixes implemented

