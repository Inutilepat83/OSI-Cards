#!/usr/bin/env node

/**
 * Compile Sections - Master Orchestrator
 *
 * Discovers all section modules and auto-generates all derived artifacts:
 * - section-registry.json (from definition files)
 * - sections/index.ts (component exports)
 * - _all-sections.generated.scss (style bundle)
 * - SECTIONS_GENERATED.md (documentation)
 *
 * This makes the sections/ folder truly plug-and-play:
 * - Add section = drop folder, run this script
 * - Remove section = delete folder, run this script
 * - Zero manual updates needed!
 *
 * Usage:
 *   node scripts/compile-sections.js
 *   node scripts/compile-sections.js --verify  (dry run)
 */

const { execSync } = require('child_process');
const { discoverSections } = require('./discover-sections');
const { buildRegistry } = require('./build-section-registry');
const { buildExports } = require('./build-section-exports');
const { buildStyleBundle } = require('./build-section-styles');
const { generateSectionList } = require('./build-section-docs');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
}

function logSuccess(msg) {
  log(`✓ ${msg}`, colors.green);
}

function logError(msg) {
  log(`✗ ${msg}`, colors.red);
}

function logStep(msg) {
  log(`\n▶ ${msg}...`, colors.blue);
}

/**
 * Main compilation process
 */
function main() {
  const verifyOnly = process.argv.includes('--verify');
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

  logHeader('Smart Section Auto-Discovery & Compilation');

  if (verifyOnly) {
    log('\n📋 Running in VERIFY mode (no files will be written)', colors.yellow);
  }

  // Step 1: Discover sections
  logStep('Discovering section modules');
  const sections = discoverSections();
  logSuccess(`Found ${sections.length} section modules`);

  if (sections.length === 0) {
    logError('No sections found! Check sections/ directory.');
    process.exit(1);
  }

  if (verbose) {
    log('\nDiscovered sections:', colors.dim);
    sections.forEach(s => {
      log(`  - ${s.type.padEnd(20)} ${s.folderName}`, colors.dim);
    });
  }

  // Step 2: Build registry
  logStep('Building section-registry.json from definitions');
  const registry = buildRegistry(sections);
  const registryPath = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'section-registry.json');

  if (!verifyOnly) {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
    logSuccess(`Registry written with ${Object.keys(registry.sections).length} sections`);
  } else {
    logSuccess(`Registry validated (${Object.keys(registry.sections).length} sections)`);
  }

  // Step 3: Build exports
  logStep('Generating sections/index.ts exports');
  const exportsContent = buildExports(sections);
  const exportsPath = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections', 'index.ts');

  if (!verifyOnly) {
    fs.writeFileSync(exportsPath, exportsContent);
    logSuccess(`Exports generated for ${sections.length} components`);
  } else {
    logSuccess(`Exports validated (${sections.length} components)`);
  }

  // Step 4: Build styles
  logStep('Generating style bundle');
  const stylesContent = buildStyleBundle(sections);
  const stylesPath = path.join(
    __dirname, '..', 'projects', 'osi-cards-lib', 'src', 'lib', 'styles', 'components', 'sections', '_all-sections.generated.scss'
  );

  if (!verifyOnly) {
    fs.mkdirSync(path.dirname(stylesPath), { recursive: true });
    fs.writeFileSync(stylesPath, stylesContent);
    const sectionsWithStyles = sections.filter(s => s.hasStyles).length;
    logSuccess(`Style bundle generated (${sectionsWithStyles} sections with styles)`);
  } else {
    const sectionsWithStyles = sections.filter(s => s.hasStyles).length;
    logSuccess(`Style bundle validated (${sectionsWithStyles} sections)`);
  }

  // Step 5: Build documentation
  logStep('Generating documentation');
  const docsContent = generateSectionList(sections);
  const docsPath = path.join(__dirname, '..', 'docs', 'SECTIONS_GENERATED.md');

  if (!verifyOnly) {
    fs.writeFileSync(docsPath, docsContent);
    logSuccess(`Documentation generated`);
  } else {
    logSuccess(`Documentation validated`);
  }

  // Summary
  logHeader('Compilation Complete');

  if (verifyOnly) {
    log('\n📋 Verification Summary (no files written):', colors.yellow);
  } else {
    log('\n📊 Compilation Summary:', colors.green);
  }

  log(`   Sections discovered:     ${sections.length}`);
  log(`   Registry entries:        ${Object.keys(registry.sections).length}`);
  log(`   Components exported:     ${sections.length}`);
  log(`   Sections with styles:    ${sections.filter(s => s.hasStyles).length}`);
  log(`   Documentation pages:     1`);

  if (!verifyOnly) {
    log('\n✅ All section artifacts generated successfully!', colors.green + colors.bright);
    log('\n💡 The sections/ folder is now the single source of truth!', colors.cyan);
    log('   - Add section: Create folder, run `npm run sections:build`', colors.dim);
    log('   - Remove section: Delete folder, run `npm run sections:build`', colors.dim);
  }

  log('');
}

// Run if called directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    logError(`\nFatal error: ${error.message}`);
    if (process.argv.includes('--verbose')) {
      console.error(error);
    }
    process.exit(1);
  }
}





