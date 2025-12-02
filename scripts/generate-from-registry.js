#!/usr/bin/env node

/**
 * Master Registry Generation Script
 *
 * This script is the single entry point for generating all derived artifacts
 * from the section-registry.json. It ensures consistency across:
 * - TypeScript types (CardSection.type union)
 * - Section component map
 * - Style imports bundle
 * - Documentation
 * - Test fixtures
 * - Demo card (all-components.json)
 * - OpenAPI schema
 *
 * Usage: node scripts/generate-from-registry.js [--types] [--docs] [--tests] [--styles] [--demo] [--all]
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const LIB_SRC = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'═'.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
}

/**
 * Load and validate the registry
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry not found at: ${REGISTRY_PATH}`);
  }

  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(content);

  if (!registry.version || !registry.sections) {
    throw new Error('Invalid registry format: missing version or sections');
  }

  return registry;
}

/**
 * Get all section types (excluding internal ones for public API)
 */
function getPublicSectionTypes(registry) {
  return Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal)
    .map(([type]) => type);
}

/**
 * Get all section types including internal ones
 */
function getAllSectionTypes(registry) {
  return Object.keys(registry.sections);
}

/**
 * Generate TypeScript types from registry
 */
function generateTypes(registry) {
  logSection('Generating TypeScript Types');

  const outputPath = path.join(LIB_SRC, 'lib', 'models', 'generated-section-types.ts');

  const publicTypes = getPublicSectionTypes(registry);
  const allTypes = getAllSectionTypes(registry);
  const aliases = registry.typeAliases || {};

  // Build type union
  const typeUnion = allTypes.map(t => `'${t}'`).join('\n  | ');
  const aliasUnion = Object.keys(aliases).map(t => `'${t}'`).join('\n  | ');

  // Build section metadata map
  const metadataEntries = Object.entries(registry.sections).map(([type, def]) => {
    return `  '${type}': {
    name: '${def.name}',
    usesFields: ${def.rendering.usesFields},
    usesItems: ${def.rendering.usesItems},
    usesChartData: ${def.rendering.usesChartData || false},
    defaultColumns: ${def.rendering.defaultColumns},
    supportsCollapse: ${def.rendering.supportsCollapse || false},
    supportsEmoji: ${def.rendering.supportsEmoji || false},
    requiresExternalLib: ${def.rendering.requiresExternalLib ? `'${def.rendering.requiresExternalLib}'` : 'undefined'},
    selector: '${def.selector}',
  }`;
  }).join(',\n');

  // Build alias map
  const aliasEntries = Object.entries(aliases).map(([alias, target]) => {
    return `  '${alias}': '${target}'`;
  }).join(',\n');

  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:from-registry
 */

/**
 * All valid section type identifiers
 */
export type SectionType =
  | ${typeUnion};

/**
 * Section type aliases (alternative names that resolve to canonical types)
 */
export type SectionTypeAlias =
  | ${aliasUnion || "'never'"};

/**
 * All accepted section type values (canonical + aliases)
 */
export type SectionTypeInput = SectionType | SectionTypeAlias;

/**
 * Section metadata for runtime use
 */
export interface SectionMetadata {
  name: string;
  usesFields: boolean;
  usesItems: boolean;
  usesChartData: boolean;
  defaultColumns: number;
  supportsCollapse: boolean;
  supportsEmoji: boolean;
  requiresExternalLib: string | undefined;
  selector: string;
}

/**
 * Metadata map for all section types
 */
export const SECTION_METADATA: Record<SectionType, SectionMetadata> = {
${metadataEntries}
};

/**
 * Map of type aliases to canonical types
 */
export const SECTION_TYPE_ALIASES: Record<SectionTypeAlias, SectionType> = {
${aliasEntries}
};

/**
 * Resolve a section type input to its canonical type
 */
export function resolveSectionType(type: SectionTypeInput): SectionType {
  if (type in SECTION_TYPE_ALIASES) {
    return SECTION_TYPE_ALIASES[type as SectionTypeAlias];
  }
  return type as SectionType;
}

/**
 * Check if a string is a valid section type
 */
export function isValidSectionType(type: string): type is SectionTypeInput {
  return type in SECTION_METADATA || type in SECTION_TYPE_ALIASES;
}

/**
 * Get metadata for a section type
 */
export function getSectionMetadata(type: SectionTypeInput): SectionMetadata | undefined {
  const resolved = resolveSectionType(type);
  return SECTION_METADATA[resolved];
}

/**
 * All public section types (excluding internal ones)
 */
export const PUBLIC_SECTION_TYPES: SectionType[] = [
  ${publicTypes.map(t => `'${t}'`).join(',\n  ')}
];

/**
 * All section types (including internal)
 */
export const ALL_SECTION_TYPES: SectionType[] = [
  ${allTypes.map(t => `'${t}'`).join(',\n  ')}
];
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  log(`  ✓ Generated ${outputPath}`, colors.green);
  log(`    - ${allTypes.length} section types`, colors.blue);
  log(`    - ${Object.keys(aliases).length} type aliases`, colors.blue);

  return { outputPath, typesCount: allTypes.length };
}

/**
 * Generate the section component map for dynamic loading
 */
function generateComponentMap(registry) {
  logSection('Generating Component Map');

  const outputPath = path.join(LIB_SRC, 'lib', 'components', 'section-renderer', 'section-component-map.generated.ts');

  const imports = [];
  const mapEntries = [];

  Object.entries(registry.sections).forEach(([type, def]) => {
    // Remove both 'lib-' and 'app-' prefixes from selector to get component name
    const componentName = def.selector
      .replace('lib-', '')
      .replace('app-', '')
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Component';

    // Extract just the component file name from the path
    const componentPath = def.componentPath;
    const componentFile = path.basename(componentPath);
    const componentDir = path.basename(path.dirname(componentPath));

    // Build proper relative import path
    let importPath;
    if (componentDir === 'sections') {
      // Component is directly in sections folder (e.g., info-section.component.ts)
      importPath = `../sections/${componentFile}`;
    } else {
      // Component is in a subfolder (e.g., analytics-section/analytics-section.component.ts)
      importPath = `../sections/${componentDir}/${componentFile}`;
    }

    imports.push(`import { ${componentName} } from '${importPath}';`);
    mapEntries.push(`  '${type}': ${componentName}`);
  });

  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:from-registry
 */

import { Type } from '@angular/core';
import { BaseSectionComponent } from '../sections/base-section.component';
import { SectionType } from '../../models/generated-section-types';

${imports.join('\n')}

/**
 * Map of section types to their component classes
 * Used for dynamic component resolution
 * Note: Using \`any\` for field type to allow specialized section field types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SECTION_COMPONENT_MAP: Record<SectionType, Type<BaseSectionComponent<any>>> = {
${mapEntries.join(',\n')}
};

/**
 * Get the component class for a section type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSectionComponent(type: SectionType): Type<BaseSectionComponent<any>> {
  return SECTION_COMPONENT_MAP[type];
}
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  log(`  ✓ Generated ${outputPath}`, colors.green);
  log(`    - ${Object.keys(registry.sections).length} component mappings`, colors.blue);

  return { outputPath };
}

/**
 * Generate style imports bundle
 */
function generateStyleBundle(registry) {
  logSection('Generating Style Bundle');

  const outputPath = path.join(LIB_SRC, 'lib', 'styles', 'components', 'sections', '_section-types.generated.scss');

  const imports = Object.entries(registry.sections)
    .filter(([_, def]) => def.stylePath)
    .map(([type, def]) => {
      // Import from section folder using relative path
      // From: lib/styles/components/sections/
      // To:   lib/components/sections/[section-name]/[section-name].scss
      const fileName = path.basename(def.stylePath);
      const relativePath = `../../../components/sections/${type}-section/${fileName}`;
      return `@import '${relativePath}'; // ${type}`;
    });

  const content = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from section-registry.json
// Run: npm run generate:from-registry
//
// Imports section SCSS files from their section folders.
// Each section can inherit from design-system and add custom styles.

// Section type styles - imported from section folders
${imports.join('\n')}
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  log(`  ✓ Generated ${outputPath}`, colors.green);
  log(`    - ${imports.length} style imports`, colors.blue);

  return { outputPath };
}

/**
 * Generate test fixtures from registry
 */
function generateTestFixtures(registry) {
  logSection('Generating Test Fixtures');

  const outputDir = path.join(ROOT_DIR, 'src', 'assets', 'configs', 'generated');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate complete fixtures
  const completeSections = Object.entries(registry.sections)
    .filter(([_, def]) => def.testFixtures?.complete)
    .map(([_, def]) => def.testFixtures.complete);

  const completeCard = {
    cardTitle: 'All Sections Demo - Complete',
    cardSubtitle: 'Generated from section-registry.json',
    description: 'Complete example with all section types',
    sections: completeSections,
    actions: [
      { label: 'Learn More', type: 'website', variant: 'primary', icon: '🌐', url: 'https://example.com' },
      { label: 'Contact', type: 'mail', variant: 'secondary', icon: '📧', email: { contact: { name: 'Support', email: 'support@example.com', role: 'Support' }, subject: 'Inquiry', body: 'Hello' } }
    ]
  };

  // Generate minimal fixtures
  const minimalSections = Object.entries(registry.sections)
    .filter(([_, def]) => def.testFixtures?.minimal)
    .map(([_, def]) => def.testFixtures.minimal);

  const minimalCard = {
    cardTitle: 'All Sections Demo - Minimal',
    sections: minimalSections
  };

  // Generate edge case fixtures
  const edgeCaseSections = Object.entries(registry.sections)
    .filter(([_, def]) => def.testFixtures?.edgeCases)
    .map(([_, def]) => def.testFixtures.edgeCases);

  const edgeCaseCard = {
    cardTitle: 'All Sections Demo - Edge Cases',
    sections: edgeCaseSections
  };

  // Write files
  const files = [
    { name: 'all-sections-complete.json', data: completeCard },
    { name: 'all-sections-minimal.json', data: minimalCard },
    { name: 'all-sections-edge-cases.json', data: edgeCaseCard },
  ];

  files.forEach(({ name, data }) => {
    fs.writeFileSync(
      path.join(outputDir, name),
      JSON.stringify(data, null, 2),
      'utf8'
    );
    log(`  ✓ Generated ${name}`, colors.green);
  });

  // Generate manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    generatedFrom: 'section-registry.json',
    registryVersion: registry.version,
    sectionTypes: Object.keys(registry.sections),
    files: files.map(f => f.name)
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  log(`  ✓ Generated manifest.json`, colors.green);

  return { outputDir, filesCount: files.length };
}

/**
 * Generate TypeScript fixtures from registry (fixtures.generated.ts)
 * This replaces manual fixture definitions with registry-sourced data
 */
function generateTsFixtures(registry) {
  logSection('Generating TypeScript Fixtures');

  const outputPath = path.join(LIB_SRC, 'lib', 'registry', 'fixtures.generated.ts');

  // Build complete fixtures object
  const completeSections = [];
  const minimalSections = [];
  const edgeCaseSections = [];
  const sectionTypes = [];

  Object.entries(registry.sections).forEach(([type, def]) => {
    if (def.isInternal) return; // Skip internal sections like fallback

    sectionTypes.push(type);

    if (def.testFixtures?.complete) {
      completeSections.push({ type, fixture: { id: type + '-complete', ...def.testFixtures.complete } });
    }
    if (def.testFixtures?.minimal) {
      minimalSections.push({ type, fixture: { id: type + '-minimal', ...def.testFixtures.minimal } });
    }
    if (def.testFixtures?.edgeCases) {
      edgeCaseSections.push({ type, fixture: { id: type + '-edge', ...def.testFixtures.edgeCases } });
    }
  });

  // Build fixtures JSON
  const completeFixturesObj = Object.fromEntries(
    completeSections.map(({ type, fixture }) => [type, fixture])
  );
  const minimalFixturesObj = Object.fromEntries(
    minimalSections.map(({ type, fixture }) => [type, fixture])
  );
  const edgeCaseFixturesObj = Object.fromEntries(
    edgeCaseSections.map(({ type, fixture }) => [type, fixture])
  );

  // Build SECTION_FIXTURES entries
  const sectionFixturesEntries = sectionTypes.map(type => {
    return "  '" + type + "': {\n" +
           "    complete: COMPLETE_FIXTURES['" + type + "']!,\n" +
           "    minimal: MINIMAL_FIXTURES['" + type + "']!,\n" +
           "    edgeCase: EDGE_CASE_FIXTURES['" + type + "'] || MINIMAL_FIXTURES['" + type + "']!\n" +
           "  }";
  }).join(',\n');

  const generatedAt = new Date().toISOString();

  const content = `/**
 * Generated Registry Fixtures
 *
 * Auto-generated section fixtures from the section registry.
 * This file provides sample data for testing and documentation.
 *
 * DO NOT EDIT MANUALLY - regenerate with \`npm run generate:from-registry\`
 *
 * Source: Individual *.definition.json files in section folders
 * Generated: ${generatedAt}
 */

import type { AICardConfig, CardSection } from '../models/card.model';

// ============================================================================
// TYPES
// ============================================================================

export type FixtureCategory = 'complete' | 'minimal' | 'edge-case';

export interface SectionFixtures {
  complete: CardSection;
  minimal: CardSection;
  edgeCase: CardSection;
}

// ============================================================================
// COMPLETE FIXTURES (Rich examples from definition files)
// ============================================================================

export const COMPLETE_FIXTURES: Record<string, CardSection> = ${JSON.stringify(completeFixturesObj, null, 2)};

// ============================================================================
// MINIMAL FIXTURES (Basic examples)
// ============================================================================

export const MINIMAL_FIXTURES: Record<string, CardSection> = ${JSON.stringify(minimalFixturesObj, null, 2)};

// ============================================================================
// EDGE CASE FIXTURES (Testing edge cases)
// ============================================================================

export const EDGE_CASE_FIXTURES: Record<string, CardSection> = ${JSON.stringify(edgeCaseFixturesObj, null, 2)};

// ============================================================================
// SECTION FIXTURES COMBINED
// ============================================================================

export const SECTION_FIXTURES: Record<string, SectionFixtures> = {
${sectionFixturesEntries}
};

// ============================================================================
// SAMPLE CARDS (Built from fixtures)
// ============================================================================

export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Nexus Technologies Inc.',
  cardType: 'company',
  sections: [
    COMPLETE_FIXTURES['info']!,
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
    COMPLETE_FIXTURES['financials']!,
  ].filter(Boolean),
  actions: [
    { id: 'view', label: 'View Details', variant: 'primary' },
    { id: 'contact', label: 'Contact', variant: 'secondary' },
  ],
};

export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Performance Dashboard',
  cardType: 'analytics',
  sections: [
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
  ].filter(Boolean),
};

export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest Updates',
  cardType: 'news',
  sections: [COMPLETE_FIXTURES['news']!].filter(Boolean),
};

export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'Complete Card Example',
  sections: Object.values(COMPLETE_FIXTURES),
};

export const MINIMAL_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'minimal-all-sections',
  cardTitle: 'Minimal Card',
  sections: Object.values(MINIMAL_FIXTURES),
};

export const EDGE_CASE_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'edge-case-all-sections',
  cardTitle: 'Edge Case Card',
  sections: Object.values(EDGE_CASE_FIXTURES),
};

export const SAMPLE_CARDS = {
  company: SAMPLE_COMPANY_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
  allSections: ALL_SECTIONS_CARD,
};

// ============================================================================
// FIXTURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a fixture for a specific section type and category
 */
export function getFixture(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixtures = SECTION_FIXTURES[sectionType];
  if (!fixtures) return undefined;

  switch (category) {
    case 'complete': return fixtures.complete;
    case 'minimal': return fixtures.minimal;
    case 'edge-case': return fixtures.edgeCase;
    default: return fixtures.complete;
  }
}

/**
 * Get all fixtures for a section type
 */
export function getAllFixtures(sectionType: string): SectionFixtures | undefined {
  return SECTION_FIXTURES[sectionType];
}

/**
 * Get a fixture with a unique ID generated
 */
export function getFixtureWithUniqueId(sectionType: string, category: FixtureCategory = 'complete'): CardSection | undefined {
  const fixture = getFixture(sectionType, category);
  if (!fixture) return undefined;

  return {
    ...fixture,
    id: \`\${fixture.id}-\${Date.now()}-\${Math.random().toString(36).slice(2, 9)}\`,
  };
}

/**
 * Get list of available section types
 */
export function getAvailableSectionTypes(): string[] {
  return Object.keys(SECTION_FIXTURES);
}
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  log(`  ✓ Generated ${outputPath}`, colors.green);
  log(`    - ${sectionTypes.length} section types`, colors.blue);
  log(`    - ${completeSections.length} complete fixtures`, colors.blue);
  log(`    - ${minimalSections.length} minimal fixtures`, colors.blue);
  log(`    - ${edgeCaseSections.length} edge case fixtures`, colors.blue);

  return { outputPath, sectionCount: sectionTypes.length };
}

/**
 * Generate the all-components.json demo card used by the home page
 * This ensures the "All Sections Demo" always includes every section type
 */
function generateAllComponentsCard(registry) {
  logSection('Generating All Components Demo Card');

  const outputDir = path.join(ROOT_DIR, 'src', 'assets', 'configs', 'all');
  const outputPath = path.join(outputDir, 'all-components.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all public section types (exclude internal like 'fallback')
  const publicSections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal && def.testFixtures?.complete)
    .map(([_, def]) => def.testFixtures.complete);

  const sectionCount = publicSections.length;

  const allComponentsCard = {
    cardTitle: 'All Sections Demo',
    cardSubtitle: 'Complete Component Showcase',
    cardType: 'company',
    description: 'This card demonstrates all available section types in the OSI Cards library',
    sections: publicSections,
    actions: [
      { label: 'Learn More', type: 'website', variant: 'primary', icon: '🌐', url: 'https://example.com' }
    ]
  };

  fs.writeFileSync(
    outputPath,
    JSON.stringify(allComponentsCard, null, 2) + '\n',
    'utf8'
  );

  log(`  ✓ Generated all-components.json`, colors.green);
  log(`    - ${sectionCount} section types included`, colors.blue);
  log(`    - Excludes internal sections (fallback)`, colors.blue);

  return { outputPath, sectionCount };
}

/**
 * Generate public-api exports
 */
function generatePublicApi(registry) {
  logSection('Generating Public API Exports');

  const outputPath = path.join(LIB_SRC, 'lib', 'models', 'index.ts');

  // Read existing file to preserve manual exports
  let existingContent = '';
  if (fs.existsSync(outputPath)) {
    existingContent = fs.readFileSync(outputPath, 'utf8');
  }

  // Check if we need to add the generated types export
  const exportLine = "export * from './generated-section-types';";

  if (!existingContent.includes(exportLine)) {
    const newContent = existingContent.trim() + '\n\n// Auto-generated section types\n' + exportLine + '\n';
    fs.writeFileSync(outputPath, newContent, 'utf8');
    log(`  ✓ Updated ${outputPath}`, colors.green);
  } else {
    log(`  ✓ ${outputPath} already includes generated types`, colors.blue);
  }

  return { outputPath };
}

/**
 * Validate registry against schema
 */
function validateRegistry(registry) {
  logSection('Validating Registry');

  let errors = [];
  let warnings = [];

  // Check required fields for each section
  Object.entries(registry.sections).forEach(([type, def]) => {
    if (!def.name) errors.push(`Section '${type}' missing 'name'`);
    if (!def.description) errors.push(`Section '${type}' missing 'description'`);
    if (!def.componentPath) errors.push(`Section '${type}' missing 'componentPath'`);
    if (!def.selector) errors.push(`Section '${type}' missing 'selector'`);
    if (!def.rendering) errors.push(`Section '${type}' missing 'rendering'`);

    // Check component file exists
    const componentFile = path.join(LIB_SRC, def.componentPath + '.ts');
    if (!fs.existsSync(componentFile)) {
      warnings.push(`Component file not found for '${type}': ${componentFile}`);
    }

    // Note: Styles are in unified bundles, not per-section files
    // The _sections-base.scss and _unified-sections-final.scss contain all styles

    // Check test fixtures
    if (!def.testFixtures) {
      warnings.push(`Section '${type}' missing 'testFixtures'`);
    }
  });

  // Check aliases point to valid types
  if (registry.typeAliases) {
    Object.entries(registry.typeAliases).forEach(([alias, target]) => {
      if (!registry.sections[target]) {
        errors.push(`Alias '${alias}' points to non-existent type '${target}'`);
      }
    });
  }

  // Report results
  if (errors.length > 0) {
    log(`\n  ❌ Validation errors:`, colors.red);
    errors.forEach(e => log(`     - ${e}`, colors.red));
  }

  if (warnings.length > 0) {
    log(`\n  ⚠️  Validation warnings:`, colors.yellow);
    warnings.forEach(w => log(`     - ${w}`, colors.yellow));
  }

  if (errors.length === 0) {
    log(`  ✓ Registry is valid`, colors.green);
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes('--all') || args.length === 0;

  log('\n🔧 OSI Cards Registry Generation', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);

  try {
    // Load registry
    const registry = loadRegistry();
    log(`\n📄 Loaded registry v${registry.version}`, colors.green);
    log(`   ${Object.keys(registry.sections).length} sections defined`, colors.blue);

    // Validate
    const validation = validateRegistry(registry);
    if (!validation.isValid) {
      log('\n❌ Registry validation failed. Fix errors before generating.', colors.red);
      process.exit(1);
    }

    // Generate artifacts
    if (runAll || args.includes('--types')) {
      generateTypes(registry);
    }

    if (runAll || args.includes('--components')) {
      generateComponentMap(registry);
    }

    if (runAll || args.includes('--styles')) {
      generateStyleBundle(registry);
    }

    if (runAll || args.includes('--tests')) {
      generateTestFixtures(registry);
    }

    if (runAll || args.includes('--fixtures')) {
      generateTsFixtures(registry);
    }

    if (runAll || args.includes('--api')) {
      generatePublicApi(registry);
    }

    // Always generate the all-components.json demo card
    // This ensures the home page demo stays in sync with the registry
    if (runAll || args.includes('--demo')) {
      generateAllComponentsCard(registry);
    }

    // Summary
    log('\n' + '═'.repeat(60), colors.cyan);
    log('✅ Generation complete!', colors.bright + colors.green);
    log('═'.repeat(60) + '\n', colors.cyan);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();

