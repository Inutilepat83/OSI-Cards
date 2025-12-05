# 🔧 Troubleshooting Guide

**Version:** 1.5.5
**Last Updated:** December 4, 2025

---

## 🎯 Common Issues & Solutions

### Build & Compilation

#### ❌ TypeScript Compilation Errors

**Problem:** `Cannot find module 'osi-cards-lib'`

**Solution:**
```bash
# Rebuild library
npm run build:lib

# Clear cache
npm run clean
npm install
```

---

**Problem:** `Type 'X' is not assignable to type 'Y'`

**Solution:**
- Check TypeScript version (need 5.8+)
- Verify imports from correct paths
- Rebuild library if using local development

---

#### ❌ SCSS/CSS Errors

**Problem:** `Cannot find stylesheet`

**Solution:**
```scss
// Import scoped styles
@import 'osi-cards-lib/styles/styles-scoped';

// Or use global (may affect host app)
@import 'osi-cards-lib/styles/styles';
```

---

### Runtime Issues

#### ❌ Cards Not Rendering

**Problem:** Cards don't appear

**Solutions:**

1. **Check console for errors**
```typescript
// Open browser DevTools (F12)
// Check Console tab for errors
```

2. **Verify card configuration**
```typescript
// Valid card structure
const card = {
  cardTitle: 'Test',  // Required
  sections: []         // Required (can be empty)
};
```

3. **Ensure styles are imported**
```scss
// In styles.scss
@import 'osi-cards-lib/styles/styles-scoped';
```

4. **Wrap in container (if using scoped styles)**
```html
<osi-cards-container>
  <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
</osi-cards-container>
```

---

#### ❌ Sections Not Showing

**Problem:** Card renders but sections are missing

**Solutions:**

1. **Check section type**
```typescript
// Supported types
const validTypes = [
  'info', 'analytics', 'chart', 'list', 'news',
  'social-media', 'financials', 'event', 'map',
  'product', 'solutions', 'overview', 'quotation',
  'text-reference', 'brand-colors', 'contact-card',
  'network-card', 'faq', 'timeline', 'gallery'
];
```

2. **Verify section structure**
```typescript
// Minimum required
{
  type: 'info',
  title: 'My Section',  // Optional but recommended
  fields: [...]         // Or items, depending on type
}
```

---

#### ❌ Grid Layout Issues

**Problem:** Sections overlapping or gaps appearing

**Solutions:**

1. **Provide container width explicitly**
```html
<app-masonry-grid
  [sections]="sections"
  [containerWidth]="1200">
</app-masonry-grid>
```

2. **Enable optimization**
```html
<app-masonry-grid
  [sections]="sections"
  [optimizeLayout]="true">
</app-masonry-grid>
```

3. **Check for rapid updates**
```typescript
// Use streaming flag
<app-masonry-grid
  [sections]="sections"
  [isStreaming]="true">
</app-masonry-grid>
```

---

### Performance Issues

#### ❌ Slow Rendering

**Problem:** Cards take long to render

**Solutions:**

1. **Enable virtual scrolling**
```html
<app-masonry-grid
  [sections]="manySections"
  [enableVirtualScroll]="true"
  [virtualThreshold]="50">
</app-masonry-grid>
```

2. **Use memoization**
```typescript
import { Memoize } from 'osi-cards-lib';

@Memoize()
expensiveCalculation(data: Data): Result {
  return complexComputation(data);
}
```

3. **Deduplicate requests**
```typescript
import { Deduplicate } from 'osi-cards-lib';

@Deduplicate()
loadData(id: string): Observable<Data> {
  return this.http.get(`/api/data/${id}`);
}
```

---

#### ❌ Memory Leaks

**Problem:** Memory usage grows over time

**Solutions:**

1. **Use AutoUnsubscribe**
```typescript
import { AutoUnsubscribe } from 'osi-cards-lib';

@AutoUnsubscribe()
@Component({...})
export class MyComponent {
  private sub = this.service.data$.subscribe(...);
  // Automatically unsubscribed on destroy
}
```

2. **Use takeUntilDestroyed**
```typescript
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(...);
}
```

---

### Streaming Issues

#### ❌ Streaming Flickering

**Problem:** Cards flicker during streaming

**Solution:**
```html
<!-- Use isStreaming flag -->
<app-masonry-grid
  [sections]="sections"
  [isStreaming]="true">
</app-masonry-grid>
```

---

#### ❌ Incomplete Streaming

**Problem:** Streaming stops before completion

**Solutions:**

1. **Check JSON validity**
```typescript
// Validate JSON
try {
  JSON.parse(jsonString);
} catch (e) {
  console.error('Invalid JSON:', e);
}
```

2. **Check for errors**
```typescript
streamingService.stream(json).subscribe({
  next: (update) => console.log('Update:', update),
  error: (err) => console.error('Stream error:', err),
  complete: () => console.log('Stream complete')
});
```

---

### Theme Issues

#### ❌ Theme Not Applied

**Problem:** Theme doesn't change appearance

**Solutions:**

1. **Use Theme Service**
```typescript
import { ThemeService } from 'osi-cards-lib';

@Component({...})
export class MyComponent {
  private theme = inject(ThemeService);

  ngOnInit() {
    this.theme.setTheme('cupertino');
  }
}
```

2. **Or use component input**
```html
<app-ai-card-renderer
  [cardConfig]="card"
  [theme]="'cupertino'">
</app-ai-card-renderer>
```

---

## 🐛 Debugging Tips

### Enable Debug Mode

```html
<app-masonry-grid
  [sections]="sections"
  [debug]="true">
</app-masonry-grid>
```

**Output:** Detailed layout calculations in console

---

### Check Health Status

```typescript
import { HealthCheckService } from './core/services/health-check.service';

const healthService = inject(HealthCheckService);
const health = await healthService.check();

console.log('Status:', health.status);
console.log('Checks:', health.checks);
```

---

### Monitor Performance

```typescript
import { PerformanceMonitor } from 'osi-cards-lib';

const monitor = new PerformanceMonitor();

// Your code here

const metrics = monitor.getMetrics();
console.log('Performance:', metrics);
```

---

## 📞 Getting Help

### Check Documentation
1. [Master Index](./MASTER_INDEX.md) - Find any doc
2. [Quick Start Guide](../QUICK_START_GUIDE.md) - Basic setup
3. [API Reference](./api/API_REFERENCE.md) - Complete API
4. [Grid System Guide](./guides/GRID_SYSTEM_GUIDE.md) - Grid details

### Check Examples
- `src/app/features/home` - Complete examples
- Storybook - Component examples
- Unit tests - Usage patterns

### Common Error Messages

**"Cannot find module"**
→ Run `npm run build:lib`

**"Type 'X' is not assignable"**
→ Check TypeScript version, rebuild library

**"No provider for..."**
→ Add `provideOSICards()` to app.config.ts

**"Styles not loading"**
→ Import styles in styles.scss

**"Card not rendering"**
→ Check browser console, verify card structure

---

## 🔍 Debug Checklist

When something doesn't work:

- [ ] Check browser console for errors
- [ ] Verify card configuration structure
- [ ] Ensure styles are imported
- [ ] Check TypeScript version (5.8+)
- [ ] Rebuild library (`npm run build:lib`)
- [ ] Clear cache (`npm run clean && npm install`)
- [ ] Enable debug mode
- [ ] Check network tab for failed requests
- [ ] Review component inputs/outputs
- [ ] Test with minimal example

---

## 📊 Performance Debugging

### Slow Layout Calculation

```typescript
// Enable performance monitoring
import { measureSync } from 'osi-cards-lib';

const result = measureSync('layout', () => {
  return this.layoutService.calculateLayout(sections, config);
});

console.log('Layout took:', result.duration, 'ms');
```

### Memory Issues

```typescript
// Monitor memory
import { MemoryLeakDetector } from 'osi-cards-lib';

const detector = new MemoryLeakDetector();
detector.startMonitoring({
  interval: 5000,
  threshold: 10 * 1024 * 1024
});
```

---

## 🆘 Still Need Help?

1. **Search Issues:** Check GitHub issues
2. **Create Issue:** Provide minimal reproduction
3. **Ask Community:** Discord/Slack channel
4. **Email Support:** support@osi-cards.com

---

**Last Updated:** December 4, 2025
**Version:** 1.5.5





