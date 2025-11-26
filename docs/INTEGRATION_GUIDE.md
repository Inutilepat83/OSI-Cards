# OSI Cards Integration Guide

This guide explains how to import and use the OSI Cards module in your Angular project.

## Table of Contents

1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Using Components](#using-components)
4. [Using Services](#using-services)
5. [Using the Store](#using-the-store)
6. [Configuration](#configuration)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

## Installation

### Option 1: Install from NPM (when published)

```bash
npm install osi-cards-lib
```

### Option 2: Install from Local Path

If you're using the library locally before publishing:

```bash
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

### Option 3: Build and Link Locally

1. Build the library:
```bash
cd OSI-Cards-1
npm run build:lib
```

2. Link the package:
```bash
npm link
```

3. In your project:
```bash
npm link osi-cards
```

## Basic Setup

### 1. Import Required Modules

In your `app.config.ts` or `app.module.ts`:

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideAnimations } from '@angular/platform-browser/animations';

// Import OSI Cards providers
import { 
  provideOSICards,
  OSICardsConfig 
} from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideStore(),
    provideEffects([]),
    
    // Configure OSI Cards
    provideOSICards({
      apiUrl: 'https://api.example.com',
      enableLogging: true,
      logLevel: 'info'
    })
  ]
};
```

### 2. Import Styles

Add to your `styles.scss` or `angular.json`:

```scss
// Import OSI Cards styles
@import 'osi-cards/styles';
```

Or in `angular.json`:

```json
{
  "styles": [
    "node_modules/osi-cards/styles.css",
    "src/styles.scss"
  ]
}
```

## Using Components

### AICardRendererComponent

The main component for rendering cards:

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent } from 'osi-cards-lib';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-cards',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer
      [card]="myCard"
      [isFullscreen]="false"
      (cardInteraction)="onCardInteraction($event)"
      (fieldInteraction)="onFieldInteraction($event)">
    </app-ai-card-renderer>
  `
})
export class MyCardsComponent {
  myCard: AICardConfig = {
    id: '1',
    cardTitle: 'My Card',
    cardType: 'company',
    sections: [
      {
        id: 'section-1',
        title: 'Overview',
        type: 'info',
        fields: [
          { id: 'field-1', label: 'Name', value: 'Example Corp' }
        ]
      }
    ]
  };

  onCardInteraction(event: any): void {
    console.log('Card interaction:', event);
  }

  onFieldInteraction(event: any): void {
    console.log('Field interaction:', event);
  }
}
```

### CardPreviewComponent

Preview a card with loading states:

```typescript
import { CardPreviewComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CardPreviewComponent],
  template: `
    <app-card-preview
      [generatedCard]="card"
      [isGenerating]="isLoading"
      [isInitialized]="true"
      (cardInteraction)="handleInteraction($event)">
    </app-card-preview>
  `
})
export class CardPreviewComponent {
  card: AICardConfig | null = null;
  isLoading = false;
  
  handleInteraction(event: any): void {
    // Handle interaction
  }
}
```

### JsonEditorComponent

Edit card JSON:

```typescript
import { JsonEditorComponent } from 'osi-cards-lib';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [JsonEditorComponent],
  template: `
    <app-json-editor
      [jsonInput]="jsonString"
      [isGenerating]="false"
      (jsonInputChange)="onJsonChange($event)">
    </app-json-editor>
  `
})
export class JsonEditorComponent {
  jsonString = '{}';
  
  onJsonChange(json: string): void {
    this.jsonString = json;
  }
}
```

## Using Services

### CardDataService

Load and manage cards:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CardDataService } from 'osi-cards-lib';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-card-loader',
  standalone: true,
  template: `
    <div *ngFor="let card of cards$ | async">
      <h3>{{ card.cardTitle }}</h3>
    </div>
  `
})
export class CardLoaderComponent implements OnInit {
  private cardDataService = inject(CardDataService);
  cards$ = this.cardDataService.getAllCards();

  ngOnInit(): void {
    // Load cards
    this.cardDataService.loadCards();
  }
}
```

### ExportService

Export cards to various formats:

```typescript
import { Component, inject } from '@angular/core';
import { ExportService } from 'osi-cards-lib';
import { AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-export',
  standalone: true,
  template: `
    <button (click)="exportAsJson()">Export JSON</button>
    <button (click)="exportAsPdf()">Export PDF</button>
  `
})
export class ExportComponent {
  private exportService = inject(ExportService);
  card: AICardConfig = { /* ... */ };

  exportAsJson(): void {
    this.exportService.exportAsJson(this.card);
  }

  async exportAsPdf(): Promise<void> {
    const element = document.getElementById('card-element');
    if (element) {
      await this.exportService.exportAsPdf(this.card, element);
    }
  }
}
```

### SearchFilterService

Search and filter cards:

```typescript
import { Component, inject } from '@angular/core';
import { SearchFilterService, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input [(ngModel)]="searchQuery" (ngModelChange)="search()">
    <div *ngFor="let card of filteredCards">
      {{ card.cardTitle }}
    </div>
  `
})
export class SearchComponent {
  private searchFilter = inject(SearchFilterService);
  searchQuery = '';
  allCards: AICardConfig[] = [];
  filteredCards: AICardConfig[] = [];

  search(): void {
    this.filteredCards = this.searchFilter.searchCards(this.allCards, {
      query: this.searchQuery,
      caseSensitive: false
    });
  }
}
```

## Using the Store

### Setup NgRx Store

```typescript
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from 'osi-cards-lib';
import { CardsEffects } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(reducers),
    provideEffects([CardsEffects])
  ]
};
```

### Using Selectors

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCards, selectCurrentCard } from 'osi-cards-lib';

@Component({
  selector: 'app-cards-list',
  standalone: true,
  template: `
    <div *ngFor="let card of cards$ | async">
      {{ card.cardTitle }}
    </div>
  `
})
export class CardsListComponent {
  private store = inject(Store);
  cards$ = this.store.select(selectCards);
  currentCard$ = this.store.select(selectCurrentCard);
}
```

### Dispatching Actions

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadCards, generateCard } from 'osi-cards-lib';

@Component({
  selector: 'app-card-manager',
  standalone: true,
  template: `
    <button (click)="loadCards()">Load Cards</button>
    <button (click)="createCard()">Create Card</button>
  `
})
export class CardManagerComponent {
  private store = inject(Store);

  loadCards(): void {
    this.store.dispatch(loadCards());
  }

  createCard(): void {
    const newCard: AICardConfig = {
      id: 'new-1',
      cardTitle: 'New Card',
      cardType: 'company',
      sections: []
    };
    this.store.dispatch(generateCard({ config: newCard }));
  }
}
```

## Configuration

### AppConfigService

Configure the library:

```typescript
import { AppConfigService } from 'osi-cards-lib';

// In your app initialization
const config = inject(AppConfigService);
config.updateConfig({
  LOGGING: {
    LOG_LEVEL: 'info',
    ENABLE_SECTION_STATE_LOGGING: false
  },
  API_RATE_LIMITING: {
    enabled: true,
    refillRate: 10,
    capacity: 100
  }
});
```

## Examples

### Complete Example: Card Viewer

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AICardRendererComponent,
  CardDataService,
  Store,
  selectCards,
  loadCards
} from 'osi-cards';

@Component({
  selector: 'app-card-viewer',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent],
  template: `
    <div class="card-viewer">
      <h1>My Cards</h1>
      <button (click)="loadAllCards()">Load Cards</button>
      
      <div *ngFor="let card of cards$ | async" class="card-item">
        <app-ai-card-renderer
          [card]="card"
          (cardInteraction)="handleInteraction($event)">
        </app-ai-card-renderer>
      </div>
    </div>
  `,
  styles: [`
    .card-viewer {
      padding: 2rem;
    }
    .card-item {
      margin-bottom: 2rem;
    }
  `]
})
export class CardViewerComponent implements OnInit {
  private cardDataService = inject(CardDataService);
  private store = inject(Store);
  
  cards$ = this.store.select(selectCards);

  ngOnInit(): void {
    this.loadAllCards();
  }

  loadAllCards(): void {
    this.store.dispatch(loadCards());
  }

  handleInteraction(event: any): void {
    console.log('Interaction:', event);
  }
}
```

## Troubleshooting

### Common Issues

1. **Module not found**
   - Ensure the library is built: `npm run build:lib`
   - Check that the package is linked or installed correctly

2. **Styles not loading**
   - Import styles in `angular.json` or `styles.scss`
   - Check that CSS files are included in the build

3. **NgRx store errors**
   - Ensure `provideStore()` and `provideEffects()` are configured
   - Import reducers and effects from the library

4. **Component not rendering**
   - Check that all required providers are configured
   - Verify that the component is imported in your module/standalone component

### Getting Help

- Check the [Developer Guide](./DEVELOPER_GUIDE.md)
- Review [Examples](./EXAMPLES.md)
- Check the [Architecture Documentation](./ARCHITECTURE.md)

## Next Steps

- Explore the [API Reference](./API_REFERENCE.md)
- See [Code Examples](./EXAMPLES.md)
- Review [Best Practices](./BEST_PRACTICES.md)

