# Performance Optimization Guide

This guide provides best practices for optimizing performance when using OSI Cards.

## Table of Contents

1. [Card Configuration Optimization](#card-configuration-optimization)
2. [Change Detection Optimization](#change-detection-optimization)
3. [Bundle Size Optimization](#bundle-size-optimization)
4. [Rendering Performance](#rendering-performance)
5. [Caching Strategies](#caching-strategies)
6. [Monitoring Performance](#monitoring-performance)

## Card Configuration Optimization

### Limit Section Count

Keep the number of sections per card reasonable:

```typescript
// ✅ Good: 3-5 sections per card
const card: AICardConfig = {
  cardTitle: 'Company Overview',
  sections: [
    { title: 'Info', type: 'info', fields: [...] },
    { title: 'Metrics', type: 'analytics', fields: [...] },
    { title: 'Contact', type: 'contact-card', items: [...] }
  ]
};

// ❌ Avoid: 20+ sections in a single card
// Consider splitting into multiple cards
```

**Recommendation:** Keep cards to 5-10 sections maximum for optimal performance.

### Optimize Field Count

Limit fields per section:

```typescript
// ✅ Good: 5-10 fields per section
const section: CardSection = {
  title: 'Company Info',
  type: 'info',
  fields: [
    { label: 'Industry', value: 'Tech' },
    { label: 'Employees', value: '500' },
    // ... 3-8 more fields
  ]
};

// ❌ Avoid: 50+ fields in a single section
// Split into multiple sections
```

### Use Appropriate Section Types

Choose section types that match your data:

```typescript
// ✅ Good: Use analytics for numeric data
{
  type: 'analytics',
  fields: [
    { label: 'Revenue', value: 1000000, percentage: 100, trend: 'up' }
  ]
}

// ❌ Avoid: Using info for numeric metrics
{
  type: 'info',
  fields: [
    { label: 'Revenue', value: '1000000' } // Less efficient rendering
  ]
}
```

## Change Detection Optimization

### OnPush Strategy

All OSI Cards components use `OnPush` change detection. Ensure you're not breaking this:

```typescript
// ✅ Good: Immutable updates
this.cardConfig = {
  ...this.cardConfig,
  sections: [...this.cardConfig.sections, newSection]
};

// ❌ Avoid: Mutating objects directly
this.cardConfig.sections.push(newSection); // Won't trigger change detection
```

### TrackBy Functions

Always provide trackBy functions for lists:

```typescript
// ✅ Good: Custom trackBy
trackBySection = (_index: number, section: CardSection): string =>
  section.id ?? `${section.title}-${_index}`;

// Template
<div *ngFor="let section of sections; trackBy: trackBySection">
```

## Bundle Size Optimization

### Tree Shaking

Ensure proper tree shaking:

```typescript
// ✅ Good: Import only what you need
import { AICardRendererComponent } from 'osi-cards-lib';

// ❌ Avoid: Importing entire library
import * as OSICards from 'osi-cards-lib';
```

### Lazy Loading

Use lazy loading for card configurations:

```typescript
// ✅ Good: Load cards on demand
async loadCard(id: string): Promise<AICardConfig> {
  return import(`./assets/configs/cards/${id}.json`).then(m => m.default);
}

// ❌ Avoid: Loading all cards at once
const allCards = await Promise.all([
  import('./card1.json'),
  import('./card2.json'),
  // ... 100 more
]);
```

## Rendering Performance

### Virtual Scrolling

For large card lists (100+ cards), consider implementing virtual scrolling:

```typescript
// When rendering many cards
// Use @angular/cdk/scrolling VirtualScrollViewport
// Or implement pagination
```

### Image Optimization

Optimize images in cards:

```typescript
// ✅ Good: Use optimized images
{
  icon: 'https://example.com/icon.webp', // WebP format
  meta: {
    image: 'https://example.com/image.jpg?w=400&q=80' // Optimized size
  }
}

// ❌ Avoid: Large unoptimized images
{
  icon: 'https://example.com/icon.png', // Large PNG
  meta: {
    image: 'https://example.com/full-res-image.jpg' // 5MB image
  }
}
```

### Debounce Updates

Debounce rapid updates:

```typescript
import { debounceTime } from 'rxjs/operators';

cardUpdates$
  .pipe(debounceTime(300))
  .subscribe(update => {
    // Update card
  });
```

## Caching Strategies

### Card Data Caching

Leverage built-in caching:

```typescript
// CardDataService automatically caches with shareReplay(1)
const cards$ = cardDataService.getAllCards();
// Subsequent subscriptions use cached data
```

### IndexedDB Caching

Cards are automatically cached in IndexedDB for offline access.

## Monitoring Performance

### Performance Service

Use the built-in performance service:

```typescript
import { PerformanceService } from 'osi-cards-lib';

const perfService = inject(PerformanceService);

// Measure component render time
perfService.measure('CardRender', () => {
  // Render card
});

// Check performance budgets
perfService.checkBudget('card-render', 100); // 100ms budget
```

### Web Vitals

Monitor Core Web Vitals:

```typescript
import { WebVitalsService } from 'osi-cards-lib';

const webVitals = inject(WebVitalsService);
webVitals.metrics$.subscribe(metrics => {
  console.log('LCP:', metrics.lcp);
  console.log('FID:', metrics.fid);
  console.log('CLS:', metrics.cls);
});
```

## Performance Checklist

- [ ] Limit sections per card (5-10 recommended)
- [ ] Limit fields per section (10-20 recommended)
- [ ] Use appropriate section types
- [ ] Use OnPush change detection (already enabled)
- [ ] Provide trackBy functions for lists
- [ ] Optimize images (WebP, appropriate sizes)
- [ ] Implement virtual scrolling for 100+ cards
- [ ] Debounce rapid updates
- [ ] Leverage caching
- [ ] Monitor performance metrics
- [ ] Test on low-end devices
- [ ] Check bundle size regularly

## Performance Budgets

Recommended performance budgets:

- **Initial Load:** < 2MB
- **Card Render Time:** < 100ms
- **Section Render Time:** < 50ms
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

## Troubleshooting

### Slow Card Rendering

1. Check section count - reduce if > 10
2. Check field count - reduce if > 20 per section
3. Profile with Chrome DevTools
4. Check for unnecessary re-renders
5. Verify OnPush is working correctly

### Large Bundle Size

1. Run bundle analyzer: `npm run bundle:analyze`
2. Check for duplicate dependencies
3. Ensure tree shaking is working
4. Consider code splitting
5. Review optional dependencies

### Memory Issues

1. Check for memory leaks in subscriptions
2. Verify components are destroyed properly
3. Monitor with Chrome DevTools Memory Profiler
4. Check for large cached data

## Additional Resources

- [Angular Performance Guide](https://angular.io/guide/performance)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

