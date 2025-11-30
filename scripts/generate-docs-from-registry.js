#!/usr/bin/env node

/**
 * Generate Documentation from Registry
 * 
 * Creates comprehensive documentation for all section types based on
 * section-registry.json. Includes:
 * - Section type documentation pages
 * - API reference
 * - Example JSON configurations
 * - LLM prompt documentation
 * - Interactive schema explorer data
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation', 'section-types');
const LLM_DOCS_DIR = path.join(ROOT_DIR, 'docs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Generate documentation page for a section type
 */
function generateSectionDoc(type, def, registry) {
  const pageDir = path.join(DOCS_DIR, type);
  
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  // Generate page.ts
  const varName = type
    .split('-')
    .map((part, i) => i === 0 
      ? part.charAt(0).toUpperCase() + part.slice(1)
      : part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'SectionPage';

  const pageTs = `import { NgDocPage } from '@ng-doc/core';

const ${varName}: NgDocPage = {
  title: '${def.name}',
  mdFile: './index.md',
  order: 1
};

export default ${varName};
`;

  // Generate comprehensive markdown
  const schemaFields = def.fieldSchema?.properties || def.itemSchema?.properties || {};
  const schemaFieldsDocs = Object.entries(schemaFields)
    .map(([name, field]) => `| \`${name}\` | ${field.type || 'any'} | ${field.description || '-'} |`)
    .join('\n');

  const useCasesList = (def.useCases || []).map(uc => `- ${uc}`).join('\n');
  const bestPracticesList = (def.bestPractices || []).map((bp, i) => `${i + 1}. ${bp}`).join('\n');

  // Get aliases
  const aliases = Object.entries(registry.typeAliases || {})
    .filter(([_, target]) => target === type)
    .map(([alias]) => `\`${alias}\``)
    .join(', ') || 'None';

  const markdown = `# ${def.name}

${def.description}

## Overview

The **${def.name}** (\`type: "${type}"\`) is used for ${def.description.toLowerCase().replace(/\.$/, '')}.

### Quick Facts

| Property | Value |
|----------|-------|
| Type | \`${type}\` |
| Uses Fields | ${def.rendering.usesFields ? 'Yes' : 'No'} |
| Uses Items | ${def.rendering.usesItems ? 'Yes' : 'No'} |
| Default Columns | ${def.rendering.defaultColumns} |
| Supports Collapse | ${def.rendering.supportsCollapse ? 'Yes' : 'No'} |
| Aliases | ${aliases} |
${def.rendering.requiresExternalLib ? `| External Library | \`${def.rendering.requiresExternalLib}\` |` : ''}

## Use Cases

${useCasesList || '- General data display'}

## Data Schema

${def.rendering.usesFields ? `### Fields Schema

| Property | Type | Description |
|----------|------|-------------|
${schemaFieldsDocs || '| (See CardField interface) | - | - |'}` : ''}

${def.rendering.usesItems ? `### Items Schema

| Property | Type | Description |
|----------|------|-------------|
${schemaFieldsDocs || '| (See CardItem interface) | - | - |'}` : ''}

## Complete Example

\`\`\`json
${JSON.stringify(def.testFixtures?.complete || { title: def.name, type }, null, 2)}
\`\`\`

## Minimal Example

\`\`\`json
${JSON.stringify(def.testFixtures?.minimal || { title: type, type }, null, 2)}
\`\`\`

## Best Practices

${bestPracticesList || '1. Follow the standard data patterns for this section type'}

## Component Information

- **Selector:** \`${def.selector}\`
- **Component Path:** \`${def.componentPath}\`
${def.stylePath ? `- **Style Path:** \`${def.stylePath}\`` : ''}

## Related Documentation

- [All Section Types](/docs/section-types)
- [Card Configuration](/docs/api/models/aicardconfig)
- [Best Practices](/docs/best-practices)
`;

  // Write files
  fs.writeFileSync(path.join(pageDir, `${type}.page.ts`), pageTs, 'utf8');
  fs.writeFileSync(path.join(pageDir, 'index.md'), markdown, 'utf8');

  return { type, pageDir };
}

/**
 * Generate the LLM prompt documentation
 */
function generateLLMPrompt(registry) {
  const sections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal)
    .map(([type, def]) => {
      const fields = def.fieldSchema?.properties || def.itemSchema?.properties || {};
      const fieldsList = Object.entries(fields)
        .slice(0, 5)
        .map(([name, f]) => `    - ${name}: ${f.type || 'any'}`)
        .join('\n');

      return `### ${type}
${def.description}
${def.rendering.usesFields ? 'Uses fields:' : 'Uses items:'}
${fieldsList}

Example:
\`\`\`json
${JSON.stringify(def.testFixtures?.minimal || { title: type, type }, null, 2)}
\`\`\``;
    })
    .join('\n\n');

  const aliases = Object.entries(registry.typeAliases || {})
    .map(([alias, target]) => `- \`${alias}\` → \`${target}\``)
    .join('\n');

  const llmPrompt = `# OSI Cards - LLM Card Generation Guide

> AUTO-GENERATED FROM section-registry.json
> Generated: ${new Date().toISOString()}

## Overview

OSI Cards is a card-based UI component library for Angular. Cards are JSON configurations
that define structured data displays with multiple section types.

## Card Structure

\`\`\`json
{
  "cardTitle": "Card Title",
  "cardSubtitle": "Optional Subtitle",
  "cardType": "company|contact|event|product|analytics",
  "description": "Card description",
  "sections": [
    {
      "title": "Section Title",
      "type": "<section-type>",
      "fields": [...] // or "items": [...]
    }
  ],
  "actions": [
    {
      "label": "Action Label",
      "type": "website|mail|agent|question",
      "variant": "primary|secondary|outline|ghost"
    }
  ]
}
\`\`\`

## Available Section Types

${sections}

## Type Aliases

The following aliases are supported for backward compatibility:

${aliases}

## Guidelines for LLM Card Generation

1. **Always use valid section types** from the list above
2. **Match data structure** - use \`fields\` or \`items\` based on section type
3. **Include required properties** - \`title\` and \`type\` are always required
4. **Use appropriate types** - analytics for metrics, list for items, etc.
5. **Validate JSON** - ensure output is valid JSON before returning

## Quick Reference

| Section Type | Data Structure | Best For |
|--------------|---------------|----------|
${Object.entries(registry.sections)
  .filter(([_, def]) => !def.isInternal)
  .map(([type, def]) => 
    `| \`${type}\` | ${def.rendering.usesItems ? 'items' : 'fields'} | ${def.useCases?.[0] || def.name} |`
  )
  .join('\n')}

## Example Complete Card

\`\`\`json
{
  "cardTitle": "Example Company Card",
  "cardType": "company",
  "sections": [
    {
      "title": "Overview",
      "type": "overview",
      "fields": [
        { "label": "Industry", "value": "Technology" },
        { "label": "Founded", "value": "2010" }
      ]
    },
    {
      "title": "Key Metrics",
      "type": "analytics",
      "fields": [
        { "label": "Revenue Growth", "value": "25%", "percentage": 25, "trend": "up" }
      ]
    }
  ],
  "actions": [
    { "label": "Learn More", "type": "website", "variant": "primary", "url": "https://example.com" }
  ]
}
\`\`\`
`;

  const outputPath = path.join(LLM_DOCS_DIR, 'LLM_PROMPT.md');
  fs.writeFileSync(outputPath, llmPrompt, 'utf8');
  
  return { path: outputPath };
}

/**
 * Generate kitchen sink demo config
 */
function generateKitchenSink(registry) {
  const sections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal && def.testFixtures?.complete)
    .map(([_, def]) => def.testFixtures.complete);

  const config = {
    cardTitle: 'Kitchen Sink - All Section Types',
    cardSubtitle: 'Generated from section-registry.json',
    description: 'This card demonstrates all available section types with complete examples',
    sections,
    actions: [
      { label: 'Learn More', type: 'website', variant: 'primary', icon: '🌐', url: 'https://example.com' },
      { label: 'Contact', type: 'mail', variant: 'secondary', icon: '📧', 
        email: { contact: { name: 'Support', email: 'support@example.com', role: 'Support' }, subject: 'Inquiry', body: 'Hello' } }
    ]
  };

  const outputPath = path.join(ROOT_DIR, 'src', 'assets', 'configs', 'kitchen-sink.generated.json');
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf8');
  
  return { path: outputPath, sectionsCount: sections.length };
}

/**
 * Generate section comparison table
 */
function generateComparisonTable(registry) {
  const headers = ['Type', 'Name', 'Fields', 'Items', 'Chart', 'Columns', 'External Lib'];
  
  const rows = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal)
    .map(([type, def]) => [
      type,
      def.name.replace(' Section', ''),
      def.rendering.usesFields ? '✓' : '-',
      def.rendering.usesItems ? '✓' : '-',
      def.rendering.usesChartData ? '✓' : '-',
      def.rendering.defaultColumns.toString(),
      def.rendering.requiresExternalLib || '-'
    ]);

  let markdown = `# Section Types Comparison

> AUTO-GENERATED FROM section-registry.json

| ${headers.join(' | ')} |
| ${headers.map(() => '---').join(' | ')} |
${rows.map(row => `| ${row.join(' | ')} |`).join('\n')}

## Legend

- **Fields**: Section uses \`fields\` array (CardField[])
- **Items**: Section uses \`items\` array (CardItem[])
- **Chart**: Section uses \`chartData\` for visualization
- **Columns**: Default column span (1-4)
- **External Lib**: Required external library (optional)
`;

  const outputPath = path.join(LLM_DOCS_DIR, 'SECTION_COMPARISON.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  
  return { path: outputPath };
}

/**
 * Main
 */
function main() {
  log('\n📚 Generating Documentation from Registry', colors.cyan);
  log('═'.repeat(50), colors.cyan);

  const registry = loadRegistry();
  log(`\n📄 Registry: v${registry.version}`, colors.blue);

  // Ensure directories exist
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Generate section docs
  log('\n📝 Generating section documentation...', colors.blue);
  let docsCount = 0;
  Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal)
    .forEach(([type, def]) => {
      generateSectionDoc(type, def, registry);
      docsCount++;
    });
  log(`  ✓ Generated ${docsCount} section documentation pages`, colors.green);

  // Generate LLM prompt
  const llmResult = generateLLMPrompt(registry);
  log(`  ✓ Generated ${path.basename(llmResult.path)}`, colors.green);

  // Generate kitchen sink
  const kitchenSink = generateKitchenSink(registry);
  log(`  ✓ Generated kitchen-sink.generated.json (${kitchenSink.sectionsCount} sections)`, colors.green);

  // Generate comparison table
  const comparison = generateComparisonTable(registry);
  log(`  ✓ Generated ${path.basename(comparison.path)}`, colors.green);

  log('\n═'.repeat(50), colors.cyan);
  log('✅ Documentation generation complete!\n', colors.green);
}

main();

