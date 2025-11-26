# OSI Cards Integration - Complete Example

This is a complete, working example of integrating OSI Cards into an Angular application.

## Project Setup

### 1. Create a New Angular Project

```bash
ng new my-app
cd my-app
```

### 2. Install OSI Cards

#### Option A: From Local Build
```bash
# Build OSI Cards library
cd /path/to/OSI-Cards-1
npm run build:lib

# Install in your project
cd /path/to/my-app
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

#### Option B: Using NPM Link (Development)
```bash
# In OSI Cards directory
cd /path/to/OSI-Cards-1
npm link

# In your project
cd /path/to/my-app
npm link osi-cards
```

### 3. Configure Your App

**app.config.ts:**
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideAnimations } from '@angular/platform-browser/animations';

// Import OSI Cards
import { 
  provideOSICards,
  reducers,
  CardsEffects
} from 'osi-cards-lib';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(),
    provideStore(reducers),
    provideEffects([CardsEffects]),
    
    // Configure OSI Cards
    provideOSICards({
      enableLogging: true,
      logLevel: 'info',
      enableDevTools: true // Only in development
    })
  ]
};
```

### 4. Import Styles

**angular.json:**
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/osi-cards-lib/styles/_styles.scss",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

Or in **styles.scss:**
```scss
@import 'osi-cards-lib/styles/_styles';
```

### 5. Create a Card Component

**src/app/card-viewer/card-viewer.component.ts:**
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AICardRendererComponent,
  CardDataService,
  Store,
  selectCards,
  loadCards,
  generateCard,
  AICardConfig
} from 'osi-cards-lib';

@Component({
  selector: 'app-card-viewer',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent],
  template: `
    <div class="card-viewer">
      <h1>OSI Cards Viewer</h1>
      
      <div class="controls">
        <button (click)="loadAllCards()">Load Cards</button>
        <button (click)="createSampleCard()">Create Sample Card</button>
      </div>

      <div class="cards-grid">
        <div *ngFor="let card of cards$ | async" class="card-item">
          <app-ai-card-renderer
            [card]="card"
            [isFullscreen]="false"
            (cardInteraction)="handleCardInteraction($event)"
            (fieldInteraction)="handleFieldInteraction($event)">
          </app-ai-card-renderer>
        </div>
      </div>

      <div *ngIf="(cards$ | async)?.length === 0" class="empty-state">
        <p>No cards loaded. Click "Load Cards" to load from assets.</p>
      </div>
    </div>
  `,
  styles: [`
    .card-viewer {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .controls button {
      padding: 0.75rem 1.5rem;
      background: #FF7900;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: opacity 0.2s;
    }

    .controls button:hover {
      opacity: 0.9;
    }

    .cards-grid {
      display: grid;
      gap: 2rem;
    }

    .card-item {
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }
  `]
})
export class CardViewerComponent implements OnInit {
  private cardDataService = inject(CardDataService);
  private store = inject(Store);
  
  cards$ = this.store.select(selectCards);

  ngOnInit(): void {
    // Optionally load cards on init
    // this.loadAllCards();
  }

  loadAllCards(): void {
    this.store.dispatch(loadCards());
  }

  createSampleCard(): void {
    const sampleCard: AICardConfig = {
      id: `sample-${Date.now()}`,
      cardTitle: 'Sample Company',
      cardSubtitle: 'A sample card created programmatically',
      cardType: 'company',
      sections: [
        {
          id: 'section-1',
          title: 'Company Overview',
          type: 'info',
          fields: [
            { 
              id: 'field-1', 
              label: 'Industry', 
              value: 'Technology' 
            },
            { 
              id: 'field-2', 
              label: 'Employees', 
              value: '1000+' 
            },
            { 
              id: 'field-3', 
              label: 'Founded', 
              value: '2020' 
            }
          ]
        },
        {
          id: 'section-2',
          title: 'Key Metrics',
          type: 'analytics',
          fields: [
            { 
              id: 'field-4', 
              label: 'Revenue', 
              value: '$10M', 
              percentage: 100, 
              trend: 'up' 
            },
            { 
              id: 'field-5', 
              label: 'Growth', 
              value: '25%', 
              percentage: 25, 
              trend: 'up' 
            }
          ]
        }
      ]
    };

    // Using NgRx (recommended)
    this.store.dispatch(generateCard({ config: sampleCard }));
  }

  handleCardInteraction(event: any): void {
    console.log('Card interaction:', event);
    // Handle card-level interactions (e.g., clicks, actions)
  }

  handleFieldInteraction(event: any): void {
    console.log('Field interaction:', event);
    // Handle field-level interactions (e.g., field clicks, value changes)
  }
}
```

**Don't forget to import `generateCard`:**
```typescript
import { generateCard } from 'osi-cards';
```

### 6. Add Route

**app.routes.ts:**
```typescript
import { Routes } from '@angular/router';
import { CardViewerComponent } from './card-viewer/card-viewer.component';

export const routes: Routes = [
  { path: '', component: CardViewerComponent },
  { path: 'cards', component: CardViewerComponent }
];
```

### 7. Update App Component

**app.component.ts:**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'My App with OSI Cards';
}
```

## Running the Application

```bash
npm start
```

Navigate to `http://localhost:4200` and you should see the OSI Cards viewer.

## Using Services Directly

You can also use OSI Cards services without NgRx:

```typescript
import { Component, inject } from '@angular/core';
import { CardDataService, ExportService } from 'osi-cards-lib';

@Component({
  selector: 'app-my-component',
  standalone: true,
  template: `
    <button (click)="loadCards()">Load</button>
    <button (click)="exportCard()">Export</button>
  `
})
export class MyComponent {
  private cardDataService = inject(CardDataService);
  private exportService = inject(ExportService);

  async loadCards() {
    const cards = await this.cardDataService.getAllCards().toPromise();
    console.log('Loaded cards:', cards);
  }

  exportCard() {
    const card = { /* your card */ };
    this.exportService.exportAsJson(card);
  }
}
```

## Troubleshooting

### Issue: Module not found
**Solution:** Ensure the library is built and installed correctly:
```bash
cd OSI-Cards-1
npm run build:lib
cd ../my-app
npm install ../OSI-Cards-1/dist/osi-cards-lib
```

### Issue: Styles not loading
**Solution:** Check that styles are imported in `angular.json` or `styles.scss`:
```scss
@import 'osi-cards-lib/styles/_styles';
```

### Issue: NgRx errors
**Solution:** Ensure `provideStore()` and `provideEffects()` are configured with the correct reducers and effects

### Issue: Components not rendering
**Solution:** Verify all required providers are in `app.config.ts` and components are imported

## Next Steps

- Explore the [Integration Guide](./INTEGRATION_GUIDE.md) for more advanced usage
- Check the [API Reference](./API_REFERENCE.md) for detailed API documentation
- See [Examples](./EXAMPLES.md) for more code samples

