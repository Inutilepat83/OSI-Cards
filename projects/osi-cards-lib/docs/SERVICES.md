# OSI Cards Library - Services Documentation

This document provides comprehensive information about the services included in the OSI Cards library, including their lifecycle, instantiation behavior, and usage patterns.

## Service Architecture

All services in the OSI Cards library use Angular's `providedIn: 'root'` pattern, which means:

1. **Singleton Pattern**: Each service is instantiated once per Angular application
2. **Automatic Provision**: Services are automatically available throughout the application without explicit providers
3. **Lazy Initialization**: Services are created on first injection (when first used)
4. **Tree-shakable**: Services are excluded from bundles if never imported

## Available Services

### MagneticTiltService

**Purpose**: Provides magnetic tilt calculations for interactive card effects.

**Provided In**: `root` (singleton)

**Lifecycle**:
- Initialized on first injection into any component
- Maintains state across all card components
- Automatically cleans up on application destroy

**Key Features**:
- Mouse position tracking for tilt calculations
- RAF (RequestAnimationFrame) optimized updates
- Element dimension caching for performance
- Observable-based tilt calculations stream

**Usage**:
```typescript
import { Component, inject } from '@angular/core';
import { MagneticTiltService } from 'osi-cards-lib';

@Component({
  // ...
})
export class MyComponent {
  private tiltService = inject(MagneticTiltService);
  
  // Subscribe to tilt calculations
  // tiltService.tiltCalculations$.subscribe(calculations => { ... });
}
```

**Initialization Timing**: 
- Created on first component injection
- No explicit initialization required
- Shared across all card instances

---

### IconService

**Purpose**: Maps field names and keywords to Lucide icon names.

**Provided In**: `root` (singleton)

**Lifecycle**:
- Stateless service with icon mapping dictionary
- No initialization required
- Instant access to icon mappings

**Key Features**:
- Pre-defined icon mappings for common fields
- Fallback icon support
- Field name to icon name translation

**Usage**:
```typescript
import { Component, inject } from '@angular/core';
import { IconService } from 'osi-cards-lib';

@Component({
  // ...
})
export class MyComponent {
  private iconService = inject(IconService);
  
  getIcon(fieldName: string): string {
    return this.iconService.getFieldIcon(fieldName);
  }
}
```

**Initialization Timing**:
- Available immediately (no async initialization)
- Icon map is static and in-memory
- No dependencies

---

### SectionNormalizationService

**Purpose**: Normalizes and validates card sections for consistent rendering.

**Provided In**: `root` (singleton)

**Lifecycle**:
- Stateless normalization functions
- No persistent state
- Available immediately

**Key Features**:
- Section type validation
- Field normalization
- Section sorting and ordering
- Default value injection

**Usage**:
```typescript
import { Component, inject } from '@angular/core';
import { SectionNormalizationService, CardSection } from 'osi-cards-lib';

@Component({
  // ...
})
export class MyComponent {
  private normalizationService = inject(SectionNormalizationService);
  
  normalizeSections(sections: CardSection[]): CardSection[] {
    return this.normalizationService.normalizeAndSortSections(sections);
  }
}
```

**Initialization Timing**:
- Available immediately
- Pure functions, no state
- No async operations

---

### SectionUtilsService

**Purpose**: Utility functions for section rendering and formatting.

**Provided In**: `root` (singleton)

**Lifecycle**:
- Utility functions only
- No state management
- Stateless helper methods

**Key Features**:
- Trend icon mapping
- Change formatting
- Value formatting utilities
- Section-specific helpers

**Usage**:
```typescript
import { Component, inject } from '@angular/core';
import { SectionUtilsService } from 'osi-cards-lib';

@Component({
  // ...
})
export class MyComponent {
  private utils = inject(SectionUtilsService);
  
  formatChange(change: number): string {
    return this.utils.formatChange(change);
  }
}
```

**Initialization Timing**:
- Available immediately
- No initialization required
- Pure utility functions

## Service Instantiation and Lifecycle

### Singleton Behavior

All services use `providedIn: 'root'`, ensuring:

- **Single Instance**: One instance shared across entire application
- **State Sharing**: State maintained across all components using the service
- **Memory Efficiency**: No duplicate service instances
- **Consistent Behavior**: All components see the same service state

### Initialization Timeline

```
Application Bootstrap
  ↓
Component Injection (first use)
  ↓
Service Instantiated (lazy)
  ↓
Service Available (singleton)
  ↓
Subsequent Injections (reuse existing instance)
```

### Example Timeline

```typescript
// App starts
// No services created yet

// Component A injects MagneticTiltService
const service1 = inject(MagneticTiltService);
// ✅ MagneticTiltService created (first time)
// ✅ Service instance cached in root injector

// Component B injects MagneticTiltService
const service2 = inject(MagneticTiltService);
// ✅ Same instance returned (singleton)
// service1 === service2 (true)

// Component C injects IconService
const iconService = inject(IconService);
// ✅ IconService created (first time)
```

## Dependency Injection Pattern

### Modern Injection (Recommended)

All services support Angular's modern `inject()` function:

```typescript
import { Component, inject } from '@angular/core';
import { MagneticTiltService } from 'osi-cards-lib';

@Component({
  standalone: true,
  // ...
})
export class MyComponent {
  private tiltService = inject(MagneticTiltService);
  // Service automatically available
}
```

### Constructor Injection (Alternative)

Traditional constructor injection also works:

```typescript
import { Component } from '@angular/core';
import { MagneticTiltService } from 'osi-cards-lib';

@Component({
  // ...
})
export class MyComponent {
  constructor(private tiltService: MagneticTiltService) {
    // Service automatically available
  }
}
```

## Service State Management

### Stateful Services

**MagneticTiltService**:
- Maintains mouse position state
- Tracks element cache
- Manages animation frame requests
- State shared across all components

### Stateless Services

**IconService**, **SectionNormalizationService**, **SectionUtilsService**:
- No persistent state
- Pure functions only
- No side effects
- Thread-safe operations

## Memory Management

### Automatic Cleanup

Services using `providedIn: 'root'` are automatically cleaned up:

- **On Application Destroy**: All root services destroyed
- **Observable Cleanup**: Services implement `OnDestroy` where needed
- **Subscription Management**: Internal subscriptions properly unsubscribed

### Best Practices

1. **Don't manually clean up**: Angular handles root service lifecycle
2. **Unsubscribe from observables**: In components, not services
3. **Avoid circular references**: Services shouldn't hold component references

## Testing Services

### Unit Testing

Services can be tested in isolation:

```typescript
import { TestBed } from '@angular/core/testing';
import { IconService } from 'osi-cards-lib';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### Service Behavior Verification

```typescript
it('should be singleton', () => {
  const service1 = TestBed.inject(IconService);
  const service2 = TestBed.inject(IconService);
  expect(service1).toBe(service2);
});
```

## Common Patterns

### Sharing Service State

Since services are singletons, state is automatically shared:

```typescript
// Component A
export class ComponentA {
  private tiltService = inject(MagneticTiltService);
  
  updateTilt() {
    this.tiltService.calculateTilt({ x: 100, y: 200 }, element);
  }
}

// Component B (same instance)
export class ComponentB {
  private tiltService = inject(MagneticTiltService);
  
  subscribeToTilt() {
    // Receives updates from Component A
    this.tiltService.tiltCalculations$.subscribe(calc => {
      // ...
    });
  }
}
```

### Service Initialization Check

Services are available immediately after injection:

```typescript
export class MyComponent {
  private iconService = inject(IconService);
  
  ngOnInit() {
    // Service already initialized and ready
    const icon = this.iconService.getFieldIcon('email');
  }
}
```

## Troubleshooting

### Service Not Available

**Issue**: Cannot inject service

**Solution**: 
- Ensure service is imported from 'osi-cards-lib'
- Verify service uses `providedIn: 'root'` (no explicit providers needed)
- Check import path is correct

### Service State Not Shared

**Issue**: Multiple service instances

**Solution**:
- This shouldn't happen with `providedIn: 'root'`
- Verify you're not providing the service elsewhere
- Check for module-level providers that might override root

### Memory Leaks

**Issue**: Services not cleaned up

**Solution**:
- Services with `providedIn: 'root'` are automatically cleaned up
- Ensure components unsubscribe from service observables
- Check for component references held in services

## Summary

- ✅ All services use `providedIn: 'root'` (singleton pattern)
- ✅ Services are lazy-initialized on first injection
- ✅ No explicit providers needed in your app config
- ✅ Services automatically available throughout the application
- ✅ Automatic cleanup on application destroy
- ✅ State shared across all components using the service

## Related Documentation

- [README.md](../README.md) - Library overview and setup
- [IMPORT_EXAMPLE.md](../IMPORT_EXAMPLE.md) - Import and usage examples
- [USAGE.md](../USAGE.md) - Detailed API documentation








