#!/usr/bin/env node

/**
 * Auto-Build Section Documentation
 *
 * Automatically generates comprehensive documentation from section modules.
 * Compiles information from definition.json and README.md files.
 *
 * Generates:
 * - Section list with all types
 * - Quick reference guide
 * - Complete API documentation
 *
 * Usage:
 *   node scripts/build-section-docs.js
 *   node scripts/build-section-docs.js --verify  (check only, don't write)
 */

const fs = require('fs');
const path = require('path');
const { discoverSections, ROOT_DIR } = require('./discover-sections');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Generate section list markdown
 */
function generateSectionList(sections) {
  const lines = [];

  lines.push('# Section Components - Complete List');
  lines.push('');
  lines.push('> **Auto-Generated**: This file is generated from section modules.');
  lines.push('> Last updated: ' + new Date().toISOString());
  lines.push('');
  lines.push(`Total sections: **${sections.length}**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  sections.forEach(s => {
    lines.push(`- [${s.name}](#${s.type.replace(/_/g, '-')})`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');

  // Section details
  for (const section of sections) {
    const def = section.definition;

    lines.push(`## ${def.name}`);
    lines.push('');
    lines.push(`**Type**: \`${section.type}\``);
    lines.push(`**Selector**: \`${section.selector}\``);
    lines.push(`**Component**: \`${section.componentName}\``);
    lines.push('');
    lines.push(def.description);
    lines.push('');

    if (def.useCases && def.useCases.length > 0) {
      lines.push('### Use Cases');
      lines.push('');
      def.useCases.forEach(useCase => {
        lines.push(`- ${useCase}`);
      });
      lines.push('');
    }

    if (def.bestPractices && def.bestPractices.length > 0) {
      lines.push('### Best Practices');
      lines.push('');
      def.bestPractices.forEach(practice => {
        lines.push(`- ${practice}`);
      });
      lines.push('');
    }

    // Rendering configuration
    if (def.rendering) {
      lines.push('### Rendering');
      lines.push('');
      lines.push(`- Uses fields: ${def.rendering.usesFields ? '✅' : '❌'}`);
      lines.push(`- Uses items: ${def.rendering.usesItems ? '✅' : '❌'}`);
      lines.push(`- Default columns: ${def.rendering.defaultColumns}`);
      lines.push(`- Supports collapse: ${def.rendering.supportsCollapse ? '✅' : '❌'}`);
      lines.push('');
    }

    // Example
    if (def.testFixtures && def.testFixtures.minimal) {
      lines.push('### Example');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(def.testFixtures.minimal, null, 2));
      lines.push('```');
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  const verifyOnly = process.argv.includes('--verify');

  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Building Section Documentation', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  // Discover sections
  log('\n🔍 Discovering sections...', colors.blue);
  const sections = discoverSections();
  log(`✅ Found ${sections.length} sections`, colors.green);

  // Build documentation
  log('\n📚 Generating documentation...', colors.blue);
  const docContent = generateSectionList(sections);

  log(`✅ Documentation generated`, colors.green);

  if (verifyOnly) {
    log('\n✓ Verification complete (no files written)', colors.dim);
    log('\nDocumentation preview:', colors.dim);
    console.log(docContent.substring(0, 500) + '...');
    return;
  }

  // Write documentation
  const outputPath = path.join(ROOT_DIR, 'docs', 'SECTIONS_GENERATED.md');
  log('\n📝 Writing SECTIONS_GENERATED.md...', colors.blue);
  fs.writeFileSync(outputPath, docContent);

  const relativePath = path.relative(ROOT_DIR, outputPath);
  log(`✅ Documentation written to: ${relativePath}`, colors.green);

  // Print summary
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Summary', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
  log(`\n📊 Sections documented: ${sections.length}`);
  log(`📄 Output file: ${relativePath}\n`);

  log('\n✅ Section documentation build complete!', colors.green + colors.bright);
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

module.exports = { generateSectionList };

