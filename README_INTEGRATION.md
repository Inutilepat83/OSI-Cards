# OSI Cards - Integration Guide

## Quick Start

### 1. Build the Library

```bash
npm run build:lib
```

This creates a distributable package in `dist/osi-cards-lib/`.

### 2. Install in Your Project

#### Option A: Local Path
```bash
npm install /path/to/OSI-Cards-1/dist/osi-cards-lib
```

#### Option B: NPM Link (Development)
```bash
# In OSI-Cards-1 directory
cd dist/osi-cards-lib
npm link

# In your project
npm link osi-cards-lib
```

### 3. Configure Your App

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      enableLogging: true,
      logLevel: 'info'
    })
  ]
};
```

### 4. Use Components

```typescript
// my-component.ts
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-my-cards',
  standalone: true,
  imports: [AICardRendererComponent],
  template: `
    <app-ai-card-renderer [card]="myCard"></app-ai-card-renderer>
  `
})
export class MyCardsComponent {
  myCard: AICardConfig = {
    id: '1',
    cardTitle: 'My Card',
    cardType: 'company',
    sections: []
  };
}
```

### 5. Import Styles

Add to `angular.json`:
```json
{
  "styles": [
    "node_modules/osi-cards-lib/styles/_styles.scss"
  ]
}
```

Or in `styles.scss`:
```scss
@import 'osi-cards-lib/styles/_styles';
```

## Full Documentation

See [docs/INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md) for complete documentation.

## Package Structure

After building, the package structure is:

```
dist/osi-cards-lib/
├── package.json
├── public-api.d.ts
├── public-api.metadata.json
├── public-api.js
├── styles/
│   └── _styles.scss
└── lib/
    └── (compiled components and services)
```

## Publishing

To publish to NPM:

```bash
npm run build:lib
cd dist/osi-cards-lib
npm publish
```

## Support

For issues and questions, see the main [README.md](./README.md) and [docs/](./docs/) directory.

