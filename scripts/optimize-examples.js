#!/usr/bin/env node

/**
 * Optimize Examples in Definition Files
 *
 * Removes minimal and edgeCases examples, keeping only one optimized example
 * that demonstrates all available features of each section type.
 *
 * Usage:
 *   node scripts/optimize-examples.js
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
 * Optimize example to show all features but keep it concise
 */
function optimizeExample(example, sectionType, definition) {
  const optimized = { ...example };

  // Ensure type is set
  if (!optimized.type) {
    optimized.type = sectionType;
  }

  // For fields-based sections: keep 4-6 representative fields showing different features
  if (optimized.fields && Array.isArray(optimized.fields)) {
    if (optimized.fields.length > 6) {
      // Keep first 2, middle 2, last 2 to show variety
      const first = optimized.fields.slice(0, 2);
      const middle = optimized.fields.slice(
        Math.floor(optimized.fields.length / 2),
        Math.floor(optimized.fields.length / 2) + 2
      );
      const last = optimized.fields.slice(-2);
      optimized.fields = [...first, ...middle, ...last].slice(0, 6);
    }

    // Ensure we show different field features (format, trend, percentage, etc.)
    const hasFormat = optimized.fields.some(f => f.format);
    const hasTrend = optimized.fields.some(f => f.trend);
    const hasPercentage = optimized.fields.some(f => f.percentage !== undefined);
    const hasChange = optimized.fields.some(f => f.change !== undefined);

    // If missing key features, try to add them to first field
    if (optimized.fields.length > 0 && definition.fieldSchema) {
      const firstField = optimized.fields[0];
      if (!hasFormat && definition.fieldSchema.properties?.format) {
        firstField.format = firstField.format || 'currency';
      }
      if (!hasTrend && definition.fieldSchema.properties?.trend) {
        firstField.trend = firstField.trend || 'up';
      }
      if (!hasPercentage && definition.fieldSchema.properties?.percentage) {
        firstField.percentage = firstField.percentage || 75;
      }
      if (!hasChange && definition.fieldSchema.properties?.change) {
        firstField.change = firstField.change || 10.5;
      }
    }
  }

  // For items-based sections: keep 3-4 representative items
  if (optimized.items && Array.isArray(optimized.items)) {
    if (optimized.items.length > 4) {
      const first = optimized.items.slice(0, 2);
      const last = optimized.items.slice(-2);
      optimized.items = [...first, ...last].slice(0, 4);
    }
  }

  // Ensure layout parameters are present
  if (!optimized.preferredColumns && !optimized.colSpan) {
    if (['contact-card', 'analytics', 'gallery', 'chart'].includes(sectionType)) {
      optimized.preferredColumns = 2;
    } else {
      optimized.preferredColumns = 1;
    }
  }

  if (!optimized.priority) {
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
 * Main optimization process
 */
function main() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Optimize Examples in Definition Files', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  if (!fs.existsSync(SECTIONS_DIR)) {
    log(`❌ Sections directory not found: ${SECTIONS_DIR}`, colors.red);
    process.exit(1);
  }

  const sectionFolders = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let optimized = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of sectionFolders) {
    const sectionType = folder.replace('-section', '');
    const definitionPath = path.join(SECTIONS_DIR, folder, `${sectionType}.definition.json`);

    log(`\n  Processing ${sectionType}...`, colors.blue);

    if (!fs.existsSync(definitionPath)) {
      log(`  ⚠️  Definition file not found: ${definitionPath}`, colors.yellow);
      skipped++;
      continue;
    }

    try {
      const content = fs.readFileSync(definitionPath, 'utf8');
      const definition = JSON.parse(content);

      if (!definition.examples || !definition.examples.complete) {
        log(`  ⏭️  No complete example found, skipping`, colors.yellow);
        skipped++;
        continue;
      }

      // Optimize the complete example
      const optimizedExample = optimizeExample(
        definition.examples.complete,
        sectionType,
        definition
      );

      // Replace examples object with single optimized example
      definition.examples = {
        example: optimizedExample
      };

      // Write updated definition file
      fs.writeFileSync(definitionPath, JSON.stringify(definition, null, 2) + '\n', 'utf8');
      log(`  ✓ Optimized ${definitionPath}`, colors.green);

      optimized++;
    } catch (error) {
      log(`  ❌ Error processing ${sectionType}: ${error.message}`, colors.red);
      errors++;
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  Summary:`, colors.cyan);
  log(`    ✓ Optimized: ${optimized}`, colors.green);
  log(`    ⏭️  Skipped: ${skipped}`, colors.yellow);
  log(`    ❌ Errors: ${errors}`, colors.red);
  log('═'.repeat(70) + '\n', colors.cyan);

  if (errors > 0) {
    process.exit(1);
  }
}

main();


