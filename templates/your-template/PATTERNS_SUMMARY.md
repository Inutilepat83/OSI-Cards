# 🏗️ OSI Cards Design Patterns Summary

**Total Patterns:** 31
**Last Updated:** December 6, 2025

---

## 📋 Complete Pattern List

### Core Architectural Patterns

1. **Service Layer Pattern** ✅
   - Services with dependency injection
   - No direct database access
   - Proper lifecycle management

2. **Component Pattern** ✅
   - Standalone components
   - OnPush change detection
   - Input/Output communication

3. **Dependency Injection Pattern** ✅
   - All dependencies injected
   - No manual instantiation

4. **Facade Pattern** ✅
   - CardFacadeService as unified API
   - Simplifies complex subsystems

5. **Repository Pattern** ✅
   - Data access abstraction
   - Provider-based data sources

### Creational Patterns

6. **Factory Pattern** ✅
   - CardFactory, SectionFactory
   - Fluent API for object creation

7. **Builder Pattern** ✅
   - TestDataBuilders
   - Fluent API for step-by-step construction

8. **Singleton Pattern** ✅
   - Services with providedIn: 'root'
   - Single instance per application

9. **Prototype Pattern** ✅
   - Object cloning for card duplication
   - Efficient object creation

### Behavioral Patterns

10. **Observer Pattern (RxJS)** ✅
    - Reactive programming with Observables
    - Proper subscription management

11. **Strategy Pattern** ✅
    - Pluggable layout algorithms
    - Runtime strategy selection

12. **Command Pattern** ✅
    - Encapsulate requests as objects
    - Undo/redo support

13. **Mediator Pattern** ✅
    - EventBusService mediates communication
    - Reduces component coupling

14. **Chain of Responsibility Pattern** ✅
    - EventMiddlewareService chains handlers
    - Sequential event processing

15. **State Pattern** ✅
    - CardStateEngine manages transitions
    - State-specific behavior

16. **Template Method Pattern** ✅
    - Base classes define algorithm
    - Subclasses customize steps

17. **Visitor Pattern** ✅
    - Section rendering operations
    - Operations on object structure

### Structural Patterns

18. **Decorator Pattern** ✅
    - @Memoize, @AutoUnsubscribe, @Validate
    - Add behavior without modification

19. **Adapter Pattern** ✅
    - Data format transformation
    - Interface compatibility

20. **Proxy Pattern** ✅
    - Caching proxies
    - Lazy loading and access control

21. **Bridge Pattern** ✅
    - Theme abstraction
    - Multiple theme implementations

22. **Composite Pattern** ✅
    - Card sections form tree structure
    - Uniform section treatment

### Specialized Patterns

23. **Registry Pattern** ✅
    - SectionPluginRegistry
    - Dynamic plugin registration

24. **Provider Pattern** ✅
    - CardDataProvider abstraction
    - Multiple data source implementations

25. **Preset Pattern** ✅
    - Pre-configured card templates
    - Preset factory for creation

### Cross-Cutting Patterns

26. **Utility Pattern** ✅
    - Pure functions
    - No side effects

27. **Model Pattern** ✅
    - Type-safe models
    - Clear data contracts

28. **Error Handling Pattern** ✅
    - Centralized error handling
    - Proper error propagation

29. **Performance Pattern** ✅
    - OnPush change detection
    - Memoization and caching

30. **Accessibility Pattern** ✅
    - WCAG compliance
    - ARIA and keyboard support

31. **Memento Pattern** ✅
    - State snapshots for undo/redo
    - State restoration

---

## 📊 Pattern Coverage by Category

### Creational (4 patterns)
- Factory, Builder, Singleton, Prototype

### Structural (5 patterns)
- Decorator, Adapter, Proxy, Bridge, Composite

### Behavioral (8 patterns)
- Observer, Strategy, Command, Mediator, Chain of Responsibility, State, Template Method, Visitor

### Architectural (5 patterns)
- Service Layer, Component, Dependency Injection, Facade, Repository

### Specialized (5 patterns)
- Registry, Provider, Preset, Utility, Model

### Cross-Cutting (4 patterns)
- Error Handling, Performance, Accessibility, Memento

---

## 🎯 Pattern Usage by File Type

### Services
- Service Layer, Singleton, Dependency Injection, Facade, Repository, Provider

### Components
- Component, Template Method, Visitor, Composite, Accessibility

### Decorators
- Decorator Pattern

### Factories
- Factory, Builder, Preset

### Core
- State, Strategy, Template Method

### Events
- Observer, Mediator, Chain of Responsibility

### Themes
- Bridge Pattern

### Testing
- Builder Pattern (TestDataBuilders)

---

## 📝 Pattern Definitions Location

All patterns are defined in: `templates/your-template/architect.yaml`

Each pattern includes:
- Pattern name and description
- File path matching rules
- ✅ What TO DO
- ❌ What NOT TO DO
- Specific rules for enforcement

---

## 🔍 How to Use

### Check Patterns for a File
```
What architectural patterns apply to [file path]?
```

### Validate Code Against Patterns
```
Review [file path] for pattern compliance
```

### Generate Code Following Patterns
```
Create a new [Service/Component] following our patterns
```

---

**See Also:**
- `docs/development/ARCHITECT_MCP_SETUP.md` - Complete setup guide
- `templates/your-template/README.md` - Template documentation
- `ARCHITECT_MCP_IMPLEMENTATION.md` - Implementation details













