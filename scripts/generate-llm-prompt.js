#!/usr/bin/env node
/**
 * Generate LLM System Prompt Documentation
 *
 * This script generates a comprehensive system prompt for LLMs that generate OSI Cards JSON.
 * It reads from section-registry.json (single source of truth) and creates:
 * - Complete schema documentation
 * - All section types with examples
 * - Type aliases
 * - Action button schemas
 * - Complete example cards
 *
 * Output: src/app/features/documentation/llm-integration/index.md
 */

const fs = require('fs');
const path = require('path');

// Paths
const REGISTRY_PATH = path.join(__dirname, '../projects/osi-cards-lib/section-registry.json');
const OUTPUT_PATH = path.join(__dirname, '../src/app/features/documentation/llm-integration/index.md');

/**
 * Read and parse the section registry
 */
function readRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Format schema properties for display
 */
function formatSchemaProperties(schema, indent = '  ') {
  if (!schema || !schema.properties) return `${indent}No specific schema`;

  const props = Object.entries(schema.properties);
  const required = schema.required || [];

  return props.map(([name, prop]) => {
    const type = Array.isArray(prop.type) ? prop.type.join('|') : prop.type;
    const req = required.includes(name) ? ' (required)' : '';
    const desc = prop.description ? ` - ${prop.description}` : '';
    const enumVals = prop.enum ? ` [${prop.enum.join(', ')}]` : '';
    return `${indent}- ${name}: ${type}${req}${desc}${enumVals}`;
  }).join('\n');
}

/**
 * Generate section documentation
 */
function generateSectionDocs(sections, typeAliases) {
  const publicSections = Object.entries(sections).filter(([_, def]) => !def.isInternal);

  return publicSections.map(([type, def]) => {
    // Find aliases for this type
    const aliases = Object.entries(typeAliases)
      .filter(([_, target]) => target === type)
      .map(([alias]) => alias);

    const aliasStr = aliases.length > 0 ? ` (aliases: ${aliases.join(', ')})` : '';

    // Determine data structure
    let dataStructure = 'fields';
    if (def.rendering.usesItems && !def.rendering.usesFields) {
      dataStructure = 'items';
    } else if (def.rendering.usesChartData) {
      dataStructure = 'chartData';
    }

    // Get schema
    const schema = def.fieldSchema || def.itemSchema || def.chartSchema;
    const schemaStr = formatSchemaProperties(schema);

    // Get minimal example
    const example = def.testFixtures?.minimal || { title: type, type };

    return `### ${type}${aliasStr}

${def.description}

**Data Structure:** ${dataStructure}
**Use Cases:** ${def.useCases?.join(', ') || 'General use'}

**Schema:**
${schemaStr}

**Example:**
${JSON.stringify(example, null, 2)}

---`;
  }).join('\n\n');
}

/**
 * Generate quick reference table
 */
function generateQuickReference(sections, typeAliases) {
  const publicSections = Object.entries(sections).filter(([_, def]) => !def.isInternal);

  const rows = publicSections.map(([type, def]) => {
    // Find aliases
    const aliases = Object.entries(typeAliases)
      .filter(([_, target]) => target === type)
      .map(([alias]) => alias);
    const aliasStr = aliases.length > 0 ? aliases.join('/') : '-';

    // Data structure
    let data = 'fields';
    if (def.rendering.usesItems && !def.rendering.usesFields) {
      data = 'items';
    } else if (def.rendering.usesChartData) {
      data = 'chartData';
    }

    // Use case
    const useCase = def.useCases?.[0] || def.name;

    return `${type} | ${data} | ${aliasStr} | ${useCase}`;
  });

  return `Type | Data | Aliases | Use Case\n${rows.join('\n')}`;
}

/**
 * Generate type aliases section
 */
function generateTypeAliases(typeAliases) {
  return Object.entries(typeAliases)
    .map(([alias, target]) => `${alias} -> ${target}`)
    .join('\n');
}

/**
 * Generate complete example cards
 */
function generateExampleCards(sections) {
  // Example 1: Company card with key sections
  const example1 = {
    cardTitle: "Example Company",
    cardType: "company",
    sections: [
      sections['overview']?.testFixtures?.complete,
      sections['analytics']?.testFixtures?.complete,
      sections['contact-card']?.testFixtures?.complete
    ].filter(Boolean),
    actions: [
      { label: "Website", type: "website", variant: "primary", url: "https://example.com" }
    ]
  };

  // Example 2: All sections demo
  const example2 = {
    cardTitle: "All Sections Demo",
    sections: Object.entries(sections)
      .filter(([_, def]) => !def.isInternal && def.testFixtures?.complete)
      .map(([_, def]) => def.testFixtures.complete),
    actions: [
      { label: "Website", type: "website", variant: "primary", url: "https://example.com" },
      {
        label: "Email",
        type: "mail",
        variant: "secondary",
        email: {
          contact: { name: "Support", email: "support@example.com", role: "Support" },
          subject: "Hello",
          body: "Message"
        }
      }
    ]
  };

  return { example1, example2 };
}

/**
 * Generate the complete LLM system prompt
 */
function generateLLMPrompt(registry) {
  const { sections, typeAliases } = registry;
  const sectionCount = Object.keys(sections).filter(k => !sections[k].isInternal).length;
  const aliasCount = Object.keys(typeAliases).length;

  const sectionTypesList = Object.keys(sections)
    .filter(k => !sections[k].isInternal)
    .join(', ');

  const quickRef = generateQuickReference(sections, typeAliases);
  const aliasesStr = generateTypeAliases(typeAliases);
  const sectionDocs = generateSectionDocs(sections, typeAliases);
  const { example1, example2 } = generateExampleCards(sections);

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

SECTION TYPES (${sectionCount}):

${sectionTypesList}

QUICK REFERENCE:
${quickRef}

TYPE ALIASES:
${aliasesStr}

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

Example 1:
${JSON.stringify(example1, null, 2)}

Example 2:
${JSON.stringify(example2, null, 2)}

RESPONSE FORMAT:
Return ONLY the JSON object, nothing else.`;
}

/**
 * Generate statistics for the prompt
 */
function generateStats(prompt) {
  const charCount = prompt.length;
  const tokenEstimate = Math.ceil(charCount / 4); // Rough estimate
  const lines = prompt.split('\n').length;

  return {
    characters: charCount.toLocaleString(),
    estimatedTokens: `~${tokenEstimate.toLocaleString()}`,
    lines,
    generated: new Date().toISOString()
  };
}

/**
 * Generate the markdown documentation file
 */
function generateMarkdown(prompt, registry, stats) {
  const sectionCount = Object.keys(registry.sections).filter(k => !registry.sections[k].isInternal).length;
  const aliasCount = Object.keys(registry.typeAliases).length;

  return `# LLM Integration

This page provides the complete system prompt for LLMs that generate OSI Cards JSON.

:::info Auto-Generated
This prompt is dynamically generated from \`section-registry.json\` - the single source of truth for all section types.
:::

## Prompt Statistics

| Metric           | Value                    |
| ---------------- | ------------------------ |
| Section Types    | ${sectionCount}                       |
| Type Aliases     | ${aliasCount}                       |
| Characters       | ${stats.characters}                   |
| Estimated Tokens | ${stats.estimatedTokens}                   |
| Generated        | ${stats.generated} |

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
 * Generate the page component TypeScript file
 */
function generatePageComponent(markdown) {
  // Escape backticks and backslashes in the content for template literal
  const escapedContent = markdown
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');

  return `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DocPageComponent } from '../doc-page.component';

const pageContent = \`${escapedContent}\`;

@Component({
  selector: 'app-llm-integration-page',
  standalone: true,
  imports: [DocPageComponent],
  template: \`<app-doc-page [content]="content"></app-doc-page>\`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LlmIntegrationPageComponent {
  content = pageContent;
}

export default LlmIntegrationPageComponent;
`;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating LLM System Prompt Documentation...\n');

  // Read registry
  console.log('📖 Reading section-registry.json...');
  const registry = readRegistry();

  // Generate prompt
  console.log('🔧 Generating LLM system prompt...');
  const prompt = generateLLMPrompt(registry);

  // Calculate stats
  const stats = generateStats(prompt);
  console.log(`📊 Prompt Stats: ${stats.characters} chars, ${stats.estimatedTokens} tokens`);

  // Generate markdown
  console.log('📝 Generating markdown documentation...');
  const markdown = generateMarkdown(prompt, registry, stats);

  // Ensure directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write markdown file
  fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  console.log(`✅ Generated: ${OUTPUT_PATH}`);

  // Generate and write page component
  const PAGE_COMPONENT_PATH = path.join(outputDir, 'page.component.ts');
  console.log('📝 Generating page component...');
  const pageComponent = generatePageComponent(markdown);
  fs.writeFileSync(PAGE_COMPONENT_PATH, pageComponent, 'utf8');
  console.log(`✅ Generated: ${PAGE_COMPONENT_PATH}`);

  // Summary
  console.log('\n📋 Summary:');
  console.log(`   - Section Types: ${Object.keys(registry.sections).filter(k => !registry.sections[k].isInternal).length}`);
  console.log(`   - Type Aliases: ${Object.keys(registry.typeAliases).length}`);
  console.log(`   - Characters: ${stats.characters}`);
  console.log(`   - Estimated Tokens: ${stats.estimatedTokens}`);
}

// Run
main();

