#!/usr/bin/env node

/**
 * Subscription Cleanup Audit Script (Point 16)
 *
 * Analyzes TypeScript files to verify all RxJS subscriptions have proper cleanup.
 * Detects potential memory leaks from unmanaged subscriptions.
 *
 * Usage:
 *   node scripts/audit-subscriptions.js
 *   node scripts/audit-subscriptions.js --fix (suggest fixes)
 *   node scripts/audit-subscriptions.js --json (JSON output)
 *
 * Exit codes:
 *   0 - All subscriptions properly managed
 *   1 - Found potential issues
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  srcDirs: ['src/app', 'projects/osi-cards-lib/src'],
  extensions: ['.ts'],
  ignore: ['node_modules', 'dist', '.spec.ts', '.stories.ts', '.worker.ts'],
};

// Patterns that indicate proper subscription management
const CLEANUP_PATTERNS = [
  /takeUntilDestroyed/,
  /takeUntil\s*\(/,
  /\.unsubscribe\s*\(/,
  /take\s*\(\s*1\s*\)/,
  /first\s*\(\)/,
  /async\s+pipe/i,
  /\|\s*async/,
  /DestroyRef/,
  /ngOnDestroy/,
];

// Patterns that indicate a subscription
const SUBSCRIBE_PATTERNS = [
  /\.subscribe\s*\(/g,
  /\.subscribe\s*$/gm,
];

// =============================================================================
// TYPES
// =============================================================================

/**
 * @typedef {Object} SubscriptionIssue
 * @property {string} file - File path
 * @property {number} line - Line number
 * @property {string} code - Code snippet
 * @property {string} severity - 'error' | 'warning'
 * @property {string} message - Description of the issue
 * @property {string} [suggestion] - Suggested fix
 */

/**
 * @typedef {Object} AuditResult
 * @property {number} totalFiles - Total files scanned
 * @property {number} totalSubscriptions - Total subscriptions found
 * @property {number} managedSubscriptions - Properly managed subscriptions
 * @property {number} unmanagedSubscriptions - Potentially unmanaged subscriptions
 * @property {SubscriptionIssue[]} issues - List of issues
 */

// =============================================================================
// FILE SCANNING
// =============================================================================

/**
 * Get all TypeScript files to scan
 * @returns {string[]}
 */
function getFilesToScan() {
  const files = [];

  for (const srcDir of CONFIG.srcDirs) {
    const fullPath = path.join(process.cwd(), srcDir);
    if (fs.existsSync(fullPath)) {
      scanDirectory(fullPath, files);
    }
  }

  return files;
}

/**
 * Recursively scan directory for TypeScript files
 * @param {string} dir
 * @param {string[]} files
 */
function scanDirectory(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Check if should ignore
    if (CONFIG.ignore.some(pattern => fullPath.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (entry.isFile() && CONFIG.extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
}

// =============================================================================
// ANALYSIS
// =============================================================================

/**
 * Analyze a file for subscription issues
 * @param {string} filePath
 * @returns {SubscriptionIssue[]}
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // Check if file has any cleanup mechanisms
  const hasCleanupMechanism = CLEANUP_PATTERNS.some(pattern => pattern.test(content));
  const hasDestroyRef = /DestroyRef/.test(content);
  const hasOnDestroy = /ngOnDestroy/.test(content);
  const isComponent = /@Component/.test(content);
  const isService = /@Injectable/.test(content);

  // Find all subscriptions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for .subscribe(
    if (/\.subscribe\s*\(/.test(line)) {
      const context = getContext(lines, i, 5);
      const isManaged = isSubscriptionManaged(context, content);

      if (!isManaged) {
        const issue = {
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          code: line.trim(),
          severity: determineSeverity(isComponent, isService, hasCleanupMechanism),
          message: determineMessage(isComponent, isService, hasCleanupMechanism),
          suggestion: getSuggestion(context, hasDestroyRef, hasOnDestroy),
        };
        issues.push(issue);
      }
    }
  }

  return issues;
}

/**
 * Get context around a line
 * @param {string[]} lines
 * @param {number} index
 * @param {number} range
 * @returns {string}
 */
function getContext(lines, index, range) {
  const start = Math.max(0, index - range);
  const end = Math.min(lines.length, index + range + 1);
  return lines.slice(start, end).join('\n');
}

/**
 * Check if subscription appears to be managed
 * @param {string} context
 * @param {string} fullContent
 * @returns {boolean}
 */
function isSubscriptionManaged(context, fullContent) {
  // Check if any cleanup pattern is in the context
  for (const pattern of CLEANUP_PATTERNS) {
    if (pattern.test(context)) {
      return true;
    }
  }

  // Check if it's a one-time subscription (take(1), first())
  if (/take\s*\(\s*1\s*\)/.test(context) || /first\s*\(\)/.test(context)) {
    return true;
  }

  // Check if subscription is stored in a variable that's cleaned up
  const subscriptionVarMatch = context.match(/(?:this\.)?(\w+)\s*=\s*.*\.subscribe/);
  if (subscriptionVarMatch) {
    const varName = subscriptionVarMatch[1];
    const cleanupPattern = new RegExp(`${varName}\\s*\\.\\s*unsubscribe`);
    if (cleanupPattern.test(fullContent)) {
      return true;
    }
  }

  // Check if using async pipe (in template)
  if (/\|\s*async/.test(context)) {
    return true;
  }

  return false;
}

/**
 * Determine severity based on context
 * @param {boolean} isComponent
 * @param {boolean} isService
 * @param {boolean} hasCleanup
 * @returns {'error' | 'warning'}
 */
function determineSeverity(isComponent, isService, hasCleanup) {
  if (isComponent && !hasCleanup) {
    return 'error';
  }
  if (isService) {
    return 'warning'; // Services with providedIn: 'root' are singletons
  }
  return 'warning';
}

/**
 * Determine message based on context
 * @param {boolean} isComponent
 * @param {boolean} isService
 * @param {boolean} hasCleanup
 * @returns {string}
 */
function determineMessage(isComponent, isService, hasCleanup) {
  if (isComponent && !hasCleanup) {
    return 'Component subscription without cleanup mechanism. Potential memory leak.';
  }
  if (isService) {
    return 'Service subscription. Ensure cleanup in ngOnDestroy if not a singleton.';
  }
  return 'Subscription without visible cleanup mechanism.';
}

/**
 * Get suggestion for fixing the issue
 * @param {string} context
 * @param {boolean} hasDestroyRef
 * @param {boolean} hasOnDestroy
 * @returns {string}
 */
function getSuggestion(context, hasDestroyRef, hasOnDestroy) {
  if (hasDestroyRef) {
    return 'Add takeUntilDestroyed(this.destroyRef) before .subscribe()';
  }
  if (hasOnDestroy) {
    return 'Store subscription and call .unsubscribe() in ngOnDestroy()';
  }
  return 'Use takeUntilDestroyed() with DestroyRef, or implement ngOnDestroy';
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate audit report
 * @param {SubscriptionIssue[]} allIssues
 * @param {number} totalFiles
 * @returns {AuditResult}
 */
function generateReport(allIssues, totalFiles) {
  const totalSubscriptions = allIssues.length;
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  return {
    totalFiles,
    totalSubscriptions,
    managedSubscriptions: 0, // Would need more analysis
    unmanagedSubscriptions: totalSubscriptions,
    issues: allIssues,
    summary: {
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}

/**
 * Print report to console
 * @param {AuditResult} report
 */
function printReport(report) {
  console.log('\n📊 Subscription Audit Report');
  console.log('═'.repeat(50));
  console.log(`Files scanned: ${report.totalFiles}`);
  console.log(`Potential issues found: ${report.issues.length}`);
  console.log(`  - Errors: ${report.summary.errors}`);
  console.log(`  - Warnings: ${report.summary.warnings}`);
  console.log('═'.repeat(50));

  if (report.issues.length === 0) {
    console.log('\n✅ No subscription issues detected!\n');
    return;
  }

  console.log('\n🔍 Issues:\n');

  // Group by file
  const byFile = {};
  for (const issue of report.issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  for (const [file, issues] of Object.entries(byFile)) {
    console.log(`📁 ${file}`);
    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} Line ${issue.line}: ${issue.message}`);
      console.log(`     Code: ${issue.code.substring(0, 60)}${issue.code.length > 60 ? '...' : ''}`);
      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
    }
    console.log('');
  }
}

/**
 * Print JSON report
 * @param {AuditResult} report
 */
function printJsonReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const showFixes = args.includes('--fix');

  console.log('🔍 Scanning for subscription issues...\n');

  const files = getFilesToScan();
  const allIssues = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  const report = generateReport(allIssues, files.length);

  if (jsonOutput) {
    printJsonReport(report);
  } else {
    printReport(report);

    if (showFixes && report.issues.length > 0) {
      console.log('\n💡 Recommended Actions:');
      console.log('─'.repeat(50));
      console.log('1. Add DestroyRef to component constructors');
      console.log('2. Use takeUntilDestroyed() operator before .subscribe()');
      console.log('3. For one-time subscriptions, use take(1) or first()');
      console.log('4. Consider using async pipe in templates instead');
      console.log('');
    }
  }

  // Exit with error code if there are errors
  process.exit(report.summary.errors > 0 ? 1 : 0);
}

main();



