#!/usr/bin/env node

/**
 * Generate LLM Card Generation Prompt
 * 
 * This script generates a comprehensive, copy-pasteable prompt for LLMs
 * that are tasked with generating OSI Cards JSON configurations.
 * 
 * EVERYTHING is dynamically generated from section-registry.json - the single source of truth.
 * 
 * Outputs:
 * - docs/LLM_PROMPT.md - Standalone prompt file
 * - src/app/features/documentation/llm-integration/index.md - Documentation page
 * 
 * Usage: npm run generate:llm-prompt
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const PROMPT_OUTPUT_PATH = path.join(ROOT_DIR, 'docs', 'LLM_PROMPT.md');
const DOCS_OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'app', 'features', 'documentation', 'llm-integration', 'index.md');

/**
 * Read and parse the section registry
 */
function readRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Generate schema properties as text
 */
function generateSchemaProperties(schema) {
  if (!schema || !schema.properties) return '';
  
  const required = schema.required || [];
  const lines = [];
  
  for (const [name, prop] of Object.entries(schema.properties)) {
    let type = prop.type;
    if (Array.isArray(type)) type = type.join('|');
    
    const req = required.includes(name) ? ' (required)' : '';
    let desc = prop.description || '';
    if (prop.enum) desc += ` [${prop.enum.join(', ')}]`;
    
    lines.push(`  - ${name}: ${type}${req}${desc ? ' - ' + desc : ''}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate section documentation
 */
function generateSectionDoc(type, def) {
  const dataStruct = def.rendering.usesChartData ? 'chartData' : def.rendering.usesItems ? 'items' : 'fields';
  const schema = def.rendering.usesChartData ? def.chartSchema : def.rendering.usesItems ? def.itemSchema : def.fieldSchema;
  const aliases = def.aliases?.length ? ` (aliases: ${def.aliases.join(', ')})` : '';
  
  let doc = `
### ${type}${aliases}

${def.description}

**Data Structure:** ${dataStruct}
**Use Cases:** ${def.useCases.join(', ')}

**Schema:**
${schema ? generateSchemaProperties(schema) : '  No specific schema'}

**Example:**
${JSON.stringify(def.testFixtures?.minimal || { title: def.name, type }, null, 2)}
`;
  
  return doc;
}

/**
 * Generate example cards from fixtures
 */
function generateExampleCards(registry) {
  const sections = registry.sections;
  const examples = [];
  
  // Company card
  const companyTypes = ['overview', 'analytics', 'contact-card'];
  const companySections = companyTypes
    .filter(t => sections[t]?.testFixtures?.complete)
    .map(t => sections[t].testFixtures.complete);
  
  if (companySections.length > 0) {
    examples.push({
      cardTitle: 'Example Company',
      cardType: 'company',
      sections: companySections,
      actions: [
        { label: 'Website', type: 'website', variant: 'primary', url: 'https://example.com' }
      ]
    });
  }
  
  // All sections demo
  const allSections = Object.entries(sections)
    .filter(([, d]) => !d.isInternal && d.testFixtures?.complete)
    .map(([, d]) => d.testFixtures.complete);
  
  examples.push({
    cardTitle: 'All Sections Demo',
    sections: allSections,
    actions: [
      { label: 'Website', type: 'website', variant: 'primary', url: 'https://example.com' },
      { label: 'Email', type: 'mail', variant: 'secondary', email: { contact: { name: 'Support', email: 'support@example.com', role: 'Support' }, subject: 'Hello', body: 'Message' } }
    ]
  });
  
  return examples;
}

/**
 * Generate the raw system prompt content (plain text, no markdown formatting)
 */
function generateSystemPromptContent(registry) {
  const publicSections = Object.entries(registry.sections).filter(([, def]) => !def.isInternal);
  
  // Section types list
  const sectionTypes = publicSections.map(([type]) => type).join(', ');
  
  // Quick reference
  const quickRef = publicSections.map(([type, def]) => {
    const data = def.rendering.usesChartData ? 'chartData' : def.rendering.usesItems ? 'items' : 'fields';
    const aliases = def.aliases?.length ? def.aliases.join('/') : '-';
    return `${type} | ${data} | ${aliases} | ${def.useCases[0]}`;
  }).join('\n');
  
  // Aliases
  const aliases = Object.entries(registry.typeAliases)
    .map(([alias, canonical]) => `${alias} -> ${canonical}`)
    .join('\n');
  
  // Section docs
  const sectionDocs = publicSections
    .map(([type, def]) => generateSectionDoc(type, def))
    .join('\n---\n');
  
  // Example cards
  const exampleCards = generateExampleCards(registry);
  const examplesJson = exampleCards.map((card, i) => 
    `Example ${i + 1}:\n${JSON.stringify(card, null, 2)}`
  ).join('\n\n');

  return `You are a JSON generator for OSI Cards. Generate valid JSON configurations for card UI components.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. cardTitle and sections are REQUIRED
3. Each section needs title and type
4. Use correct data structure: fields, items, or chartData based on type

CARD SCHEMA:

AICardConfig (root):
  - cardTitle: string (required)
  - sections: array (required)
  - cardSubtitle: string
  - cardType: company|contact|event|product|analytics
  - description: string
  - actions: array

CardSection:
  - title: string (required)
  - type: string (required)
  - description: string
  - emoji: string
  - fields: array (for field-based types)
  - items: array (for item-based types)
  - chartType: bar|line|pie|doughnut
  - chartData: object

SECTION TYPES (${publicSections.length}):

${sectionTypes}

QUICK REFERENCE:
Type | Data | Aliases | Use Case
${quickRef}

TYPE ALIASES:
${aliases}

SECTION DETAILS:
${sectionDocs}

ACTION BUTTONS:

website:
  - label: string (required)
  - type: "website" (required)
  - url: string (required)
  - variant: primary|secondary|outline|ghost

mail:
  - label: string (required)
  - type: "mail" (required)
  - email.contact.name: string (required)
  - email.contact.email: string (required)
  - email.contact.role: string (required)
  - email.subject: string (required)
  - email.body: string (required)

agent:
  - label: string (required)
  - type: "agent" (required)
  - agentId: string
  - agentContext: object

question:
  - label: string (required)
  - type: "question" (required)
  - question: string

EXAMPLES:

${examplesJson}

RESPONSE FORMAT:
Return ONLY the JSON object, nothing else.`;
}

/**
 * Generate the standalone prompt file
 */
function generatePromptFile(registry) {
  const timestamp = new Date().toISOString();
  const prompt = generateSystemPromptContent(registry);
  const publicSections = Object.entries(registry.sections).filter(([, def]) => !def.isInternal);

  return `# OSI Cards - LLM System Prompt

> Auto-generated from section-registry.json
> Generated: ${timestamp}
> Version: ${registry.version}

## Usage

Copy the prompt below and paste it into your LLM's system prompt.

---

\`\`\`
${prompt}
\`\`\`

---

## Stats

- Section Types: ${publicSections.length}
- Aliases: ${Object.keys(registry.typeAliases).length}
- Characters: ${prompt.length.toLocaleString()}
- Estimated Tokens: ~${Math.ceil(prompt.length / 4).toLocaleString()}

Regenerate: \`npm run generate:llm-prompt\`
`;
}

/**
 * Generate the documentation page with branded styling
 */
function generateDocsPage(registry) {
  const timestamp = new Date().toISOString();
  const prompt = generateSystemPromptContent(registry);
  const publicSections = Object.entries(registry.sections).filter(([, def]) => !def.isInternal);
  const tokenEstimate = Math.ceil(prompt.length / 4);

  return `# LLM Integration

This page provides the complete system prompt for LLMs that generate OSI Cards JSON.

:::info Auto-Generated
This prompt is dynamically generated from \`section-registry.json\` - the single source of truth for all section types.
:::

## Prompt Statistics

| Metric | Value |
|--------|-------|
| Section Types | ${publicSections.length} |
| Type Aliases | ${Object.keys(registry.typeAliases).length} |
| Characters | ${prompt.length.toLocaleString()} |
| Estimated Tokens | ~${tokenEstimate.toLocaleString()} |
| Generated | ${timestamp} |

## How to Use

1. Click the **Copy** button below
2. Paste into your LLM's system prompt configuration
3. Send user queries to generate card JSON

## Complete System Prompt

\`\`\`llm
${prompt}
\`\`\`
`;
}

/**
 * Main execution
 */
function main() {
  console.log('🤖 Generating LLM Prompt from section-registry.json...\n');

  const registry = readRegistry();
  const publicSections = Object.keys(registry.sections).filter(k => !registry.sections[k].isInternal);
  
  console.log(`   ✓ Registry version: ${registry.version}`);
  console.log(`   ✓ Section types: ${publicSections.length}`);
  console.log(`   ✓ Type aliases: ${Object.keys(registry.typeAliases).length}`);

  // Generate files
  const promptContent = generatePromptFile(registry);
  fs.writeFileSync(PROMPT_OUTPUT_PATH, promptContent, 'utf8');
  console.log(`   ✓ Written: docs/LLM_PROMPT.md`);

  const docsContent = generateDocsPage(registry);
  fs.writeFileSync(DOCS_OUTPUT_PATH, docsContent, 'utf8');
  console.log(`   ✓ Written: src/app/features/documentation/llm-integration/index.md`);
  
  const prompt = generateSystemPromptContent(registry);
  console.log(`\n📊 Prompt stats:`);
  console.log(`   - ${prompt.length.toLocaleString()} characters`);
  console.log(`   - ~${Math.ceil(prompt.length / 4).toLocaleString()} estimated tokens`);
  
  console.log('\n✅ Done!');
}

try {
  main();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
