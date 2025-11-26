# OSI Cards - Full Integration Guide

This guide covers integrating OSI Cards as a complete library with all services, store, and features.

## Two Integration Options

### Option 1: Component-Only Library (Recommended for Most Cases)

The built library at `dist/osi-cards-lib` provides components and basic services. This is the simplest integration.

**Package Name**: `osi-cards-lib`

**What's Included**:
- All card components (AICardRendererComponent, SectionRendererComponent, etc.)
- All section components (20+ types)
- Basic services (IconService, SectionNormalizationService, etc.)
- Models and types
- Styles

**What's NOT Included**:
- CardDataService (you provide your own data)
- NgRx store (manage state in your app)
- Core services (LoggingService, PerformanceService, etc.)

**Use Case**: When you want to render cards but manage data and state yourself.

### Option 2: Full Application Integration

For full functionality including services and NgRx store, you can:

1. **Copy source files** into your project
2. **Use as a monorepo workspace**
3. **Import directly from source** (development only)

## Option 1: Component Library Integration (Recommended)

### Installation

```bash
# Build the library
cd OSI-Cards-1
npm run build:lib

# Install in your project
cd your-project
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

### Basic Setup

**1. Import Styles**

In `angular.json`:
```json
{
  "styles": [
    "node_modules/osi-cards-lib/styles/_styles.scss"
  ]
}
```

**2. Use Components**

```typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [card]="myCard"></app-ai-card-renderer>
  `
})
export class CardsComponent {
  myCard: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      {
        title: 'Info',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' }
        ]
      }
    ]
  };
}
```

### Managing Card Data

Since CardDataService is not included, you'll manage data yourself:

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-card-loader',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer 
      *ngFor="let card of cards"
      [card]="card">
    </app-ai-card-renderer>
  `
})
export class CardLoaderComponent {
  private http = inject(HttpClient);
  cards: AICardConfig[] = [];

  ngOnInit() {
    // Load cards from your API
    this.http.get<AICardConfig[]>('/api/cards').subscribe(cards => {
      this.cards = cards;
    });
  }
}
```

## Option 2: Full Integration (Advanced)

For full functionality, you can integrate the source code directly.

### Method A: Monorepo Workspace

**1. Create Angular Workspace**

```bash
ng new my-workspace --create-application=false
cd my-workspace
```

**2. Add OSI Cards as Library**

```bash
# Copy OSI Cards source
cp -r /path/to/OSI-Cards-1/src/app my-workspace/libs/osi-cards/src/lib

# Create library
ng generate library osi-cards
```

**3. Configure Paths**

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@osi/cards": ["libs/osi-cards/src/public-api.ts"]
    }
  }
}
```

**4. Import Everything**

```typescript
import { 
  AICardRendererComponent,
  CardDataService,
  provideOSICards,
  reducers,
  CardsEffects
} from '@osi/cards';
```

### Method B: Direct Source Import (Development)

**1. Add Path Mapping**

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@osi/cards/*": ["../OSI-Cards-1/src/app/*"]
    }
  }
}
```

**2. Import from Source**

```typescript
import { AICardRendererComponent } from '@osi/cards/shared/components/cards';
import { CardDataService } from '@osi/cards/core/services/card-data';
```

**Note**: This method requires the OSI Cards project to be built and may have dependency issues.

## Complete Example: Full Integration

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideAnimations } from '@angular/platform-browser/animations';

// If using Option 2 (full integration)
import { 
  provideOSICards,
  reducers,
  CardsEffects
} from '@osi/cards'; // or your path

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideStore(reducers),
    provideEffects([CardsEffects]),
    provideOSICards({
      enableLogging: true,
      logLevel: 'info'
    })
  ]
};
```

## Comparison

| Feature | Component Library | Full Integration |
|---------|------------------|------------------|
| Components | ✅ | ✅ |
| Basic Services | ✅ | ✅ |
| CardDataService | ❌ | ✅ |
| NgRx Store | ❌ | ✅ |
| Core Services | ❌ | ✅ |
| Setup Complexity | Low | High |
| Bundle Size | Smaller | Larger |
| Flexibility | High | Medium |

## Recommendation

- **Use Component Library** if you:
  - Want to render cards with your own data
  - Prefer managing state yourself
  - Want smaller bundle size
  - Need quick integration

- **Use Full Integration** if you:
  - Need CardDataService functionality
  - Want NgRx store integration
  - Need all core services
  - Are building a complex application

## Next Steps

- See [Integration Guide](./INTEGRATION_GUIDE.md) for component library details
- See [Integration Example](./INTEGRATION_EXAMPLE.md) for working examples
- See [Integration Checklist](./INTEGRATION_CHECKLIST.md) for verification steps






