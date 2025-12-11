# ADR 0001: Section Renderer Strategy Pattern

## Status

Accepted

## Context

The `SectionRendererComponent` and `SectionLoaderService` originally used switch statements to determine which component to load based on section type. This approach had several limitations:

- Hard to extend with new section types
- Switch statements become unwieldy with many cases
- Tight coupling between type resolution and component loading
- Difficult to test individual strategies

## Decision

We implemented a registry-based strategy pattern for section component loading:

- Created `SectionComponentRegistryService` to manage component loaders
- Each section type has a loader strategy implementing `ISectionComponentLoader`
- Loaders are registered at service initialization
- Type aliases are supported (e.g., 'metrics' → 'analytics')
- Fallback mechanism for unknown types

## Consequences

### Positive

- Easy to add new section types by registering a loader
- Better separation of concerns
- More testable (can test individual loaders)
- Supports type aliases for backward compatibility
- Extensible without modifying core service

### Negative

- Slightly more complex initial setup
- Requires understanding of registry pattern

## Implementation

- `SectionComponentRegistryService` - Registry service
- `ISectionComponentLoader` - Loader interface
- `SectionLoaderService` - Updated to use registry

## References

- Strategy Pattern: https://refactoring.guru/design-patterns/strategy
- ADR Format: https://adr.github.io/













