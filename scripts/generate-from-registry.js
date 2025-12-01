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
    const componentName = def.selector
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
      const fileName = path.basename(def.stylePath);
      return `@import '${fileName}'; // ${type}`;
    });

  const content = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from section-registry.json
// Run: npm run generate:from-registry

// Section type styles - import all registered sections
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

    // Check style file exists
    if (def.stylePath) {
      const styleFile = path.join(LIB_SRC, def.stylePath);
      if (!fs.existsSync(styleFile)) {
        warnings.push(`Style file not found for '${type}': ${styleFile}`);
      }
    }

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

