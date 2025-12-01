# OSI Cards - Integration Guide

This guide covers integrating OSI Cards into various Angular application setups.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Standalone Components](#standalone-components)
- [Module-Based Applications](#module-based-applications)
- [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
- [Micro-Frontend Integration](#micro-frontend-integration)
- [State Management Integration](#state-management-integration)
- [Form Integration](#form-integration)
- [Testing Setup](#testing-setup)

---

## Basic Setup

### Installation

```bash
npm install osi-cards-lib
```

### Configuration

Add the provider to your application:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [provideOSICards()],
};
```

### Import Styles

```scss
// styles.scss
@import 'osi-cards-lib/styles/styles.scss';
```

Or import pre-compiled CSS:

```scss
@import 'osi-cards-lib/styles/styles.css';
```

---

## Standalone Components

### Basic Usage

```typescript
// my-component.ts
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [cardConfig]="card" (cardEvent)="onInteraction($event)">
    </app-ai-card-renderer>
  `,
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'Product Overview',
    sections: [
      {
        title: 'Details',
        type: 'info',
        fields: [
          { label: 'SKU', value: 'PRD-001' },
          { label: 'Price', value: '$99.99', type: 'currency' },
        ],
      },
    ],
  };

  onInteraction(event: CardFieldInteractionEvent) {
    console.log('Interaction:', event);
  }
}
```

### With Streaming

```typescript
import { Component, inject } from '@angular/core';
import { AICardRendererComponent, CardFacadeService, StreamingStage } from 'osi-cards-lib';

@Component({
  // ...
  template: `
    <app-ai-card-renderer
      [cardConfig]="currentCard()"
      [isStreaming]="isStreaming()"
      [streamingStage]="streamingStage()"
    >
    </app-ai-card-renderer>
  `,
})
export class StreamingComponent {
  private cardFacade = inject(CardFacadeService);

  currentCard = signal<AICardConfig | null>(null);
  isStreaming = signal(false);
  streamingStage = signal<StreamingStage>('idle');

  startStreaming(jsonData: string) {
    this.isStreaming.set(true);

    this.cardFacade
      .streamFromJson(jsonData, {
        onStateChange: (state) => {
          this.streamingStage.set(state.stage);
          if (state.stage === 'complete') {
            this.isStreaming.set(false);
          }
        },
      })
      .subscribe((card) => {
        this.currentCard.set(card);
      });
  }
}
```

---

## Module-Based Applications

### Create a Feature Module

```typescript
// cards.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AICardRendererComponent,
  CardSkeletonComponent,
  MasonryGridComponent,
} from 'osi-cards-lib';

@NgModule({
  imports: [CommonModule, AICardRendererComponent, CardSkeletonComponent, MasonryGridComponent],
  exports: [AICardRendererComponent, CardSkeletonComponent, MasonryGridComponent],
})
export class CardsModule {}
```

### Use in App Module

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardsModule } from './cards/cards.module';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, CardsModule],
  // ...
})
export class AppModule {}
```

---

## Server-Side Rendering (SSR)

### Angular Universal Setup

```typescript
// app.config.server.ts
import { ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideOSICards } from 'osi-cards-lib';

export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideOSICards({
      ssr: true, // Disables browser-only features
    }),
  ],
};
```

### Platform Check

```typescript
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({...})
export class MyComponent {
  private platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
```

### Conditional Rendering

```html
<app-ai-card-renderer *ngIf="isBrowser" [cardConfig]="card"> </app-ai-card-renderer>

<!-- SSR fallback -->
<app-card-skeleton
  *ngIf="!isBrowser"
  [cardTitle]="card.cardTitle"
  [sectionCount]="card.sections.length"
>
</app-card-skeleton>
```

---

## Micro-Frontend Integration

### Module Federation Setup

```javascript
// webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      remotes: {
        osiCards: 'osiCards@http://localhost:4201/remoteEntry.js',
      },
      shared: {
        '@angular/core': { singleton: true },
        '@angular/common': { singleton: true },
        'osi-cards-lib': { singleton: true },
      },
    }),
  ],
};
```

### Loading Remote Cards Component

```typescript
// Lazy load from remote
@Component({
  template: ` <ng-container *ngComponentOutlet="cardComponent"></ng-container> `,
})
export class RemoteCardHost {
  cardComponent: Type<unknown> | null = null;

  async ngOnInit() {
    const module = await import('osiCards/CardRenderer');
    this.cardComponent = module.AICardRendererComponent;
  }
}
```

---

## State Management Integration

### NgRx Integration

```typescript
// cards.actions.ts
import { createAction, props } from '@ngrx/store';
import { AICardConfig } from 'osi-cards-lib';

export const loadCard = createAction('[Card] Load');
export const loadCardSuccess = createAction('[Card] Load Success', props<{ card: AICardConfig }>());
export const updateCard = createAction(
  '[Card] Update',
  props<{ updates: Partial<AICardConfig> }>()
);
```

```typescript
// cards.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { AICardConfig } from 'osi-cards-lib';

export interface CardsState {
  currentCard: AICardConfig | null;
  loading: boolean;
}

const initialState: CardsState = {
  currentCard: null,
  loading: false,
};

export const cardsReducer = createReducer(
  initialState,
  on(loadCard, (state) => ({ ...state, loading: true })),
  on(loadCardSuccess, (state, { card }) => ({
    ...state,
    currentCard: card,
    loading: false,
  }))
);
```

```typescript
// Using in component
@Component({...})
export class CardContainerComponent {
  card$ = this.store.select(selectCurrentCard);
  loading$ = this.store.select(selectLoading);

  constructor(private store: Store) {}

  loadCard(id: string) {
    this.store.dispatch(loadCard({ id }));
  }
}
```

### Signal-Based State

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { AICardConfig } from 'osi-cards-lib';

@Injectable({ providedIn: 'root' })
export class CardStore {
  private _cards = signal<AICardConfig[]>([]);
  private _selectedId = signal<string | null>(null);

  cards = this._cards.asReadonly();

  selectedCard = computed(() => {
    const id = this._selectedId();
    return id ? this._cards().find((c) => c.id === id) : null;
  });

  addCard(card: AICardConfig) {
    this._cards.update((cards) => [...cards, card]);
  }

  selectCard(id: string) {
    this._selectedId.set(id);
  }
}
```

---

## Form Integration

### Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, AICardRendererComponent],
  template: `
    <form [formGroup]="cardForm">
      <input formControlName="title" placeholder="Card Title" />

      <app-ai-card-renderer [cardConfig]="previewCard"> </app-ai-card-renderer>
    </form>
  `,
})
export class CardEditorComponent {
  cardForm = this.fb.group({
    title: [''],
    description: [''],
  });

  get previewCard(): AICardConfig {
    return {
      cardTitle: this.cardForm.value.title || 'Untitled',
      description: this.cardForm.value.description,
      sections: [],
    };
  }

  constructor(private fb: FormBuilder) {}
}
```

### Dynamic Section Forms

```typescript
import { FormArray, FormGroup } from '@angular/forms';

// Add section dynamically
addSection(type: string) {
  const sectionGroup = this.fb.group({
    type: [type],
    title: [''],
    fields: this.fb.array([])
  });

  this.sectionsArray.push(sectionGroup);
}

get sectionsArray(): FormArray {
  return this.cardForm.get('sections') as FormArray;
}
```

---

## Testing Setup

### Unit Testing Components

```typescript
// my-component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideOSICards, AICardRendererComponent } from 'osi-cards-lib';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent, AICardRendererComponent],
      providers: [provideOSICards()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should render card', () => {
    fixture.detectChanges();
    const cardElement = fixture.nativeElement.querySelector('app-ai-card-renderer');
    expect(cardElement).toBeTruthy();
  });
});
```

### Testing Services

```typescript
import { TestBed } from '@angular/core/testing';
import { CardFacadeService, provideOSICards } from 'osi-cards-lib';

describe('CardFacadeService', () => {
  let service: CardFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideOSICards()],
    });
    service = TestBed.inject(CardFacadeService);
  });

  it('should create card', () => {
    const card = service.createCard({
      title: 'Test',
      sections: [],
    });

    expect(card.cardTitle).toBe('Test');
    expect(card.id).toBeDefined();
  });
});
```

### E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test';

test('card renders correctly', async ({ page }) => {
  await page.goto('/cards');

  const card = page.locator('app-ai-card-renderer');
  await expect(card).toBeVisible();

  // Check title
  const title = card.locator('.card-title');
  await expect(title).toContainText('Product Overview');
});

test('card interaction emits event', async ({ page }) => {
  await page.goto('/cards');

  // Listen for custom event
  const eventPromise = page.evaluate(() => {
    return new Promise((resolve) => {
      document.addEventListener(
        'card-interaction',
        (e) => {
          resolve((e as CustomEvent).detail);
        },
        { once: true }
      );
    });
  });

  // Click field
  await page.click('.card-field');

  const event = await eventPromise;
  expect(event).toBeDefined();
});
```

---

## Common Issues

### Animation Issues

If animations aren't working:

```typescript
// Ensure animations are provided
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig = {
  providers: [provideAnimations(), provideOSICards()],
};
```

### Style Encapsulation

If styles aren't applying:

```typescript
// For Shadow DOM components, styles must be imported in the component
@Component({
  styleUrls: ['./my-component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
```

### Zone.js Issues

For performance with many cards:

```typescript
// Run outside Angular zone
this.ngZone.runOutsideAngular(() => {
  // Heavy operations here
});
```

---

For more help, see the [API Reference](./API.md) or [Theming Guide](./THEMING_GUIDE.md).
