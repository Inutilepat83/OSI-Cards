#!/usr/bin/env node

/**
 * Unified Validation CLI
 *
 * Consolidates all validation scripts into a single interface.
 * All existing validation scripts are preserved - this is a wrapper/orchestrator.
 *
 * Usage:
 *   node scripts/validate.js                - Interactive mode
 *   node scripts/validate.js --all          - Run all validations
 *   node scripts/validate.js --exports      - Validate barrel exports
 *   node scripts/validate.js --card         - Validate card configurations
 *   node scripts/validate.js --sections     - Validate section usage
 *   node scripts/validate.js --help         - Show help
 */

const { execSync } = require('child_process');
const readline = require('readline');
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

function logWarning(msg) {
  log(`⚠ ${msg}`, colors.yellow);
}

function logInfo(msg) {
  log(`ℹ ${msg}`, colors.blue);
}

// Execute a script and handle errors
function runScript(scriptPath, description) {
  try {
    log(`\n▶ ${description}...`, colors.cyan);
    execSync(`node ${scriptPath}`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

// Validation script mappings - all existing scripts preserved
const VALIDATION_SCRIPTS = {
  exports: {
    barrel: 'scripts/validate-barrel-exports.js',
    verify: 'scripts/verify-exports.js',
  },
  cards: {
    validate: 'scripts/validate-card.js',
  },
  sections: {
    usage: 'scripts/validate-section-usage.js',
  },
  dependencies: {
    check: 'scripts/check-dependencies.js',
  },
  files: {
    sizes: 'scripts/check-file-sizes.js',
  },
};

// Validation workflows
const WORKFLOWS = {
  all: () => {
    logHeader('Run All Validations');
    logInfo('Running comprehensive validation suite...\n');

    const steps = [
      { script: VALIDATION_SCRIPTS.exports.barrel, desc: 'Validate barrel exports' },
      { script: VALIDATION_SCRIPTS.exports.verify, desc: 'Verify exports' },
      { script: VALIDATION_SCRIPTS.cards.validate, desc: 'Validate card configurations' },
      { script: VALIDATION_SCRIPTS.sections.usage, desc: 'Validate section usage' },
      { script: VALIDATION_SCRIPTS.dependencies.check, desc: 'Check dependencies' },
      { script: VALIDATION_SCRIPTS.files.sizes, desc: 'Check file sizes' },
    ];

    let success = 0;
    let failed = 0;

    for (const step of steps) {
      if (runScript(step.script, step.desc)) {
        success++;
      } else {
        failed++;
      }
    }

    log('\n' + '═'.repeat(70), colors.cyan);
    logSuccess(`Validation completed: ${success} checks passed`);
    if (failed > 0) {
      logError(`${failed} checks failed`);
    }
  },

  exports: () => {
    logHeader('Export Validations');
    runScript(VALIDATION_SCRIPTS.exports.barrel, 'Validate barrel exports');
    runScript(VALIDATION_SCRIPTS.exports.verify, 'Verify exports');
    logInfo('\nFor detailed report: node scripts/validate-barrel-exports.js --report');
    logInfo('For strict mode: node scripts/validate-barrel-exports.js --strict');
  },

  cards: () => {
    logHeader('Card Configuration Validation');
    runScript(VALIDATION_SCRIPTS.cards.validate, 'Validate card configurations');
  },

  sections: () => {
    logHeader('Section Usage Validation');
    runScript(VALIDATION_SCRIPTS.sections.usage, 'Validate section usage');
  },

  dependencies: () => {
    logHeader('Dependency Validation');
    runScript(VALIDATION_SCRIPTS.dependencies.check, 'Check dependencies');
  },

  files: () => {
    logHeader('File Size Validation');
    runScript(VALIDATION_SCRIPTS.files.sizes, 'Check file sizes');
  },
};

// Interactive mode
async function interactiveMode() {
  logHeader('OSI-Cards Validation CLI');
  log('\nSelect validation to run:\n', colors.bright);

  log('  1. All (comprehensive validation)', colors.green);
  log('  2. Exports (barrel exports, verify)');
  log('  3. Cards (card configurations)');
  log('  4. Sections (section usage)');
  log('  5. Dependencies (dependency check)');
  log('  6. Files (file sizes)');
  log('  0. Exit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter choice (0-6): ', (answer) => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          WORKFLOWS.all();
          break;
        case '2':
          WORKFLOWS.exports();
          break;
        case '3':
          WORKFLOWS.cards();
          break;
        case '4':
          WORKFLOWS.sections();
          break;
        case '5':
          WORKFLOWS.dependencies();
          break;
        case '6':
          WORKFLOWS.files();
          break;
        case '0':
          log('Exiting...', colors.dim);
          break;
        default:
          logError('Invalid choice');
      }

      resolve();
    });
  });
}

// Show help
function showHelp() {
  logHeader('OSI-Cards Validation CLI - Help');
  log('\nUsage:', colors.bright);
  log('  node scripts/validate.js [options]\n');
  log('Options:', colors.bright);
  log('  --all           Run all validations');
  log('  --exports       Validate barrel exports');
  log('  --cards         Validate card configurations');
  log('  --sections      Validate section usage');
  log('  --dependencies  Check dependencies');
  log('  --files         Check file sizes');
  log('  --help          Show this help message\n');
  log('Interactive:', colors.bright);
  log('  Run without arguments for interactive mode\n');
  log('Legacy Scripts:', colors.bright + colors.dim);
  log('  All individual scripts are preserved in scripts/ directory');
  log('  You can still run them directly if needed\n');
  log('Examples:', colors.bright);
  log('  node scripts/validate.js --all');
  log('  node scripts/validate.js --exports');
  log('  node scripts/validate-barrel-exports.js --strict    (direct access)\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveMode();
  } else if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else if (args.includes('--all')) {
    WORKFLOWS.all();
  } else if (args.includes('--exports')) {
    WORKFLOWS.exports();
  } else if (args.includes('--cards')) {
    WORKFLOWS.cards();
  } else if (args.includes('--sections')) {
    WORKFLOWS.sections();
  } else if (args.includes('--dependencies')) {
    WORKFLOWS.dependencies();
  } else if (args.includes('--files')) {
    WORKFLOWS.files();
  } else {
    logError('Unknown option. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

