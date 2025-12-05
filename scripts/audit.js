#!/usr/bin/env node

/**
 * Unified Audit CLI
 *
 * Consolidates all audit and validation scripts into a single interface.
 * All existing audit scripts are preserved - this is a wrapper/orchestrator.
 *
 * Usage:
 *   node scripts/audit.js                    - Interactive mode
 *   node scripts/audit.js --all              - Run all audits
 *   node scripts/audit.js --security         - Security audits
 *   node scripts/audit.js --code             - Code quality audits
 *   node scripts/audit.js --performance      - Performance audits
 *   node scripts/audit.js --accessibility    - Accessibility audits
 *   node scripts/audit.js --subscriptions    - RxJS subscription audits
 *   node scripts/audit.js --jsdoc            - JSDoc documentation audits
 *   node scripts/audit.js --help             - Show help
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

// Execute npm command
function runNpmCommand(command, description) {
  try {
    log(`\n▶ ${description}...`, colors.cyan);
    execSync(`npm ${command}`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

// Audit script mappings - all existing scripts preserved
const AUDIT_SCRIPTS = {
  security: {
    npm: 'audit --audit-level=moderate',
    vulnerabilities: 'scripts/vulnerability-scan.js',
    securityAudit: 'scripts/security-audit.js',
  },
  code: {
    onpush: 'scripts/audit-onpush.js',
    changeDetection: 'scripts/audit-change-detection.js',
    inputSanitization: 'scripts/audit-input-sanitization.js',
    treeshaking: 'scripts/tree-shaking-audit.js',
    tokens: 'scripts/audit-tokens.js',
    duplicates: 'scripts/detect-duplicates.js',
  },
  performance: {
    bundleSize: 'scripts/bundle-size-monitor.js',
    bundleAnalyzer: 'scripts/bundle-analyzer.js',
  },
  accessibility: {
    a11y: 'scripts/a11y-audit.js',
    wcag: 'scripts/wcag-audit.js',
    accessibilityTest: 'scripts/accessibility-test.js',
  },
  rxjs: {
    subscriptions: 'scripts/audit-subscriptions.js',
  },
  docs: {
    jsdoc: 'scripts/audit-jsdoc.js',
  },
};

// Audit workflows
const WORKFLOWS = {
  all: () => {
    logHeader('Run All Audits');
    logInfo('Running comprehensive audit suite...\n');

    const steps = [
      { type: 'npm', cmd: AUDIT_SCRIPTS.security.npm, desc: 'NPM Security Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.security.securityAudit, desc: 'Security Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.code.onpush, desc: 'OnPush Change Detection Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.code.changeDetection, desc: 'Change Detection Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.rxjs.subscriptions, desc: 'RxJS Subscriptions Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.docs.jsdoc, desc: 'JSDoc Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.accessibility.a11y, desc: 'Accessibility Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.code.treeshaking, desc: 'Tree-shaking Audit' },
      { type: 'script', cmd: AUDIT_SCRIPTS.code.duplicates, desc: 'Duplicate Code Detection' },
    ];

    let success = 0;
    let failed = 0;
    let warnings = 0;

    for (const step of steps) {
      let result;
      if (step.type === 'npm') {
        result = runNpmCommand(step.cmd, step.desc);
      } else {
        result = runScript(step.cmd, step.desc);
      }

      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    log('\n' + '═'.repeat(70), colors.cyan);
    logSuccess(`Audit completed: ${success} audits passed`);
    if (failed > 0) {
      logError(`${failed} audits failed or found issues`);
    }
  },

  security: () => {
    logHeader('Security Audits');
    runNpmCommand(AUDIT_SCRIPTS.security.npm, 'NPM Security Audit');
    runScript(AUDIT_SCRIPTS.security.vulnerabilities, 'Vulnerability Scan');
    runScript(AUDIT_SCRIPTS.security.securityAudit, 'Security Audit');
  },

  code: () => {
    logHeader('Code Quality Audits');
    runScript(AUDIT_SCRIPTS.code.onpush, 'OnPush Change Detection Audit');
    runScript(AUDIT_SCRIPTS.code.changeDetection, 'Change Detection Audit');
    runScript(AUDIT_SCRIPTS.code.inputSanitization, 'Input Sanitization Audit');
    runScript(AUDIT_SCRIPTS.code.treeshaking, 'Tree-shaking Audit');
    runScript(AUDIT_SCRIPTS.code.tokens, 'Design Tokens Audit');
    runScript(AUDIT_SCRIPTS.code.duplicates, 'Duplicate Code Detection');
  },

  performance: () => {
    logHeader('Performance Audits');
    runScript(AUDIT_SCRIPTS.performance.bundleSize, 'Bundle Size Monitoring');
    runScript(AUDIT_SCRIPTS.performance.bundleAnalyzer, 'Bundle Analysis');
  },

  accessibility: () => {
    logHeader('Accessibility Audits');
    runScript(AUDIT_SCRIPTS.accessibility.a11y, 'Accessibility Audit');
    runScript(AUDIT_SCRIPTS.accessibility.wcag, 'WCAG Compliance Audit');
    runScript(AUDIT_SCRIPTS.accessibility.accessibilityTest, 'Accessibility Testing');
  },

  subscriptions: () => {
    logHeader('RxJS Subscriptions Audit');
    runScript(AUDIT_SCRIPTS.rxjs.subscriptions, 'RxJS Subscriptions Audit');
    logInfo('\nTo see JSON output: node scripts/audit-subscriptions.js --json');
    logInfo('To auto-fix issues: node scripts/audit-subscriptions.js --fix');
  },

  jsdoc: () => {
    logHeader('JSDoc Documentation Audit');
    runScript(AUDIT_SCRIPTS.docs.jsdoc, 'JSDoc Audit');
    logInfo('\nTo see detailed report: node scripts/audit-jsdoc.js --report');
  },
};

// Interactive mode
async function interactiveMode() {
  logHeader('OSI-Cards Audit CLI');
  log('\nSelect audit to run:\n', colors.bright);

  log('  1. All (comprehensive audit suite)', colors.green);
  log('  2. Security (npm audit, vulnerabilities, security)');
  log('  3. Code Quality (OnPush, change detection, tree-shaking)');
  log('  4. Performance (bundle size, analysis)');
  log('  5. Accessibility (a11y, WCAG compliance)');
  log('  6. RxJS Subscriptions (memory leak detection)');
  log('  7. JSDoc (documentation coverage)');
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
          WORKFLOWS.all();
          break;
        case '2':
          WORKFLOWS.security();
          break;
        case '3':
          WORKFLOWS.code();
          break;
        case '4':
          WORKFLOWS.performance();
          break;
        case '5':
          WORKFLOWS.accessibility();
          break;
        case '6':
          WORKFLOWS.subscriptions();
          break;
        case '7':
          WORKFLOWS.jsdoc();
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
  logHeader('OSI-Cards Audit CLI - Help');
  log('\nUsage:', colors.bright);
  log('  node scripts/audit.js [options]\n');
  log('Options:', colors.bright);
  log('  --all             Run all audits');
  log('  --security        Run security audits');
  log('  --code            Run code quality audits');
  log('  --performance     Run performance audits');
  log('  --accessibility   Run accessibility audits');
  log('  --subscriptions   Run RxJS subscription audits');
  log('  --jsdoc           Run JSDoc documentation audits');
  log('  --help            Show this help message\n');
  log('Interactive:', colors.bright);
  log('  Run without arguments for interactive mode\n');
  log('Legacy Scripts:', colors.bright + colors.dim);
  log('  All individual scripts are preserved in scripts/ directory');
  log('  You can still run them directly if needed\n');
  log('Examples:', colors.bright);
  log('  node scripts/audit.js --all');
  log('  node scripts/audit.js --security');
  log('  node scripts/audit-subscriptions.js --json    (direct access)\n');
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
  } else if (args.includes('--security')) {
    WORKFLOWS.security();
  } else if (args.includes('--code')) {
    WORKFLOWS.code();
  } else if (args.includes('--performance')) {
    WORKFLOWS.performance();
  } else if (args.includes('--accessibility') || args.includes('--a11y')) {
    WORKFLOWS.accessibility();
  } else if (args.includes('--subscriptions')) {
    WORKFLOWS.subscriptions();
  } else if (args.includes('--jsdoc')) {
    WORKFLOWS.jsdoc();
  } else {
    logError('Unknown option. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});





