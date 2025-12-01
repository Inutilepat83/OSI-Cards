# OSI Cards Documentation

Welcome to the OSI Cards documentation. This guide helps you integrate and use the OSI Cards library in your Angular applications.

> **Note:** This README is auto-generated. Run `npm run docs:readme` to regenerate it.

---

## Quick Navigation

| Getting Started | Reference | Advanced |
|----------------|-----------|----------|
| [GETTING_STARTED](./GETTING_STARTED.md) | [API](./API.md) | [ARCHITECTURE](./ARCHITECTURE.md) |
| [INTEGRATION_GUIDE](./INTEGRATION_GUIDE.md) | [COMPONENTS](./COMPONENTS.md) | [EVENT_SYSTEM](./EVENT_SYSTEM.md) |
| [MIGRATION_GUIDE](./MIGRATION_GUIDE.md) | [SECTION_TYPES](./SECTION_TYPES.md) | [PLUGIN_SYSTEM](./PLUGIN_SYSTEM.md) |
|  | [SERVICES](./SERVICES.md) | [SECTION_REGISTRY](./SECTION_REGISTRY.md) |

---

## 🚀 Getting Started

Installation, setup, and initial configuration

| Document | Description |
|----------|-------------|
| **[GETTING_STARTED](./GETTING_STARTED.md)** | Step-by-step Angular integration guide (CSS, HTML, TS) |
| **[INTEGRATION_GUIDE](./INTEGRATION_GUIDE.md)** | SSR, NgRx, Micro-frontends, Form integration |
| **[MIGRATION_GUIDE](./MIGRATION_GUIDE.md)** | Migrating from v1.x to v2.0 with Shadow DOM |

---

## 📖 API & Reference

Complete API documentation and type references

| Document | Description |
|----------|-------------|
| **[API](./API.md)** | Complete API documentation for components, services, and types |
| **[COMPONENTS](./COMPONENTS.md)** | Detailed component reference (OsiCards, MasonryGrid, SectionRenderer) |
| **[SECTION_TYPES](./SECTION_TYPES.md)** | All 17+ section types with configuration examples |
| **[SERVICES](./SERVICES.md)** | Service documentation (Streaming, CardFacade, Animation, Theme) |

---

## 🎨 Theming & Styling

Customize appearance and style isolation

| Document | Description |
|----------|-------------|
| **[CSS_ENCAPSULATION](./CSS_ENCAPSULATION.md)** | Shadow DOM, CSS Layers, style isolation |
| **[PRESETS](./PRESETS.md)** | Card presets (Company, Analytics, Contact) and theme composition |
| **[THEMING_GUIDE](./THEMING_GUIDE.md)** | CSS custom properties, theme presets, dark mode |

---

## 🏗️ Architecture & Extensibility

Library architecture and extension points

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE](./ARCHITECTURE.md)** | Project structure and design decisions |
| **[EVENT_SYSTEM](./EVENT_SYSTEM.md)** | EventBus, middleware, Shadow DOM events |
| **[PLUGIN_SYSTEM](./PLUGIN_SYSTEM.md)** | Creating custom section types and plugins |
| **[SECTION_REGISTRY](./SECTION_REGISTRY.md)** | Section type definitions, aliases, registry schema |

---

## 🛠️ Utilities & Best Practices

Directives, utilities, and best practices

| Document | Description |
|----------|-------------|
| **[BEST_PRACTICES](./BEST_PRACTICES.md)** | Performance, accessibility, security, testing best practices |
| **[DIRECTIVES_UTILITIES](./DIRECTIVES_UTILITIES.md)** | CopyToClipboard, Tooltip, validation, performance utilities |

---

## 📚 Reference & Specifications

OpenAPI specs, LLM integration, and other references

| Document | Description |
|----------|-------------|
| **[LLM_PROMPT](./LLM_PROMPT.md)** | Guide for LLM-based card generation |
| **[OPENAPI](./OPENAPI.md)** | OpenAPI/Swagger specification for card configuration |
| **[openapi (YAML)](./openapi.yaml)** | OpenAPI 3.1.0 specification file |

---

## 📋 Architecture Decision Records

Documented architectural decisions

| Document | Description |
|----------|-------------|
| **[0001-section-renderer-strategy-pattern](./adr/0001-section-renderer-strategy-pattern.md)** | ADR 0001: Section Renderer Strategy Pattern |
| **[0002-component-refactoring](./adr/0002-component-refactoring.md)** | ADR 0002: AICardRendererComponent Refactoring |

---

## 🚀 Quick Start

```bash
npm install osi-cards-lib
```

```typescript
// app.config.ts
import { provideOSICards } from 'osi-cards-lib';

export const appConfig = {
  providers: [provideOSICards()]
};
```

```scss
// styles.scss
@import 'osi-cards-lib/styles/styles.scss';
```

```typescript
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  imports: [OsiCardsComponent],
  template: `<osi-cards [card]="card" />`
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      { title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Active' }] }
    ]
  };
}
```

📖 **Full guide:** [Getting Started](./GETTING_STARTED.md)

---

## 🆘 Help & Support

| Issue | Solution |
|-------|----------|
| Cards not rendering | Check `provideOSICards()` in providers |
| Styles not applied | Import `osi-cards-lib/styles/styles.scss` |
| Animations not working | Add `provideAnimations()` to providers |
| TypeScript errors | Ensure Angular 18+ |

### Resources

- [GitHub Repository](https://github.com/Inutilepat83/OSI-Cards)
- [API Reference](./API.md)
- [Best Practices](./BEST_PRACTICES.md)

---

## 📝 Regenerating This Documentation

This README is auto-generated from the docs directory. To regenerate:

```bash
npm run docs:readme:docs
```

Or directly:

```bash
node scripts/generate-docs-readme.js
```

---

*Auto-generated on 2025-12-01*
