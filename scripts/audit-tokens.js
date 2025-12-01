#!/usr/bin/env node

/**
 * Token Audit Script
 * 
 * Analyzes SCSS files to detect:
 * - Duplicate CSS variable definitions
 * - Inconsistent values between files
 * - Deprecated variable usage
 * - Missing variables
 * 
 * Usage: node scripts/audit-tokens.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  stylesDir: 'projects/osi-cards-lib/src/lib/styles',
  deprecatedVars: [
    '--master-color',
    '--master-color-dark',
    '--master-color-light',
    '--bg-color',
    '--card-bg',
    '--section-bg',
    '--text-color',
    '--text-muted',
    '--primary-color',
    '--secondary-color',
    '--font-section-label',
    '--font-section-value',
    '--font-section-meta',
    '--font-chart-label',
    '--font-chart-value',
    '--font-contact-name',
    '--font-list-title',
  ],
  requiredVars: [
    '--color-brand',
    '--foreground',
    '--background',
    '--card',
    '--muted',
    '--border',
  ]
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log('bold', title);
  console.log('='.repeat(60));
}

/**
 * Extract CSS variable definitions from SCSS content
 */
function extractVariableDefinitions(content, filename) {
  const definitions = [];
  const regex = /--([\w-]+):\s*([^;]+);/g;
  let match;
  let lineNumber = 1;
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    regex.lastIndex = 0;
    while ((match = regex.exec(line)) !== null) {
      definitions.push({
        name: `--${match[1]}`,
        value: match[2].trim(),
        file: filename,
        line: i + 1,
      });
    }
  }
  
  return definitions;
}

/**
 * Extract CSS variable usages from SCSS content
 */
function extractVariableUsages(content, filename) {
  const usages = [];
  const regex = /var\(\s*--([\w-]+)/g;
  let match;
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    regex.lastIndex = 0;
    while ((match = regex.exec(line)) !== null) {
      usages.push({
        name: `--${match[1]}`,
        file: filename,
        line: i + 1,
      });
    }
  }
  
  return usages;
}

/**
 * Find duplicate variable definitions
 */
function findDuplicates(definitions) {
  const byName = {};
  
  definitions.forEach(def => {
    if (!byName[def.name]) {
      byName[def.name] = [];
    }
    byName[def.name].push(def);
  });
  
  const duplicates = {};
  Object.keys(byName).forEach(name => {
    if (byName[name].length > 1) {
      duplicates[name] = byName[name];
    }
  });
  
  return duplicates;
}

/**
 * Find inconsistent values for the same variable
 */
function findInconsistentValues(duplicates) {
  const inconsistent = {};
  
  Object.keys(duplicates).forEach(name => {
    const values = new Set(duplicates[name].map(d => d.value));
    if (values.size > 1) {
      inconsistent[name] = duplicates[name];
    }
  });
  
  return inconsistent;
}

/**
 * Find deprecated variable usage
 */
function findDeprecatedUsage(usages) {
  return usages.filter(usage => 
    CONFIG.deprecatedVars.includes(usage.name)
  );
}

/**
 * Check for missing required variables
 */
function findMissingRequired(definitions) {
  const definedNames = new Set(definitions.map(d => d.name));
  return CONFIG.requiredVars.filter(v => !definedNames.has(v));
}

/**
 * Main audit function
 */
async function audit(options = {}) {
  const { verbose = false } = options;
  
  header('OSI Cards Token Audit');
  log('cyan', `Scanning: ${CONFIG.stylesDir}`);
  
  // Find all SCSS files
  const files = glob.sync(`${CONFIG.stylesDir}/**/*.scss`);
  log('blue', `Found ${files.length} SCSS files`);
  
  let allDefinitions = [];
  let allUsages = [];
  
  // Process each file
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    
    allDefinitions = allDefinitions.concat(extractVariableDefinitions(content, relativePath));
    allUsages = allUsages.concat(extractVariableUsages(content, relativePath));
  });
  
  log('blue', `Found ${allDefinitions.length} variable definitions`);
  log('blue', `Found ${allUsages.length} variable usages`);
  
  // Analyze
  const duplicates = findDuplicates(allDefinitions);
  const inconsistent = findInconsistentValues(duplicates);
  const deprecatedUsage = findDeprecatedUsage(allUsages);
  const missingRequired = findMissingRequired(allDefinitions);
  
  let issues = 0;
  
  // Report duplicates
  header('Duplicate Variable Definitions');
  const duplicateCount = Object.keys(duplicates).length;
  if (duplicateCount > 0) {
    log('yellow', `Found ${duplicateCount} variables defined multiple times`);
    
    if (verbose) {
      Object.keys(duplicates).forEach(name => {
        console.log(`\n  ${name}:`);
        duplicates[name].forEach(d => {
          console.log(`    - ${d.file}:${d.line}`);
        });
      });
    } else {
      console.log('  Run with --verbose to see details');
    }
    issues += duplicateCount;
  } else {
    log('green', 'No duplicate definitions found');
  }
  
  // Report inconsistent values
  header('Inconsistent Variable Values');
  const inconsistentCount = Object.keys(inconsistent).length;
  if (inconsistentCount > 0) {
    log('red', `Found ${inconsistentCount} variables with inconsistent values`);
    
    Object.keys(inconsistent).forEach(name => {
      console.log(`\n  ${colors.bold}${name}${colors.reset}:`);
      inconsistent[name].forEach(d => {
        console.log(`    ${d.file}:${d.line}`);
        console.log(`      Value: ${colors.cyan}${d.value}${colors.reset}`);
      });
    });
    issues += inconsistentCount;
  } else {
    log('green', 'No inconsistent values found');
  }
  
  // Report deprecated usage
  header('Deprecated Variable Usage');
  if (deprecatedUsage.length > 0) {
    log('yellow', `Found ${deprecatedUsage.length} uses of deprecated variables`);
    
    if (verbose) {
      deprecatedUsage.forEach(u => {
        console.log(`  ${u.name} in ${u.file}:${u.line}`);
      });
    } else {
      // Group by variable name
      const grouped = {};
      deprecatedUsage.forEach(u => {
        if (!grouped[u.name]) grouped[u.name] = 0;
        grouped[u.name]++;
      });
      Object.keys(grouped).forEach(name => {
        console.log(`  ${name}: ${grouped[name]} usages`);
      });
    }
    issues += deprecatedUsage.length;
  } else {
    log('green', 'No deprecated variable usage found');
  }
  
  // Report missing required
  header('Missing Required Variables');
  if (missingRequired.length > 0) {
    log('red', `Missing ${missingRequired.length} required variables:`);
    missingRequired.forEach(v => {
      console.log(`  - ${v}`);
    });
    issues += missingRequired.length;
  } else {
    log('green', 'All required variables are defined');
  }
  
  // Summary
  header('Summary');
  if (issues === 0) {
    log('green', '✓ No issues found!');
  } else {
    log('yellow', `Found ${issues} total issues to review`);
  }
  
  console.log('\n');
  
  return { issues, duplicates, inconsistent, deprecatedUsage, missingRequired };
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  fix: args.includes('--fix'),
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Token Audit Script

Usage: node scripts/audit-tokens.js [options]

Options:
  --verbose, -v   Show detailed output
  --help, -h      Show this help message

Reports:
  - Duplicate variable definitions across files
  - Inconsistent values for the same variable
  - Usage of deprecated variables
  - Missing required variables
`);
  process.exit(0);
}

audit(options).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});









