#!/usr/bin/env node

/**
 * Generate README.md from ng-doc documentation and package.json
 * 
 * This script extracts information from package.json and generates a comprehensive
 * README.md file that stays in sync with the documentation.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const readmePath = path.join(rootDir, 'README.md');
const libReadmePath = path.join(rootDir, 'projects', 'osi-cards-lib', 'README.md');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

/**
 * Generate main project README
 */
function generateMainReadme() {
  const name = packageJson.name || 'osi-cards';
  const version = packageJson.version || '1.0.0';
  const description = packageJson.description || 'OSI Cards - Versatile card generator for sales intelligence agents';
  
  const readme = `# OrangeSales Intelligence OSI Cards

**${description}**

Built as a modern, token-driven Angular dashboard framework (supports Angular 18 and 20), OSI Cards transforms any dataset into a visually rich stack of interactive cards rendered within a responsive masonry grid. Built for flexibility, accessibility, and performance, OSI Cards empowers developers to compose diverse data experiences with minimal friction.

> **🤖 AI-Generated Cards:** All OSI Cards are **AI-generated** by Large Language Models (LLMs). Cards are never manually created - they are always produced by LLMs that understand the card structure, section types, and data schemas.

Each card is composed of one or more **sections**—standalone, configurable components orchestrated by \`AICardRendererComponent\` ⟶ \`SectionRendererComponent\` ⟶ \`MasonryGridComponent\`. This architecture enables seamless combination of layouts, real-time streaming updates, and rich interactions.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Using OSI Cards in Your Project](#using-osi-cards-in-your-project)
4. [LLM Integration](#llm-integration)
5. [Section Types](#section-types)
6. [Documentation](#documentation)
7. [Development](#development)

---

## Quick Start

### Run the Development Server

\`\`\`bash
npm start
# Navigate to http://localhost:4200
\`\`\`

### Create Your First Card

Add a JSON card configuration to \`src/assets/configs/companies/\` or \`src/assets/configs/contacts/\`:

\`\`\`json
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
\`\`\`

The card will automatically appear in the masonry grid on page load.

---

## Installation

### Install from npm (Recommended)

\`\`\`bash
npm install osi-cards-lib
\`\`\`

**Package URL:** https://www.npmjs.com/package/osi-cards-lib

The library supports both Angular 18 and Angular 20. If you encounter peer dependency conflicts:

\`\`\`bash
npm install osi-cards-lib --legacy-peer-deps
\`\`\`

### Install from GitHub

\`\`\`bash
npm install git+https://github.com/Inutilepat83/OSI-Cards.git
\`\`\`

---

## Using OSI Cards in Your Project

### Quick Integration

1. **Install peer dependencies:**
   \`\`\`bash
   npm install @angular/common@^20.0.0 @angular/core@^20.0.0 @angular/animations@^20.0.0 @angular/platform-browser@^20.0.0 lucide-angular@^0.548.0 rxjs@~7.8.0
   \`\`\`

2. **Import styles in your \`src/styles.scss\`:**
   \`\`\`scss
   @import 'osi-cards-lib/styles/_styles';
   \`\`\`

3. **Use components in your Angular component:**
   \`\`\`typescript
   import { Component } from '@angular/core';
   import { AICardRendererComponent, AICardConfig } from 'osi-cards-lib';
   
   @Component({
     selector: 'app-my-component',
     standalone: true,
     imports: [AICardRendererComponent],
     template: \`
       <app-ai-card-renderer [cardConfig]="cardConfig"></app-ai-card-renderer>
     \`
   })
   export class MyComponent {
     cardConfig: AICardConfig = {
       cardTitle: 'My Card',
       sections: [
         {
           title: 'Overview',
           type: 'info',
           fields: [
             { label: 'Name', value: 'Example' },
             { label: 'Status', value: 'Active' }
           ]
         }
       ]
     };
   }
   \`\`\`

For detailed integration instructions, see the [Documentation](#documentation).

---

## LLM Integration

OSI Cards is designed to work seamlessly with Large Language Models (LLMs) for dynamic card generation.

### Features

- **Streaming Card Generation**: Cards are generated progressively as LLM responses stream in
- **WebSocket Support**: Real-time card updates via WebSocket connections
- **Agent Integration**: Connect with agent systems for automated card generation
- **Prompt Engineering**: Structured prompts for consistent card generation

### Quick Example

\`\`\`typescript
import { LLMStreamingService } from 'osi-cards-lib';

const streamingService = inject(LLMStreamingService);

// Start streaming from LLM response
streamingService.start(llmJsonResponse);

// Subscribe to card updates
streamingService.cardUpdates$.subscribe(update => {
  console.log('Card updated:', update.card);
});
\`\`\`

For complete LLM integration guide, see [Documentation - LLM Integration](/docs/llm-integration).

---

## Section Types

OSI Cards includes **20+ pre-built section types**:

- **Info**: Key-value pairs and metadata
- **Analytics**: Metrics with trends and percentages
- **News**: News articles and headlines
- **Social Media**: Social media posts and engagement
- **Financials**: Financial data and reports
- **List/Table**: Structured lists and tables
- **Event/Timeline**: Chronological events
- **Product**: Product information and features
- **Contact Cards**: Person information
- **Network Cards**: Relationship graphs
- **Map/Locations**: Geographic data
- **Chart**: Data visualizations
- And many more...

For complete section type documentation with examples and best practices, see [Documentation - Section Types](/docs/section-types).

---

## Documentation

📖 **Full Documentation:** [View Documentation](/docs)

The documentation includes:
- Installation and setup guides
- Library usage examples
- LLM integration guide
- Complete section type reference
- API documentation
- Best practices

---

## Development

### Setup

\`\`\`bash
# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build production
npm run build
\`\`\`

### Generate Documentation

\`\`\`bash
# Generate all documentation
npm run docs:generate

# Generate API docs only
npm run docs:api

# Generate README
npm run docs:readme

# Watch mode for development
npm run docs:watch
\`\`\`

---

## License

${packageJson.license || 'MIT'}

## Version

${version}

---

**Questions or contributions?** See the [Documentation](/docs) for detailed guides and examples.
`;

  fs.writeFileSync(readmePath, readme, 'utf8');
  console.log('✅ Generated README.md');
}

/**
 * Generate library README
 */
function generateLibraryReadme() {
  const libPackageJsonPath = path.join(rootDir, 'projects', 'osi-cards-lib', 'package.json');
  let libPackageJson = {};
  
  if (fs.existsSync(libPackageJsonPath)) {
    libPackageJson = JSON.parse(fs.readFileSync(libPackageJsonPath, 'utf8'));
  }
  
  const name = libPackageJson.name || 'osi-cards-lib';
  const version = libPackageJson.version || packageJson.version || '1.0.0';
  const description = libPackageJson.description || 'Standalone OSI Cards library for Angular applications';
  
  const readme = `# ${name}

${description}

## Installation

\`\`\`bash
npm install ${name}
\`\`\`

## Quick Start

\`\`\`typescript
import { AICardRendererComponent, AICardConfig } from '${name}';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AICardRendererComponent],
  template: \`
    <app-ai-card-renderer [cardConfig]="card"></app-ai-card-renderer>
  \`
})
export class ExampleComponent {
  card: AICardConfig = {
    cardTitle: 'Example Card',
    sections: [
      {
        title: 'Info',
        type: 'info',
        fields: [
          { label: 'Name', value: 'Example' }
        ]
      }
    ]
  };
}
\`\`\`

## Documentation

For complete documentation, visit: https://github.com/Inutilepat83/OSI-Cards

## Version

${version}
`;

  // Ensure directory exists
  const libDir = path.dirname(libReadmePath);
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  fs.writeFileSync(libReadmePath, readme, 'utf8');
  console.log('✅ Generated library README.md');
}

// Generate both READMEs
try {
  generateMainReadme();
  generateLibraryReadme();
  console.log('✅ README generation complete');
} catch (error) {
  console.error('❌ Error generating README:', error);
  process.exit(1);
}







