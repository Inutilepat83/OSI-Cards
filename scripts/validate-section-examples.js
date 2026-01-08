#!/usr/bin/env node

/**
 * Validate Section Examples
 *
 * This script validates that all section definition files have the required examples:
 * - examples.demo - Demo example for showcases
 * - examples.doc - Minimal example for documentation
 * - examples.long - Comprehensive example showing all features/edge cases
 *
 * Usage:
 *   node scripts/validate-section-examples.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(
  ROOT_DIR,
  'projects',
  'osi-cards-lib',
  'src',
  'lib',
  'components',
  'sections'
);
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

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
 * Check if section is internal (should be excluded from validation)
 */
function isInternalSection(sectionType, registry) {
  if (!registry || !registry.sections) {
    return false;
  }
  return registry.sections[sectionType]?.isInternal === true;
}

/**
 * Load section registry
 */
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    log(`  ⚠️  Could not load registry: ${error.message}`, colors.yellow);
  }
  return null;
}

/**
 * Validate a single section definition file
 */
function validateSectionDefinition(sectionType, definitionPath, registry) {
  const issues = [];
  const warnings = [];

  if (!fs.existsSync(definitionPath)) {
    issues.push(`Definition file not found: ${definitionPath}`);
    return { issues, warnings };
  }

  try {
    const content = fs.readFileSync(definitionPath, 'utf8');
    const definition = JSON.parse(content);

    // Check for required examples
    if (!definition.examples) {
      issues.push('Missing examples object');
      return { issues, warnings };
    }

    const examples = definition.examples;

    // Check for demo example
    if (!examples.demo) {
      if (examples.example || examples.complete) {
        warnings.push(
          'Missing examples.demo (has example/complete - consider adding demo for clarity)'
        );
      } else {
        issues.push('Missing examples.demo');
      }
    }

    // Check for doc example
    if (!examples.doc) {
      warnings.push('Missing examples.doc (recommended for documentation)');
    }

    // Check for long example
    if (!examples.long) {
      warnings.push(
        'Missing examples.long (recommended for comprehensive examples showing all features)'
      );
    }

    // Validate example structure if present
    if (examples.demo) {
      if (!examples.demo.title || !examples.demo.type) {
        warnings.push('examples.demo missing title or type');
      }
    }

    if (examples.doc) {
      if (!examples.doc.title || !examples.doc.type) {
        warnings.push('examples.doc missing title or type');
      }
    }

    if (examples.long) {
      if (!examples.long.title || !examples.long.type) {
        warnings.push('examples.long missing title or type');
      }
    }
  } catch (error) {
    issues.push(`Error parsing definition file: ${error.message}`);
  }

  return { issues, warnings };
}

/**
 * Main validation process
 */
function main() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Validate Section Examples', colors.cyan);
  log('═'.repeat(70), colors.cyan);

  if (!fs.existsSync(SECTIONS_DIR)) {
    log(`❌ Sections directory not found: ${SECTIONS_DIR}`, colors.red);
    process.exit(1);
  }

  const registry = loadRegistry();
  const sectionFolders = fs
    .readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let totalIssues = 0;
  let totalWarnings = 0;
  let sectionsChecked = 0;
  let sectionsWithIssues = 0;
  let sectionsWithWarnings = 0;

  const results = [];

  for (const folder of sectionFolders) {
    const sectionType = folder.replace('-section', '');
    // Handle special case: contact-card-section folder has contact-card.definition.json
    const definitionFileName =
      sectionType === 'contact' ? 'contact-card.definition.json' : `${sectionType}.definition.json`;
    const definitionPath = path.join(SECTIONS_DIR, folder, definitionFileName);

    // Check if internal
    if (isInternalSection(sectionType, registry)) {
      log(`  ⏭️  Skipping internal section: ${sectionType}`, colors.yellow);
      continue;
    }

    sectionsChecked++;

    const { issues, warnings } = validateSectionDefinition(sectionType, definitionPath, registry);

    if (issues.length > 0 || warnings.length > 0) {
      results.push({
        type: sectionType,
        path: definitionPath,
        issues,
        warnings,
      });

      if (issues.length > 0) {
        sectionsWithIssues++;
        totalIssues += issues.length;
      }
      if (warnings.length > 0) {
        sectionsWithWarnings++;
        totalWarnings += warnings.length;
      }
    }
  }

  // Print results
  log('\n📊 Validation Results:\n', colors.cyan);

  if (results.length === 0) {
    log('✅ All sections have required examples!', colors.green);
  } else {
    for (const result of results) {
      log(`\n📁 ${result.type}`, colors.blue);
      log(`   Path: ${result.path}`, colors.reset);

      if (result.issues.length > 0) {
        log(`   ❌ Issues (${result.issues.length}):`, colors.red);
        result.issues.forEach((issue) => {
          log(`      - ${issue}`, colors.red);
        });
      }

      if (result.warnings.length > 0) {
        log(`   ⚠️  Warnings (${result.warnings.length}):`, colors.yellow);
        result.warnings.forEach((warning) => {
          log(`      - ${warning}`, colors.yellow);
        });
      }
    }
  }

  // Summary
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Summary', colors.cyan);
  log('═'.repeat(70), colors.cyan);
  log(`   Sections checked: ${sectionsChecked}`, colors.reset);
  log(`   Sections with issues: ${sectionsWithIssues}`, colors.red);
  log(`   Sections with warnings: ${sectionsWithWarnings}`, colors.yellow);
  log(`   Total issues: ${totalIssues}`, colors.red);
  log(`   Total warnings: ${totalWarnings}`, colors.yellow);

  if (totalIssues > 0) {
    log('\n❌ Validation failed - please fix issues above', colors.red);
    process.exit(1);
  } else if (totalWarnings > 0) {
    log('\n⚠️  Validation passed with warnings - consider addressing warnings', colors.yellow);
    process.exit(0);
  } else {
    log('\n✅ Validation passed - all sections have required examples!', colors.green);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateSectionDefinition, main };
