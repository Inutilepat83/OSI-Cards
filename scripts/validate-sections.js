#!/usr/bin/env node

/**
 * Validate Sections
 *
 * Validates all section modules for:
 * - Required files present
 * - Definition.json schema validity
 * - Component naming consistency
 * - SCSS import correctness
 * - README completeness
 *
 * Usage:
 *   node scripts/validate-sections.js
 *   node scripts/validate-sections.js --strict  (fail on warnings)
 */

const { discoverSections, validateSection } = require('./discover-sections');

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

/**
 * Main validation
 */
function main() {
  const strict = process.argv.includes('--strict');

  logHeader('Section Module Validation');

  // Discover sections
  log('\n🔍 Discovering sections...', colors.blue);
  const sections = discoverSections();
  log(`✅ Found ${sections.length} sections\n`, colors.green);

  // Validate each section
  const results = sections.map(section => ({
    section,
    validation: validateSection(section)
  }));

  // Categorize results
  const valid = results.filter(r => r.validation.errors.length === 0 && r.validation.warnings.length === 0);
  const withWarnings = results.filter(r => r.validation.errors.length === 0 && r.validation.warnings.length > 0);
  const withErrors = results.filter(r => r.validation.errors.length > 0);

  // Print results
  log('═'.repeat(70), colors.cyan);
  log('  Validation Results', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  // Valid sections
  if (valid.length > 0) {
    log(`\n✅ Valid Sections: ${valid.length}`, colors.green + colors.bright);
    valid.forEach(r => {
      log(`   ✓ ${r.section.type.padEnd(20)} ${r.section.folderName}`, colors.dim);
    });
  }

  // Warnings
  if (withWarnings.length > 0) {
    log(`\n⚠ Sections with Warnings: ${withWarnings.length}`, colors.yellow + colors.bright);
    withWarnings.forEach(r => {
      log(`   ${r.section.type}:`, colors.yellow);
      r.validation.warnings.forEach(warning => {
        log(`     - ${warning}`, colors.dim);
      });
    });
  }

  // Errors
  if (withErrors.length > 0) {
    log(`\n✗ Sections with Errors: ${withErrors.length}`, colors.red + colors.bright);
    withErrors.forEach(r => {
      log(`   ${r.section.type}:`, colors.red);
      r.validation.errors.forEach(error => {
        log(`     - ${error}`, colors.dim);
      });
    });
  }

  // Summary
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Summary', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
  log(`\n✅ Valid:    ${valid.length}`);
  log(`⚠ Warnings: ${withWarnings.length}`);
  log(`✗ Errors:   ${withErrors.length}`);
  log(`📊 Total:    ${sections.length}\n`);

  // Exit status
  if (withErrors.length > 0) {
    log('❌ Validation failed! Fix errors above.', colors.red + colors.bright);
    process.exit(1);
  } else if (strict && withWarnings.length > 0) {
    log('⚠ Validation failed (strict mode)! Fix warnings above.', colors.yellow + colors.bright);
    process.exit(1);
  } else {
    log('✅ Validation passed!', colors.green + colors.bright);
    if (withWarnings.length > 0) {
      log(`   (${withWarnings.length} warnings - not blocking)`, colors.dim);
    }
  }
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

