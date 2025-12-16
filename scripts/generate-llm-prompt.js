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
const OUTPUT_PATH = path.join(
  __dirname,
  '../src/app/features/documentation/llm-integration/index.md'
);

/**
 * Read and parse the section registry
 * Also loads examples from definition files if not in registry
 */
function readRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(content);

  // If examples are not in registry, load them from definition files
  const sectionsDir = path.join(
    __dirname,
    '..',
    'projects',
    'osi-cards-lib',
    'src',
    'lib',
    'components',
    'sections'
  );

  for (const [type, def] of Object.entries(registry.sections || {})) {
    if (!def.examples) {
      const definitionPath = path.join(sectionsDir, `${type}-section`, `${type}.definition.json`);
      if (fs.existsSync(definitionPath)) {
        try {
          const definitionContent = fs.readFileSync(definitionPath, 'utf8');
          const definition = JSON.parse(definitionContent);
          if (definition.examples) {
            def.examples = definition.examples;

            // Backward compatibility: treat existing "example" as "demo" if demo doesn't exist
            if (def.examples.example && !def.examples.demo) {
              def.examples.demo = def.examples.example;
            }

            // Also support "complete" as fallback for demo
            if (def.examples.complete && !def.examples.demo) {
              def.examples.demo = def.examples.complete;
            }
          }
        } catch (error) {
          // Silently fail if definition file can't be read
        }
      }
    } else {
      // For registry sections that already have examples, ensure demo/doc structure
      if (def.examples.example && !def.examples.demo) {
        def.examples.demo = def.examples.example;
      }
      if (def.examples.complete && !def.examples.demo) {
        def.examples.demo = def.examples.complete;
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

  return props
    .map(([name, prop]) => {
      const type = Array.isArray(prop.type) ? prop.type.join('|') : prop.type;
      const req = required.includes(name) ? ' (required)' : '';
      const desc = prop.description ? ` - ${prop.description}` : '';
      const enumVals = prop.enum ? ` [${prop.enum.join(', ')}]` : '';
      return `${indent}- ${name}: ${type}${req}${desc}${enumVals}`;
    })
    .join('\n');
}

/**
 * Generate section documentation
 */
function generateSectionDocs(sections, typeAliases) {
  const publicSections = Object.entries(sections).filter(([_, def]) => !def.isInternal);

  return publicSections
    .map(([type, def]) => {
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
      let example = def.examples?.example ||
        def.examples?.complete ||
        def.examples?.minimal || { title: type, type };

      // Fix HTML entities in example (deep clone and clean)
      const exampleStr = JSON.stringify(example);
      const cleanedStr = exampleStr
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      try {
        example = JSON.parse(cleanedStr);
      } catch (e) {
        // If parsing fails, use original
      }

      // Build use cases list
      const useCasesList =
        def.useCases && def.useCases.length > 0
          ? def.useCases.map((uc) => `- ${uc}`).join('\n')
          : '- General use';

      // Build best practices list
      const bestPracticesList =
        def.bestPractices && def.bestPractices.length > 0
          ? def.bestPractices.map((bp) => `- ${bp}`).join('\n')
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
    })
    .join('\n\n');
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
  const publicSections = Object.keys(sections).filter((k) => !sections[k].isInternal);

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
  if (publicSections.includes('overview'))
    companySections.push(
      `overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`
    );
  if (publicSections.includes('analytics'))
    companySections.push(
      `analytics (priority ${getPriority('analytics')}) - ${getDescription('analytics')}`
    );
  if (publicSections.includes('contact-card'))
    companySections.push(
      `contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`
    );
  if (publicSections.includes('financials'))
    companySections.push(
      `financials (priority ${getPriority('financials')}) - ${getDescription('financials')}`
    );
  if (publicSections.includes('news'))
    companySections.push(`news (priority ${getPriority('news')}) - ${getDescription('news')}`);

  if (companySections.length > 0) {
    patterns.push(`Company Card:\n${companySections.map((s) => `- ${s}`).join('\n')}`);
  }

  // Product Card pattern
  const productSections = [];
  if (publicSections.includes('overview'))
    productSections.push(
      `overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`
    );
  if (publicSections.includes('product'))
    productSections.push(
      `product (priority ${getPriority('product')}) - ${getDescription('product')}`
    );
  if (publicSections.includes('chart'))
    productSections.push(`chart (priority ${getPriority('chart')}) - ${getDescription('chart')}`);
  if (publicSections.includes('quotation'))
    productSections.push(
      `quotation (priority ${getPriority('quotation')}) - ${getDescription('quotation')}`
    );

  if (productSections.length > 0) {
    patterns.push(`Product Card:\n${productSections.map((s) => `- ${s}`).join('\n')}`);
  }

  // Event Card pattern
  const eventSections = [];
  if (publicSections.includes('overview'))
    eventSections.push(
      `overview (priority ${getPriority('overview')}) - ${getDescription('overview')}`
    );
  if (publicSections.includes('event'))
    eventSections.push(`event (priority ${getPriority('event')}) - ${getDescription('event')}`);
  if (publicSections.includes('contact-card'))
    eventSections.push(
      `contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`
    );
  if (publicSections.includes('gallery'))
    eventSections.push(
      `gallery (priority ${getPriority('gallery')}) - ${getDescription('gallery')}`
    );

  if (eventSections.length > 0) {
    patterns.push(`Event Card:\n${eventSections.map((s) => `- ${s}`).join('\n')}`);
  }

  // Contact Card pattern
  const contactSections = [];
  if (publicSections.includes('contact-card'))
    contactSections.push(
      `contact-card (priority ${getPriority('contact-card')}) - ${getDescription('contact-card')}`
    );
  if (publicSections.includes('info'))
    contactSections.push(`info (priority ${getPriority('info')}) - ${getDescription('info')}`);
  if (publicSections.includes('social-media'))
    contactSections.push(
      `social-media (priority ${getPriority('social-media')}) - ${getDescription('social-media')}`
    );

  if (contactSections.length > 0) {
    patterns.push(`Contact Card:\n${contactSections.map((s) => `- ${s}`).join('\n')}`);
  }

  return patterns.join('\n\n');
}

/**
 * Generate demo example for a section type (extensive/comprehensive)
 */
function generateDemoExampleSection(type, def) {
  // Get demo example (or fallback to example/complete for backward compatibility)
  const demoExample = def.examples?.demo || def.examples?.example || def.examples?.complete || null;

  if (demoExample) {
    // Deep clone to avoid modifying original
    const section = JSON.parse(JSON.stringify(demoExample));
    // Ensure type is set
    section.type = type;
    return section;
  }

  // Fallback: create minimal section if no demo example exists
  const defaultColumns = def.rendering?.defaultColumns || 1;
  return {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
    type: type,
    description: def.description || `Demo section for ${type}`,
    preferredColumns: defaultColumns,
  };
}

/**
 * Generate comprehensive demo example card with all sections
 */
function generateDemoExample(sections, registry) {
  const publicSections = Object.entries(sections).filter(([_, def]) => !def.isInternal);

  const demoCard = {
    cardTitle: 'All Sections Demo',
    description: 'Comprehensive demonstration of all available section types in OSI Cards',
    sections: publicSections.map(([type, def]) => generateDemoExampleSection(type, def)),
    actions: [
      {
        label: 'Learn More',
        type: 'website',
        variant: 'primary',
        icon: '🌐',
        url: 'https://example.com',
      },
    ],
  };

  return demoCard;
}

/**
 * Generate doc example for a section type (minimal one-entry)
 */
function generateDocExampleSection(type, def) {
  const defaultColumns = def.rendering?.defaultColumns || 1;
  const getPriority = (sectionType) => {
    if (['overview', 'contact-card'].includes(sectionType)) return 1;
    if (['analytics', 'chart', 'financials'].includes(sectionType)) return 2;
    return 3;
  };
  const priority = getPriority(type);

  // Determine data structure
  const usesFields = def.rendering?.usesFields;
  const usesItems = def.rendering?.usesItems && !def.rendering.usesFields;
  const usesChartData = def.rendering?.usesChartData;

  // Get doc example (preferred), or fallback to creating minimal from demo/example
  let docExample = def.examples?.doc;

  // If no doc example exists, create minimal version from demo/example
  if (!docExample) {
    const demoExample = def.examples?.demo || def.examples?.example || def.examples?.complete;
    if (demoExample) {
      // Create minimal version from demo example
      docExample = JSON.parse(JSON.stringify(demoExample));
    } else {
      docExample = { title: type, type };
    }
  }

  const example = docExample;

  // Create base section
  const section = {
    title: example.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
    type: type,
    description: example.description || def.description || `Single ${type} entry.`,
    preferredColumns: defaultColumns,
    priority: priority,
  };

  if (usesChartData) {
    // Chart section: exactly 1 label and 1 dataset with 1 non-zero value
    section.chartType = example.chartType || 'bar';
    section.chartData = {
      labels: ['FY2025'],
      datasets: [
        {
          label: example.chartData?.datasets?.[0]?.label || 'Value',
          data: [45500], // Non-zero value
        },
      ],
    };
  } else if (usesItems) {
    // Item-based section: exactly 1 item
    if (example.items && example.items.length > 0) {
      // Take first item and ensure it's valid
      let item = JSON.parse(JSON.stringify(example.items[0]));
      // Remove any invalid values
      Object.keys(item).forEach((key) => {
        if (
          item[key] === null ||
          item[key] === '' ||
          item[key] === 0 ||
          item[key] === 0.0 ||
          (typeof item[key] === 'string' &&
            (item[key] === '0' || item[key] === '0%' || item[key] === '0k€' || item[key] === '€0'))
        ) {
          delete item[key];
        }
      });
      // Ensure item has at least title
      if (!item.title) item.title = example.title || `Sample ${type} item`;
      if (!item.description && item.description !== '')
        item.description = def.description || `Description for ${type} item`;
      section.items = [item];
    } else {
      // Generate minimal item
      section.items = [
        {
          title: example.title || `Sample ${type} item`,
          description: def.description || `Description for ${type} item`,
        },
      ];
    }
  } else {
    // Field-based section: exactly 1 field
    if (example.fields && example.fields.length > 0) {
      // Take first field and ensure it's valid
      let field = JSON.parse(JSON.stringify(example.fields[0]));
      // Remove any invalid values
      Object.keys(field).forEach((key) => {
        if (
          field[key] === null ||
          field[key] === '' ||
          field[key] === 0 ||
          field[key] === 0.0 ||
          (typeof field[key] === 'string' &&
            (field[key] === '0' ||
              field[key] === '0%' ||
              field[key] === '0k€' ||
              field[key] === '€0'))
        ) {
          delete field[key];
        }
      });
      // Ensure field has at least label and value
      if (!field.label)
        field.label = example.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Field`;
      if (!field.value && field.value !== 0) field.value = 'Sample value';
      section.fields = [field];
    } else {
      // Generate minimal field based on section type
      const defaultField = {
        label: example.title || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        value: def.description || `Sample ${type} value`,
      };
      section.fields = [defaultField];
    }
  }

  // Special handling for specific section types that might need meta or other properties
  if (type === 'table' && example.meta?.tableData) {
    section.meta = {
      tableData: {
        columns: example.meta.tableData.columns?.slice(0, 2) || [
          { key: 'column1', label: 'Column 1', type: 'string', sortable: true },
        ],
        rows: example.meta.tableData.rows?.slice(0, 1) || [{ column1: 'Value' }],
      },
    };
  }

  if (type === 'text-reference' && example.meta?.url) {
    section.meta = { url: example.meta.url };
  }

  return section;
}

/**
 * Generate doc example card (minimal one-entry per section)
 */
function generateDocExample(sections, registry) {
  // Generate doc example with all section types, each with exactly one entry
  const publicSections = Object.entries(sections).filter(([_, def]) => !def.isInternal);

  const docExample = {
    cardTitle: '{{CARD_TITLE}}',
    description: '{{CONTEXT}}',
    sections: publicSections.map(([type, def]) => generateDocExampleSection(type, def)),
    actions: [
      {
        label: 'Generate Presentation',
        type: 'agent',
        variant: 'primary',
        icon: '📊',
        agentId: '{{AGENT_ID}}',
      },
      {
        label: 'Write Email',
        type: 'mail',
        variant: 'primary',
        icon: '✉️',
        email: {
          subject: '{{EMAIL_SUBJECT}}',
          body: '{{EMAIL_BODY}}',
          contact: {
            name: '{{EMAIL_CONTACT_NAME}}',
            email: '{{EMAIL_CONTACT_ADDRESS}}',
            role: '{{EMAIL_CONTACT_ROLE}}',
          },
        },
      },
      {
        label: 'Learn More',
        type: 'website',
        variant: 'primary',
        icon: '🌐',
        url: '{{WEBSITE_URL}}',
      },
    ],
  };

  return docExample;
}

/**
 * Generate the complete LLM system prompt
 */
function generateLLMPrompt(registry) {
  const { sections, typeAliases = {} } = registry;
  const sectionCount = Object.keys(sections).filter((k) => !sections[k].isInternal).length;

  const sectionTypesList = Object.keys(sections)
    .filter((k) => !sections[k].isInternal)
    .join(', ');

  const docExample = generateDocExample(sections, registry);

  // Clean HTML entities from example
  const cleanExampleFn = (ex) => {
    if (!ex) return ex;
    const str = JSON.stringify(ex);
    const cleaned = str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      return ex;
    }
  };

  const cleanExampleData = cleanExampleFn(docExample);

  return `You are a JSON generator for OSI Cards. Output MUST be a single valid JSON object only (no markdown, no explanations, no code blocks).

AICardConfig REQUIREMENTS:
Root JSON object MUST include:
"cardTitle": string (required)
"sections": array (required)
Optional root keys: "description", "actions"
Do NOT output "cardType" (feature removed).

GLOBAL VALIDATION RULES (STRICT):
Currency format: ALWAYS "45,500k€" (comma thousands separator, suffix k€, no leading €).
Never output any invalid values anywhere:
null, "", [], {}, 0, 0.0, 0%, "0k€", "€0"
"N/A", "not available", "unknown", "TBD", "pending"
If a value is invalid, omit that entire field/item (do not output placeholders).

SECTION RULES:
Every section MUST have "title" and "type".
A section MUST contain exactly ONE container: "fields" OR "items" OR "chartData" (never mix).
Field-based types use "fields": analytics, brand-colors, contact-card, event, fallback, financials, info, overview, product, quotation, social-media, solutions, text-reference, table, map.
Item-based types use "items": faq, gallery, list, network-card, news, timeline, video.
Chart type uses ONLY "chartData" (recommended: also provide "chartType": bar|line|pie|doughnut).

LAYOUT RULES:
priority must be 1, 2, or 3 only.
preferredColumns/minColumns/maxColumns must be 1–4 only.
Do not include component-specific keys (componentPath, selector, stylePath).

ACTIONS RULES:
Include "actions" with exactly 3 entries:
type "agent" with agentId
type "mail" with email.subject, email.body, and email.contact { name, email, role }
type "website" with url
For every action: include label, type, variant, icon.
Do not include empty objects or empty strings in actions.

TASK INPUT:
Card title: {{CARD_TITLE}}
Context: {{CONTEXT}}
Website URL for Learn More: {{WEBSITE_URL}}
Agent ID for presentation: {{AGENT_ID}}
Email subject: {{EMAIL_SUBJECT}}
Email body: {{EMAIL_BODY}}
Email contact name: {{EMAIL_CONTACT_NAME}}
Email contact address: {{EMAIL_CONTACT_ADDRESS}}
Email contact role: {{EMAIL_CONTACT_ROLE}}
AVAILABLE SECTIONS (PICK AND CHOOSE - select only relevant ones from context):
You may include any of these section types, but ONLY include sections that have relevant data in the context. Do not include sections just to fill space - only include sections where you have valid, meaningful data to populate. You are NOT required to include all section types - pick only the ones that match your context data.

${sectionTypesList}

IMPORTANT: Select sections based on available context data. Include sections where you have valid information to display. Skip sections that don't have relevant data in the context.

Per-section content requirement:
For fields sections: fields array must contain ALL available FieldItem objects from the context. Include multiple fields when data is available - do not limit to just one entry.
For items sections: items array must contain ALL available ItemObject entries from the context. Include multiple items when data is available - do not limit to just one entry.
For chart sections: chartData should include all relevant data points. Include multiple labels and datasets when appropriate - do not limit to just one data point.
CRITICAL: Generate multiple entries per section when the context provides multiple valid data points. The example below shows minimal structure (1 entry per section), but you should populate ALL available valid data from the context.

OUTPUT:

Return ONLY the final JSON object.

EXAMPLE (covers ALL section types + actions; structure reference only; do not copy verbatim):

${JSON.stringify(cleanExampleData, null, 2)}`;
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
    generated: new Date().toISOString(),
  };
}

/**
 * Generate the markdown documentation file
 */
function generateMarkdown(prompt, registry, stats) {
  const sectionCount = Object.keys(registry.sections).filter(
    (k) => !registry.sections[k].isInternal
  ).length;
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
    generateDemoExample,
    generateDocExample,
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
  console.log(
    `   - Section Types: ${Object.keys(registry.sections).filter((k) => !registry.sections[k].isInternal).length}`
  );
  console.log(`   - Type Aliases: ${Object.keys(registry.typeAliases || {}).length}`);
  console.log(`   - Characters: ${stats.characters}`);
  console.log(`   - Estimated Tokens: ${stats.estimatedTokens}`);
}

// Run only if called directly (not when required as module)
if (require.main === module) {
  main();
}
