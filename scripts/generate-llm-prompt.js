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
 * Also loads examples from definition files if not in registry
 */
function readRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(content);

  // If examples are not in registry, load them from definition files
  const sectionsDir = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');

  for (const [type, def] of Object.entries(registry.sections || {})) {
    if (!def.examples) {
      const definitionPath = path.join(sectionsDir, `${type}-section`, `${type}.definition.json`);
      if (fs.existsSync(definitionPath)) {
        try {
          const definitionContent = fs.readFileSync(definitionPath, 'utf8');
          const definition = JSON.parse(definitionContent);
          if (definition.examples) {
            def.examples = definition.examples;
            // Ensure we use example if available, fallback to complete
            if (def.examples.example) {
              def.examples.example = def.examples.example;
            } else if (def.examples.complete) {
              def.examples.example = def.examples.complete;
            }
          }
        } catch (error) {
          // Silently fail if definition file can't be read
        }
      }
    }
  }

  return registry;
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

    // Get example from examples.example (or fallback to complete/minimal for backwards compatibility)
    let example = def.examples?.example || def.examples?.complete || def.examples?.minimal || { title: type, type };

    // Fix HTML entities in example (deep clone and clean)
    const exampleStr = JSON.stringify(example);
    const cleanedStr = exampleStr.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    try {
      example = JSON.parse(cleanedStr);
    } catch (e) {
      // If parsing fails, use original
    }

    // Build use cases list
    const useCasesList = def.useCases && def.useCases.length > 0
      ? def.useCases.map(uc => `- ${uc}`).join('\n')
      : '- General use';

    // Build best practices list
    const bestPracticesList = def.bestPractices && def.bestPractices.length > 0
      ? def.bestPractices.map(bp => `- ${bp}`).join('\n')
      : '- Follow standard data structure conventions';

    // Layout recommendations
    const defaultColumns = def.rendering?.defaultColumns || 1;
    const supportsCollapse = def.rendering?.supportsCollapse ? 'Yes' : 'No';

    // Preferred columns guidance based on default
    let preferredColumnsGuidance = '';
    if (defaultColumns === 1) {
      preferredColumnsGuidance = '1 column (single column layout)';
    } else if (defaultColumns === 2) {
      preferredColumnsGuidance = '2 columns (side-by-side layout, recommended for most cases)';
    } else if (defaultColumns >= 3) {
      preferredColumnsGuidance = `${defaultColumns} columns (wide layout for detailed content)`;
    }

    // Priority recommendation - dynamically determine based on section type
    let priorityRecommendation = '3 (lowest - supporting content)';
    const getPriorityForType = (sectionType) => {
      if (['overview', 'contact-card'].includes(sectionType)) return 1;
      if (['analytics', 'chart', 'financials'].includes(sectionType)) return 2;
      return 3;
    };
    const priorityNum = getPriorityForType(type);
    if (priorityNum === 1) {
      priorityRecommendation = '1 (highest - critical content)';
    } else if (priorityNum === 2) {
      priorityRecommendation = '2 (medium - important metrics)';
    }

    // Clean example JSON - remove HTML entities
    const cleanExampleJson = JSON.stringify(example, null, 2)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    return `#${type}${aliasStr}
Description: ${def.description || 'No description available'}
Use Cases:
${useCasesList}
Best Practices:
${bestPracticesList}
Layout:
Default columns: ${defaultColumns}
Recommended: ${preferredColumnsGuidance}
Supports collapse: ${supportsCollapse}
Priority recommendation: ${priorityRecommendation}
Data Structure: ${dataStructure}
Schema:
${schemaStr}
Note: The meta field can be used to store additional structured data specific to the section type. See examples for common meta field usage patterns.
Example:
${cleanExampleJson}`;
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
    const aliasStr = aliases.length > 0 ? aliases.join(', ') : '-';

    // Data structure
    let data = 'fields';
    if (def.rendering.usesItems && !def.rendering.usesFields) {
      data = 'items';
    } else if (def.rendering.usesChartData) {
      data = 'chartData';
    }

    // Use case
    const useCase = def.useCases?.[0] || def.name;

    // Get default columns
    const defaultColumns = def.rendering?.defaultColumns || 1;

    return `${type} | ${data} | ${defaultColumns} | ${aliasStr} | ${useCase}`;
  });

  return `Type | Data | Default Cols | Aliases | Use Case\n${rows.join('\n')}`;
}

/**
 * Generate type aliases section
 */
function generateTypeAliases(typeAliases) {
  const aliases = Object.entries(typeAliases)
    .map(([alias, target]) => `${alias} -> ${target}`)
    .join('\n');
  return aliases || '';
}

/**
 * Generate common patterns dynamically based on available section types
 */
function generateCommonPatterns(sections) {
  const publicSections = Object.keys(sections).filter(k => !sections[k].isInternal);

  // Helper to get priority recommendation for a section type
  const getPriority = (type) => {
    if (['overview', 'contact-card'].includes(type)) return 1;
    if (['analytics', 'chart', 'financials'].includes(type)) return 2;
    return 3;
  };

  // Helper to get description for a section type
  const getDescription = (type) => {
    const def = sections[type];
    if (!def) return '';
    const useCase = def.useCases?.[0] || def.name || type;
    return useCase;
  };

  // Build patterns dynamically
  const patterns = [];

  // Company Card pattern
  const companySections = [];
  if (publicSections.includes('overview')) companySections.push(`overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`);
  if (publicSections.includes('analytics')) companySections.push(`analytics (priority ${getPriority('analytics')}) - ${getDescription('analytics')}`);
  if (publicSections.includes('contact-card')) companySections.push(`contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`);
  if (publicSections.includes('financials')) companySections.push(`financials (priority ${getPriority('financials')}) - ${getDescription('financials')}`);
  if (publicSections.includes('news')) companySections.push(`news (priority ${getPriority('news')}) - ${getDescription('news')}`);

  if (companySections.length > 0) {
    patterns.push(`Company Card:\n${companySections.map(s => `- ${s}`).join('\n')}`);
  }

  // Product Card pattern
  const productSections = [];
  if (publicSections.includes('overview')) productSections.push(`overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`);
  if (publicSections.includes('product')) productSections.push(`product (priority ${getPriority('product')}) - ${getDescription('product')}`);
  if (publicSections.includes('chart')) productSections.push(`chart (priority ${getPriority('chart')}) - ${getDescription('chart')}`);
  if (publicSections.includes('quotation')) productSections.push(`quotation (priority ${getPriority('quotation')}) - ${getDescription('quotation')}`);

  if (productSections.length > 0) {
    patterns.push(`Product Card:\n${productSections.map(s => `- ${s}`).join('\n')}`);
  }

  // Event Card pattern
  const eventSections = [];
  if (publicSections.includes('overview')) eventSections.push(`overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`);
  if (publicSections.includes('event')) eventSections.push(`event (priority ${getPriority('event')}) - ${getDescription('event')}`);
  if (publicSections.includes('contact-card')) eventSections.push(`contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`);
  if (publicSections.includes('gallery')) eventSections.push(`gallery (priority ${getPriority('gallery')}) - ${getDescription('gallery')}`);

  if (eventSections.length > 0) {
    patterns.push(`Event Card:\n${eventSections.map(s => `- ${s}`).join('\n')}`);
  }

  // Contact Card pattern
  const contactSections = [];
  if (publicSections.includes('contact-card')) contactSections.push(`contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`);
  if (publicSections.includes('info')) contactSections.push(`info (priority ${getPriority('info')}) - ${getDescription('info')}`);
  if (publicSections.includes('social-media')) contactSections.push(`social-media (priority ${getPriority('social-media')}) - ${getDescription('social-media')}`);

  if (contactSections.length > 0) {
    patterns.push(`Contact Card:\n${contactSections.map(s => `- ${s}`).join('\n')}`);
  }

  return patterns.join('\n\n');
}

/**
 * Generate complete example cards
 */
function generateExampleCards(sections, registry) {
  // Example 1: Company card with key sections
  const loadExample = (type) => {
    return sections[type]?.examples?.example || sections[type]?.examples?.complete || null;
  };

  const example1 = {
    cardTitle: "Example Company",
    cardType: "company",
    sections: [
      loadExample('overview'),
      loadExample('analytics'),
      loadExample('contact-card')
    ].filter(Boolean),
    actions: [
      { label: "Website", type: "website", variant: "primary", url: "https://example.com" }
    ]
  };

  // Example 2: All sections demo - use compiled version from registry if available
  let example2 = null;
  if (registry && registry.allSectionsExample) {
    example2 = registry.allSectionsExample;
  } else {
    // Fallback: compile from individual examples in definitions
    example2 = {
      cardTitle: "All Sections Demo",
      sections: Object.entries(sections)
        .filter(([_, def]) => !def.isInternal)
        .map(([type, _]) => loadExample(type))
        .filter(Boolean),
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
  }

  return { example1, example2 };
}

/**
 * Generate the complete LLM system prompt
 */
function generateLLMPrompt(registry) {
  const { sections, typeAliases = {} } = registry;
  const sectionCount = Object.keys(sections).filter(k => !sections[k].isInternal).length;
  const aliasCount = Object.keys(typeAliases).length;

  const sectionTypesList = Object.keys(sections)
    .filter(k => !sections[k].isInternal)
    .join(', ');

  const quickRef = generateQuickReference(sections, typeAliases);
  const aliasesStr = generateTypeAliases(typeAliases);
  const sectionDocs = generateSectionDocs(sections, typeAliases);
  const { example1, example2 } = generateExampleCards(sections, registry);

  // Clean HTML entities from examples
  const cleanExample = (ex) => {
    if (!ex) return ex;
    const str = JSON.stringify(ex);
    const cleaned = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    return JSON.parse(cleaned);
  };

  const cleanExample1 = cleanExample(example1);
  const cleanExample2 = cleanExample(example2);

  // Generate common patterns dynamically based on section types
  const commonPatterns = generateCommonPatterns(sections);

  return `You are a JSON generator for OSI Cards. Generate valid JSON configurations for card UI components.

CRITICAL RULES:
Return ONLY valid JSON - no markdown, no explanations
cardTitle and sections are REQUIRED
Each section needs title and type
Use correct data structure: fields, items, or chartData based on type

COMMON MISTAKES TO AVOID:
Using wrong data structure (e.g., fields for item-based types like faq, gallery)
Missing required fields (title, type are always required)
Using HTML entities in JSON (use plain text, e.g., "&" not "&amp;")
Setting priority outside 1-3 range
Using preferredColumns outside 1-4 range
Including component-specific fields (componentPath, selector, stylePath)
Mixing data structures (don't use both fields and items unless type supports it)

CARD SCHEMA:

AICardConfig (root):
  - cardTitle: string (required)
  - sections: array (required)
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
  - preferredColumns: 1|2|3|4 (preferred width in columns)
  - minColumns: 1|2|3|4 (minimum width constraint)
  - maxColumns: 1|2|3|4 (maximum width constraint)
  - colSpan: number (explicit column span override)
  - orientation: vertical|horizontal|auto (content flow direction)
  - priority: 1|2|3 (layout priority: 1=highest, 2=medium, 3=lowest)
  - collapsed: boolean (whether section is collapsed)
  - meta: object (additional structured data)

PRIORITY SYSTEM:
Priority values (1-3) control section ordering and layout importance:
- Priority 1 (Highest): Critical sections like overview, executive summaries, key contacts
- Priority 2 (Medium): Important sections like analytics, charts, financials
- Priority 3 (Lowest): Supporting sections like FAQs, galleries, timelines

Higher priority sections appear first and are less likely to be condensed or moved.

LAYOUT PARAMETERS:
- preferredColumns: Recommended width (use default from quick reference as starting point)
- minColumns/maxColumns: Set constraints when section needs specific width range
- colSpan: Override for exact column span (use sparingly)
- orientation: Controls content flow (vertical=stacked, horizontal=side-by-side, auto=adaptive)

SECTION TYPES (${sectionCount}):
${sectionTypesList}

QUICK REFERENCE:
${quickRef}

${aliasesStr ? `TYPE ALIASES:\n${aliasesStr}\n\n` : ''}DATA STRUCTURE GUIDE:
Choose the correct data structure based on section type:
- fields: Use for key-value pairs, metrics, contact info, financial data (analytics, contact-card, financials, info, etc.)
- items: Use for lists, collections, sequences (faq, gallery, list, news, timeline, video, etc.)
- chartData: Use ONLY for chart type sections (chart)

Quick check: Look at the "Data" column in QUICK REFERENCE table above.

COMMON PATTERNS:
Typical section combinations for different card types:
${commonPatterns}

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
${JSON.stringify(cleanExample1, null, 2)}

Example 2:
${JSON.stringify(cleanExample2, null, 2)}`;
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
  const aliasCount = Object.keys(registry.typeAliases || {}).length;

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

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateLLMPrompt,
    generateStats,
    generateMarkdown,
    readRegistry,
  };
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
  console.log(`   - Type Aliases: ${Object.keys(registry.typeAliases || {}).length}`);
  console.log(`   - Characters: ${stats.characters}`);
  console.log(`   - Estimated Tokens: ${stats.estimatedTokens}`);
}

// Run only if called directly (not when required as module)
if (require.main === module) {
  main();
}

