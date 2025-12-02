#!/usr/bin/env node

/**
 * Unified Version Management CLI
 *
 * Consolidates all version-related scripts into a single interface.
 * All existing version scripts are preserved - this is a wrapper/orchestrator.
 *
 * Usage:
 *   node scripts/version.js                 - Interactive mode (bump version)
 *   node scripts/version.js patch           - Bump patch version
 *   node scripts/version.js minor           - Bump minor version
 *   node scripts/version.js major           - Bump major version
 *   node scripts/version.js prerelease      - Bump prerelease version
 *   node scripts/version.js --check         - Check version synchronization
 *   node scripts/version.js --show          - Show current version
 *   node scripts/version.js --sync          - Sync version across files
 *   node scripts/version.js --help          - Show help
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
  magenta: '\x1b[35m',
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
function runScript(scriptPath, args = '', description = '') {
  try {
    if (description) log(`\n▶ ${description}...`, colors.cyan);
    const cmd = `node ${scriptPath} ${args}`.trim();
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    if (description) logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    if (description) logError(`${description} failed: ${error.message}`);
    return false;
  }
}

// Version script mappings - all existing scripts preserved
const VERSION_SCRIPTS = {
  sync: 'scripts/version-sync.js',
  generate: 'scripts/generate-version.js',
  detectBump: 'scripts/detect-version-bump.js',
  manager: 'scripts/version-manager.js',
};

// Get current version
function getCurrentVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return pkg.version;
  } catch (error) {
    return 'unknown';
  }
}

// Version workflows
const WORKFLOWS = {
  bump: (type) => {
    logHeader(`Bump ${type.toUpperCase()} Version`);
    const currentVersion = getCurrentVersion();
    log(`Current version: ${currentVersion}\n`, colors.dim);

    if (runScript(VERSION_SCRIPTS.sync, type, `Bump ${type} version`)) {
      const newVersion = getCurrentVersion();
      log('');
      logSuccess(`Version bumped: ${currentVersion} → ${newVersion}`);
      logInfo('Version synchronized across all files');
    }
  },

  check: () => {
    logHeader('Check Version Synchronization');
    runScript(VERSION_SCRIPTS.sync, '--check', 'Check version sync');
  },

  show: () => {
    logHeader('Current Version Information');
    runScript(VERSION_SCRIPTS.sync, '--show', 'Show version info');
  },

  sync: () => {
    logHeader('Synchronize Version');
    runScript(VERSION_SCRIPTS.sync, '', 'Sync version across files');
  },

  generate: () => {
    logHeader('Generate Version File');
    runScript(VERSION_SCRIPTS.generate, '', 'Generate version.ts');
  },

  detectBump: () => {
    logHeader('Detect Version Bump Type');
    runScript(VERSION_SCRIPTS.detectBump, '', 'Detect version bump');
  },
};

// Interactive mode
async function interactiveMode() {
  logHeader('OSI-Cards Version Management');
  const currentVersion = getCurrentVersion();
  log(`\nCurrent version: ${colors.bright}${currentVersion}${colors.reset}\n`);
  log('Select version bump type:\n', colors.bright);

  log('  1. Patch (bug fixes) - 1.0.0 → 1.0.1', colors.green);
  log('  2. Minor (features) - 1.0.0 → 1.1.0', colors.cyan);
  log('  3. Major (breaking) - 1.0.0 → 2.0.0', colors.yellow);
  log('  4. Prerelease - 1.0.0 → 1.0.1-0', colors.magenta);
  log('  5. Check sync status');
  log('  6. Show version info');
  log('  7. Sync version (no bump)');
  log('  0. Exit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter choice (0-7): ', (answer) => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          WORKFLOWS.bump('patch');
          break;
        case '2':
          WORKFLOWS.bump('minor');
          break;
        case '3':
          WORKFLOWS.bump('major');
          break;
        case '4':
          WORKFLOWS.bump('prerelease');
          break;
        case '5':
          WORKFLOWS.check();
          break;
        case '6':
          WORKFLOWS.show();
          break;
        case '7':
          WORKFLOWS.sync();
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
  logHeader('OSI-Cards Version Management CLI - Help');
  log('\nUsage:', colors.bright);
  log('  node scripts/version.js [command|option]\n');
  log('Commands:', colors.bright);
  log('  patch          Bump patch version (1.0.0 → 1.0.1)');
  log('  minor          Bump minor version (1.0.0 → 1.1.0)');
  log('  major          Bump major version (1.0.0 → 2.0.0)');
  log('  prerelease     Bump prerelease version (1.0.0 → 1.0.1-0)\n');
  log('Options:', colors.bright);
  log('  --check        Check if versions are synchronized');
  log('  --show         Show current version information');
  log('  --sync         Synchronize version across all files');
  log('  --help         Show this help message\n');
  log('Interactive:', colors.bright);
  log('  Run without arguments for interactive mode\n');
  log('Legacy Scripts:', colors.bright + colors.dim);
  log('  All individual scripts are preserved in scripts/ directory');
  log('  - scripts/version-sync.js');
  log('  - scripts/generate-version.js');
  log('  - scripts/detect-version-bump.js');
  log('  - scripts/version-manager.js\n');
  log('Examples:', colors.bright);
  log('  node scripts/version.js patch');
  log('  node scripts/version.js minor');
  log('  node scripts/version.js --check\n');
  log('Version Files Updated:', colors.bright);
  log('  - package.json');
  log('  - projects/osi-cards-lib/package.json');
  log('  - src/version.ts');
  log('  - docs/openapi.yaml');
  log('  - CHANGELOG.md\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveMode();
  } else if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else if (args.includes('--check')) {
    WORKFLOWS.check();
  } else if (args.includes('--show')) {
    WORKFLOWS.show();
  } else if (args.includes('--sync')) {
    WORKFLOWS.sync();
  } else if (args.includes('patch')) {
    WORKFLOWS.bump('patch');
  } else if (args.includes('minor')) {
    WORKFLOWS.bump('minor');
  } else if (args.includes('major')) {
    WORKFLOWS.bump('major');
  } else if (args.includes('prerelease')) {
    WORKFLOWS.bump('prerelease');
  } else {
    logError('Unknown option. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

