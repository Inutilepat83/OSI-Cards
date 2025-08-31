# OSI Cards - AI Agent Instructions

## Architecture Overview

**OSI Cards** is a modular Angular 17+ application for creating and managing interactive business cards with advanced visualization features. The app follows a **core/shared/features** architecture pattern with lazy-loaded feature modules.

### Key Architectural Patterns

#### 1. Modular Structure

```
src/app/
├── core/           # Singleton services, interceptors, global providers
├── shared/         # Reusable components, UI modules, common utilities
├── features/       # Feature-specific modules (lazy-loaded)
├── models/         # TypeScript interfaces and types
└── services/       # Legacy service location (being migrated to core/)
```

#### 2. Component Communication

- **Input/Output**: Standard Angular component communication
- **Services**: Observable-based reactive data flow using RxJS
- **ViewChild**: DOM manipulation for tilt effects and interactions
- **ChangeDetectionStrategy.OnPush**: Performance optimization pattern

#### 3. Data Flow Patterns

```typescript
// JSON-based card configuration system
interface AICardConfig {
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event';
  sections: CardSection[];
  // ... other properties
}

// Observable-based service pattern
@Injectable({ providedIn: 'root' })
export class LocalCardConfigurationService {
  getTemplate(cardType: string): Observable<AICardConfig> {
    return of(templateData);
  }
}
```

## Critical Workflows

### Development Server

```bash
npm start  # Runs ng serve with hot reload
```

### Build Commands

```bash
npm run build          # Production build
npm run build -- --configuration=development  # Dev build
```

### Testing

```bash
npm test              # Karma/Jasmine unit tests
npx cypress open      # E2E tests (if configured)
```

## Component Patterns

### UI Framework Integration

**Dual UI Library Approach**: Uses both Angular Material and PrimeNG

```typescript
// Shared module exports both libraries
@NgModule({
  imports: [
    MatButtonModule,
    MatCardModule, // Angular Material
    ButtonModule,
    CardModule, // PrimeNG
  ],
  exports: [
    /* both libraries */
  ],
})
export class SharedModule {}
```

### Interactive Components

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance pattern
  templateUrl: './component.html',
})
export class AICardRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardContainer') cardContainer!: ElementRef; // DOM access pattern

  private destroyed$ = new Subject<void>(); // Memory leak prevention

  ngOnInit() {
    // RxJS subscription pattern
    this.service.data$.pipe(takeUntil(this.destroyed$)).subscribe(data => this.handleData(data));
  }

  ngOnDestroy() {
    this.destroyed$.next(); // Cleanup pattern
    this.destroyed$.complete();
  }
}
```

## Service Patterns

### Core Service Structure

```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  private state$ = new BehaviorSubject<AppState>({});
  readonly state$ = this.state$.asObservable();

  updateState(newState: Partial<AppState>) {
    this.state$.next({ ...this.state$.value, ...newState });
  }
}
```

### HTTP Interceptors

```typescript
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(error => this.handleError(error)));
  }
}
```

## Data Management

### Card Configuration System

- **JSON-driven**: All card content defined via JSON configuration
- **Type-safe**: Strong TypeScript interfaces for all data structures
- **Persistent**: localStorage integration for saving configurations
- **Template-based**: Predefined templates for different card types

### State Management

- **Custom StateService**: Observable-based state management (not NgRx yet)
- **Reactive**: RxJS-powered data streams throughout the app
- **Service Layer**: Centralized business logic in services

## Key Integration Points

### External Libraries

- **Chart.js**: Data visualization in chart sections
- **Leaflet**: Interactive maps in map sections
- **html2canvas**: Card export functionality
- **Supabase**: Backend integration (configured but not fully implemented)

### UI Components

- **Angular Material**: Primary UI component library
- **PrimeNG**: Enhanced components (Toast, advanced inputs)
- **Custom Components**: Specialized card renderers and interactive elements

## Development Conventions

### File Naming

- **Components**: `component-name.component.ts`
- **Services**: `service-name.service.ts`
- **Models**: `model-name.model.ts`
- **Modules**: `feature-name.module.ts`

### Import Organization

```typescript
// Angular core imports first
import { Component, OnInit } from '@angular/core';

// External libraries
import { Observable } from 'rxjs';

// Local imports (relative paths)
import { AICardConfig } from '../../models/card.model';
import { StateService } from '../../core/state/state.service';
```

### Error Handling

```typescript
// Global error handler pattern
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Global error:', error);
    // Custom error reporting logic
  }
}
```

## Migration Context

**Recently migrated from React/Vite to Angular 17+**

- **React Hooks → Angular Services**: State management converted to injectable services
- **JSX → Templates**: Component templates converted to Angular template syntax
- **Props → @Input/@Output**: Component communication standardized
- **Context → Services**: Global state moved to injectable services

## Performance Patterns

### Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush  // Optimize re-renders
})
```

### Memory Management

```typescript
// Always unsubscribe from observables
private destroyed$ = new Subject<void>();

ngOnDestroy() {
  this.destroyed$.next();
  this.destroyed$.complete();
}
```

### Lazy Loading

```typescript
// Feature module lazy loading
const routes: Routes = [
  {
    path: 'cards',
    loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule),
  },
];
```

## Common Pitfalls

1. **Module Dependencies**: Always import SharedModule for Material/PrimeNG components
2. **Service Injection**: Use `providedIn: 'root'` for singleton services
3. **Observable Cleanup**: Always unsubscribe to prevent memory leaks
4. **Change Detection**: Use OnPush strategy for performance-critical components
5. **Template Context**: Be careful with `this` context in template event handlers

## Key Files to Reference

- `src/app/core/core.module.ts` - Core service providers and global setup
- `src/app/shared/shared.module.ts` - UI library exports and shared components
- `src/app/models/card.model.ts` - Core data type definitions
- `src/app/features/cards/cards.module.ts` - Feature module structure example
- `migration-plan.md` - Migration context and architectural decisions
