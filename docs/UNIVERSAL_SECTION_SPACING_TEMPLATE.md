# Universal Section Spacing Template

Copy-paste template for instant spacing support.

---

## Quick Template

### Step 1: Import Directive

```typescript
import { SectionDesignDirective } from '../../../directives';

@Component({
  imports: [CommonModule, SectionDesignDirective]
})
```

### Step 2: Apply in Template

```html
<div class="section-container" [libSectionDesign]="section.meta">
  <div class="section-grid">
    <div *ngFor="let item of items" class="section-item">
      <!-- Content -->
    </div>
  </div>
</div>
```

### Step 3: Universal SCSS

```scss
// Container
.section-container {
  padding: var(--section-container-padding, 12px);
  margin: var(--section-margin, 0);
}

// Grid Layout
.section-grid {
  display: grid;
  gap: var(--section-grid-gap, 12px);
  row-gap: var(--section-grid-row-gap, var(--section-grid-gap, 12px));
  column-gap: var(--section-grid-column-gap, var(--section-grid-gap, 12px));
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

// Flex Layout
.section-flex {
  display: flex;
  flex-direction: column;
  gap: var(--section-vertical-spacing, var(--section-item-gap, 10px));
}

// Items
.section-item {
  padding: var(--section-item-padding, 12px);
  gap: var(--section-element-gap, 4px);
  background: var(--section-item-background, transparent);
  border: var(--section-item-border-width, 1px)
          solid
          var(--section-item-border-color, rgba(255, 255, 255, 0.06));
  border-radius: var(--section-border-radius, 8px);
}
```

---

## Common Patterns

### Analytics Grid
```scss
.analytics-grid {
  display: grid;
  gap: var(--section-grid-gap, 8px);
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
```

### Info List
```scss
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--section-item-gap, 8px);
}
```

### Contact Cards
```scss
.contact-grid {
  display: grid;
  gap: var(--section-grid-gap, 12px);
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

---

For complete examples, see the full documentation.
