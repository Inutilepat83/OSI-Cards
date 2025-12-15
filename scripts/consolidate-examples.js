#!/usr/bin/env node

/**
 * Consolidate Examples into Definition Files
 *
 * Moves all standalone {type}.example.json files into their corresponding
 * {type}.definition.json files under examples.complete, then removes the standalone files.
 *
 * Usage:
 *   node scripts/consolidate-examples.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Main consolidation process
 */
function main() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Consolidate Examples into Definition Files', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  if (!fs.existsSync(SECTIONS_DIR)) {
    log(`❌ Sections directory not found: ${SECTIONS_DIR}`, colors.red);
    process.exit(1);
  }

  const sectionFolders = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let consolidated = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of sectionFolders) {
    const sectionType = folder.replace('-section', '');
    const examplePath = path.join(SECTIONS_DIR, folder, `${sectionType}.example.json`);
    const definitionPath = path.join(SECTIONS_DIR, folder, `${sectionType}.definition.json`);

    log(`\n  Processing ${sectionType}...`, colors.blue);

    // Check if example file exists
    if (!fs.existsSync(examplePath)) {
      log(`  ⏭️  No example file found, skipping`, colors.yellow);
      skipped++;
      continue;
    }

    // Check if definition file exists
    if (!fs.existsSync(definitionPath)) {
      log(`  ⚠️  Definition file not found: ${definitionPath}`, colors.yellow);
      skipped++;
      continue;
    }

    try {
      // Read example file
      const exampleContent = fs.readFileSync(examplePath, 'utf8');
      const example = JSON.parse(exampleContent);

      // Read definition file
      const definitionContent = fs.readFileSync(definitionPath, 'utf8');
      const definition = JSON.parse(definitionContent);

      // Update examples.complete
      if (!definition.examples) {
        definition.examples = {};
      }
      definition.examples.complete = example;

      // Write updated definition file
      fs.writeFileSync(definitionPath, JSON.stringify(definition, null, 2) + '\n', 'utf8');
      log(`  ✓ Updated ${definitionPath}`, colors.green);

      // Delete standalone example file
      fs.unlinkSync(examplePath);
      log(`  ✓ Removed ${examplePath}`, colors.green);

      consolidated++;
    } catch (error) {
      log(`  ❌ Error processing ${sectionType}: ${error.message}`, colors.red);
      errors++;
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  Summary:`, colors.cyan);
  log(`    ✓ Consolidated: ${consolidated}`, colors.green);
  log(`    ⏭️  Skipped: ${skipped}`, colors.yellow);
  log(`    ❌ Errors: ${errors}`, colors.red);
  log('═'.repeat(70) + '\n', colors.cyan);

  if (errors > 0) {
    process.exit(1);
  }
}

main();


