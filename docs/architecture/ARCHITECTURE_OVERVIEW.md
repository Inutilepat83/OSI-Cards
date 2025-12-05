# 🏗️ Architecture Overview

**Version:** 1.5.5
**Last Updated:** December 4, 2025

---

## 📋 Executive Summary

OSI Cards is a modern Angular library for rendering AI-generated cards with dynamic sections in a responsive masonry grid.

**Core Mission:** Render LLM-streamed cards beautifully, performantly, and accessibly.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Application                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │           AICardRendererComponent              │ │
│  │                                                 │ │
│  │  ┌───────────────────────────────────────────┐ │ │
│  │  │       SectionRendererComponent            │ │ │
│  │  │                                           │ │ │
│  │  │  ┌─────────────────────────────────────┐ │ │ │
│  │  │  │    MasonryGridComponent             │ │ │ │
│  │  │  │                                     │ │ │ │
│  │  │  │  • Layout Calculation               │ │ │ │
│  │  │  │  • Responsive Behavior              │ │ │ │
│  │  │  │  • Virtual Scrolling                │ │ │ │
│  │  │  │  • FLIP Animations                  │ │ │ │
│  │  │  └─────────────────────────────────────┘ │ │ │
│  │  │                                           │ │ │
│  │  │  ┌─────────────────────────────────────┐ │ │ │
│  │  │  │    Section Components (20+)         │ │ │ │
│  │  │  │                                     │ │ │ │
│  │  │  │  • InfoSection                      │ │ │ │
│  │  │  │  • AnalyticsSection                 │ │ │ │
│  │  │  │  • ChartSection                     │ │ │ │
│  │  │  │  • ...and 17 more                   │ │ │ │
│  │  │  └─────────────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Services Layer:                                     │
│  • CardFacade • Streaming • Theme • Layout          │
│  • Icon • Accessibility • I18n • EventBus           │
│                                                      │
│  Utilities Layer:                                    │
│  • Performance • Animation • Layout • Color          │
│  • Validation • Error Handling • Subscription       │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Key Technologies

### Core
- **Angular 20.0** - Framework
- **TypeScript 5.8** - Language
- **RxJS 7.8** - Reactive programming
- **NgRx 18.0** - State management

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **SCSS** - Component styles
- **CSS Custom Properties** - Theming

### Build & Tooling
- **Angular CLI 20.0** - Build system
- **ng-packagr** - Library packaging
- **ESLint** - Linting
- **Prettier** - Formatting

### Testing
- **Jasmine & Karma** - Unit testing
- **Playwright** - E2E testing
- **Storybook** - Component development

---

## 🎨 Design Patterns

### 1. **Component Pattern**
- Standalone components
- OnPush change detection
- Input/Output communication

### 2. **Facade Pattern**
- CardFacadeService as single entry point
- Simplifies complex subsystem interactions

### 3. **Strategy Pattern** (Future)
- Pluggable layout algorithms
- Skyline, BinPacking, RowFirst strategies

### 4. **Observer Pattern**
- RxJS Observables for reactive updates
- Event-driven architecture

### 5. **Factory Pattern**
- CardFactory for creating cards
- SectionFactory for sections
- Fluent API

---

## 📊 Module Structure

```
osi-cards/
├── src/app/                    # Application
│   ├── core/                   # Core services
│   ├── features/               # Feature modules
│   ├── shared/                 # Shared components
│   └── store/                  # NgRx store
│
└── projects/osi-cards-lib/     # Library
    ├── components/             # UI components
    ├── services/               # Business logic
    ├── utils/                  # Utilities (130+ files)
    ├── models/                 # Types & interfaces
    ├── themes/                 # Theming system
    └── public-api.ts           # Public exports
```

---

## 🔄 Data Flow

```
1. Card Configuration (JSON/Object)
   ↓
2. CardFactory or Direct Config
   ↓
3. AICardRendererComponent
   ↓
4. SectionRendererComponent
   ↓
5. MasonryGridComponent (Layout)
   ↓
6. Individual Section Components
   ↓
7. User sees rendered card
```

---

## ⚡ Performance Features

### Built-In Optimizations
- ✅ OnPush change detection
- ✅ Virtual scrolling (50+ sections)
- ✅ Lazy loading (section components)
- ✅ Memoization (layout calculations)
- ✅ Request deduplication (80% reduction)
- ✅ Object pooling (40-60% less GC)
- ✅ FLIP animations (60fps)

---

## 🎯 Core Principles

### 1. **Performance First**
- Every feature optimized
- Lazy load everything possible
- Cache aggressively

### 2. **Type Safety**
- 100% TypeScript
- Branded types for IDs
- Runtime validation

### 3. **Accessibility**
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support

### 4. **Developer Experience**
- Clear APIs
- Comprehensive docs
- Type-safe throughout

### 5. **Zero Bloat**
- Only valuable features
- Tree-shakeable exports
- Minimal bundle size

---

## 🚀 Getting Started

**For Users:** See [Quick Start Guide](../../QUICK_START_GUIDE.md)

**For Contributors:** See [Components](./ARCHITECTURE_COMPONENTS.md)

**For Architects:** Review all architecture docs in this directory

---

**Next:** [Components Architecture](./ARCHITECTURE_COMPONENTS.md)

---

**Last Updated:** December 4, 2025
**Version:** 1.5.5


