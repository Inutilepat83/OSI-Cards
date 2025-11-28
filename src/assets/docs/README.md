# OrangeSales Intelligence OSI Cards

**OrangeSales Intelligence OSI Cards** is a versatile card generator used by sales intelligence agents. It features structured formatting that can design cards for any form of business intelligence data. Built as a modern, token-driven Angular dashboard framework (supports Angular 18 and 20), OSI Cards transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance, OSI Cards empowers developers to compose diverse data experiences with minimal friction.

Each card is composed of one or more **sections**—standalone, configurable components orchestrated by `AICardRendererComponent` ⟶ `SectionRendererComponent` ⟶ `MasonryGridComponent`. This architecture enables seamless combination of layouts, real-time streaming updates, and rich interactions.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using OSI Cards in Your Project](#using-osi-cards-in-your-project)
3. [Core Architecture](#core-architecture)
4. [Section Types Catalog](#section-types-catalog---all-20-components)
5. [Creating Cards: Complete Guide](#creating-cards-complete-guide)
6. [Design System & Tokens](#design-system--tokens)
7. [Advanced Features](#advanced-features)
8. [Development](#development)
9. [Appendix](#appendix)

---

## Quick Start

### Run the Development Server

```bash
npm start
# Navigate to http://localhost:4200
```

### Create Your First Card

Add a JSON card configuration to `src/assets/configs/companies/` or `src/assets/configs/contacts/`:

```json
{
  "cardTitle": "Your Company",
  "sections": [
    {
      "title": "Company Info",
      "type": "info",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Employees", "value": "1000+" },
        { "label": "Founded", "value": "2020" }
      ]
    },
    {
      "title": "Key Metrics",
      "type": "analytics",
      "fields": [
        { "label": "Growth", "value": "85%", "percentage": 85 },
        { "label": "ROI", "value": "120%", "percentage": 120 }
      ]
    }
  ]
}
```

The card will automatically appear in the masonry grid on page load.

---

## Using OSI Cards in Your Project

OSI Cards can be imported and used as a library in other Angular projects.

> 📖 **For detailed integration instructions, see [README_INTEGRATION.md](./README_INTEGRATION.md)**

### Installation Options

#### Option 1: Install from npm (Recommended)

Install the library directly from npm:

```bash
npm install osi-cards-lib
```

The library supports both Angular 18 and Angular 20, which should resolve most peer dependency conflicts. If you still encounter issues, use:

```bash
npm install osi-cards-lib --legacy-peer-deps
```

**Package URL:** https://www.npmjs.com/package/osi-cards-lib

📖 **See [docs/PEER_DEPENDENCY_CONFLICTS.md](./docs/PEER_DEPENDENCY_CONFLICTS.md) for detailed conflict resolution guide.**

#### Option 2: Install from GitHub

Install the library directly from the GitHub repository:

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
```

Or add to your `package.json`:

