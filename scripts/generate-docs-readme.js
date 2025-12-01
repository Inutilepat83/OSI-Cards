#!/usr/bin/env node

/**
 * Generate docs/README.md from documentation directory
 *
 * This script scans the docs/ directory and auto-generates the README.md
 * with proper categorization and links to all documentation files.
 *
 * Usage: node scripts/generate-docs-readme.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const README_PATH = path.join(DOCS_DIR, 'README.md');

// Document categories and their display order
const CATEGORIES = {
  'getting-started': {
    title: '🚀 Getting Started',
    description: 'Installation, setup, and initial configuration',
    files: ['GETTING_STARTED.md', 'INTEGRATION_GUIDE.md', 'MIGRATION_GUIDE.md'],
    order: 1
  },
  'api-reference': {
    title: '📖 API & Reference',
    description: 'Complete API documentation and type references',
    files: ['API.md', 'COMPONENTS.md', 'SERVICES.md', 'SECTION_TYPES.md'],
    order: 2
  },
  'theming-styling': {
    title: '🎨 Theming & Styling',
    description: 'Customize appearance and style isolation',
    files: ['THEMING_GUIDE.md', 'PRESETS.md', 'CSS_ENCAPSULATION.md'],
    order: 3
  },
  'architecture': {
    title: '🏗️ Architecture & Extensibility',
    description: 'Library architecture and extension points',
    files: ['ARCHITECTURE.md', 'PLUGIN_SYSTEM.md', 'EVENT_SYSTEM.md', 'SECTION_REGISTRY.md'],
    order: 4
  },
  'utilities': {
    title: '🛠️ Utilities & Best Practices',
    description: 'Directives, utilities, and best practices',
    files: ['DIRECTIVES_UTILITIES.md', 'BEST_PRACTICES.md'],
    order: 5
  },
  'reference': {
    title: '📚 Reference & Specifications',
    description: 'OpenAPI specs, LLM integration, and other references',
    files: ['OPENAPI.md', 'LLM_PROMPT.md', 'openapi.yaml'],
    order: 6
  },
  'adr': {
    title: '📋 Architecture Decision Records',
    description: 'Documented architectural decisions',
    isDirectory: true,
    dirPath: 'adr',
    order: 7
  }
};

// File descriptions (extracted from first heading or hardcoded)
const FILE_DESCRIPTIONS = {
  'GETTING_STARTED.md': 'Step-by-step Angular integration guide (CSS, HTML, TS)',
  'INTEGRATION_GUIDE.md': 'SSR, NgRx, Micro-frontends, Form integration',
  'MIGRATION_GUIDE.md': 'Migrating from v1.x to v2.0 with Shadow DOM',
  'API.md': 'Complete API documentation for components, services, and types',
  'COMPONENTS.md': 'Detailed component reference (OsiCards, MasonryGrid, SectionRenderer)',
  'SERVICES.md': 'Service documentation (Streaming, CardFacade, Animation, Theme)',
  'SECTION_TYPES.md': 'All 17+ section types with configuration examples',
  'THEMING_GUIDE.md': 'CSS custom properties, theme presets, dark mode',
  'PRESETS.md': 'Card presets (Company, Analytics, Contact) and theme composition',
  'CSS_ENCAPSULATION.md': 'Shadow DOM, CSS Layers, style isolation',
  'ARCHITECTURE.md': 'Project structure and design decisions',
  'PLUGIN_SYSTEM.md': 'Creating custom section types and plugins',
  'EVENT_SYSTEM.md': 'EventBus, middleware, Shadow DOM events',
  'SECTION_REGISTRY.md': 'Section type definitions, aliases, registry schema',
  'DIRECTIVES_UTILITIES.md': 'CopyToClipboard, Tooltip, validation, performance utilities',
  'BEST_PRACTICES.md': 'Performance, accessibility, security, testing best practices',
  'OPENAPI.md': 'OpenAPI/Swagger specification for card configuration',
  'LLM_PROMPT.md': 'Guide for LLM-based card generation',
  'openapi.yaml': 'OpenAPI 3.1.0 specification file'
};

/**
 * Scan docs directory for all markdown files
 */
function scanDocsDirectory() {
  const files = fs.readdirSync(DOCS_DIR);
  const mdFiles = [];
  const directories = [];

  files.forEach(file => {
    const filePath = path.join(DOCS_DIR, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      directories.push(file);
    } else if (file.endsWith('.md') && file !== 'README.md') {
      mdFiles.push(file);
    } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      mdFiles.push(file);
    }
  });

  return { mdFiles, directories };
}

/**
 * Scan ADR directory for decision records
 */
function scanADRDirectory() {
  const adrPath = path.join(DOCS_DIR, 'adr');
  if (!fs.existsSync(adrPath)) {
    return [];
  }

  const files = fs.readdirSync(adrPath);
  return files
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(file => {
      const content = fs.readFileSync(path.join(adrPath, file), 'utf8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
      return { file, title };
    });
}

/**
 * Extract description from file content
 */
function getFileDescription(filename) {
  // Check hardcoded descriptions first
  if (FILE_DESCRIPTIONS[filename]) {
    return FILE_DESCRIPTIONS[filename];
  }

  // Try to extract from file
  const filePath = path.join(DOCS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Extract first paragraph after title
      const lines = content.split('\n');
      let foundTitle = false;
      for (const line of lines) {
        if (line.startsWith('#')) {
          foundTitle = true;
          continue;
        }
        if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('|')) {
          return line.trim().substring(0, 100) + (line.length > 100 ? '...' : '');
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return 'Documentation file';
}

/**
 * Categorize files
 */
function categorizeFiles(mdFiles) {
  const categorized = {};
  const uncategorized = [];

  // Initialize categories
  Object.keys(CATEGORIES).forEach(cat => {
    categorized[cat] = {
      ...CATEGORIES[cat],
      foundFiles: []
    };
  });

  // Categorize each file
  mdFiles.forEach(file => {
    let found = false;

    Object.keys(CATEGORIES).forEach(cat => {
      const category = CATEGORIES[cat];
      if (category.files && category.files.includes(file)) {
        categorized[cat].foundFiles.push({
          name: file,
          description: getFileDescription(file)
        });
        found = true;
      }
    });

    if (!found) {
      uncategorized.push({
        name: file,
        description: getFileDescription(file)
      });
    }
  });

  return { categorized, uncategorized };
}

/**
 * Generate the README content
 */
function generateReadme(categorized, uncategorized, adrFiles) {
  let content = `# OSI Cards Documentation

Welcome to the OSI Cards documentation. This guide helps you integrate and use the OSI Cards library in your Angular applications.

> **Note:** This README is auto-generated. Run \`npm run docs:readme\` to regenerate it.

---

## Quick Navigation

`;

  // Generate quick navigation table
  const sortedCategories = Object.entries(categorized)
    .filter(([, cat]) => cat.foundFiles.length > 0 || cat.isDirectory)
    .sort((a, b) => a[1].order - b[1].order);

  // First row: Getting Started files as entry points
  const gettingStarted = categorized['getting-started'];
  if (gettingStarted && gettingStarted.foundFiles.length > 0) {
    content += `| Getting Started | Reference | Advanced |\n`;
    content += `|----------------|-----------|----------|\n`;

    // Build columns
    const col1 = gettingStarted.foundFiles.map(f => `[${f.name.replace('.md', '')}](./${f.name})`);
    const apiRef = categorized['api-reference'];
    const col2 = apiRef ? apiRef.foundFiles.map(f => `[${f.name.replace('.md', '')}](./${f.name})`) : [];
    const arch = categorized['architecture'];
    const col3 = arch ? arch.foundFiles.map(f => `[${f.name.replace('.md', '')}](./${f.name})`) : [];

    const maxRows = Math.max(col1.length, col2.length, col3.length);
    for (let i = 0; i < maxRows; i++) {
      content += `| ${col1[i] || ''} | ${col2[i] || ''} | ${col3[i] || ''} |\n`;
    }
  }

  content += `\n---\n\n`;

  // Generate sections for each category
  sortedCategories.forEach(([key, category]) => {
    if (key === 'adr') {
      // Handle ADR section specially
      if (adrFiles.length > 0) {
        content += `## ${category.title}\n\n`;
        content += `${category.description}\n\n`;
        content += `| Document | Description |\n`;
        content += `|----------|-------------|\n`;
        adrFiles.forEach(adr => {
          content += `| **[${adr.file.replace('.md', '')}](./adr/${adr.file})** | ${adr.title} |\n`;
        });
        content += `\n---\n\n`;
      }
      return;
    }

    if (category.foundFiles.length === 0) return;

    content += `## ${category.title}\n\n`;
    content += `${category.description}\n\n`;
    content += `| Document | Description |\n`;
    content += `|----------|-------------|\n`;

    category.foundFiles.forEach(file => {
      const displayName = file.name.replace('.md', '').replace('.yaml', ' (YAML)');
      content += `| **[${displayName}](./${file.name})** | ${file.description} |\n`;
    });

    content += `\n---\n\n`;
  });

  // Add uncategorized files if any
  if (uncategorized.length > 0) {
    content += `## 📄 Other Documentation\n\n`;
    content += `| Document | Description |\n`;
    content += `|----------|-------------|\n`;

    uncategorized.forEach(file => {
      const displayName = file.name.replace('.md', '').replace('.yaml', ' (YAML)');
      content += `| **[${displayName}](./${file.name})** | ${file.description} |\n`;
    });

    content += `\n---\n\n`;
  }

  // Quick Start section
  content += `## 🚀 Quick Start

\`\`\`bash
npm install osi-cards-lib
\`\`\`

\`\`\`typescript
// app.config.ts
import { provideOSICards } from 'osi-cards-lib';

export const appConfig = {
  providers: [provideOSICards()]
};
\`\`\`

\`\`\`scss
// styles.scss
@import 'osi-cards-lib/styles/styles.scss';
\`\`\`

\`\`\`typescript
import { OsiCardsComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  imports: [OsiCardsComponent],
  template: \`<osi-cards [card]="card" />\`
})
export class MyComponent {
  card: AICardConfig = {
    cardTitle: 'My Card',
    sections: [
      { title: 'Info', type: 'info', fields: [{ label: 'Status', value: 'Active' }] }
    ]
  };
}
\`\`\`

📖 **Full guide:** [Getting Started](./GETTING_STARTED.md)

---

## 🆘 Help & Support

| Issue | Solution |
|-------|----------|
| Cards not rendering | Check \`provideOSICards()\` in providers |
| Styles not applied | Import \`osi-cards-lib/styles/styles.scss\` |
| Animations not working | Add \`provideAnimations()\` to providers |
| TypeScript errors | Ensure Angular 18+ |

### Resources

- [GitHub Repository](https://github.com/Inutilepat83/OSI-Cards)
- [API Reference](./API.md)
- [Best Practices](./BEST_PRACTICES.md)

---

## 📝 Regenerating This Documentation

This README is auto-generated from the docs directory. To regenerate:

\`\`\`bash
npm run docs:readme:docs
\`\`\`

Or directly:

\`\`\`bash
node scripts/generate-docs-readme.js
\`\`\`

---

*Auto-generated on ${new Date().toISOString().split('T')[0]}*
`;

  return content;
}

/**
 * Main function
 */
function main() {
  console.log('📚 Generating docs/README.md...\n');

  // Scan directories
  const { mdFiles, directories } = scanDocsDirectory();
  console.log(`Found ${mdFiles.length} documentation files`);
  console.log(`Found ${directories.length} subdirectories\n`);

  // Scan ADR directory
  const adrFiles = scanADRDirectory();
  console.log(`Found ${adrFiles.length} ADR files\n`);

  // Categorize files
  const { categorized, uncategorized } = categorizeFiles(mdFiles);

  // Log categorization
  Object.entries(categorized).forEach(([key, cat]) => {
    if (cat.foundFiles.length > 0) {
      console.log(`✓ ${cat.title}: ${cat.foundFiles.length} files`);
    }
  });
  if (uncategorized.length > 0) {
    console.log(`✓ Uncategorized: ${uncategorized.length} files`);
  }

  // Generate README
  const readmeContent = generateReadme(categorized, uncategorized, adrFiles);

  // Write README
  fs.writeFileSync(README_PATH, readmeContent, 'utf8');

  console.log(`\n✅ Generated ${README_PATH}`);
  console.log('   Run this script whenever documentation files change.');
}

// Run
main();

