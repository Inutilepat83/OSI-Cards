# [ADR-0005] Test Data Builders Pattern

**Status:** Accepted
**Date:** 2025-12-03
**Deciders:** Testing Team, Architecture Team
**Technical Story:** Architecture Improvements Plan - Items 292-293

## Context and Problem Statement

Writing tests for OSI Cards requires creating complex card configurations with sections, fields, and items. Manually constructing these objects leads to verbose, hard-to-maintain test code. We need a better way to create test data that is readable, flexible, and maintainable.

## Decision Drivers

* Test code readability and maintainability
* Reduce boilerplate in tests
* Provide sensible defaults for test data
* Enable easy creation of edge cases
* Support both simple and complex test scenarios
* Maintain type safety

## Considered Options

1. **Test Data Builders with Fluent API**
2. Plain object literals
3. Factory functions
4. Object Mother pattern

## Decision Outcome

Chosen option: "Test Data Builders with Fluent API", because it provides the best balance of readability, flexibility, and type safety.

### Implementation

Created `test-data-builders.ts` with builders for:

1. **TestCardBuilder**
   - Fluent API for card creation
   - Preset methods (asMinimal, asLarge)
   - Type-safe building
   - Sensible defaults

2. **TestSectionBuilder**
   - Section creation with validation
   - Preset methods per section type
   - Field and item management
   - Column span configuration

3. **TestFieldBuilder**
   - Field creation helpers
   - Type-specific builders
   - Icon and trend support

4. **TestDataHelpers**
   - Common test scenarios
   - Bulk creation utilities
   - Edge case helpers

### Code Examples

```typescript
// Simple card
const card = TestCardBuilder.create()
  .withTitle('Test Card')
  .withSection(
    TestSectionBuilder.create()
      .asInfo()
      .build()
  )
  .build();

// Complex card
const card = TestCardBuilder.create()
  .withTitle('Company Profile')
  .withType('company')
  .withSection(
    TestSectionBuilder.create()
      .withTitle('Overview')
      .asInfo()
      .withField(
        TestFieldBuilder.create()
          .withLabel('Industry')
          .withValue('Technology')
          .withIcon('building')
          .build()
      )
      .build()
  )
  .withSection(
    TestSectionBuilder.create()
      .withTitle('Metrics')
      .asAnalytics()
      .build()
  )
  .build();

// Using helpers
const minimalCard = TestDataHelpers.createMinimalCard();
const largeCard = TestDataHelpers.createLargeCard();
const cards = TestDataHelpers.createCards(10);
```

### Positive Consequences

* Tests are more readable and maintainable
* Reduced boilerplate code
* Easier to create complex test scenarios
* Better test data consistency
* Faster test writing
* Type-safe building
* Easy to extend with new methods

### Negative Consequences

* Additional code to maintain
* Learning curve for new developers
* Can be overused for simple cases

## Pros and Cons of the Options

### Test Data Builders with Fluent API

* Good, because highly readable
* Good, because flexible
* Good, because type-safe
* Good, because reusable
* Bad, because additional abstraction
* Bad, because maintenance overhead

### Plain object literals

* Good, because simple
* Good, because no abstraction
* Bad, because verbose
* Bad, because repetitive
* Bad, because error-prone
* Bad, because hard to maintain

### Factory functions

* Good, because simple functions
* Good, because flexible
* Bad, because less readable for complex cases
* Bad, because no method chaining
* Bad, because harder to customize

### Object Mother pattern

* Good, because predefined objects
* Good, because simple to use
* Bad, because inflexible
* Bad, because requires many variations
* Bad, because hard to customize

## Implementation Notes

### Integration with Existing Tests

1. Gradually migrate existing tests to use builders
2. Start with new tests
3. Create migration guide
4. Provide examples in documentation

### Best Practices

1. Use builders for complex test data
2. Use plain literals for trivial cases
3. Create helper methods for common scenarios
4. Document custom builder methods
5. Keep builders focused and cohesive

### Extension Points

```typescript
// Custom section builder
class CustomSectionBuilder extends TestSectionBuilder {
  asCustomType(): this {
    return this.withType('custom')
      .withField(/* custom fields */)
      .build();
  }
}
```

## Validation

### Success Metrics

* Reduced test code lines by 30%
* Improved test readability scores
* Faster test writing (measured by developer feedback)
* Fewer test maintenance issues
* Higher test coverage due to easier test creation

### Monitoring

* Track builder usage in tests
* Monitor test code complexity
* Collect developer feedback
* Track test maintenance time

## Related Decisions

* [ADR-0002] Component Refactoring
* Future: Test generation automation

## Links

* Implementation: `projects/osi-cards-lib/src/lib/testing/test-data-builders.ts`
* Testing Guide: `docs/TESTING_GUIDE.md`
* Examples: See unit tests throughout codebase

## Migration Path

### Step 1: Education
- Document builders
- Provide examples
- Conduct team training

### Step 2: Gradual Adoption
- Use in new tests first
- Migrate high-value tests
- Update documentation

### Step 3: Full Migration
- Convert all tests
- Remove old helpers
- Standardize patterns

### Timeline

* Week 1: Documentation and training
* Weeks 2-4: Gradual adoption
* Months 2-3: Full migration





