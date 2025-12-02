# Section Spacing & Grid Layout Guide

Guide for spacing and grid parameters.

## Available Spacing Parameters

### Item-Level Spacing
```typescript
{
  itemPadding: '12px 16px',      // Padding inside items
  itemGap: '10px',               // Gap between items
  elementGap: '4px'              // Gap between elements
}
```

### Container-Level Spacing
```typescript
{
  containerPadding: '16px',      // Section container padding
  sectionMargin: '20px 0'        // Section margin
}
```

### Grid Layouts
```typescript
{
  gridGap: '12px',               // Gap for rows and columns
  gridRowGap: '12px',            // Gap between rows
  gridColumnGap: '12px'          // Gap between columns
}
```

---

## Usage Examples

### Analytics Section (Grid Layout)

```typescript
const section: CardSection = {
  title: 'Metrics',
  type: 'analytics',
  fields: [...],
  meta: {
    design: {
      gridGap: '12px',
      itemPadding: '12px 14px',
      containerPadding: '16px'
    }
  }
};
```

### Info Section (Stacked Layout)

```typescript
const section: CardSection = {
  title: 'Details',
  type: 'info',
  fields: [...],
  meta: {
    design: {
      itemGap: '8px',
      itemPadding: '10px 14px'
    }
  }
};
```

### List Section (Vertical Layout)

```typescript
const section: CardSection = {
  title: 'Items',
  type: 'list',
  items: [...],
  meta: {
    design: {
      itemGap: '12px',
      elementGap: '6px'
    }
  }
};
```

---

## Common Patterns

### Compact Layout
```typescript
meta: {
  design: {
    itemPadding: '8px 10px',
    itemGap: '6px',
    gridGap: '8px'
  }
}
```

### Spacious Layout
```typescript
meta: {
  design: {
    itemPadding: '16px 20px',
    itemGap: '16px',
    gridGap: '16px'
  }
}
```

### Standard Layout
```typescript
meta: {
  design: {
    itemPadding: '12px 16px',
    itemGap: '10px',
    gridGap: '12px'
  }
}
```

---

For advanced layouts, see the full documentation.
