#!/usr/bin/env node

/**
 * Section Registry Compiler
 *
 * Reads individual section definition files from each section folder
 * and compiles them into a single section-registry.json file.
 *
 * Structure:
 * - Each section folder contains a *.definition.json file
 * - This script aggregates them into the central registry
 * - Maintains backward compatibility with existing registry format
 *
 * Usage: node scripts/compile-section-registry.js [--watch]
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const SCHEMA_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.schema.json');

// Colors for console output
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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'═'.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
}

/**
 * Find all section definition files
 */
function findDefinitionFiles() {
  const definitionFiles = [];

  // Read all directories in sections folder
  const entries = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sectionDir = path.join(SECTIONS_DIR, entry.name);
      const files = fs.readdirSync(sectionDir);

      // Look for *.definition.json files
      const definitionFile = files.find(f => f.endsWith('.definition.json'));

      if (definitionFile) {
        definitionFiles.push({
          name: entry.name,
          path: path.join(sectionDir, definitionFile),
          file: definitionFile
        });
      }
    }
  }

  return definitionFiles;
}

/**
 * Load and parse a definition file
 */
function loadDefinition(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error.message}`);
  }
}

/**
 * Validate a section definition
 */
function validateDefinition(definition, fileName) {
  const errors = [];

  if (!definition.type) {
    errors.push(`Missing 'type' field`);
  }
  if (!definition.name) {
    errors.push(`Missing 'name' field`);
  }
  if (!definition.description) {
    errors.push(`Missing 'description' field`);
  }
  if (!definition.selector) {
    errors.push(`Missing 'selector' field`);
  }
  if (!definition.rendering) {
    errors.push(`Missing 'rendering' configuration`);
  }
  if (!definition.testFixtures) {
    errors.push(`Missing 'testFixtures' configuration`);
  }

  return errors;
}

/**
 * Convert definition to registry format
 */
function convertToRegistryFormat(definition, folderName) {
  // Build component path from folder name
  const componentFileName = folderName.replace('-section', '');
  const componentPath = `./lib/components/sections/${folderName}/${componentFileName}-section.component`;

  // Check for optional SCSS file in section folder
  const sectionDir = path.join(SECTIONS_DIR, folderName);
  const scssFile = `${componentFileName}-section.scss`;
  const scssPath = path.join(sectionDir, scssFile);
  const hasScss = fs.existsSync(scssPath);

  const result = {
    name: definition.name,
    description: definition.description,
    componentPath: componentPath,
    selector: definition.selector,
    useCases: definition.useCases || [],
    bestPractices: definition.bestPractices || [],
    rendering: definition.rendering,
    fieldSchema: definition.fieldSchema,
    itemSchema: definition.itemSchema,
    chartSchema: definition.chartSchema,
    aliases: definition.aliases,
    isInternal: definition.isInternal,
    testFixtures: definition.testFixtures
  };

  // Only add stylePath if SCSS file exists
  if (hasScss) {
    result.stylePath = `./lib/components/sections/${folderName}/${scssFile}`;
  }

  return result;
}

/**
 * Build type aliases map from all definitions
 */
function buildTypeAliases(sections) {
  const aliases = {};

  for (const [type, definition] of Object.entries(sections)) {
    if (definition.aliases && Array.isArray(definition.aliases)) {
      for (const alias of definition.aliases) {
        aliases[alias] = type;
      }
    }
  }

  return aliases;
}

/**
 * Main compilation function
 */
function compile() {
  logSection('Section Registry Compiler');

  // Find all definition files
  log('\n📂 Scanning for definition files...', colors.blue);
  const definitionFiles = findDefinitionFiles();

  if (definitionFiles.length === 0) {
    log('  ⚠️  No definition files found', colors.yellow);
    log('  Looking for *.definition.json files in section folders', colors.dim);
    return;
  }

  log(`  Found ${definitionFiles.length} definition files`, colors.green);

  // Load and validate all definitions
  log('\n📄 Loading definitions...', colors.blue);
  const sections = {};
  const errors = [];

  for (const { name, path: filePath, file } of definitionFiles) {
    try {
      const definition = loadDefinition(filePath);

      // Validate
      const validationErrors = validateDefinition(definition, file);
      if (validationErrors.length > 0) {
        errors.push({ file, errors: validationErrors });
        log(`  ⚠️  ${file} has validation errors`, colors.yellow);
        continue;
      }

      // Convert to registry format
      const registryEntry = convertToRegistryFormat(definition, name);

      // Remove undefined properties
      Object.keys(registryEntry).forEach(key => {
        if (registryEntry[key] === undefined) {
          delete registryEntry[key];
        }
      });

      sections[definition.type] = registryEntry;
      log(`  ✓ ${definition.type} (${file})`, colors.green);

    } catch (error) {
      errors.push({ file, errors: [error.message] });
      log(`  ✗ ${file}: ${error.message}`, colors.red);
    }
  }

  // Report validation errors
  if (errors.length > 0) {
    log('\n⚠️  Validation Issues:', colors.yellow);
    for (const { file, errors: fileErrors } of errors) {
      log(`  ${file}:`, colors.yellow);
      for (const err of fileErrors) {
        log(`    - ${err}`, colors.dim);
      }
    }
  }

  // Build type aliases
  const typeAliases = buildTypeAliases(sections);

  // Sort sections alphabetically for consistency
  const sortedSections = {};
  Object.keys(sections).sort().forEach(key => {
    sortedSections[key] = sections[key];
  });

  // Build final registry
  const registry = {
    '$schema': './section-registry.schema.json',
    version: '2.0.0',
    description: 'Single source of truth for all OSI Cards section types - compiled from individual definition files',
    generatedAt: new Date().toISOString(),
    sections: sortedSections,
    typeAliases: typeAliases,
    defaultSection: 'fallback'
  };

  // Write registry file
  log('\n💾 Writing section-registry.json...', colors.blue);
  fs.writeFileSync(
    REGISTRY_PATH,
    JSON.stringify(registry, null, 2) + '\n',
    'utf8'
  );

  log(`  ✓ Registry written with ${Object.keys(sections).length} sections`, colors.green);
  log(`  ✓ ${Object.keys(typeAliases).length} type aliases configured`, colors.green);

  // Summary
  log('\n' + '═'.repeat(60), colors.cyan);
  log('✅ Compilation complete!', colors.bright + colors.green);
  log('═'.repeat(60), colors.cyan);

  log('\nNext steps:', colors.blue);
  log('  1. Run: npm run generate:from-registry', colors.dim);
  log('  2. This will regenerate TypeScript types and other artifacts', colors.dim);
  log('\n');

  return { sections: Object.keys(sections).length, aliases: Object.keys(typeAliases).length };
}

/**
 * Watch mode
 */
function watch() {
  log('\n👀 Watching for changes...', colors.cyan);
  log(`  Directory: ${SECTIONS_DIR}`, colors.dim);
  log('  Press Ctrl+C to stop\n', colors.dim);

  // Initial compile
  compile();

  // Watch for changes
  fs.watch(SECTIONS_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.definition.json')) {
      log(`\n🔄 Change detected: ${filename}`, colors.yellow);
      compile();
    }
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--watch') || args.includes('-w')) {
  watch();
} else {
  compile();
}

