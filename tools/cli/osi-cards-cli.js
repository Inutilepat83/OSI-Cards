#!/usr/bin/env node

/**
 * OSI Cards CLI
 * 
 * Command-line interface for OSI Cards development and management.
 * 
 * Usage:
 *   npx osi-cards <command> [options]
 * 
 * Commands:
 *   generate section <name>  - Generate a new section component
 *   validate <config.json>   - Validate a card configuration
 *   preview <config.json>    - Preview a card configuration
 *   doctor                   - Check project setup
 *   list-sections            - List all available section types
 *   info <section-type>      - Show information about a section type
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.join(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function error(msg) {
  log(`❌ ${msg}`, colors.red);
}

function success(msg) {
  log(`✅ ${msg}`, colors.green);
}

function info(msg) {
  log(`ℹ️  ${msg}`, colors.blue);
}

function warn(msg) {
  log(`⚠️  ${msg}`, colors.yellow);
}

/**
 * Load registry
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    error(`Registry not found at ${REGISTRY_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

/**
 * Print help
 */
function printHelp() {
  log(`
${colors.cyan}${colors.bright}OSI Cards CLI${colors.reset}

${colors.yellow}Usage:${colors.reset}
  npx osi-cards <command> [options]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}generate section <name>${colors.reset}  Generate a new section component
  ${colors.green}validate <config.json>${colors.reset}   Validate a card configuration
  ${colors.green}preview <config.json>${colors.reset}    Show card configuration preview
  ${colors.green}doctor${colors.reset}                   Check project setup
  ${colors.green}list-sections${colors.reset}            List all available section types
  ${colors.green}info <section-type>${colors.reset}      Show information about a section type
  ${colors.green}sync${colors.reset}                     Sync all generated files from registry
  ${colors.green}help${colors.reset}                     Show this help message

${colors.yellow}Examples:${colors.reset}
  npx osi-cards generate section my-custom
  npx osi-cards validate ./my-card.json
  npx osi-cards info analytics
  npx osi-cards doctor
  npx osi-cards sync
`);
}

/**
 * Generate section command
 */
function generateSection(name) {
  if (!name) {
    error('Section name is required');
    log('Usage: npx osi-cards generate section <name>');
    process.exit(1);
  }

  info(`Generating section: ${name}`);
  
  try {
    execSync(`npm run generate:section -- ${name}`, {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    
    success(`Section '${name}' generated successfully!`);
    info('Run "npm run generate:all" to regenerate derived files');
  } catch (err) {
    error(`Failed to generate section: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Validate config command
 */
function validateConfig(configPath) {
  if (!configPath) {
    error('Config file path is required');
    log('Usage: npx osi-cards validate <config.json>');
    process.exit(1);
  }

  const fullPath = path.resolve(configPath);
  
  if (!fs.existsSync(fullPath)) {
    error(`Config file not found: ${fullPath}`);
    process.exit(1);
  }

  info(`Validating: ${configPath}`);

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(content);
    const registry = loadRegistry();
    
    const errors = [];
    const warnings = [];

    // Validate structure
    if (!config.cardTitle) {
      errors.push('Missing cardTitle');
    }

    if (!Array.isArray(config.sections)) {
      errors.push('sections must be an array');
    } else {
      config.sections.forEach((section, i) => {
        if (!section.title) {
          errors.push(`Section ${i}: missing title`);
        }
        if (!section.type) {
          errors.push(`Section ${i}: missing type`);
        } else {
          const type = section.type.toLowerCase();
          const resolvedType = registry.typeAliases?.[type] || type;
          
          if (!registry.sections[resolvedType]) {
            warnings.push(`Section ${i}: unknown type '${type}'`);
          } else {
            const def = registry.sections[resolvedType];
            if (def.rendering.usesFields && !section.fields && !def.rendering.usesItems) {
              warnings.push(`Section ${i} (${type}): expected 'fields' array`);
            }
            if (def.rendering.usesItems && !section.items && !def.rendering.usesFields) {
              warnings.push(`Section ${i} (${type}): expected 'items' array`);
            }
          }
        }
      });
    }

    // Report results
    if (errors.length > 0) {
      log('\n❌ Validation Errors:', colors.red);
      errors.forEach(e => log(`   - ${e}`, colors.red));
    }

    if (warnings.length > 0) {
      log('\n⚠️  Validation Warnings:', colors.yellow);
      warnings.forEach(w => log(`   - ${w}`, colors.yellow));
    }

    if (errors.length === 0 && warnings.length === 0) {
      success('Configuration is valid!');
    } else if (errors.length === 0) {
      success('Configuration is valid (with warnings)');
    } else {
      process.exit(1);
    }

  } catch (err) {
    if (err instanceof SyntaxError) {
      error(`Invalid JSON: ${err.message}`);
    } else {
      error(`Validation failed: ${err.message}`);
    }
    process.exit(1);
  }
}

/**
 * Preview config command
 */
function previewConfig(configPath) {
  if (!configPath) {
    error('Config file path is required');
    log('Usage: npx osi-cards preview <config.json>');
    process.exit(1);
  }

  const fullPath = path.resolve(configPath);
  
  if (!fs.existsSync(fullPath)) {
    error(`Config file not found: ${fullPath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(content);
    
    log(`\n${colors.cyan}${colors.bright}Card Preview${colors.reset}`);
    log('═'.repeat(50), colors.cyan);
    
    log(`\n${colors.yellow}Title:${colors.reset} ${config.cardTitle}`);
    if (config.description) {
      log(`${colors.yellow}Description:${colors.reset} ${config.description}`);
    }
    
    log(`\n${colors.yellow}Sections (${config.sections?.length || 0}):${colors.reset}`);
    (config.sections || []).forEach((section, i) => {
      const dataCount = section.fields?.length || section.items?.length || 0;
      log(`  ${i + 1}. ${section.title} (${section.type}) - ${dataCount} items`);
    });
    
    if (config.actions?.length > 0) {
      log(`\n${colors.yellow}Actions (${config.actions.length}):${colors.reset}`);
      config.actions.forEach((action, i) => {
        log(`  ${i + 1}. ${action.label} (${action.type || 'default'})`);
      });
    }
    
    log('\n' + '═'.repeat(50), colors.cyan);

  } catch (err) {
    error(`Failed to preview: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Doctor command - check project setup
 */
function runDoctor() {
  log(`\n${colors.cyan}${colors.bright}OSI Cards Doctor${colors.reset}`);
  log('═'.repeat(50), colors.cyan);
  
  const checks = [];

  // Check registry exists
  checks.push({
    name: 'Section Registry',
    pass: fs.existsSync(REGISTRY_PATH),
    message: fs.existsSync(REGISTRY_PATH) 
      ? 'Found' 
      : 'Not found - run "npm run generate:from-registry"'
  });

  // Check generated types
  const typesPath = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'models', 'generated-section-types.ts');
  checks.push({
    name: 'Generated Types',
    pass: fs.existsSync(typesPath),
    message: fs.existsSync(typesPath) 
      ? 'Found' 
      : 'Not found - run "npm run generate:from-registry"'
  });

  // Check component map
  const componentMapPath = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'components', 'section-renderer', 'section-component-map.generated.ts');
  checks.push({
    name: 'Component Map',
    pass: fs.existsSync(componentMapPath),
    message: fs.existsSync(componentMapPath) 
      ? 'Found' 
      : 'Not found - run "npm run generate:from-registry"'
  });

  // Check manifest
  const manifestPath = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'section-manifest.generated.ts');
  checks.push({
    name: 'Section Manifest',
    pass: fs.existsSync(manifestPath),
    message: fs.existsSync(manifestPath) 
      ? 'Found' 
      : 'Not found - run "npm run generate:manifest"'
  });

  // Check node_modules
  const nodeModules = path.join(ROOT_DIR, 'node_modules');
  checks.push({
    name: 'Dependencies',
    pass: fs.existsSync(nodeModules),
    message: fs.existsSync(nodeModules) 
      ? 'Installed' 
      : 'Not installed - run "npm install"'
  });

  // Report
  log('\nChecks:', colors.blue);
  let allPass = true;
  checks.forEach(check => {
    const icon = check.pass ? '✓' : '✗';
    const color = check.pass ? colors.green : colors.red;
    log(`  ${color}${icon}${colors.reset} ${check.name}: ${check.message}`);
    if (!check.pass) allPass = false;
  });

  log('\n' + '═'.repeat(50), colors.cyan);
  
  if (allPass) {
    success('All checks passed!');
  } else {
    warn('Some checks failed. Run the suggested commands to fix.');
    process.exit(1);
  }
}

/**
 * List sections command
 */
function listSections() {
  const registry = loadRegistry();
  
  log(`\n${colors.cyan}${colors.bright}Available Section Types${colors.reset}`);
  log('═'.repeat(60), colors.cyan);
  
  const sections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal)
    .sort(([a], [b]) => a.localeCompare(b));
  
  log(`\n${colors.yellow}Type${' '.repeat(20)}Name${' '.repeat(20)}Data${colors.reset}`);
  log('-'.repeat(60));
  
  sections.forEach(([type, def]) => {
    const dataType = def.rendering.usesItems ? 'items' : (def.rendering.usesChartData ? 'chartData' : 'fields');
    const typePadded = type.padEnd(24);
    const namePadded = def.name.replace(' Section', '').padEnd(24);
    log(`${colors.green}${typePadded}${colors.reset}${namePadded}${dataType}`);
  });
  
  // List aliases
  if (registry.typeAliases && Object.keys(registry.typeAliases).length > 0) {
    log(`\n${colors.yellow}Type Aliases:${colors.reset}`);
    Object.entries(registry.typeAliases).forEach(([alias, target]) => {
      log(`  ${colors.dim}${alias}${colors.reset} → ${target}`);
    });
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  log(`Total: ${sections.length} section types\n`);
}

/**
 * Section info command
 */
function sectionInfo(type) {
  if (!type) {
    error('Section type is required');
    log('Usage: npx osi-cards info <section-type>');
    process.exit(1);
  }

  const registry = loadRegistry();
  const resolvedType = registry.typeAliases?.[type] || type;
  const def = registry.sections[resolvedType];
  
  if (!def) {
    error(`Unknown section type: ${type}`);
    log('\nAvailable types:');
    Object.keys(registry.sections)
      .filter(t => !registry.sections[t].isInternal)
      .forEach(t => log(`  - ${t}`));
    process.exit(1);
  }

  log(`\n${colors.cyan}${colors.bright}${def.name}${colors.reset}`);
  log('═'.repeat(50), colors.cyan);
  
  log(`\n${colors.yellow}Type:${colors.reset} ${resolvedType}`);
  log(`${colors.yellow}Description:${colors.reset} ${def.description}`);
  log(`${colors.yellow}Selector:${colors.reset} ${def.selector}`);
  
  log(`\n${colors.yellow}Data Structure:${colors.reset}`);
  log(`  Uses Fields: ${def.rendering.usesFields ? 'Yes' : 'No'}`);
  log(`  Uses Items: ${def.rendering.usesItems ? 'Yes' : 'No'}`);
  log(`  Uses Chart Data: ${def.rendering.usesChartData ? 'Yes' : 'No'}`);
  log(`  Default Columns: ${def.rendering.defaultColumns}`);
  
  if (def.useCases?.length > 0) {
    log(`\n${colors.yellow}Use Cases:${colors.reset}`);
    def.useCases.forEach(uc => log(`  - ${uc}`));
  }
  
  if (def.bestPractices?.length > 0) {
    log(`\n${colors.yellow}Best Practices:${colors.reset}`);
    def.bestPractices.forEach((bp, i) => log(`  ${i + 1}. ${bp}`));
  }
  
  if (def.testFixtures?.minimal) {
    log(`\n${colors.yellow}Minimal Example:${colors.reset}`);
    log(JSON.stringify(def.testFixtures.minimal, null, 2));
  }
  
  log('\n' + '═'.repeat(50), colors.cyan);
}

/**
 * Sync command - regenerate all files
 */
function syncAll() {
  info('Syncing all generated files from registry...');
  
  try {
    execSync('npm run generate:all', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    
    success('All files synchronized!');
  } catch (err) {
    error(`Sync failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'generate':
      if (args[1] === 'section') {
        generateSection(args[2]);
      } else {
        error(`Unknown generate target: ${args[1]}`);
        log('Usage: npx osi-cards generate section <name>');
      }
      break;

    case 'validate':
      validateConfig(args[1]);
      break;

    case 'preview':
      previewConfig(args[1]);
      break;

    case 'doctor':
      runDoctor();
      break;

    case 'list-sections':
    case 'list':
      listSections();
      break;

    case 'info':
      sectionInfo(args[1]);
      break;

    case 'sync':
      syncAll();
      break;

    default:
      error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();




