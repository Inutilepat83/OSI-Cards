# OSI Cards - Plugin System

This guide explains how to extend OSI Cards with custom section types using the plugin system.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Creating a Custom Section Plugin](#creating-a-custom-section-plugin)
- [Registering Plugins](#registering-plugins)
- [Plugin Priority and Override](#plugin-priority-and-override)
- [Type Resolution Order](#type-resolution-order)
- [The @SectionComponent Decorator](#the-sectioncomponent-decorator)
- [BaseSectionComponent](#basesectioncomponent)
- [SectionPlugin Interface](#sectionplugin-interface)
- [DynamicSectionLoaderService](#dynamicsectionloaderservice)
- [Best Practices](#best-practices)
- [Complete Example](#complete-example)
- [Testing Plugins](#testing-plugins)

---

## Overview

The OSI Cards plugin system allows you to:

- Create custom section types beyond the 17 built-in types
- Override built-in sections with custom implementations
- Register components dynamically at runtime
- Use decorators for compile-time registration
- Define type aliases for your custom sections

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Section Rendering Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CardSection with type="my-custom"                           │
│              ↓                                                   │
│  2. DynamicSectionLoaderService.getComponentForSection()        │
│              ↓                                                   │
│  3. Check SectionPluginRegistry for custom plugins              │
│              ↓ (if found)                                        │
│  4. Return plugin component                                      │
│              ↓ (if not found)                                    │
│  5. Resolve type aliases (e.g., 'metrics' → 'analytics')        │
│              ↓                                                   │
│  6. Look up in SECTION_COMPONENT_MAP (built-in sections)        │
│              ↓ (if not found)                                    │
│  7. Return FallbackSectionComponent                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating a Custom Section Plugin

### Step 1: Create the Component

Your custom section component must extend `BaseSectionComponent` and implement `SectionPlugin`:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BaseSectionComponent,
  SectionPlugin,
  CardSection,
  CardField
} from 'osi-cards-lib';

@Component({
  selector: 'app-my-custom-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-section unified-card">
      <div class="section-header">
        <h3 class="section-title">{{ section.title }}</h3>
        <p *ngIf="section.description" class="section-description">
          {{ section.description }}
        </p>
      </div>

      <div class="custom-content" *ngIf="hasFields">
        <div
          *ngFor="let field of getFields(); let i = index; trackBy: trackField"
          class="custom-field"
          [class]="getFieldAnimationClass(getFieldId(field, i), i)"
          [style.--stagger-index]="getFieldStaggerIndex(i)"
          (click)="emitFieldInteraction(field)">
          <span class="field-label">{{ field.label }}</span>
          <span class="field-value">{{ field.value }}</span>
        </div>
      </div>

      <div class="custom-empty" *ngIf="!hasFields">
        <p>No data available</p>
      </div>
    </div>
  `,
  styles: [`
    .custom-section {
      padding: var(--section-padding, 1rem);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .custom-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .custom-field {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .custom-field:hover {
      background-color: var(--hover-bg, rgba(255, 255, 255, 0.05));
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyCustomSectionComponent
  extends BaseSectionComponent
  implements SectionPlugin {

  // Unique plugin type identifier
  static readonly PLUGIN_TYPE = 'my-custom-section';

  /**
   * Returns the section type this plugin handles
   */
  getPluginType(): string {
    return MyCustomSectionComponent.PLUGIN_TYPE;
  }

  /**
   * Determines if this plugin can handle the given section
   */
  canHandle(section: CardSection): boolean {
    return section.type === MyCustomSectionComponent.PLUGIN_TYPE;
  }
}
```

### Step 2: Register the Plugin

Register your plugin with the `SectionPluginRegistry`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { SectionPluginRegistry } from 'osi-cards-lib';
import { MyCustomSectionComponent } from './my-custom-section.component';

@Component({...})
export class AppComponent implements OnInit {
  private readonly pluginRegistry = inject(SectionPluginRegistry);

  ngOnInit() {
    this.pluginRegistry.register({
      type: 'my-custom-section',
      name: 'My Custom Section',
      description: 'A custom section for displaying domain-specific data',
      component: MyCustomSectionComponent,
      config: {
        priority: 10 // Higher priority = checked first
      },
      metadata: {
        version: '1.0.0',
        author: 'Your Name'
      }
    });
  }
}
```

### Step 3: Use in Card Configuration

```typescript
const cardConfig: AICardConfig = {
  cardTitle: 'My Card',
  sections: [
    {
      title: 'Custom Data',
      type: 'my-custom-section', // Your custom type
      fields: [
        { label: 'Status', value: 'Active' },
        { label: 'Score', value: '95%' }
      ]
    }
  ]
};
```

---

## Registering Plugins

### Using SectionPluginRegistry

```typescript
import { SectionPluginRegistry } from 'osi-cards-lib';

const registry = inject(SectionPluginRegistry);

// Register a single plugin
registry.register({
  type: 'custom-section',
  name: 'Custom Section',
  description: 'A custom section type',
  component: CustomSectionComponent,
  config: {
    priority: 10,
    override: false
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
});

// Register multiple plugins at once
registry.registerAll([
  { type: 'custom-a', name: 'Custom A', component: CustomAComponent },
  { type: 'custom-b', name: 'Custom B', component: CustomBComponent }
]);

// Unregister a plugin
registry.unregister('custom-section');

// Check if a plugin exists
if (registry.hasPlugin('custom-section')) {
  // Plugin is registered
}

// Get all registered plugins
const plugins = registry.getPlugins(); // Returns array sorted by priority

// Get specific plugin metadata
const metadata = registry.getPluginMetadata('custom-section');

// Clear all plugins
registry.clear();
```

### In app.config.ts (Recommended)

```typescript
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideOSICards, SectionPluginRegistry } from 'osi-cards-lib';
import { MyCustomSectionComponent } from './sections/my-custom-section.component';

function initializePlugins() {
  return () => {
    const registry = inject(SectionPluginRegistry);

    registry.register({
      type: 'my-custom-section',
      name: 'My Custom Section',
      component: MyCustomSectionComponent,
      config: { priority: 10 }
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializePlugins,
      multi: true
    }
  ]
};
```

---

## Plugin Priority and Override

### Priority

When multiple plugins could handle the same section type, priority determines which one wins:

```typescript
// Lower priority - checked last
registry.register({
  type: 'chart',
  component: BasicChartComponent,
  config: { priority: 0 }
});

// Higher priority - checked first
registry.register({
  type: 'chart',
  component: AdvancedChartComponent,
  config: { priority: 100, override: true }
});
```

### Override

By default, registering a plugin with an existing type throws an error. Set `override: true` to replace:

```typescript
// This will throw an error if 'info' is already registered
registry.register({
  type: 'info',
  component: CustomInfoComponent
});

// This will replace the existing 'info' plugin
registry.register({
  type: 'info',
  component: CustomInfoComponent,
  config: { override: true }
});
```

---

## Type Resolution Order

When resolving which component to use for a section, the system follows this order:

1. **Plugin Registry** - Custom plugins registered via `SectionPluginRegistry`
2. **Type Aliases** - Resolve aliases like `'metrics'` → `'analytics'`
3. **Built-in Components** - The 17 built-in section types
4. **Fallback** - `FallbackSectionComponent` for unknown types

```typescript
// Example resolution:
section.type = 'metrics'
// 1. Check plugin registry → not found
// 2. Resolve alias: 'metrics' → 'analytics'
// 3. Look up 'analytics' in built-in map → AnalyticsSectionComponent
```

---

## The @SectionComponent Decorator

For compile-time registration, use the `@SectionComponent` decorator:

```typescript
import { Component } from '@angular/core';
import { SectionComponent, BaseSectionComponent } from 'osi-cards-lib';

@SectionComponent({
  type: 'custom-dashboard',
  name: 'Dashboard Section',
  description: 'A custom dashboard section',
  priority: 10,
  override: false,
  aliases: ['dash', 'dashboard'] // Type aliases
})
@Component({
  selector: 'app-custom-dashboard-section',
  standalone: true,
  template: `...`
})
export class CustomDashboardSectionComponent extends BaseSectionComponent {
  // Implementation
}
```

### Decorator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `string` | Required | Section type identifier |
| `name` | `string` | - | Display name for the section |
| `description` | `string` | - | Description of the section |
| `priority` | `number` | `0` | Resolution priority |
| `override` | `boolean` | `false` | Override existing registrations |
| `aliases` | `string[]` | - | Alternative type names |

### Accessing Decorated Components

```typescript
import {
  getRegisteredSectionComponents,
  hasRegisteredComponent,
  getRegisteredComponent,
  getRegisteredSectionTypes
} from 'osi-cards-lib';

// Get all decorated components
const components = getRegisteredSectionComponents();

// Check if a type has a decorated component
if (hasRegisteredComponent('custom-dashboard')) {
  const component = getRegisteredComponent('custom-dashboard');
}

// Get all registered section types
const types = getRegisteredSectionTypes();
// ['custom-dashboard', 'dash', 'dashboard', ...]
```

---

## BaseSectionComponent

All section components must extend `BaseSectionComponent`:

```typescript
export abstract class BaseSectionComponent<T = CardField> implements OnChanges {
  @Input({ required: true }) section!: CardSection;
  @Output() fieldInteraction = new EventEmitter<SectionInteraction<T>>();
  @Output() itemInteraction = new EventEmitter<SectionInteraction<T>>();

  // Protected helpers
  protected getFields(): CardField[];
  protected getItems(): CardItem[];
  protected emitFieldInteraction(field: T, metadata?: Record<string, unknown>): void;
  protected emitItemInteraction(item: T, metadata?: Record<string, unknown>): void;
  protected trackField(index: number, field: CardField): string;
  protected trackItem(index: number, item: CardItem): string;
  protected getFieldValue(field: CardField): string | number | boolean | undefined | null;
  protected getMetaValue(field: CardField, key: string): unknown;
  protected isStreamingPlaceholder(value: unknown): boolean;

  // Animation helpers
  getFieldAnimationClass(fieldId: string, index: number): string;
  getItemAnimationClass(itemId: string, index: number): string;
  getFieldStaggerIndex(index: number): number;
  getItemStaggerIndex(index: number): number;

  // Public getters
  get hasFields(): boolean;
  get hasItems(): boolean;
}
```

### Using Base Methods

```typescript
@Component({...})
export class MySection extends BaseSectionComponent {

  // Access fields
  displayFields() {
    const fields = this.getFields();
    fields.forEach(field => {
      const value = this.getFieldValue(field);
      if (!this.isStreamingPlaceholder(value)) {
        console.log(field.label, value);
      }
    });
  }

  // Emit interactions
  onFieldClick(field: CardField) {
    this.emitFieldInteraction(field, { source: 'click' });
  }

  // Use animation classes
  getAnimationClass(field: CardField, index: number) {
    const fieldId = field.id || `field-${index}`;
    return this.getFieldAnimationClass(fieldId, index);
  }
}
```

---

## SectionPlugin Interface

Custom section components must implement the `SectionPlugin` interface:

```typescript
export interface SectionPlugin {
  /**
   * Returns the section type this plugin handles
   */
  getPluginType(): string;

  /**
   * Determines if this plugin can handle the given section
   * @param section - The section to check
   * @returns True if this plugin can handle the section
   */
  canHandle(section: CardSection): boolean;
}
```

### Implementation Example

```typescript
export class MyPluginComponent extends BaseSectionComponent implements SectionPlugin {
  static readonly PLUGIN_TYPE = 'my-plugin';

  getPluginType(): string {
    return MyPluginComponent.PLUGIN_TYPE;
  }

  canHandle(section: CardSection): boolean {
    // Basic type check
    if (section.type !== MyPluginComponent.PLUGIN_TYPE) {
      return false;
    }

    // Advanced validation (optional)
    // Only handle sections with specific metadata
    if (section.meta?.['variant'] === 'unsupported') {
      return false;
    }

    return true;
  }
}
```

---

## DynamicSectionLoaderService

This service handles the component resolution logic:

```typescript
import { DynamicSectionLoaderService } from 'osi-cards-lib';

const loader = inject(DynamicSectionLoaderService);

// Get component for a section
const component = loader.getComponentForSection(section);

// Resolve a type to its canonical form
const resolved = loader.resolveType('metrics'); // Returns 'analytics'

// Check if a type is supported
if (loader.isTypeSupported('my-custom-type')) {
  // Type is supported (built-in or via plugin)
}

// Get metadata for a type
const metadata = loader.getTypeMetadata('analytics');

// Get all supported types
const types = loader.getSupportedTypes(); // Built-in + plugins

// Clear the component cache (for testing/hot reload)
loader.clearCache();
```

---

## Best Practices

### 1. Use Meaningful Type Names

```typescript
// ✅ Good - descriptive and namespace-like
type: 'crm-customer-profile'
type: 'finance-profit-loss'

// ❌ Avoid - too generic, may conflict
type: 'custom'
type: 'data'
```

### 2. Implement OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush // Required
})
```

### 3. Use trackBy for Lists

```typescript
// Use the built-in trackBy methods
*ngFor="let field of getFields(); trackBy: trackField"
```

### 4. Handle Empty States

```typescript
<div *ngIf="hasFields; else emptyState">
  <!-- Content -->
</div>

<ng-template #emptyState>
  <p>No data available</p>
</ng-template>
```

### 5. Support Animations

```typescript
[class]="getFieldAnimationClass(getFieldId(field, i), i)"
[style.--stagger-index]="getFieldStaggerIndex(i)"
```

### 6. Register Early

Register plugins in `APP_INITIALIZER` or component `OnInit` before cards are rendered.

---

## Complete Example

### custom-crm-section.component.ts

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BaseSectionComponent,
  SectionPlugin,
  CardSection,
  CardField,
  SectionComponent
} from 'osi-cards-lib';

interface CRMField extends CardField {
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
}

@SectionComponent({
  type: 'crm-deals',
  name: 'CRM Deals Section',
  description: 'Displays CRM deal information',
  aliases: ['deals', 'opportunities']
})
@Component({
  selector: 'app-crm-deals-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crm-deals-section unified-card">
      <div class="section-header">
        <h3>{{ section.title }}</h3>
        <span class="deal-count">{{ getFields().length }} deals</span>
      </div>

      <div class="deals-list" *ngIf="hasFields">
        <div
          *ngFor="let deal of getFields(); let i = index; trackBy: trackField"
          class="deal-card"
          [class]="getFieldAnimationClass(getFieldId(deal, i), i)"
          [class.high-priority]="getDealPriority(deal) === 'high'"
          (click)="emitFieldInteraction(deal)">

          <div class="deal-header">
            <span class="deal-name">{{ deal.label }}</span>
            <span class="deal-value">{{ deal.value }}</span>
          </div>

          <div class="deal-meta">
            <span *ngIf="getDealAssignee(deal)" class="assignee">
              {{ getDealAssignee(deal) }}
            </span>
            <span class="priority-badge" [class]="getDealPriority(deal)">
              {{ getDealPriority(deal) }}
            </span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!hasFields">
        <p>No deals to display</p>
      </div>
    </div>
  `,
  styles: [`
    .crm-deals-section {
      padding: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .deals-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .deal-card {
      padding: 1rem;
      border-radius: 8px;
      background: var(--card-bg-secondary, #f5f5f5);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .deal-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .deal-card.high-priority {
      border-left: 3px solid #ef4444;
    }

    .priority-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .priority-badge.high { background: #fef2f2; color: #ef4444; }
    .priority-badge.medium { background: #fffbeb; color: #f59e0b; }
    .priority-badge.low { background: #f0fdf4; color: #22c55e; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CRMDealsSectionComponent
  extends BaseSectionComponent<CRMField>
  implements SectionPlugin {

  static readonly PLUGIN_TYPE = 'crm-deals';

  getPluginType(): string {
    return CRMDealsSectionComponent.PLUGIN_TYPE;
  }

  canHandle(section: CardSection): boolean {
    return section.type === 'crm-deals' ||
           section.type === 'deals' ||
           section.type === 'opportunities';
  }

  getDealPriority(deal: CRMField): string {
    return deal.priority || 'medium';
  }

  getDealAssignee(deal: CRMField): string | undefined {
    return deal.assignee || (this.getMetaValue(deal, 'assignee') as string);
  }
}
```

### Registration in app.config.ts

```typescript
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideOSICards, SectionPluginRegistry } from 'osi-cards-lib';
import { CRMDealsSectionComponent } from './sections/crm-deals-section.component';

function registerCRMPlugins() {
  return () => {
    const registry = inject(SectionPluginRegistry);

    registry.register({
      type: CRMDealsSectionComponent.PLUGIN_TYPE,
      name: 'CRM Deals',
      description: 'Displays CRM deal pipeline',
      component: CRMDealsSectionComponent,
      config: { priority: 10 },
      metadata: { version: '1.0.0', author: 'CRM Team' }
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards(),
    {
      provide: APP_INITIALIZER,
      useFactory: registerCRMPlugins,
      multi: true
    }
  ]
};
```

### Usage

```typescript
const crmCard: AICardConfig = {
  cardTitle: 'Q4 Pipeline',
  sections: [
    {
      title: 'Active Deals',
      type: 'crm-deals',
      fields: [
        {
          label: 'Enterprise Contract',
          value: '$250,000',
          priority: 'high',
          assignee: 'John Smith'
        },
        {
          label: 'Mid-Market Renewal',
          value: '$45,000',
          priority: 'medium',
          assignee: 'Jane Doe'
        }
      ]
    }
  ]
};
```

---

## Testing Plugins

### Unit Testing

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideOSICards, SectionPluginRegistry } from 'osi-cards-lib';
import { MyCustomSectionComponent } from './my-custom-section.component';

describe('MyCustomSectionComponent', () => {
  let fixture: ComponentFixture<MyCustomSectionComponent>;
  let component: MyCustomSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCustomSectionComponent],
      providers: [provideOSICards()]
    }).compileComponents();

    fixture = TestBed.createComponent(MyCustomSectionComponent);
    component = fixture.componentInstance;
  });

  it('should implement SectionPlugin interface', () => {
    expect(component.getPluginType()).toBe('my-custom-section');
    expect(component.canHandle({ type: 'my-custom-section', title: 'Test' })).toBe(true);
    expect(component.canHandle({ type: 'other', title: 'Test' })).toBe(false);
  });

  it('should render fields', () => {
    component.section = {
      title: 'Test Section',
      type: 'my-custom-section',
      fields: [
        { label: 'Field 1', value: 'Value 1' }
      ]
    };
    fixture.detectChanges();

    expect(component.hasFields).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Field 1');
  });
});
```

### Testing Registration

```typescript
describe('Plugin Registration', () => {
  let registry: SectionPluginRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideOSICards()]
    });
    registry = TestBed.inject(SectionPluginRegistry);
  });

  afterEach(() => {
    registry.clear();
  });

  it('should register custom plugin', () => {
    registry.register({
      type: 'test-plugin',
      name: 'Test Plugin',
      component: MyCustomSectionComponent
    });

    expect(registry.hasPlugin('test-plugin')).toBe(true);
  });

  it('should throw on duplicate registration', () => {
    registry.register({
      type: 'test-plugin',
      component: MyCustomSectionComponent
    });

    expect(() => {
      registry.register({
        type: 'test-plugin',
        component: MyCustomSectionComponent
      });
    }).toThrow();
  });

  it('should allow override', () => {
    registry.register({
      type: 'test-plugin',
      component: MyCustomSectionComponent
    });

    expect(() => {
      registry.register({
        type: 'test-plugin',
        component: MyCustomSectionComponent,
        config: { override: true }
      });
    }).not.toThrow();
  });
});
```

---

## Related Documentation

- [Section Types Reference](./SECTION_TYPES.md) - Built-in section types
- [API Reference](./API.md) - Full API documentation
- [Event System](./EVENT_SYSTEM.md) - Custom events and middleware
- [Theming Guide](./THEMING_GUIDE.md) - Styling custom sections


