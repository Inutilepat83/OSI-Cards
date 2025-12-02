#!/usr/bin/env node

/**
 * Auto-Build Section Registry
 *
 * Automatically compiles section-registry.json from individual section definition files.
 * This makes section-registry.json a GENERATED file, ensuring it's always in sync with sections.
 *
 * Usage:
 *   node scripts/build-section-registry.js
 *   node scripts/build-section-registry.js --verify  (check only, don't write)
 */

const fs = require('fs');
const path = require('path');
const { discoverSections, ROOT_DIR } = require('./discover-sections');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

// Output path
const REGISTRY_OUTPUT = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

/**
 * Build section registry from discovered sections
 */
function buildRegistry(sections) {
  const registry = {
    "$schema": "./section-registry.schema.json",
    "version": "2.0.0",
    "description": "Single source of truth for all OSI Cards section types - compiled from individual section definition files",
    "generatedAt": new Date().toISOString(),
    "sections": {}
  };

  for (const section of sections) {
    const def = section.definition;

    // Build component path relative to lib root
    const relativePath = path.relative(
      path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src'),
      section.componentFile
    ).replace(/\.ts$/, '');

    registry.sections[section.type] = {
      // Core metadata
      name: def.name,
      description: def.description,
      componentPath: `./${relativePath}`,
      selector: def.selector || `lib-${section.folderName}`,

      // Use cases and best practices
      useCases: def.useCases || [],
      bestPractices: def.bestPractices || [],

      // Rendering configuration
      rendering: def.rendering || {
        usesFields: false,
        usesItems: false,
        defaultColumns: 1,
        supportsCollapse: true,
        supportsEmoji: true
      },

      // Schema
      ...(def.fieldSchema && { fieldSchema: def.fieldSchema }),
      ...(def.itemSchema && { itemSchema: def.itemSchema }),

      // Aliases
      ...(def.aliases && { aliases: def.aliases }),

      // Test fixtures
      ...(def.testFixtures && { testFixtures: def.testFixtures }),

      // Additional metadata
      ...(def.meta && { meta: def.meta }),
      ...(def.examples && { examples: def.examples }),
      ...(def.dependencies && { dependencies: def.dependencies }),
    };
  }

  return registry;
}

/**
 * Main execution
 */
function main() {
  const verifyOnly = process.argv.includes('--verify');

  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Building Section Registry', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  // Discover sections
  log('\n🔍 Discovering sections...', colors.blue);
  const sections = discoverSections();
  log(`✅ Found ${sections.length} sections`, colors.green);

  // Build registry
  log('\n📋 Building registry...', colors.blue);
  const registry = buildRegistry(sections);

  const sectionCount = Object.keys(registry.sections).length;
  log(`✅ Registry compiled with ${sectionCount} sections`, colors.green);

  if (verifyOnly) {
    log('\n✓ Verification complete (no files written)', colors.dim);
    log('\nRegistry preview:', colors.dim);
    console.log(JSON.stringify(registry, null, 2).substring(0, 500) + '...');
    return;
  }

  // Write registry file
  log('\n📝 Writing section-registry.json...', colors.blue);
  fs.writeFileSync(REGISTRY_OUTPUT, JSON.stringify(registry, null, 2) + '\n');

  const relativePath = path.relative(ROOT_DIR, REGISTRY_OUTPUT);
  log(`✅ Registry written to: ${relativePath}`, colors.green);

  // Print summary
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Summary', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
  log(`\n📊 Sections processed: ${sections.length}`);
  log(`📊 Registry entries: ${sectionCount}`);
  log(`📄 Output file: ${relativePath}\n`);

  // List all section types
  log('Section types registered:', colors.dim);
  const types = Object.keys(registry.sections).sort();
  types.forEach(type => {
    log(`  - ${type}`, colors.dim);
  });

  log('\n✅ Section registry build complete!', colors.green + colors.bright);
}

// Run if called directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

module.exports = { buildRegistry };

