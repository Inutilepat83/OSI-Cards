#!/usr/bin/env node

/**
 * Generate section type documentation from component code
 *
 * This script scans all section component files and generates comprehensive
 * documentation pages for each section type, including examples, data schemas,
 * and best practices.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const sectionsDir = path.join(rootDir, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');
const docsDir = path.join(rootDir, 'src', 'app', 'features', 'documentation', 'section-types');

// Section type metadata
const sectionTypes = {
  'info': {
    name: 'Info Section',
    description: 'Displays key-value pairs in a clean, scannable format. Ideal for metadata, contact information, and general data display.',
    useCases: ['Company information', 'Contact details', 'Metadata display', 'Key-value pairs'],
    bestPractices: [
      'Use for structured data with clear labels and values',
      'Keep labels concise and descriptive',
      'Use trend indicators for dynamic data',
      'Group related fields together'
    ]
  },
  'analytics': {
    name: 'Analytics Section',
    description: 'Displays metrics with visual indicators, trends, and percentages. Perfect for KPIs, performance metrics, and statistical data.',
    useCases: ['Performance metrics', 'KPIs', 'Growth statistics', 'Analytics dashboards'],
    bestPractices: [
      'Include percentage values for better visualization',
      'Use trend indicators (up/down/stable)',
      'Show change values when available',
      'Group related metrics together'
    ]
  },
  'news': {
    name: 'News Section',
    description: 'Displays news articles, headlines, and press releases. Supports source attribution and publication dates.',
    useCases: ['News feeds', 'Press releases', 'Announcements', 'Blog posts'],
    bestPractices: [
      'Include source and publication date in meta',
      'Keep headlines concise',
      'Use descriptions for summaries',
      'Include status for article state'
    ]
  },
  'list': {
    name: 'List Section',
    description: 'Displays structured lists and tables. Supports sorting, filtering, and item interactions.',
    useCases: ['Product lists', 'Employee rosters', 'Inventory', 'Task lists'],
    bestPractices: [
      'Use items array for list data',
      'Include titles and descriptions',
      'Add status badges when relevant',
      'Keep list items scannable'
    ]
  },
  'chart': {
    name: 'Chart Section',
    description: 'Displays data visualizations including bar charts, line charts, pie charts, and more.',
    useCases: ['Data visualization', 'Analytics dashboards', 'Statistical reports', 'Trend analysis'],
    bestPractices: [
      'Provide proper chart configuration',
      'Include chart type specification',
      'Use appropriate data formats',
      'Ensure accessibility with labels'
    ]
  },
  'map': {
    name: 'Map Section',
    description: 'Displays geographic data with embedded maps, pins, and location information.',
    useCases: ['Office locations', 'Store finder', 'Geographic data', 'Location tracking'],
    bestPractices: [
      'Include coordinates or addresses',
      'Use proper location formats',
      'Add location metadata',
      'Ensure map accessibility'
    ]
  },
  'contact-card': {
    name: 'Contact Card Section',
    description: 'Displays person information with avatars, roles, contact details, and social links.',
    useCases: ['Team members', 'Key contacts', 'Leadership', 'Stakeholders'],
    bestPractices: [
      'Include name, role, and contact info',
      'Add avatar images when available',
      'Include social media links',
      'Group by department or role'
    ]
  },
  'financials': {
    name: 'Financials Section',
    description: 'Displays financial data including revenue, expenses, P&L statements, and currency information.',
    useCases: ['Financial reports', 'Quarterly earnings', 'Budget information', 'Revenue tracking'],
    bestPractices: [
      'Use currency formatting',
      'Include time periods',
      'Show trends and changes',
      'Group by category'
    ]
  },
  'event': {
    name: 'Event Section',
    description: 'Displays chronological events, timelines, schedules, and calendar information.',
    useCases: ['Event calendars', 'Project timelines', 'Schedules', 'Milestones'],
    bestPractices: [
      'Include dates and times',
      'Add location information',
      'Use status for event state',
      'Chronological ordering'
    ]
  },
  'product': {
    name: 'Product Section',
    description: 'Displays product information, features, benefits, and pricing.',
    useCases: ['Product catalogs', 'Feature lists', 'Product comparisons', 'Pricing tables'],
    bestPractices: [
      'Highlight key features',
      'Include pricing when relevant',
      'Use descriptions for details',
      'Add status for availability'
    ]
  },
  'overview': {
    name: 'Overview Section',
    description: 'Displays high-level summaries, executive dashboards, and key highlights.',
    useCases: ['Executive summaries', 'Dashboard overviews', 'Key highlights', 'Quick insights'],
    bestPractices: [
      'Keep content high-level',
      'Focus on key metrics',
      'Use visual indicators',
      'Limit to essential information'
    ]
  },
  'social-media': {
    name: 'Social Media Section',
    description: 'Displays social media posts, engagement metrics, and social feed content.',
    useCases: ['Social feeds', 'Engagement tracking', 'Social monitoring', 'Content aggregation'],
    bestPractices: [
      'Include platform information',
      'Show engagement metrics',
      'Add timestamps',
      'Include author information'
    ]
  },
  'solutions': {
    name: 'Solutions Section',
    description: 'Displays solution offerings, use cases, features, and benefits.',
    useCases: ['Service offerings', 'Solution portfolios', 'Use cases', 'Case studies'],
    bestPractices: [
      'Highlight key benefits',
      'Include use cases',
      'Add feature lists',
      'Show outcomes when available'
    ]
  },
  'quotation': {
    name: 'Quotation Section',
    description: 'Displays quotes, testimonials, highlighted text, and citations.',
    useCases: ['Testimonials', 'Quotes', 'Citations', 'Highlighted content'],
    bestPractices: [
      'Include source attribution',
      'Add author information',
      'Use for emphasis',
      'Include dates when relevant'
    ]
  },
  'text-reference': {
    name: 'Text Reference Section',
    description: 'Displays long-form text, paragraphs, articles, and reference content.',
    useCases: ['Articles', 'Blog posts', 'Research summaries', 'Long-form content'],
    bestPractices: [
      'Break into readable chunks',
      'Use proper formatting',
      'Include citations',
      'Add metadata for context'
    ]
  },
  'network-card': {
    name: 'Network Card Section',
    description: 'Displays relationship graphs, network connections, and influence metrics.',
    useCases: ['Org charts', 'Relationship maps', 'Network analysis', 'Connection graphs'],
    bestPractices: [
      'Show relationships clearly',
      'Include connection types',
      'Add influence metrics',
      'Use visual hierarchy'
    ]
  },
  'brand-colors': {
    name: 'Brand Colors Section',
    description: 'Displays color swatches, brand palettes, and design system colors.',
    useCases: ['Brand assets', 'Design systems', 'Color palettes', 'Style guides'],
    bestPractices: [
      'Include hex/RGB values',
      'Show color names',
      'Group by category',
      'Enable copy-to-clipboard'
    ]
  }
};

/**
 * Extract component metadata from TypeScript file
 */
function extractComponentMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract component selector
  const selectorMatch = content.match(/selector:\s*['"]([^'"]+)['"]/);
  const selector = selectorMatch ? selectorMatch[1] : null;

  // Extract @Input properties
  const inputMatches = content.matchAll(/@Input\(\)\s+(\w+)/g);
  const inputs = Array.from(inputMatches, m => m[1]);

  // Extract @Output properties
  const outputMatches = content.matchAll(/@Output\(\)\s+(\w+)/g);
  const outputs = Array.from(outputMatches, m => m[1]);

  // Extract description from JSDoc
  const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  return {
    selector,
    inputs,
    outputs,
    description
  };
}

/**
 * Generate documentation page for a section type
 */
function generateSectionDoc(sectionType, metadata) {
  const sectionInfo = sectionTypes[sectionType] || {
    name: `${sectionType} Section`,
    description: `Documentation for ${sectionType} section type.`,
    useCases: [],
    bestPractices: []
  };

  const pageDir = path.join(docsDir, sectionType);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  // Try to find component file
  let componentMetadata = { inputs: [], outputs: [], description: '' };
  try {
    const files = fs.readdirSync(sectionsDir);
    const componentFile = files.find(f =>
      f.includes(sectionType) && f.endsWith('.component.ts')
    );
    if (componentFile) {
      const filePath = path.join(sectionsDir, componentFile);
      componentMetadata = extractComponentMetadata(filePath);
    }
  } catch (error) {
    // Directory might not exist or be accessible
    console.warn(`Could not read section directory: ${sectionsDir}`);
  }

  // Generate page.ts file
  // Convert section type to valid variable name (camelCase)
  const varName = sectionType
    .split('-')
    .map((part, index) => index === 0
      ? part.charAt(0).toUpperCase() + part.slice(1)
      : part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'SectionPage';

  const pageTs = `import { NgDocPage } from '@ng-doc/core';

const ${varName}: NgDocPage = {
  title: '${sectionInfo.name}',
  mdFile: './index.md',
  order: 1
};

export default ${varName};
`;

  // Generate markdown content
  const markdown = `# ${sectionInfo.name}

${sectionInfo.description}

## Overview

The **${sectionInfo.name}** is used for ${sectionInfo.description.toLowerCase()}

## Use Cases

${sectionInfo.useCases.map(uc => `- ${uc}`).join('\n')}

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: '${sectionType}';
  ${componentMetadata.inputs.length > 0 ? componentMetadata.inputs.map(input => `${input}?: any;`).join('\n  ') : 'fields?: CardField[];'}
  ${sectionType === 'list' || sectionType === 'news' || sectionType === 'event' ? 'items?: CardItem[];' : ''}
}
\`\`\`

## Example

\`\`\`json
${(() => {
  // Try to load from definition file
  const definitionPath = path.join(sectionsDir, `${sectionType}-section`, `${sectionType}.definition.json`);
  if (fs.existsSync(definitionPath)) {
    try {
      const definitionContent = fs.readFileSync(definitionPath, 'utf8');
      const definition = JSON.parse(definitionContent);
      const example = definition.examples?.example || definition.examples?.complete || definition.examples?.minimal;
      if (example) {
        return JSON.stringify(example, null, 2);
      }
    } catch (error) {
      // Fallback to basic example
    }
  }
  // Fallback to basic example
  return JSON.stringify({
    title: `${sectionInfo.name} Example`,
    type: sectionType,
    ...(sectionType === 'list' || sectionType === 'news' ? {
      items: [
        {
          title: "Example Item",
          description: "Item description"
        }
      ]
    } : {
      fields: [
        {
          label: "Example Label",
          value: "Example Value"
        }
      ]
    })
  }, null, 2);
})()}
\`\`\`

## Best Practices

${sectionInfo.bestPractices.map(bp => `1. ${bp}`).join('\n')}

## Component Properties

${componentMetadata.inputs.length > 0 ? `### Inputs\n\n${componentMetadata.inputs.map(input => `- **${input}**: Input property`).join('\n')}\n` : ''}
${componentMetadata.outputs.length > 0 ? `### Outputs\n\n${componentMetadata.outputs.map(output => `- **${output}**: Output event`).join('\n')}\n` : ''}

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

  // Write files
  fs.writeFileSync(path.join(pageDir, `${sectionType}.page.ts`), pageTs, 'utf8');
  fs.writeFileSync(path.join(pageDir, 'index.md'), markdown, 'utf8');

  console.log(`✅ Generated documentation for ${sectionType} section`);
}

// Generate docs for all section types
try {
  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Generate docs for each known section type
  Object.keys(sectionTypes).forEach(sectionType => {
    generateSectionDoc(sectionType, sectionTypes[sectionType]);
  });

  // Also scan for any additional section types in the codebase
  try {
    const files = fs.readdirSync(sectionsDir);
    files.forEach(file => {
      if (file.endsWith('-section.component.ts') || file.endsWith('section.component.ts')) {
        const sectionType = file
          .replace('-section.component.ts', '')
          .replace('section.component.ts', '')
          .replace('-', '');
        if (sectionType && !sectionTypes[sectionType]) {
          generateSectionDoc(sectionType, {
            name: `${sectionType} Section`,
            description: `Documentation for ${sectionType} section type.`,
            useCases: [],
            bestPractices: []
          });
        }
      }
    });
  } catch (error) {
    console.warn('Could not scan for additional section types:', error.message);
  }

  console.log('✅ Section type documentation generation complete');
} catch (error) {
  console.error('❌ Error generating section docs:', error);
  process.exit(1);
}

