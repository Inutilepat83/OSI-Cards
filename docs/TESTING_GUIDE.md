# OSI Cards - Comprehensive Testing Guide

**Version:** 1.0.0
**Last Updated:** December 3, 2025
**Target Coverage:** 95%+

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [E2E Testing](#e2e-testing)
5. [Visual Regression Testing](#visual-regression-testing)
6. [Performance Testing](#performance-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Test Data Builders](#test-data-builders)
9. [Best Practices](#best-practices)
10. [CI/CD Integration](#cicd-integration)

## Overview

OSI Cards employs a comprehensive testing strategy to ensure quality, reliability, and maintainability. This guide covers all testing types, utilities, and best practices.

### Testing Pyramid

```
         /\
        /E2\      E2E Tests (10%)
       /----\     - Integration
      / Intg \    - Visual Regression
     /--------\
    /  Unit   \   Unit Tests (90%)
   /----------\   - Components
  /__________\    - Services
                  - Utilities
```

### Coverage Goals

| Type | Target | Current | Status |
|------|--------|---------|--------|
| Statements | 95% | 94.2% | 🟡 |
| Branches | 90% | 89.7% | 🟡 |
| Functions | 95% | 93.8% | 🟡 |
| Lines | 95% | 94.1% | 🟡 |

## Testing Strategy

### Test Types by Component

#### Components
- **Unit tests**: Component logic, inputs, outputs
- **Visual tests**: Screenshot comparison
- **Accessibility tests**: WCAG compliance
- **E2E tests**: User interactions

#### Services
- **Unit tests**: Business logic, state management
- **Integration tests**: Service interactions
- **Contract tests**: API contracts

#### Utilities
- **Unit tests**: Pure function testing
- **Property-based tests**: Edge cases

## Unit Testing

### Setup

```typescript
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MyComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### Using Test Data Builders

```typescript
import { TestBuilders } from '@osi-cards/testing';

describe('Card Component', () => {
  it('should render minimal card', () => {
    const card = TestBuilders.Card.create()
      .withTitle('Test Card')
      .withSection(
        TestBuilders.Section.create()
          .asInfo()
          .build()
      )
      .build();

    // Test with card
  });

  it('should render large card', () => {
    const card = TestBuilders.Helpers.createLargeCard();
    // Test performance
  });
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const result = await service.fetchData();
  expect(result).toBeDefined();
});

// Or with fakeAsync
it('should debounce input', fakeAsync(() => {
  component.onInput('test');
  tick(300);
  expect(component.processedValue).toBe('test');
}));
```

### Testing RxJS Streams

```typescript
import { TestScheduler } from 'rxjs/testing';

it('should throttle emissions', () => {
  const scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  scheduler.run(({ cold, expectObservable }) => {
    const source = cold('a-b-c-d-e|');
    const result = source.pipe(throttleTime(20, scheduler));
    expectObservable(result).toBe('a---c---e|');
  });
});
```

## E2E Testing

### Playwright Setup

```typescript
import { test, expect } from '@playwright/test';

test.describe('Card Rendering', () => {
  test('should render card with sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ai-card"]');

    const card = await page.locator('[data-testid="ai-card"]');
    await expect(card).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
export class CardPage {
  constructor(private page: Page) {}

  async navigateTo() {
    await this.page.goto('/cards');
  }

  async getCard(index: number) {
    return this.page.locator('[data-testid="ai-card"]').nth(index);
  }

  async clickAction(cardIndex: number, actionLabel: string) {
    const card = await this.getCard(cardIndex);
    await card.locator(`button:has-text("${actionLabel}")`).click();
  }
}
```

## Visual Regression Testing

### Taking Snapshots

```typescript
import { test, expect } from '@playwright/test';

test('visual snapshot of card', async ({ page }) => {
  await page.goto('/cards/example');

  const card = await page.locator('[data-testid="ai-card"]');
  await expect(card).toHaveScreenshot('card-example.png', {
    threshold: 0.1,
    maxDiffPixels: 100,
  });
});
```

### Using Visual Regression Utils

```typescript
import { compareElementToBaseline, updateBaseline } from '@osi-cards/testing';

// In component test
const result = await compareElementToBaseline(
  element,
  'section-info-baseline',
  { threshold: 0.05 }
);

expect(result.match).toBe(true);
```

## Performance Testing

### Lighthouse CI

```bash
npm run test:performance
```

### Custom Performance Tests

```typescript
import { PerformanceMonitor } from '@osi-cards/utils';

const monitor = new PerformanceMonitor({
  frameTime: 16.67,
  renderTime: 8,
});

monitor.start();

monitor.startMeasure('render-card');
// ... render operation
monitor.endMeasure('render-card');

const metrics = monitor.getMetrics();
expect(metrics[0].duration).toBeLessThan(50);
```

### Memory Testing

```typescript
import { MemoryLeakDetector } from '@osi-cards/utils';

const detector = new MemoryLeakDetector();
detector.enable();

// ... operations that might leak
await performOperations();

const stats = detector.getStatistics();
expect(stats.warnings.high).toBe(0);

detector.disable();
```

## Accessibility Testing

### Automated A11y Tests

```typescript
import { testA11y, testContrast } from '@osi-cards/testing';

it('should be accessible', () => {
  const result = testA11y(element);
  expect(result.passed).toBe(true);
  expect(result.violations.length).toBe(0);
});

it('should have proper contrast', () => {
  const result = testContrast('#FF7900', '#FFFFFF');
  expect(result.passed).toBe(true);
  expect(result.ratio).toBeGreaterThan(4.5);
});
```

### Manual A11y Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus is visible and logical
- [ ] Color contrast meets WCAG AA
- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] ARIA labels are descriptive

## Test Data Builders

### Creating Test Cards

```typescript
import { TestBuilders } from '@osi-cards/testing';

// Minimal card
const minCard = TestBuilders.Helpers.createMinimalCard();

// Card with multiple sections
const multiCard = TestBuilders.Helpers.createCardWithMultipleSections();

// Large card for performance testing
const largeCard = TestBuilders.Helpers.createLargeCard();

// Custom card
const customCard = TestBuilders.Card.create()
  .withTitle('Custom Card')
  .withType('company')
  .withSection(
    TestBuilders.Section.create()
      .withTitle('Information')
      .asInfo()
      .withField(
        TestBuilders.Field.create()
          .withLabel('Name')
          .withValue('Test Company')
          .build()
      )
      .build()
  )
  .build();
```

## Best Practices

### 1. Test Naming

```typescript
// Good
it('should emit event when field is clicked', () => {});
it('should calculate correct column count for 1024px width', () => {});

// Bad
it('works', () => {});
it('test1', () => {});
```

### 2. AAA Pattern

```typescript
it('should calculate layout', () => {
  // Arrange
  const sections = createTestSections();
  const columns = 3;

  // Act
  const result = calculateLayout(sections, columns);

  // Assert
  expect(result.totalHeight).toBeGreaterThan(0);
});
```

### 3. Test Independence

```typescript
// Each test should be independent
beforeEach(() => {
  // Fresh setup for each test
  component = new MyComponent();
});

afterEach(() => {
  // Cleanup
  component = null;
});
```

### 4. Mock External Dependencies

```typescript
const mockService = {
  fetchData: jest.fn().mockResolvedValue(mockData),
};

TestBed.configureTestingModule({
  providers: [
    { provide: DataService, useValue: mockService },
  ],
});
```

### 5. Test Edge Cases

```typescript
describe('calculateColumns', () => {
  it('should handle zero width', () => {
    expect(calculateColumns(0)).toBe(1);
  });

  it('should handle negative width', () => {
    expect(calculateColumns(-100)).toBe(1);
  });

  it('should respect max columns', () => {
    expect(calculateColumns(10000, { maxColumns: 4 })).toBe(4);
  });
});
```

## CI/CD Integration

### Running Tests in CI

```yaml
# .github/workflows/ci-quality.yml
- name: Run unit tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

### Quality Gates

- **Unit tests**: Must pass
- **Coverage**: Must be >= 95%
- **E2E tests**: Must pass on all browsers
- **Performance**: Must meet Lighthouse thresholds
- **Accessibility**: Zero critical violations

## Commands Reference

```bash
# Unit tests
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:ci             # CI mode (no watch)

# E2E tests
npm run test:e2e            # All E2E tests
npm run test:e2e:headed     # With browser UI
npm run test:e2e:debug      # Debug mode

# Specific test types
npm run test:visual         # Visual regression
npm run test:a11y           # Accessibility
npm run test:performance    # Performance

# Coverage
npm run coverage:report     # Generate HTML report
npm run coverage:check      # Check coverage thresholds
```

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in test configuration
- Check for missing async/await
- Verify observables complete

**Flaky tests**
- Add proper waits for async operations
- Use `waitFor` utilities
- Avoid time-dependent assertions

**Memory leaks in tests**
- Ensure subscriptions unsubscribe
- Clean up event listeners
- Clear timers and intervals

**Coverage not updating**
- Clear coverage directory
- Rebuild project
- Check file paths in coverage config

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Next Steps:**
1. Increase coverage to 95%+
2. Add mutation testing
3. Implement contract testing
4. Add chaos engineering tests





