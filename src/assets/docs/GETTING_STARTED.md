# Getting Started with OSI Cards

Welcome to **OSI Cards**! This guide will help you get up and running quickly.

## What is OSI Cards?

**OSI Cards** is a modern, token-driven Angular dashboard framework that transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance.

## Key Features

- 🎨 **20+ Section Types** - Rich variety of card sections
- ⚡ **Real-time Updates** - Streaming card generation
- 📱 **Responsive Design** - Works on all devices
- 🎯 **TypeScript First** - Full type safety
- 🚀 **Performance Optimized** - Fast rendering and updates
- ♿ **Accessible** - WCAG compliant

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Angular 18 or 20

### Installation

```bash
npm install osi-cards-lib
```

Or install from GitHub:

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
```

### Basic Usage

1. **Import the module** in your Angular app:

```typescript
import { OsiCardsModule } from 'osi-cards-lib';

@NgModule({
  imports: [OsiCardsModule]
})
export class AppModule {}
```

2. **Use the component** in your template:

```html
<app-ai-card-renderer [cardConfig]="myCard"></app-ai-card-renderer>
```

3. **Create a card configuration**:

```typescript
const myCard = {
  cardTitle: "My First Card",
  sections: [
    {
      title: "Information",
      type: "info",
      fields: [
        { label: "Status", value: "Active" },
        { label: "Priority", value: "High" }
      ]
    }
  ]
};
```

## Next Steps

- 📖 Read the [Installation Guide](./installation) for detailed setup
- 📚 Check the [API Reference](./api-reference) for complete documentation
- 🎨 Explore the [Improvement Plan](./improvement-plan) for roadmap

## Resources

- **npm Package**: [osi-cards-lib](https://www.npmjs.com/package/osi-cards-lib)
- **GitHub Repository**: [OSI-Cards](https://github.com/Inutilepat83/OSI-Cards)
- **Version**: 1.2.0

## Support

Need help? Check out:
- [API Reference](./api-reference)
- [GitHub Issues](https://github.com/Inutilepat83/OSI-Cards/issues)
- [Documentation Index](./)

