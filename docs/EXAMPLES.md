# Code Examples and Recipes

This document provides practical code examples and recipes for common use cases in OSI Cards.

## Table of Contents

1. [Creating Cards](#creating-cards)
2. [Extending the Framework](#extending-the-framework)
3. [Troubleshooting](#troubleshooting)
4. [Migration Guides](#migration-guides)
5. [Performance Optimization](#performance-optimization)

## Creating Cards

### Basic Card Example

```typescript
import { AICardConfig } from '@app/models';

const myCard: AICardConfig = {
  cardTitle: 'My Company',
  cardType: 'company',
  sections: [
    {
      title: 'Company Info',
      type: 'info',
      fields: [
        { label: 'Industry', value: 'Technology' },
        { label: 'Employees', value: '1000+' }
      ]
    }
  ]
};
```

### Using Command Service for Undo/Redo

```typescript
import { Component, inject } from '@angular/core';
import { CommandService } from '@shared';

@Component({...})
export class MyComponent {
  private commandService = inject(CommandService);

  editCard(newCard: AICardConfig): void {
    const oldCard = this.currentCard;
    const command = this.commandService.createCardEditCommand(
      newCard.id!,
      oldCard,
      newCard,
      (card) => { this.currentCard = card as AICardConfig; },
      'Edit company card'
    );
    this.commandService.execute(command);
  }

  // Undo/Redo are automatically handled via Ctrl+Z / Ctrl+Y
}
```

### Using Validation Decorators

```typescript
import { Component } from '@angular/core';
import { Validate, ValidateCardType, ValidateNonEmpty } from '@shared/utils';
import { CardType } from '@app/models';

@Component({...})
export class CardFormComponent {
  @ValidateNonEmpty('Card title is required')
  cardTitle: string = '';

  @ValidateCardType()
  cardType: CardType = 'company';

  @Validate((value: string) => {
    if (value.length > 1000) {
      return { isValid: false, error: 'Description too long' };
    }
    return { isValid: true };
  })
  description: string = '';
}
```

## Extending the Framework

### Creating a Custom Section Component

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseSectionComponent } from '../base-section.component';
import { CardField } from '@app/models';

@Component({
  selector: 'app-custom-section',
  standalone: true,
  templateUrl: './custom-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomSectionComponent extends BaseSectionComponent<CardField> {
  // Custom logic here
}
```

### Adding a New Card Provider

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AICardConfig } from '@app/models';
import { CardDataProvider } from './card-data-provider.interface';

@Injectable()
export class MyCustomProvider extends CardDataProvider {
  override getAllCards(): Observable<AICardConfig[]> {
    // Implement your data source
    return of([...]);
  }
  
  // Implement other required methods
}
```

### Using Error Recovery

```typescript
import { Component, inject } from '@angular/core';
import { ErrorHandlingService } from '@core';

@Component({...})
export class MyComponent {
  private errorService = inject(ErrorHandlingService);

  loadData(): void {
    this.errorService.executeWithRetry(
      () => this.dataService.fetchData(),
      {
        maxRetries: 3,
        delay: 1000,
        backoff: 'exponential',
        retryable: (error) => error.status >= 500
      }
    ).subscribe({
      next: (data) => console.log('Data loaded', data),
      error: (error) => console.error('Failed after retries', error)
    });
  }
}
```

## Troubleshooting

### Card Not Rendering

**Problem**: Card doesn't appear in the grid.

**Solutions**:
1. Check JSON validity: Use `JsonValidationService.validateJsonSyntax()`
2. Verify card structure: Ensure `cardTitle` and `sections` are present
3. Check console for errors: Use LoggingService to see detailed errors
4. Verify IDs: Cards need unique IDs - use `ensureCardIds()`

```typescript
import { ensureCardIds } from '@shared';

const cardWithIds = ensureCardIds(myCard);
```

### Performance Issues

**Problem**: Slow rendering with many cards.

**Solutions**:
1. Enable virtual scrolling for 100+ cards
2. Use OnPush change detection
3. Implement trackBy functions
4. Check performance budgets

```typescript
// Use trackBy in *ngFor
trackByCardId(index: number, card: AICardConfig): string {
  return card.id || index.toString();
}
```

### Streaming Not Working

**Problem**: LLM simulation doesn't show progressive updates.

**Solutions**:
1. Check `isSimulatingLLM` flag
2. Verify JSON is being parsed incrementally
3. Check section completion states
4. Enable debug logging

```typescript
// Enable section state logging
ENABLE_SECTION_STATE_LOGGING = true;
```

## Migration Guides

### Migrating from Console to LoggingService

**Before**:
```typescript
console.log('Debug message', data);
console.error('Error occurred', error);
```

**After**:
```typescript
import { LoggingService } from '@core';

private logger = inject(LoggingService);

this.logger.debug('Debug message', 'ComponentName', data);
this.logger.error('Error occurred', 'ComponentName', error);
```

### Migrating to Validation Decorators

**Before**:
```typescript
if (!cardTitle || cardTitle.trim().length === 0) {
  throw new Error('Card title is required');
}
```

**After**:
```typescript
@ValidateNonEmpty('Card title is required')
cardTitle: string = '';
```

## Performance Optimization

### Optimizing Bundle Size

```typescript
// Lazy load optional dependencies
const loadChart = () => import('chart.js').then(m => m.default);

// Use tree-shaking friendly imports
import { specificFunction } from 'library';
// Instead of: import * from 'library';
```

### Optimizing Change Detection

```typescript
// Use OnPush strategy
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Use trackBy functions
trackByFieldId(index: number, field: CardField): string {
  return field.id || index.toString();
}
```

### Memory Management

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Properly unsubscribe
this.data$.pipe(
  takeUntilDestroyed(this.destroyRef)
).subscribe(...);
```

## Advanced Recipes

### Custom Section Type Resolution

```typescript
import { SectionNormalizationService } from '@shared';

// Add custom type mapping
sectionNormalizationService.addTypeMapping('custom-type', 'info');
```

### Custom Error Recovery Strategy

```typescript
errorService.addFallbackStrategy({
  condition: (error) => error.type === ErrorType.NETWORK,
  fallback: () => this.loadCachedData(),
  description: 'Load cached data on network error'
});
```

### Rate Limiting Configuration

```typescript
import { RateLimitInterceptor } from '@core/interceptors/rate-limit.interceptor';

// Configure rate limiting
rateLimitInterceptor.configure({
  capacity: 20,
  refillRate: 5, // 5 requests per second
  enabled: true
});
```



