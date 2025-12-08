#!/usr/bin/env node

/**
 * Unified Documentation CLI
 *
 * Consolidates all documentation generation scripts into a single interface.
 * All existing documentation scripts are preserved - this is a wrapper/orchestrator.
 *
 * Usage:
 *   node scripts/docs.js                    - Interactive mode
 *   node scripts/docs.js --all              - Build all documentation
 *   node scripts/docs.js --comprehensive    - Comprehensive docs
 *   node scripts/docs.js --api              - API reference (TypeDoc)
 *   node scripts/docs.js --pages            - Doc page components
 *   node scripts/docs.js --routes           - Route generation
 *   node scripts/docs.js --registry         - Registry-based docs
 *   node scripts/docs.js --openapi          - OpenAPI specification
 *   node scripts/docs.js --readme           - README files
 *   node scripts/docs.js --watch            - Watch mode (regenerate on changes)
 *   node scripts/docs.js --help             - Show help
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

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
function runScript(scriptPath, description, silent = false) {
  try {
    if (!silent) log(`\n▶ ${description}...`, colors.cyan);
    const stdio = silent ? 'pipe' : 'inherit';
    execSync(`node ${scriptPath}`, { stdio, cwd: path.join(__dirname, '..') });
    if (!silent) logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    if (!silent) logError(`${description} failed: ${error.message}`);
    return false;
  }
}

// Documentation script mappings - all existing scripts preserved
const DOC_SCRIPTS = {
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
  regenerateAll: 'scripts/regenerate-all-doc-pages.js',
  regenerate: 'scripts/regenerate-doc-pages.js',
};

// Documentation workflows
const WORKFLOWS = {
  all: () => {
    logHeader('Build All Documentation');
    logInfo('Running complete documentation pipeline...\n');

    const steps = [
      { script: DOC_SCRIPTS.comprehensive, desc: 'Generate comprehensive docs' },
      { script: DOC_SCRIPTS.remaining, desc: 'Generate remaining docs' },
      { script: DOC_SCRIPTS.pages, desc: 'Generate doc page components' },
      { script: DOC_SCRIPTS.routes, desc: 'Generate routes' },
      { script: DOC_SCRIPTS.fromRegistry, desc: 'Generate docs from registry' },
      { script: DOC_SCRIPTS.llmPrompt, desc: 'Generate LLM prompt' },
      { script: DOC_SCRIPTS.openapi, desc: 'Generate OpenAPI spec' },
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
    logSuccess(`Documentation build completed: ${success} tasks succeeded`);
    if (failed > 0) {
      logError(`${failed} tasks failed`);
    }

    logInfo('\nTo view documentation:');
    log('  npm run docs:serve', colors.dim);
  },

  comprehensive: () => {
    logHeader('Comprehensive Documentation');
    runScript(DOC_SCRIPTS.comprehensive, 'Generate comprehensive docs');
    runScript(DOC_SCRIPTS.remaining, 'Generate remaining docs');
  },

  api: () => {
    logHeader('API Reference Documentation');
    logInfo('Running TypeDoc...');
    try {
      execSync('npm run docs:api', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      logSuccess('API documentation generated');
    } catch (error) {
      logError('API documentation failed');
    }
  },

  pages: () => {
    logHeader('Documentation Page Components');
    runScript(DOC_SCRIPTS.pages, 'Generate doc page components');
    runScript(DOC_SCRIPTS.ngdocPages, 'Generate NgDoc pages');
  },

  routes: () => {
    logHeader('Documentation Routes');
    runScript(DOC_SCRIPTS.routes, 'Generate all routes');
    runScript(DOC_SCRIPTS.ngdocRoutes, 'Generate NgDoc routes');
  },

  registry: () => {
    logHeader('Registry-Based Documentation');
    runScript(DOC_SCRIPTS.fromRegistry, 'Generate docs from registry');
    runScript(DOC_SCRIPTS.sections, 'Generate section docs');
  },

  openapi: () => {
    logHeader('OpenAPI Specification');
    runScript(DOC_SCRIPTS.openapi, 'Generate OpenAPI spec');
  },

  readme: () => {
    logHeader('README Generation');
    runScript(DOC_SCRIPTS.readme, 'Generate README from NgDoc');
    runScript(DOC_SCRIPTS.docsReadme, 'Generate docs README');
  },

  watch: () => {
    logHeader('Documentation Watch Mode');
    logInfo('Watching for changes...');
    logWarning('Press Ctrl+C to stop\n');

    const watchPaths = [
      'projects/osi-cards-lib/src/lib/**/*.ts',
      'projects/osi-cards-lib/section-registry.json',
      'docs/**/*.md',
      'src/app/features/documentation/**/*.md',
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    let timeout;

    watcher.on('change', (filePath) => {
      log(`\n📝 File changed: ${path.basename(filePath)}`, colors.yellow);

      // Debounce regeneration
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        log('🔄 Regenerating documentation...', colors.cyan);

        if (filePath.includes('section-registry.json')) {
          runScript(DOC_SCRIPTS.fromRegistry, 'Registry docs', true);
        } else if (filePath.endsWith('.md')) {
          runScript(DOC_SCRIPTS.pages, 'Doc pages', true);
        } else {
          runScript(DOC_SCRIPTS.comprehensive, 'Comprehensive docs', true);
        }

        logSuccess('Documentation updated');
      }, 1000);
    });

    log('Watching for changes... (press Ctrl+C to stop)', colors.dim);

    // Keep process alive
    process.stdin.resume();
  },
};

// Interactive mode
async function interactiveMode() {
  logHeader('OSI-Cards Documentation CLI');
  log('\nSelect documentation to generate:\n', colors.bright);

  log('  1. All (complete documentation build)', colors.green);
  log('  2. Comprehensive (core docs)');
  log('  3. API Reference (TypeDoc)');
  log('  4. Pages (doc page components)');
  log('  5. Routes (navigation)');
  log('  6. Registry (section docs from registry)');
  log('  7. OpenAPI (API specification)');
  log('  8. README files');
  log('  9. Watch mode');
  log('  0. Exit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter choice (0-9): ', (answer) => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          WORKFLOWS.all();
          break;
        case '2':
          WORKFLOWS.comprehensive();
          break;
        case '3':
          WORKFLOWS.api();
          break;
        case '4':
          WORKFLOWS.pages();
          break;
        case '5':
          WORKFLOWS.routes();
          break;
        case '6':
          WORKFLOWS.registry();
          break;
        case '7':
          WORKFLOWS.openapi();
          break;
        case '8':
          WORKFLOWS.readme();
          break;
        case '9':
          WORKFLOWS.watch();
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
  logHeader('OSI-Cards Documentation CLI - Help');
  log('\nUsage:', colors.bright);
  log('  node scripts/docs.js [options]\n');
  log('Options:', colors.bright);
  log('  --all            Build all documentation');
  log('  --comprehensive  Generate comprehensive docs');
  log('  --api            Generate API reference (TypeDoc)');
  log('  --pages          Generate doc page components');
  log('  --routes         Generate navigation routes');
  log('  --registry       Generate docs from section registry');
  log('  --openapi        Generate OpenAPI specification');
  log('  --readme         Generate README files');
  log('  --watch          Watch mode (auto-regenerate)');
  log('  --help           Show this help message\n');
  log('Interactive:', colors.bright);
  log('  Run without arguments for interactive mode\n');
  log('Legacy Scripts:', colors.bright + colors.dim);
  log('  All individual scripts are preserved in scripts/ directory');
  log('  You can still run them directly if needed\n');
  log('Serve Documentation:', colors.bright);
  log('  npm run docs:serve   Start local documentation server\n');
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
  } else if (args.includes('--comprehensive')) {
    WORKFLOWS.comprehensive();
  } else if (args.includes('--api')) {
    WORKFLOWS.api();
  } else if (args.includes('--pages')) {
    WORKFLOWS.pages();
  } else if (args.includes('--routes')) {
    WORKFLOWS.routes();
  } else if (args.includes('--registry')) {
    WORKFLOWS.registry();
  } else if (args.includes('--openapi')) {
    WORKFLOWS.openapi();
  } else if (args.includes('--readme')) {
    WORKFLOWS.readme();
  } else if (args.includes('--watch')) {
    WORKFLOWS.watch();
  } else {
    logError('Unknown option. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});








