# Installation Guide

Complete installation instructions for OSI Cards library.

## Installation Methods

### Method 1: npm (Recommended)

Install the library directly from npm:

```bash
npm install osi-cards-lib
```

**Package URL**: https://www.npmjs.com/package/osi-cards-lib

#### Peer Dependency Conflicts

If you encounter peer dependency conflicts, use:

```bash
npm install osi-cards-lib --legacy-peer-deps
```

The library supports both Angular 18 and Angular 20, which should resolve most conflicts automatically.

### Method 2: GitHub

Install directly from the GitHub repository:

```bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "osi-cards-lib": "git+https://github.com/Inutilepat83/OSI-Cards.git"
  }
}
```

## Setup

### 1. Import the Module

In your Angular application module:

```typescript
import { NgModule } from '@angular/core';
import { OsiCardsModule } from 'osi-cards-lib';

@NgModule({
  imports: [
    OsiCardsModule
  ]
})
export class AppModule {}
```

### 2. Import Styles

Add the library styles to your `angular.json`:

```json
{
  "styles": [
    "node_modules/osi-cards-lib/styles/_styles.scss"
  ]
}
```

Or import directly in your main styles file:

```scss
@import '~osi-cards-lib/styles/_styles.scss';
```

### 3. Use Components

Import and use components in your templates:

```html
<app-ai-card-renderer 
  [cardConfig]="cardData"
  [tiltEnabled]="true">
</app-ai-card-renderer>
```

## Requirements

- **Angular**: 18.x or 20.x
- **Node.js**: 18+
- **TypeScript**: 5.0+

## Verification

After installation, verify it's working:

```typescript
import { OsiCardsModule } from 'osi-cards-lib';

// Should not throw errors
console.log('OSI Cards installed successfully!');
```

## Troubleshooting

### Common Issues

**Issue**: Module not found
- **Solution**: Ensure you've imported `OsiCardsModule` in your app module

**Issue**: Styles not loading
- **Solution**: Check that styles are imported in `angular.json` or your main styles file

**Issue**: Peer dependency warnings
- **Solution**: Use `--legacy-peer-deps` flag or ensure Angular version matches (18 or 20)

## Next Steps

- 📖 Read [Getting Started](./getting-started) guide
- 📚 Check [API Reference](./api-reference) for detailed usage
- 🎯 See [Improvement Plan](./improvement-plan) for roadmap

## Resources

- **npm**: https://www.npmjs.com/package/osi-cards-lib
- **GitHub**: https://github.com/Inutilepat83/OSI-Cards
- **Version**: 1.2.0

