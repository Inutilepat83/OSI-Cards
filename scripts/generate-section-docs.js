#!/usr/bin/env node

/**
 * Generate section type documentation from definition files
 *
 * This script reads all section definition files (*.definition.json) and generates
 * comprehensive documentation pages for each section type, including examples,
 * data schemas, and best practices.
 *
 * Uses definition files as the single source of truth for section metadata.
 */

const fs = require('fs');
const path = require('path');
const {
  getSectionTypes,
  getSectionMetadata,
  loadSectionDefinition,
  sectionsDir
} = require('./utils/definition-reader');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'src', 'app', 'features', 'documentation', 'section-types');

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
function generateSectionDoc(sectionType) {
  // Load metadata from definition file
  const sectionInfo = getSectionMetadata(sectionType) || {
    type: sectionType,
    name: `${sectionType} Section`,
    description: `Documentation for ${sectionType} section type.`,
    useCases: [],
    bestPractices: [],
    rendering: {}
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

  // Determine content type from rendering config
  const usesFields = sectionInfo.rendering?.usesFields === true;
  const usesItems = sectionInfo.rendering?.usesItems === true;
  const usesChartData = sectionInfo.rendering?.usesChartData === true;

  // Load example from definition file
  const definition = loadSectionDefinition(sectionType);
  let exampleJson = '';
  if (definition && definition.examples) {
    // Prefer demo, then doc, then long, then example (for backward compatibility)
    const example = definition.examples.demo || 
                    definition.examples.doc || 
                    definition.examples.long || 
                    definition.examples.example;
    if (example) {
      exampleJson = JSON.stringify(example, null, 2);
    }
  }

  // Fallback example if none found
  if (!exampleJson) {
    const fallbackExample = {
      title: `${sectionInfo.name} Example`,
      type: sectionType,
      description: `Example ${sectionInfo.name.toLowerCase()}`
    };
    if (usesItems) {
      fallbackExample.items = [{
        title: "Example Item",
        description: "Item description"
      }];
    } else if (usesChartData) {
      fallbackExample.chartType = "bar";
      fallbackExample.chartData = {
        labels: ["Example"],
        datasets: [{ label: "Data", data: [10] }]
      };
    } else {
      fallbackExample.fields = [{
        label: "Example Label",
        value: "Example Value"
      }];
    }
    exampleJson = JSON.stringify(fallbackExample, null, 2);
  }

  // Generate markdown content
  const markdown = `# ${sectionInfo.name}

${sectionInfo.description}

## Overview

The **${sectionInfo.name}** is used for ${sectionInfo.description.toLowerCase()}

## Use Cases

${sectionInfo.useCases.length > 0 
  ? sectionInfo.useCases.map(uc => `- ${uc}`).join('\n')
  : '- General purpose section'}

## Data Schema

\`\`\`typescript
interface CardSection {
  title: string;
  type: '${sectionType}';
  ${usesChartData 
    ? 'chartType?: "bar" | "line" | "pie" | "doughnut";\n  chartData?: ChartData;'
    : usesItems 
      ? 'items?: CardItem[];'
      : 'fields?: CardField[];'}
}
\`\`\`

## Example

\`\`\`json
${exampleJson}
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

  // Discover all section types from definition files
  const sectionTypes = getSectionTypes();
  
  if (sectionTypes.length === 0) {
    console.warn('⚠️  No section types found. Make sure definition files exist.');
    process.exit(1);
  }

  console.log(`📚 Generating documentation for ${sectionTypes.length} section types...`);

  // Generate docs for each section type discovered from definition files
  sectionTypes.forEach(sectionType => {
    generateSectionDoc(sectionType);
  });

  console.log(`✅ Section type documentation generation complete (${sectionTypes.length} sections)`);
} catch (error) {
  console.error('❌ Error generating section docs:', error);
  process.exit(1);
}

