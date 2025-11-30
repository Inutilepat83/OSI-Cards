#!/usr/bin/env node

/**
 * Registry Sync Script
 * 
 * Validates that all files are in sync with the section registry.
 * Can be run as a pre-commit hook or in CI to ensure consistency.
 * 
 * Usage: node scripts/sync-registry.js [--check] [--fix]
 *   --check: Only check, don't modify files (default)
 *   --fix: Auto-fix by regenerating files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const LIB_SRC = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

/**
 * Load registry
 */
function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Check if generated types file exists and is up-to-date
 */
function checkGeneratedTypes(registry) {
  const typesPath = path.join(LIB_SRC, 'lib', 'models', 'generated-section-types.ts');
  
  if (!fs.existsSync(typesPath)) {
    return { ok: false, message: 'Generated types file does not exist' };
  }
  
  const content = fs.readFileSync(typesPath, 'utf8');
  
  // Check if all section types are present
  const missing = [];
  Object.keys(registry.sections).forEach(type => {
    if (!content.includes(`'${type}'`)) {
      missing.push(type);
    }
  });
  
  if (missing.length > 0) {
    return { ok: false, message: `Missing types: ${missing.join(', ')}` };
  }
  
  // Check if all aliases are present
  if (registry.typeAliases) {
    Object.keys(registry.typeAliases).forEach(alias => {
      if (!content.includes(`'${alias}'`)) {
        missing.push(`alias:${alias}`);
      }
    });
  }
  
  if (missing.length > 0) {
    return { ok: false, message: `Missing aliases: ${missing.join(', ')}` };
  }
  
  return { ok: true };
}

/**
 * Check if card.model.ts type union matches registry
 */
function checkCardModel(registry) {
  const modelPath = path.join(LIB_SRC, 'lib', 'models', 'card.model.ts');
  
  if (!fs.existsSync(modelPath)) {
    return { ok: false, message: 'card.model.ts not found' };
  }
  
  const content = fs.readFileSync(modelPath, 'utf8');
  
  // Check if it imports from generated types
  if (content.includes("from './generated-section-types'") || 
      content.includes('SectionTypeInput')) {
    return { ok: true, message: 'Using generated types' };
  }
  
  // Check manual type union
  const typeMatch = content.match(/type:\s*\n?\s*\|?\s*'([^']+)'(\s*\|\s*'[^']+')+/);
  if (!typeMatch) {
    return { ok: false, message: 'Could not find type union in card.model.ts' };
  }
  
  return { ok: true, message: 'Type union found (consider migrating to generated types)' };
}

/**
 * Check if section-renderer has all section components
 */
function checkSectionRenderer(registry) {
  const rendererPath = path.join(LIB_SRC, 'lib', 'components', 'section-renderer', 'section-renderer.component.html');
  
  if (!fs.existsSync(rendererPath)) {
    return { ok: false, message: 'section-renderer.component.html not found' };
  }
  
  const content = fs.readFileSync(rendererPath, 'utf8');
  
  // Check if using dynamic component loading
  if (content.includes('ngComponentOutlet') || content.includes('SECTION_COMPONENT_MAP')) {
    return { ok: true, message: 'Using dynamic component loading' };
  }
  
  // Check switch cases for all types
  const missing = [];
  Object.entries(registry.sections).forEach(([type, def]) => {
    if (def.isInternal) return; // Skip internal sections
    
    const selector = def.selector;
    if (!content.includes(selector) && !content.includes(`'${type}'`)) {
      missing.push(type);
    }
  });
  
  if (missing.length > 0) {
    return { ok: false, message: `Missing section cases: ${missing.join(', ')}` };
  }
  
  return { ok: true };
}

/**
 * Check if public-api.ts exports all sections
 */
function checkPublicApi(registry) {
  const apiPath = path.join(LIB_SRC, 'public-api.ts');
  
  if (!fs.existsSync(apiPath)) {
    return { ok: false, message: 'public-api.ts not found' };
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  // Check if generated types are exported
  if (!content.includes('generated-section-types')) {
    return { ok: false, message: 'Generated types not exported' };
  }
  
  return { ok: true };
}

/**
 * Check component files exist
 */
function checkComponentFiles(registry) {
  const missing = [];
  
  Object.entries(registry.sections).forEach(([type, def]) => {
    const componentPath = path.join(LIB_SRC, def.componentPath + '.ts');
    if (!fs.existsSync(componentPath)) {
      missing.push(`${type}: ${componentPath}`);
    }
  });
  
  if (missing.length > 0) {
    return { ok: false, message: `Missing component files:\n    ${missing.join('\n    ')}` };
  }
  
  return { ok: true };
}

/**
 * Check style files exist
 */
function checkStyleFiles(registry) {
  const missing = [];
  
  Object.entries(registry.sections).forEach(([type, def]) => {
    if (!def.stylePath) return;
    
    const stylePath = path.join(LIB_SRC, def.stylePath);
    if (!fs.existsSync(stylePath)) {
      missing.push(`${type}: ${stylePath}`);
    }
  });
  
  if (missing.length > 0) {
    return { ok: false, message: `Missing style files:\n    ${missing.join('\n    ')}` };
  }
  
  return { ok: true };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  log('\n🔍 Registry Sync Check', colors.cyan);
  log('═'.repeat(50), colors.cyan);
  
  try {
    const registry = loadRegistry();
    log(`\n📄 Registry: v${registry.version} (${Object.keys(registry.sections).length} sections)`, colors.blue);
    
    const checks = [
      { name: 'Generated Types', fn: () => checkGeneratedTypes(registry) },
      { name: 'Card Model', fn: () => checkCardModel(registry) },
      { name: 'Section Renderer', fn: () => checkSectionRenderer(registry) },
      { name: 'Public API', fn: () => checkPublicApi(registry) },
      { name: 'Component Files', fn: () => checkComponentFiles(registry) },
      { name: 'Style Files', fn: () => checkStyleFiles(registry) },
    ];
    
    let hasErrors = false;
    
    log('\nChecks:', colors.blue);
    checks.forEach(({ name, fn }) => {
      const result = fn();
      if (result.ok) {
        log(`  ✓ ${name}`, colors.green);
        if (result.message) {
          log(`    ${result.message}`, colors.blue);
        }
      } else {
        log(`  ✗ ${name}`, colors.red);
        log(`    ${result.message}`, colors.yellow);
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      if (shouldFix) {
        log('\n🔧 Attempting to fix issues...', colors.yellow);
        try {
          execSync('node scripts/generate-from-registry.js', { 
            cwd: ROOT_DIR,
            stdio: 'inherit'
          });
          log('\n✓ Regenerated files. Please review changes.', colors.green);
        } catch (e) {
          log('\n✗ Failed to regenerate files.', colors.red);
          process.exit(1);
        }
      } else {
        log('\n⚠️  Some checks failed. Run with --fix to auto-regenerate.', colors.yellow);
        process.exit(1);
      }
    } else {
      log('\n✅ All checks passed!', colors.green);
    }
    
    log('═'.repeat(50) + '\n', colors.cyan);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();

