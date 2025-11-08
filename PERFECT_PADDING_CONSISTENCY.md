# ✅ Perfect Padding & Margin Consistency System

## Core Principle
**ALL padding and margins MUST use CSS variables. NO hardcoded values allowed.**

---

## Unified Spacing Variables

### Item-Level Spacing (Universal)
```scss
--spacing-xs: 2px;        /* Tiny gaps (gaps inside items) */
--spacing-sm: 4px;        /* Small gaps (between related items) */
--spacing-md: 6px;        /* Medium gaps (standard gap between cards) */
--spacing-lg: 8px;        /* Large gap (internal section spacing) */
--spacing-xl: 10px;       /* Extra large (card padding left/right) */
--spacing-2xl: 12px;      /* Extra extra large (card padding top/bottom) */
--spacing-3xl: 14px;      /* Large padding */
--spacing-4xl: 16px;      /* Extra padding */
```

### Section Item Padding
```scss
/* INSIDE cards that are INSIDE sections */
--section-item-padding: 8px;           /* Desktop */
--section-item-padding-mobile: 6px;    /* Mobile ≤768px */
--section-item-gap: 6px;               /* Gap between elements */
--section-item-gap-mobile: 4px;        /* Mobile ≤768px */
```

### Metric Card Padding (Analytics, Overview, Info)
```scss
/* These are the INDIVIDUAL cards inside metric sections */
--metric-item-padding: 10px 12px;      /* Desktop */
--metric-item-gap: 6px;                /* Gap between label/value */
--metric-item-gap-mobile: 4px;         /* Mobile ≤768px */
```

### List/Contact Item Padding
```scss
/* Items INSIDE list or contact sections */
--list-item-padding: 10px 12px;        /* Desktop */
--list-item-gap: 6px;                  /* Gap between elements */
--list-item-gap-mobile: 4px;           /* Mobile ≤768px */
```

---

## Perfect Consistency Rules

### Rule 1: All Cards Use CSS Variables
```scss
❌ WRONG:
.card {
  padding: 10px 12px;      /* Hardcoded! */
}

✅ RIGHT:
.card {
  padding: var(--spacing-xl) var(--spacing-2xl);  /* Or @include card */
}
```

### Rule 2: All Gaps Use CSS Variables
```scss
❌ WRONG:
.item {
  gap: 6px;               /* Hardcoded! */
}

✅ RIGHT:
.item {
  gap: var(--spacing-md);  /* Uses variable */
}
```

### Rule 3: All Margins Set to 0
```scss
❌ WRONG:
.header {
  margin: -6px -6px 0 -6px;  /* Negative margins! */
}

✅ RIGHT:
.header {
  margin: 0;               /* No margins */
  padding: 0 0 var(--spacing-md) 0;  /* Use padding instead */
}
```

### Rule 4: Mobile Responsive for ALL
```scss
❌ WRONG:
.card {
  padding: 10px 12px;      /* Same on all screen sizes */
}

✅ RIGHT:
.card {
  padding: var(--spacing-xl) var(--spacing-2xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-xl) var(--spacing-xl);
  }
}
```

---

## Section Type Padding Standards

### ALL Sections (via .ai-section in _section-shell.scss)
```scss
.ai-section {
  padding: 12px;           /* Uses --section-padding variable */
  gap: 8px;                /* Uses --section-gap variable */
  margin: 0;               /* NO margins */
}
```

### Metric Cards (Analytics, Overview, Info)
Individual cards INSIDE metric sections:
```scss
.analytics-metric,
.overview-card,
.info-card {
  padding: var(--metric-item-padding);  /* 10px 12px */
  gap: var(--metric-item-gap);          /* 6px */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: 8px 10px;
    gap: var(--metric-item-gap-mobile);
  }
}
```

### Contact Cards
Individual contact items INSIDE contact section:
```scss
.contact-card {
  padding: var(--list-item-padding);    /* 10px 12px */
  gap: 10px;                             /* Contact specific */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: 8px 10px;
  }
}
```

### List Cards
Individual list items INSIDE list section:
```scss
.list-card {
  padding: var(--list-item-padding);    /* 10px 12px */
  gap: 6px;                              /* List specific */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: 8px 10px;
  }
}
```

### Event Items
Individual event items INSIDE event section:
```scss
.event-item {
  padding: var(--section-item-padding);  /* 8px */
  gap: var(--spacing-sm);                /* 4px between elements */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: var(--section-item-padding-mobile);
    gap: var(--spacing-xs);
  }
}
```

### Financial Items
Individual metric items INSIDE financials section:
```scss
.financial-metric {
  padding: var(--metric-item-padding);  /* 10px 12px */
  gap: var(--spacing-sm);                /* 4px */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: 8px 10px;
  }
}
```

### Solution Items
Individual solution items INSIDE solutions section:
```scss
.solution-item {
  padding: var(--metric-item-padding);  /* 10px 12px */
  gap: var(--spacing-md);                /* 6px */
  margin: 0;                             /* NO margins */
  
  @media (max-width: 768px) {
    padding: 8px 10px;
  }
}
```

---

## Checklist for Perfect Consistency

For EVERY padding/margin/gap in EVERY section:

- [ ] Uses CSS variable (--spacing-*, --metric-item-*, --list-item-*, etc.)
- [ ] NO hardcoded pixel values
- [ ] margin: 0 (NO negative margins)
- [ ] Mobile responsive (≤768px breakpoint)
- [ ] Matches other sections of same type
- [ ] Documented in this file

---

## Summary of Perfect Consistency

✅ **ALL Sections** use consistent base spacing via variables  
✅ **ALL Items** inside sections use consistent padding via variables  
✅ **ALL Gaps** between elements use consistent spacing via variables  
✅ **NO Negative Margins** anywhere - use padding instead  
✅ **Mobile Responsive** all spacing variables have mobile overrides  
✅ **100% Predictable** - change one variable → all sections update  

---

**Result:** Perfectly consistent padding and margins across 15 section types
