# Ultra-Compact Design System

## Master Token System for OSI Cards Sections

All 15 sections now follow this unified, ultra-compact design system for maximum consistency and minimum code.

---

## 🎯 **Core Principles**

1. **200px/400px Column Strategy**
   - Compact sections: 200px minimum (can be 2 side-by-side)
   - Full-width sections: 400px minimum (need space for content)

2. **Height Optimization**
   - Every pixel counts
   - Target: 80-150px for cards, 40-55px for list items

3. **Consistent Spacing**
   - 1-2-3-4-6-8 pixel scale
   - Avoid 5px, 7px, 9px, 11px

4. **Unified Typography**
   - 0.55rem to 1.2rem range
   - Line heights: 1.0 to 1.4

---

## 📐 **Spacing Tokens**

```scss
--uc-space-1: 1px
--uc-space-2: 2px
--uc-space-3: 3px
--uc-space-4: 4px    // Most common internal gap
--uc-space-6: 6px    // Item padding
--uc-space-8: 8px    // Card padding, grid gap
```

### **Standard Usage**
- **Card padding**: `--uc-card-padding` (8px)
- **Item padding**: `--uc-item-padding` (6px 8px)
- **Internal gap**: `--uc-internal-gap` (4px)
- **Grid gap**: `--uc-grid-gap` (8px)

---

## 🔤 **Typography Tokens**

```scss
--uc-text-sm: 0.6rem     // Labels (9.6px)
--uc-text-md: 0.7rem     // Body text (11.2px)
--uc-text-lg: 0.75rem    // Titles (12px)
--uc-text-xl: 0.8rem     // Values (12.8px)
--uc-text-2xl: 0.95rem   // Large values (15.2px)
--uc-text-3xl: 1.1rem    // Metrics (17.6px)
```

### **Line Heights**
```scss
--uc-leading-tight: 1.1   // Labels
--uc-leading-snug: 1.2    // Titles
--uc-leading-normal: 1.3  // Body
```

---

## 📏 **Height Standards**

### **200px Column Cards**
```scss
Analytics:     85px   (--uc-card-height-200px: 80px)
Financials:    80px
Contact:       140px  (--uc-card-height-contact)
Gallery:       150px  (--uc-card-height-gallery)
News:          210px  (--uc-card-height-news)
Social:        105px  (--uc-card-height-social)
Network:       105px  (--uc-card-height-network)
Quotation:     130px  (--uc-card-height-quote)
Brand Colors:  110px  (--uc-card-height-color)
```

### **400px Full-Width Items**
```scss
Info:          42px per item  (--uc-item-height-info)
List:          44px per item  (--uc-item-height-list)
Event:         52px per item  (--uc-item-height-event)
Overview:      48px per item  (--uc-item-height-overview)
Product:       54px per item  (--uc-item-height-product)
FAQ:           42px per item  (--uc-item-height-faq)
```

---

## 🎨 **Color System**

```scss
// Backgrounds
--uc-bg: #0c0c0c
--uc-card: var(--card)
--uc-surface-hover: rgba(255, 255, 255, 0.02)

// Borders
--uc-border: rgba(255, 255, 255, 0.06)
--uc-border-hover: rgba(255, 255, 255, 0.12)
--uc-border-separator: rgba(255, 255, 255, 0.04)
--uc-border-accent: #ff7900

// Text
--uc-text-primary: #fff
--uc-text-secondary: #999
--uc-accent: #ff7900
```

---

## 🔧 **Reusable Mixins**

### **Card Base (200px compatible)**
```scss
@use 'ultra-compact-tokens' as uc;

.my-card {
  @include uc.uc-card-200px;
  min-height: var(--uc-card-height-200px);
}
```

### **List Container (400px compatible)**
```scss
.my-list {
  @include uc.uc-list-400px;
}
```

### **List Item**
```scss
.my-item {
  @include uc.uc-list-item;
  min-height: var(--uc-item-height-info);
}
```

### **Typography Mixins**
```scss
.label { @include uc.uc-label; }
.value { @include uc.uc-value; }
.title { @include uc.uc-title; }
.body { @include uc.uc-body; }
```

### **Grid Layout**
```scss
.grid {
  @include uc.uc-grid-200px;
}
```

---

## 📱 **Responsive Patterns**

### **Standard Breakpoints**
```scss
@media (max-width: 640px) {
  // Mobile: 2 columns or 1
}

@media (max-width: 420px) {
  // Tiny: Always 1 column
}
```

### **Using Mixin**
```scss
@include uc.uc-mobile {
  // Mobile styles
}

@include uc.uc-reduced-motion {
  // Accessibility
}
```

---

## 🏗️ **Section Template**

### **200px Column Section Example**

```scss
@use '../../../styles/components/sections/ultra-compact-tokens' as uc;

:host {
  display: block;
  width: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--uc-section-gap);
}

.grid {
  @include uc.uc-grid-200px;
}

.card {
  @include uc.uc-card-200px;
  gap: var(--uc-internal-gap);
  min-height: var(--uc-card-height-200px);
}

.label {
  @include uc.uc-label;
}

.value {
  @include uc.uc-value;
  font-size: var(--uc-text-3xl);
}

@include uc.uc-mobile {
  .card {
    padding: var(--uc-card-padding-sm);
  }
}

@include uc.uc-reduced-motion;
```

### **400px Full-Width Section Example**

```scss
@use '../../../styles/components/sections/ultra-compact-tokens' as uc;

:host {
  @include uc.uc-host-400px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--uc-section-gap);
}

.list {
  @include uc.uc-list-400px;
}

.item {
  @include uc.uc-list-item;
  gap: var(--uc-internal-gap-sm);
  min-height: var(--uc-item-height-info);
}

.label {
  @include uc.uc-label;
}

.value {
  @include uc.uc-value;
}

@include uc.uc-mobile {
  .item {
    padding: var(--uc-item-padding-sm);
  }
}

@include uc.uc-reduced-motion;
```

---

## ✅ **Consistency Checklist**

When creating or updating a section:

- [ ] Use `ultra-compact-tokens` mixins
- [ ] Follow 200px or 400px strategy
- [ ] Use standard spacing tokens (1-2-3-4-6-8)
- [ ] Use standard typography scale
- [ ] Include hover effects (translateY(-1px), accent color)
- [ ] Add border accent (opacity 0 → 0.6 on hover)
- [ ] Implement mobile responsive patterns
- [ ] Add reduced motion support
- [ ] Target optimal min-height from standards
- [ ] Test at 200px, 400px, 600px, 800px widths

---

## 🎯 **Benefits**

1. **Consistency**: All sections look and feel unified
2. **Compactness**: Maximum information density
3. **Maintainability**: Single source of truth for tokens
4. **Performance**: Smaller CSS, faster rendering
5. **Scalability**: Easy to add new sections
6. **Responsiveness**: Mobile-first approach built-in
7. **Accessibility**: Reduced motion support standard

---

## 📊 **Token Quick Reference**

| Category | Token | Value | Usage |
|----------|-------|-------|-------|
| Spacing | `--uc-space-4` | 4px | Internal gaps |
| Spacing | `--uc-space-6` | 6px | Item padding |
| Spacing | `--uc-space-8` | 8px | Card padding |
| Typography | `--uc-text-sm` | 0.6rem | Labels |
| Typography | `--uc-text-lg` | 0.75rem | Titles |
| Typography | `--uc-text-3xl` | 1.1rem | Metric values |
| Height | `--uc-card-height-200px` | 80px | Compact cards |
| Height | `--uc-item-height-info` | 42px | List items |
| Color | `--uc-border` | rgba(255,255,255,0.06) | Default border |
| Color | `--uc-border-hover` | rgba(255,255,255,0.12) | Hover border |
| Color | `--uc-accent` | #ff7900 | Accent color |

---

## 🚀 **Getting Started**

1. Import the tokens:
   ```scss
   @use '../../../styles/components/sections/ultra-compact-tokens' as uc;
   ```

2. Apply base structure (200px or 400px strategy)

3. Use standard mixins and tokens

4. Test responsive behavior

5. Verify consistency with other sections

---

**Result**: Ultra-compact, consistent, and beautiful sections that work perfectly at any column width! 🎉





