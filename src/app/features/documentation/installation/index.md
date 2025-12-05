# Installation Guide

Complete installation instructions for OSI Cards library.

## Prerequisites

- **Angular**: Version 18 or 20
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher

## Installation Methods

### Method 1: npm (Recommended)

Install the library directly from npm:

\`\`\`bash
npm install osi-cards-lib
\`\`\`

**Package URL:** https://www.npmjs.com/package/osi-cards-lib

### Method 2: GitHub

Install directly from the GitHub repository:

\`\`\`bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
\`\`\`

Or add to your \`package.json\`:

\`\`\`json
{
"dependencies": {
"osi-cards-lib": "git+https://github.com/Inutilepat83/OSI-Cards.git#main"
}
}
\`\`\`

### Method 3: Local Path

For local development:

\`\`\`bash
npm install /path/to/OSI-Cards/dist/osi-cards-lib
\`\`\`

## Peer Dependencies

Install required peer dependencies:

\`\`\`bash
npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
\`\`\`

## Handling Peer Dependency Conflicts

If you encounter peer dependency conflicts:

### Option 1: Use --legacy-peer-deps

\`\`\`bash
npm install osi-cards-lib --legacy-peer-deps
\`\`\`

### Option 2: Update Incompatible Packages

Update packages that require Angular 18 to versions compatible with Angular 20:

\`\`\`bash
npm install @ng-select/ng-select@latest --legacy-peer-deps
npm install @angular-slider/ngx-slider@latest --legacy-peer-deps
\`\`\`

## Configuration

### 1. Import Styles

Add to your \`src/styles.scss\`:

\`\`\`scss
@import 'osi-cards-lib/styles/\_styles';
\`\`\`

### 2. Configure Providers (Optional)

In your \`app.config.ts\`:

\`\`\`typescript
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
providers: [
provideAnimations(),
// Other providers...
]
};
\`\`\`

## Verification

Verify installation by importing a component:

\`\`\`typescript
import { AICardRendererComponent } from 'osi-cards-lib';

// If this imports without errors, installation is successful
\`\`\`

## Troubleshooting

### Issue: Module not found

**Solution**: Ensure the library is installed and peer dependencies are satisfied.

### Issue: Styles not loading

**Solution**: Verify the style import path in your \`styles.scss\`.

### Issue: Peer dependency conflicts

**Solution**: Use \`--legacy-peer-deps\` flag or update conflicting packages.

## Next Steps

- [Library Usage Guide](/docs/library-usage)
- [Quick Start](/docs/getting-started)
- [API Reference](/docs/api)






