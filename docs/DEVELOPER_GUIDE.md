# OSI Cards Developer Guide

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd OSI-Cards-1

# Install dependencies
npm install

# Start development server
npm start

# Navigate to http://localhost:4200
```

### Available Scripts

```bash
# Development
npm start                    # Start dev server
npm run start:safe           # Lint and start with timeout

# Building
npm run build                # Build for development
npm run build:prod           # Build for production
npm run build:analyze        # Analyze bundle size

# Testing
npm test                     # Run unit tests
npm run test:watch           # Run tests in watch mode
npm run test:e2e             # Run E2E tests with Playwright
npm run test:integration     # Run integration tests

# Code Quality
npm run lint                 # Lint code
npm run lint:fix             # Fix linting issues
npm run format               # Format code with Prettier
npm run format:check         # Check code formatting

# Utilities
npm run size:check           # Check bundle size
npm run generate:manifest    # Generate manifest file
```

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

### Key Concepts

1. **Section-Driven Architecture**: Cards are composed of sections, each rendered by a dedicated component
2. **Provider Pattern**: Card data can come from multiple sources (JSON files, WebSocket, API)
3. **NgRx State Management**: Centralized state management for cards
4. **Design Tokens**: All styling uses CSS custom properties
5. **Standalone Components**: All components are standalone (Angular 17+)

## Adding a New Section Type

### Step 1: Create Component

Create a new component in `src/app/shared/components/cards/sections/your-section/`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';
import { CardField } from '../../../../../models';

@Component({
  selector: 'app-your-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './your-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourSectionComponent extends BaseSectionComponent<CardField> {
  // Component-specific logic
}
```

### Step 2: Create Template

Create `your-section.component.html`:

```html
<div class="ai-section ai-section--your-section">
  <div class="ai-section__header">
    <h3 class="ai-section__title">{{ section.title }}</h3>
  </div>
  <div class="ai-section__body">
    <div *ngFor="let field of getFields(); trackBy: trackField">
      <!-- Your section content -->
    </div>
  </div>
</div>
```

### Step 3: Add Styles

Create `src/styles/components/sections/_your-section.scss`:

```scss
.your-section {
  @include card;
  @include section-grid;
  
  // Your custom styles using design tokens
}
```

Import in `src/styles.scss`:

```scss
@import 'styles/components/sections/your-section';
```

### Step 4: Register in SectionRenderer

Add to `SectionRendererComponent`:

```typescript
import { YourSectionComponent } from './sections/your-section/your-section.component';

// In imports array
imports: [
  // ... existing imports
  YourSectionComponent
]

// In template switch
<app-your-section *ngSwitchCase="'your-type'" ...></app-your-section>
```

### Step 5: Update Types

Add to `CardSection['type']` in `src/app/models/card.model.ts`:

```typescript
type: 'info' | 'your-type' | ...
```

## Testing Best Practices

### Unit Testing

Use test builders for consistent test data:

```typescript
import { CardBuilder, SectionBuilder, FieldBuilder, TestCardFactory } from '../../testing/test-builders';

describe('YourComponent', () => {
  it('should render fields', () => {
    const card = CardBuilder.create()
      .withSection(
        SectionBuilder.create()
          .withType('your-type')
          .withField(FieldBuilder.create().withLabel('Test').withValue('Value').build())
          .build()
      )
      .build();
    
    // Test component
  });

  // Use factory methods for common scenarios
  it('should handle simple info card', () => {
    const card = TestCardFactory.createSimpleInfoCard();
    // Test with common scenario
  });
});
```

### Component Testing Best Practices

1. **Use OnPush Strategy**: Test with OnPush change detection
2. **Mock Dependencies**: Mock services and dependencies
3. **Test Interactions**: Test user interactions and events
4. **Test Edge Cases**: Test with null, undefined, empty data

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YourSectionComponent } from './your-section.component';
import { provideStore } from '@ngrx/store';

describe('YourSectionComponent', () => {
  let component: YourSectionComponent;
  let fixture: ComponentFixture<YourSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourSectionComponent],
      providers: [
        provideStore({ cards: cardsReducer })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YourSectionComponent);
    component = fixture.componentInstance;
    component.section = SectionBuilder.create().build();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle empty fields', () => {
    component.section = SectionBuilder.create().withFields([]).build();
    fixture.detectChanges();
    expect(component.getFields().length).toBe(0);
  });

  it('should emit field interaction', () => {
    spyOn(component.fieldInteraction, 'emit');
    const field = FieldBuilder.create().build();
    component.emitFieldInteraction(field);
    expect(component.fieldInteraction.emit).toHaveBeenCalledWith(field);
  });
});
```

### Integration Testing

Test complete flows:

```typescript
describe('Card Generation Flow', () => {
  it('should generate card from JSON input', async () => {
    // Test complete flow: JSON input -> validation -> generation -> rendering
  });

  it('should handle streaming updates', async () => {
    // Test LLM streaming simulation
  });
});
```

### E2E Testing Best Practices

1. **Use Data Attributes**: Add `data-testid` for reliable selectors
2. **Wait for Stability**: Wait for network idle, animations
3. **Test User Journeys**: Test complete user workflows
4. **Screenshot Testing**: Capture screenshots for visual regression

```typescript
import { test, expect } from '@playwright/test';

test('should render card with your section', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Use data-testid for reliable selectors
  const card = page.locator('[data-testid="card-item"]').first();
  await expect(card).toBeVisible();
  
  // Test interactions
  await card.click();
  await expect(page.locator('[data-testid="card-details"]')).toBeVisible();
});
```

### Test Coverage Goals

- **Unit Tests**: 85%+ coverage for services and utilities
- **Component Tests**: All components should have tests
- **Integration Tests**: Critical paths should be covered
- **E2E Tests**: Main user journeys should be tested

## Code Style Guidelines

### TypeScript

- Use strict mode
- Prefer interfaces over types for object shapes
- Use readonly for immutable data
- Use const assertions where appropriate

### Angular

- Use standalone components
- Use OnPush change detection
- Use inject() for dependency injection
- Use takeUntilDestroyed for subscriptions

### Naming Conventions

- Components: PascalCase (e.g., `InfoSectionComponent`)
- Services: PascalCase with Service suffix (e.g., `CardDataService`)
- Files: kebab-case (e.g., `card-data.service.ts`)
- Variables: camelCase (e.g., `cardTitle`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

## Performance Best Practices

1. **Use OnPush Change Detection**: All components should use OnPush
2. **TrackBy Functions**: Always use trackBy with *ngFor
3. **Lazy Loading**: Lazy load optional dependencies
4. **Memoization**: Cache expensive computations
5. **Batch Updates**: Batch DOM updates using RAF

## Security Guidelines

1. **Sanitize Inputs**: Always sanitize user inputs
2. **Use SafeHtml Pipe**: For HTML content
3. **Validate JSON**: Validate all JSON inputs
4. **CSP Headers**: Configure Content Security Policy
5. **XSS Protection**: Never use innerHTML with user data

## Accessibility Guidelines

1. **ARIA Labels**: Add ARIA labels to all interactive elements
2. **Keyboard Navigation**: Ensure full keyboard support
3. **Focus Management**: Manage focus properly
4. **Color Contrast**: Ensure WCAG AA compliance
5. **Screen Readers**: Test with screen readers

## Deployment

### Production Build

```bash
npm run build:prod
```

### Environment Configuration

Configure environments in `src/environments/`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  featureFlags: {
    llmSimulation: true
  }
};
```

### CI/CD

The project includes GitHub Actions workflows for:
- Code quality checks
- Unit and integration tests
- E2E tests
- Build verification

## Troubleshooting

### Common Issues

1. **Build Errors**: Clear `.angular` cache and rebuild
2. **Test Failures**: Check test data and mocks
3. **Styling Issues**: Verify design tokens are imported
4. **Type Errors**: Check type guards and validations

### Debugging Strategies

### Using Angular DevTools

1. **Install Angular DevTools**: Browser extension for Angular debugging
2. **Component Inspection**: Inspect component tree, inputs, outputs
3. **Change Detection**: Profile change detection cycles
4. **Dependency Injection**: View injector tree

```typescript
// Enable change detection profiling
import { ApplicationRef } from '@angular/core';

// In component
constructor(private appRef: ApplicationRef) {
  // Profile change detection
  if (!environment.production) {
    this.appRef.tick(); // Force change detection
  }
}
```

### Using Redux DevTools

1. **State Inspection**: View current NgRx state
2. **Action History**: See all dispatched actions
3. **Time Travel**: Replay actions to debug state changes
4. **Export/Import**: Save and restore state snapshots

### Logging Strategies

```typescript
import { LoggingService } from '@core';

// Use appropriate log levels
this.logger.debug('Detailed debug info', 'ComponentName', { data });
this.logger.info('General information', 'ComponentName');
this.logger.warn('Warning message', 'ComponentName', warning);
this.logger.error('Error occurred', 'ComponentName', error);
```

### Performance Profiling

1. **Chrome DevTools Performance Tab**:
   - Record performance profile
   - Identify bottlenecks
   - Analyze frame rates
   - Check memory usage

2. **Angular Performance Service**:
   ```typescript
   import { PerformanceService } from '@core';
   
   // Measure operation
   const result = performanceService.measure('operationName', () => {
     // Your code
   });
   
   // Get metrics
   const metrics = performanceService.getMetrics();
   const summary = performanceService.getSummary();
   ```

3. **Web Vitals**:
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - FCP (First Contentful Paint)
   - TTI (Time to Interactive)

### Memory Leak Detection

```typescript
// Use takeUntilDestroyed for subscriptions
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

this.data$.pipe(
  takeUntilDestroyed(this.destroyRef)
).subscribe(...);

// Check memory usage
const memory = (performance as any).memory;
console.log('Memory:', {
  used: memory.usedJSHeapSize / 1048576 + 'MB',
  total: memory.totalJSHeapSize / 1048576 + 'MB',
  limit: memory.jsHeapSizeLimit / 1048576 + 'MB'
});
```

## Contributing Guidelines

### Getting Started

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow code style guidelines
4. **Write Tests**: Add tests for new features
5. **Update Documentation**: Update relevant docs
6. **Submit Pull Request**: Create PR with description

### Pull Request Process

1. **Description**: Provide clear description of changes
2. **Tests**: Ensure all tests pass
3. **Linting**: Fix all linting errors
4. **Documentation**: Update docs if needed
5. **Review**: Address review comments

### Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is properly typed (TypeScript strict mode)
- [ ] Components use OnPush change detection
- [ ] TrackBy functions used in *ngFor
- [ ] No console statements (use LoggingService)
- [ ] Error handling implemented
- [ ] Accessibility considered (ARIA labels, keyboard nav)
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] Changelog updated (if user-facing)

### Commit Message Format

Follow conventional commits:

```
feat: add new section type
fix: resolve memory leak in streaming
docs: update architecture diagrams
refactor: extract JSON editor component
test: add unit tests for command service
perf: optimize bundle size
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `perf/` - Performance improvements

## Resources

- [Angular Documentation](https://angular.io/docs)
- [NgRx Documentation](https://ngrx.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Architecture Documentation](./ARCHITECTURE.md)

