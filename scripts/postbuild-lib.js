#!/usr/bin/env node

/**
 * Post-Build Library Processing
 *
 * Consolidates all post-build tasks for the library into a single script.
 * Runs after ng build osi-cards-lib completes.
 *
 * Tasks:
 * 1. Generate library package.json
 * 2. Copy library files (README, LICENSE, etc.)
 * 3. Compile styles (SCSS to CSS)
 *
 * Usage:
 *   node scripts/postbuild-lib.js
 */

const { execSync } = require('child_process');
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

// Main execution
function main() {
  logHeader('Post-Build Library Processing');
  logInfo('Running post-build tasks for osi-cards-lib...\n');

  const tasks = [
    { script: 'scripts/generate-library-package-json.js', desc: 'Generate library package.json' },
    { script: 'scripts/copy-library-files.js', desc: 'Copy library files' },
    { script: 'scripts/compile-styles.js', desc: 'Compile styles' },
  ];

  let success = 0;
  let failed = 0;

  for (const task of tasks) {
    if (runScript(task.script, task.desc)) {
      success++;
    } else {
      failed++;
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);

  if (failed === 0) {
    logSuccess(`All post-build tasks completed successfully (${success}/${tasks.length})`);
    logInfo('\nLibrary build artifacts are ready in dist/osi-cards-lib/');
  } else {
    logError(`Post-build completed with errors: ${failed}/${tasks.length} tasks failed`);
    process.exit(1);
  }
}

main();


