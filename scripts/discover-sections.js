#!/usr/bin/env node

/**
 * Section Discovery Utility
 *
 * Automatically discovers all section modules in the sections/ folder.
 * Each section is identified by having a *.definition.json file.
 *
 * Returns structured data about each section for use by builders.
 */

const fs = require('fs');
const path = require('path');

// Colors for output
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

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'sections');

/**
 * Discover all section modules
 * @returns {Array} Array of section metadata
 */
function discoverSections() {
  const sections = [];

  // Read all directories in sections folder
  const entries = fs.readdirSync(SECTIONS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    // Skip files at root level
    if (!entry.isDirectory()) continue;

    // Skip special folders
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const sectionDir = path.join(SECTIONS_DIR, entry.name);

    // Look for definition file
    const definitionFiles = fs.readdirSync(sectionDir)
      .filter(f => f.endsWith('.definition.json'));

    if (definitionFiles.length === 0) {
      // No definition file - skip or warn
      continue;
    }

    if (definitionFiles.length > 1) {
      log(`⚠ Multiple definition files found in ${entry.name}`, colors.yellow);
    }

    const definitionPath = path.join(sectionDir, definitionFiles[0]);

    try {
      const definition = JSON.parse(fs.readFileSync(definitionPath, 'utf8'));

      // Discover other files in the folder
      const files = fs.readdirSync(sectionDir);
      const hasComponent = files.some(f => f.endsWith('.component.ts'));
      const hasTemplate = files.some(f => f.endsWith('.component.html'));
      const hasStyles = files.some(f => f.endsWith('.scss') || f.endsWith('.css'));
      const hasReadme = files.includes('README.md');

      // Component name (extract from folder name)
      const componentName = entry.name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') + 'Component';

      // Component file path
      const componentFile = files.find(f => f.endsWith('.component.ts'));
      const templateFile = files.find(f => f.endsWith('.component.html'));
      const styleFile = files.find(f => f.endsWith('.scss') || f.endsWith('.css'));

      const section = {
        // Basic info
        folderName: entry.name,
        type: definition.type,
        name: definition.name,
        description: definition.description,

        // File paths
        folderPath: sectionDir,
        relativeFolderPath: path.relative(ROOT_DIR, sectionDir),
        definitionPath,
        relativeDefinitionPath: path.relative(ROOT_DIR, definitionPath),

        // Component info
        componentName,
        componentFile: componentFile ? path.join(sectionDir, componentFile) : null,
        templateFile: templateFile ? path.join(sectionDir, templateFile) : null,
        styleFile: styleFile ? path.join(sectionDir, styleFile) : null,
        readmeFile: hasReadme ? path.join(sectionDir, 'README.md') : null,

        // File presence flags
        hasComponent,
        hasTemplate,
        hasStyles,
        hasReadme,
        hasDefinition: true,

        // Full definition data
        definition,

        // Selector
        selector: definition.selector || `lib-${entry.name}`,
      };

      sections.push(section);
    } catch (error) {
      log(`✗ Error reading definition for ${entry.name}: ${error.message}`, colors.red);
    }
  }

  return sections.sort((a, b) => a.type.localeCompare(b.type));
}

/**
 * Validate a section module
 */
function validateSection(section) {
  const errors = [];
  const warnings = [];

  // Check required files
  if (!section.hasComponent) {
    errors.push('Missing component.ts file');
  }
  if (!section.hasTemplate) {
    errors.push('Missing component.html file');
  }
  if (!section.hasDefinition) {
    errors.push('Missing definition.json file');
  }

  // Check recommended files
  if (!section.hasStyles) {
    warnings.push('No SCSS file (will use base styles)');
  }
  if (!section.hasReadme) {
    warnings.push('No README.md file');
  }

  // Validate definition
  if (!section.definition.type) {
    errors.push('definition.json missing "type" field');
  }
  if (!section.definition.name) {
    errors.push('definition.json missing "name" field');
  }
  if (!section.definition.selector) {
    warnings.push('definition.json missing "selector" field');
  }

  return { errors, warnings };
}

/**
 * Print section discovery results
 */
function printResults(sections) {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  Section Discovery Results', colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);

  log(`\n✅ Found ${sections.length} section modules\n`, colors.green);

  // Group by validation status
  const valid = [];
  const withWarnings = [];
  const withErrors = [];

  for (const section of sections) {
    const validation = validateSection(section);
    if (validation.errors.length > 0) {
      withErrors.push({ section, validation });
    } else if (validation.warnings.length > 0) {
      withWarnings.push({ section, validation });
    } else {
      valid.push(section);
    }
  }

  // Print valid sections
  if (valid.length > 0) {
    log(`✅ Valid Sections (${valid.length}):`, colors.green);
    for (const section of valid) {
      const files = [
        section.hasComponent && '📄',
        section.hasTemplate && '📝',
        section.hasStyles && '🎨',
        section.hasDefinition && '📋',
        section.hasReadme && '📖'
      ].filter(Boolean).join(' ');

      log(`   ${section.type.padEnd(20)} ${files}`, colors.dim);
    }
  }

  // Print warnings
  if (withWarnings.length > 0) {
    log(`\n⚠ Sections with Warnings (${withWarnings.length}):`, colors.yellow);
    for (const { section, validation } of withWarnings) {
      log(`   ${section.type}:`, colors.yellow);
      for (const warning of validation.warnings) {
        log(`     - ${warning}`, colors.dim);
      }
    }
  }

  // Print errors
  if (withErrors.length > 0) {
    log(`\n✗ Sections with Errors (${withErrors.length}):`, colors.red);
    for (const { section, validation } of withErrors) {
      log(`   ${section.type}:`, colors.red);
      for (const error of validation.errors) {
        log(`     - ${error}`, colors.dim);
      }
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
}

/**
 * Export for use by other scripts
 */
function exportResults(sections, outputPath) {
  const data = {
    discoveredAt: new Date().toISOString(),
    totalSections: sections.length,
    sections: sections.map(s => ({
      type: s.type,
      name: s.name,
      folderName: s.folderName,
      componentName: s.componentName,
      files: {
        component: !!s.componentFile,
        template: !!s.templateFile,
        styles: !!s.styleFile,
        definition: true,
        readme: !!s.readmeFile
      },
      definition: s.definition
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  log(`\n📄 Discovery results exported to: ${path.relative(ROOT_DIR, outputPath)}`, colors.blue);
}

// Main execution
if (require.main === module) {
  log('\n🔍 Discovering section modules...', colors.cyan);

  const sections = discoverSections();
  printResults(sections);

  // Export results if --export flag provided
  if (process.argv.includes('--export')) {
    const outputPath = path.join(ROOT_DIR, 'section-discovery.json');
    exportResults(sections, outputPath);
  }

  // Exit with error if any sections have errors
  const hasErrors = sections.some(s => validateSection(s).errors.length > 0);
  process.exit(hasErrors ? 1 : 0);
}

// Export for use by other scripts
module.exports = {
  discoverSections,
  validateSection,
  SECTIONS_DIR,
  ROOT_DIR
};

