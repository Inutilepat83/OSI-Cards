#!/usr/bin/env node

/**
 * Extract Section Examples
 *
 * Extracts examples from section definition files and creates standalone
 * {type}.example.json files in each section folder.
 *
 * This makes each section folder self-contained with its own example.
 *
 * Usage:
 *   node scripts/extract-section-examples.js
 */

const fs = require('fs');
const path = require('path');
const { getSectionMetadata } = require('./utils/definition-reader');

const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Optimize example by limiting fields/items to representative subset
 */
function optimizeExample(example, sectionType) {
  const optimized = { ...example };

  // Limit fields to 3-5 representative ones
  if (optimized.fields && Array.isArray(optimized.fields)) {
    // Keep first 2, middle 1-2, and last 1 if array is long
    if (optimized.fields.length > 5) {
      const keepCount = Math.min(5, optimized.fields.length);
      const first = optimized.fields.slice(0, 2);
      const middle = optimized.fields.slice(
        Math.floor(optimized.fields.length / 2),
        Math.floor(optimized.fields.length / 2) + 1
      );
      const last = optimized.fields.slice(-1);
      optimized.fields = [...first, ...middle, ...last].slice(0, keepCount);
    }
  }

  // Limit items to 3-5 representative ones
  if (optimized.items && Array.isArray(optimized.items)) {
    if (optimized.items.length > 5) {
      const keepCount = Math.min(5, optimized.items.length);
      const first = optimized.items.slice(0, 2);
      const middle = optimized.items.slice(
        Math.floor(optimized.items.length / 2),
        Math.floor(optimized.items.length / 2) + 1
      );
      const last = optimized.items.slice(-1);
      optimized.items = [...first, ...middle, ...last].slice(0, keepCount);
    }
  }

  // Get section metadata from definition file
  const metadata = getSectionMetadata(sectionType);
  const rendering = metadata?.rendering || {};

  // Ensure layout parameters are present
  if (!optimized.preferredColumns && !optimized.colSpan) {
    // Use defaultColumns from definition file, or fallback to 1
    optimized.preferredColumns = rendering.defaultColumns || 1;
  }

  if (!optimized.priority) {
    // Set default priority based on section type from definition file
    // Priority 1: overview, contact-card (key people/summaries)
    // Priority 2: analytics, chart, financials (important metrics)
    // Priority 3: everything else (supporting content)
    if (['overview', 'contact-card'].includes(sectionType)) {
      optimized.priority = 1;
    } else if (['analytics', 'chart', 'financials'].includes(sectionType)) {
      optimized.priority = 2;
    } else {
      optimized.priority = 3;
    }
  }

  return optimized;
}

/**
 * Extract example from definition file
 */
function extractExample(definitionPath, sectionType) {
  try {
    const content = fs.readFileSync(definitionPath, 'utf8');
    const definition = JSON.parse(content);

    // Get example - prefer demo, then doc, then long, then complete, then minimal
    let example = definition.examples?.demo ||
                  definition.examples?.doc ||
                  definition.examples?.long ||
                  definition.examples?.complete ||
                  definition.examples?.minimal ||
                  definition.examples?.example; // backward compatibility

    if (!example) {
      log(`  ⚠️  No example found in ${sectionType}`, colors.yellow);
      return null;
    }

    // Ensure type is set
    if (!example.type) {
      example.type = sectionType;
    }

    // Optimize the example
    const optimized = optimizeExample(example, sectionType);

    return optimized;
  } catch (error) {
    log(`  ❌ Error reading ${definitionPath}: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Main extraction process
 */
function main() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Extract Section Examples', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  if (!fs.existsSync(SECTIONS_DIR)) {
    log(`❌ Sections directory not found: ${SECTIONS_DIR}`, colors.red);
    process.exit(1);
  }

  const sectionFolders = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let extracted = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of sectionFolders) {
    const definitionPath = path.join(SECTIONS_DIR, folder, `${folder.replace('-section', '')}.definition.json`);

    if (!fs.existsSync(definitionPath)) {
      log(`  ⚠️  Definition file not found: ${definitionPath}`, colors.yellow);
      skipped++;
      continue;
    }

    const sectionType = folder.replace('-section', '');
    const examplePath = path.join(SECTIONS_DIR, folder, `${sectionType}.example.json`);

    log(`\n  Processing ${sectionType}...`, colors.blue);

    const example = extractExample(definitionPath, sectionType);

    if (!example) {
      errors++;
      continue;
    }

    // Write example file
    try {
      fs.writeFileSync(examplePath, JSON.stringify(example, null, 2) + '\n', 'utf8');
      log(`  ✓ Created ${examplePath}`, colors.green);
      extracted++;
    } catch (error) {
      log(`  ❌ Error writing ${examplePath}: ${error.message}`, colors.red);
      errors++;
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  Summary:`, colors.cyan);
  log(`    ✓ Extracted: ${extracted}`, colors.green);
  log(`    ⚠️  Skipped: ${skipped}`, colors.yellow);
  log(`    ❌ Errors: ${errors}`, colors.red);
  log('═'.repeat(70) + '\n', colors.cyan);

  if (errors > 0) {
    process.exit(1);
  }
}

main();


