#!/usr/bin/env node

/**
 * Unified Generate CLI
 *
 * Consolidates all generation scripts into a single, interactive interface.
 * All existing scripts are preserved - this is a wrapper/orchestrator.
 *
 * Usage:
 *   node scripts/generate.js                    - Interactive mode
 *   node scripts/generate.js --all              - Generate everything
 *   node scripts/generate.js --registry         - Registry-related generation
 *   node scripts/generate.js --docs             - Documentation generation
 *   node scripts/generate.js --tests            - Test-related generation
 *   node scripts/generate.js --styles           - Style generation
 *   node scripts/generate.js --api              - API/public exports
 *   node scripts/generate.js --help             - Show help
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

// Script mappings - all existing scripts preserved
const SCRIPTS = {
  registry: {
    fromRegistry: 'scripts/generate-from-registry.js',
    compileRegistry: 'scripts/compile-section-registry.js',
    manifest: 'scripts/generate-section-manifest.js',
    fixtures: 'scripts/generate-registry-fixtures.js',
  },
  docs: {
    comprehensive: 'scripts/generate-comprehensive-docs.js',
    remaining: 'scripts/generate-remaining-docs.js',
    fromRegistry: 'scripts/generate-docs-from-registry.js',
    pages: 'scripts/generate-doc-page-components.js',
    routes: 'scripts/generate-all-routes.js',
    ngdocPages: 'scripts/generate-ngdoc-pages.js',
    ngdocRoutes: 'scripts/generate-ngdoc-routes.js',
    readme: 'scripts/generate-readme-from-ngdoc.js',
    docsReadme: 'scripts/generate-docs-readme.js',
    llm: 'scripts/generate-llm-docs.js',
    llmPrompt: 'scripts/generate-llm-prompt.js',
    openapi: 'scripts/generate-openapi.js',
    apiDocs: 'scripts/generate-api-docs.js',
    sections: 'scripts/generate-section-docs.js',
    extractJsdoc: 'scripts/extract-jsdoc.js',
  },
  tests: {
    testSuite: 'scripts/generate-test-suite.js',
    testConfigs: 'scripts/generate-test-configs.js',
  },
  styles: {
    styleBundle: 'scripts/generate-style-bundle.js',
    compileStyles: 'scripts/compile-styles.js',
    standaloneCSS: 'scripts/build-standalone-css.js',
  },
  api: {
    publicApi: 'scripts/generate-public-api.js',
    libraryPackage: 'scripts/generate-library-package-json.js',
  },
  version: {
    version: 'scripts/generate-version.js',
  },
  build: {
    manifest: 'scripts/generate-manifest.js',
    skeletonTypes: 'scripts/generate-skeleton-types.js',
  },
};

// Generation workflows
const WORKFLOWS = {
  all: () => {
    logHeader('Generate All');
    logInfo('Running all generation scripts...\n');

    const steps = [
      { script: SCRIPTS.registry.fromRegistry, desc: 'Generate from registry' },
      { script: SCRIPTS.registry.fixtures, desc: 'Generate registry fixtures' },
      { script: SCRIPTS.styles.styleBundle, desc: 'Generate style bundle' },
      { script: SCRIPTS.registry.manifest, desc: 'Generate section manifest' },
      { script: SCRIPTS.build.skeletonTypes, desc: 'Generate skeleton types' },
      { script: SCRIPTS.tests.testSuite, desc: 'Generate test suite' },
      { script: SCRIPTS.api.publicApi, desc: 'Generate public API' },
      { script: SCRIPTS.docs.llmPrompt, desc: 'Generate LLM prompt' },
      { script: SCRIPTS.docs.fromRegistry, desc: 'Generate docs from registry' },
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
    logSuccess(`Completed: ${success} tasks succeeded`);
    if (failed > 0) {
      logError(`Failed: ${failed} tasks failed`);
    }
  },

  registry: () => {
    logHeader('Registry Generation');
    runScript(SCRIPTS.registry.compileRegistry, 'Compile section registry');
    runScript(SCRIPTS.registry.fromRegistry, 'Generate from registry');
    runScript(SCRIPTS.registry.manifest, 'Generate section manifest');
    runScript(SCRIPTS.registry.fixtures, 'Generate registry fixtures');
  },

  docs: () => {
    logHeader('Documentation Generation');
    runScript(SCRIPTS.docs.comprehensive, 'Generate comprehensive docs');
    runScript(SCRIPTS.docs.remaining, 'Generate remaining docs');
    runScript(SCRIPTS.docs.pages, 'Generate doc page components');
    runScript(SCRIPTS.docs.routes, 'Generate all routes');
    runScript(SCRIPTS.docs.fromRegistry, 'Generate docs from registry');
  },

  tests: () => {
    logHeader('Test Generation');
    runScript(SCRIPTS.tests.testConfigs, 'Generate test configs');
    runScript(SCRIPTS.tests.testSuite, 'Generate test suite');
  },

  styles: () => {
    logHeader('Style Generation');
    runScript(SCRIPTS.styles.styleBundle, 'Generate style bundle');
    runScript(SCRIPTS.styles.compileStyles, 'Compile styles');
  },

  api: () => {
    logHeader('API Generation');
    runScript(SCRIPTS.api.publicApi, 'Generate public API');
    runScript(SCRIPTS.api.libraryPackage, 'Generate library package.json');
  },
};

// Interactive mode
async function interactiveMode() {
  logHeader('OSI-Cards Generation CLI');
  log('\nSelect what to generate:\n', colors.bright);

  log('  1. All (complete generation pipeline)', colors.green);
  log('  2. Registry (types, manifest, fixtures)');
  log('  3. Documentation (comprehensive docs)');
  log('  4. Tests (test suite and configs)');
  log('  5. Styles (style bundles)');
  log('  6. API (public exports and package.json)');
  log('  7. Exit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter choice (1-7): ', (answer) => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          WORKFLOWS.all();
          break;
        case '2':
          WORKFLOWS.registry();
          break;
        case '3':
          WORKFLOWS.docs();
          break;
        case '4':
          WORKFLOWS.tests();
          break;
        case '5':
          WORKFLOWS.styles();
          break;
        case '6':
          WORKFLOWS.api();
          break;
        case '7':
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
  logHeader('OSI-Cards Generation CLI - Help');
  log('\nUsage:', colors.bright);
  log('  node scripts/generate.js [options]\n');
  log('Options:', colors.bright);
  log('  --all       Generate everything (complete pipeline)');
  log('  --registry  Generate registry-related files');
  log('  --docs      Generate documentation');
  log('  --tests     Generate test files');
  log('  --styles    Generate style bundles');
  log('  --api       Generate public API exports');
  log('  --help      Show this help message\n');
  log('Interactive:', colors.bright);
  log('  Run without arguments for interactive mode\n');
  log('Legacy Scripts:', colors.bright + colors.dim);
  log('  All individual scripts are preserved in scripts/ directory');
  log('  You can still run them directly if needed\n');
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
  } else if (args.includes('--registry')) {
    WORKFLOWS.registry();
  } else if (args.includes('--docs')) {
    WORKFLOWS.docs();
  } else if (args.includes('--tests')) {
    WORKFLOWS.tests();
  } else if (args.includes('--styles')) {
    WORKFLOWS.styles();
  } else if (args.includes('--api')) {
    WORKFLOWS.api();
  } else {
    logError('Unknown option. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});








