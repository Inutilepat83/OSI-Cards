import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../doc-page.component';

const pageContent = `# Installation

This guide covers different ways to install and configure OSI Cards in your Angular project.

## Prerequisites

- Node.js 18+ 
- Angular 18 or higher
- npm or yarn

## npm Installation

The recommended way to install OSI Cards:

\`\`\`bash
npm install osi-cards-lib
\`\`\`

Or with yarn:

\`\`\`bash
yarn add osi-cards-lib
\`\`\`

## Peer Dependencies

OSI Cards has the following peer dependencies that should already be in your Angular project:

\`\`\`json
{
  "@angular/common": "^18.0.0 || ^19.0.0 || ^20.0.0",
  "@angular/core": "^18.0.0 || ^19.0.0 || ^20.0.0",
  "rxjs": "^7.0.0"
}
\`\`\`

### Optional Dependencies

For enhanced functionality:

\`\`\`bash
# For charts (ChartSection)
npm install chart.js

# For icons (if not using defaults)
npm install lucide-angular
\`\`\`

## Configuration

### Standalone Components (Recommended)

For Angular 18+ with standalone components:

\`\`\`typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOSICards({
      theme: 'default',
      streaming: true
    })
  ]
};
\`\`\`

### Module-based (Legacy)

For projects using NgModules:

\`\`\`typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { OSICardsModule } from 'osi-cards-lib';

@NgModule({
  imports: [
    OSICardsModule.forRoot({
      theme: 'default'
    })
  ]
})
export class AppModule { }
\`\`\`

## Styles Setup

### Option 1: Import in styles.scss

\`\`\`scss
// styles.scss
@import 'osi-cards-lib/styles';
\`\`\`

### Option 2: Add to angular.json

\`\`\`json
{
  "styles": [
    "node_modules/osi-cards-lib/styles/index.css",
    "src/styles.scss"
  ]
}
\`\`\`

### Option 3: CSS Custom Properties Only

If you want to use your own base styles:

\`\`\`scss
@import 'osi-cards-lib/styles/variables';
\`\`\`

## Verify Installation

Create a simple test to verify the installation:

\`\`\`typescript
import { Component } from '@angular/core';
import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [AICardRendererComponent],
  template: \`
    <app-ai-card-renderer [cardConfig]="testCard"></app-ai-card-renderer>
  \`
})
export class TestComponent {
  testCard: AICardConfig = {
    cardTitle: 'Installation Test',
    sections: [{
      title: 'Success',
      type: 'info',
      fields: [{ label: 'Status', value: 'Working!' }]
    }]
  };
}
\`\`\`

## Troubleshooting

### "Module not found" error

Make sure you've run \`npm install\` after adding the package:

\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Style issues

If styles aren't loading, check that you've imported them in your main styles file or angular.json.

### TypeScript errors

Ensure your tsconfig.json has the correct module resolution:

\`\`\`json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
\`\`\`

## Next Steps

- [Getting Started](/docs/getting-started) - Quick start guide
- [Section Types](/docs/section-types) - Learn about section types
- [Streaming](/docs/streaming/overview) - Set up streaming
`;

@Component({
  selector: 'app-installation-page',
  standalone: true,
  imports: [DocPageComponent],
  template: `<app-doc-page [content]="content"></app-doc-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstallationPageComponent {
  content = pageContent;
}

export default InstallationPageComponent;
