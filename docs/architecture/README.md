# 🏗️ OSI Cards Architecture Documentation

**Version:** 1.5.5
**Last Updated:** December 4, 2025

---

## 📚 Architecture Documents

The OSI Cards architecture is documented across multiple focused files for easier navigation:

### 1. [Overview](./ARCHITECTURE_OVERVIEW.md)
- High-level system architecture
- Technology stack
- Design patterns
- Key concepts

### 2. [Components](./ARCHITECTURE_COMPONENTS.md)
- Component hierarchy
- Main components (AICardRenderer, MasonryGrid, SectionRenderer)
- Section components (20+ types)
- Shared components

### 3. [Services](./ARCHITECTURE_SERVICES.md)
- Core services (CardFacade, Streaming, Theme)
- Layout services (LayoutCalculation, StateManager)
- Utility services (Icon, Accessibility, I18n)
- Service dependency graph

### 4. [Utilities](./ARCHITECTURE_UTILITIES.md)
- Performance utilities (Memoization, Deduplication, Pooling)
- Layout utilities (BinPacker, AdaptiveGap)
- Animation utilities (FLIP, debounce)
- Developer utilities (ErrorBoundary, SubscriptionTracker)

### 5. [State Management](./ARCHITECTURE_STATE.md)
- NgRx store structure
- Actions, reducers, selectors
- Effects
- State flow diagrams

### 6. [Data Flow](./ARCHITECTURE_DATA_FLOW.md)
- Card configuration flow
- LLM streaming integration
- User interaction flow
- Event propagation

---

## 🎯 Quick Navigation

**New to the architecture?** → Start with [Overview](./ARCHITECTURE_OVERVIEW.md)

**Need component info?** → See [Components](./ARCHITECTURE_COMPONENTS.md)

**Looking for services?** → Check [Services](./ARCHITECTURE_SERVICES.md)

**Want to use utilities?** → Read [Utilities](./ARCHITECTURE_UTILITIES.md)

**Understanding state?** → Review [State Management](./ARCHITECTURE_STATE.md)

**Tracing data flow?** → See [Data Flow](./ARCHITECTURE_DATA_FLOW.md)

---

## 📊 Architecture Statistics

**Components:** 50+
**Services:** 30+
**Utilities:** 130+ files
**Section Types:** 20+
**Lines of Code:** 160,000+

---

## 🔍 Key Architectural Decisions

See [Architecture Decision Records](../adr/) for major decisions:
- ADR-001: Component-based section rendering
- ADR-002: Masonry grid layout strategy
- ADR-003: Streaming architecture
- ADR-004: State management with NgRx

---

**Last Updated:** December 4, 2025
**Maintainer:** OSI Cards Team


