#!/usr/bin/env node

/**
 * Security Audit Script (Point 50)
 *
 * Comprehensive security audit with OWASP checks.
 * Scans codebase for common security vulnerabilities.
 *
 * Usage:
 *   node scripts/security-audit.js
 *   node scripts/security-audit.js --strict (fail on warnings)
 *   node scripts/security-audit.js --json (JSON output)
 *   node scripts/security-audit.js --fix (show fixes)
 *
 * Exit codes:
 *   0 - No critical issues
 *   1 - Critical issues found
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  srcDirs: ['src/app', 'projects/osi-cards-lib/src'],
  extensions: ['.ts', '.html', '.json'],
  ignore: ['node_modules', 'dist', '.spec.ts', '.stories.ts'],
};

// =============================================================================
// SECURITY RULES
// =============================================================================

const SECURITY_RULES = [
  // XSS Prevention
  {
    id: 'SEC-001',
    name: 'innerHTML Usage',
    description: 'Direct innerHTML usage can lead to XSS vulnerabilities',
    severity: 'high',
    pattern: /\.innerHTML\s*=/,
    fileTypes: ['.ts'],
    fix: 'Use Angular\'s DomSanitizer or [innerHTML] binding with sanitization',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },
  {
    id: 'SEC-002',
    name: 'Unsafe bypassSecurityTrust',
    description: 'bypassSecurityTrust* methods can introduce XSS if misused',
    severity: 'medium',
    pattern: /bypassSecurityTrust(Html|Script|Style|Url|ResourceUrl)/,
    fileTypes: ['.ts'],
    fix: 'Ensure input is properly validated before bypassing security',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },
  {
    id: 'SEC-003',
    name: 'Unsafe Template Binding',
    description: 'Direct property binding without sanitization',
    severity: 'medium',
    pattern: /\[innerHTML\]\s*=\s*["'][^|]*["']/,
    fileTypes: ['.html'],
    fix: 'Use sanitization pipe: [innerHTML]="content | safeHtml"',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },

  // Injection Prevention
  {
    id: 'SEC-004',
    name: 'eval() Usage',
    description: 'eval() can execute arbitrary code',
    severity: 'critical',
    pattern: /\beval\s*\(/,
    fileTypes: ['.ts'],
    fix: 'Use JSON.parse() for JSON or safer alternatives',
    owasp: 'A1:2017 - Injection',
  },
  {
    id: 'SEC-005',
    name: 'Function Constructor',
    description: 'new Function() can execute arbitrary code',
    severity: 'critical',
    pattern: /new\s+Function\s*\(/,
    fileTypes: ['.ts'],
    fix: 'Avoid dynamic code execution',
    owasp: 'A1:2017 - Injection',
  },
  {
    id: 'SEC-006',
    name: 'setTimeout/setInterval with String',
    description: 'String argument to timer functions can execute code',
    severity: 'high',
    pattern: /set(Timeout|Interval)\s*\(\s*["'`]/,
    fileTypes: ['.ts'],
    fix: 'Use function reference instead of string',
    owasp: 'A1:2017 - Injection',
  },

  // Sensitive Data Exposure
  {
    id: 'SEC-007',
    name: 'Hardcoded Secrets',
    description: 'Potential hardcoded API keys or secrets',
    severity: 'critical',
    pattern: /(api[_-]?key|secret|password|token|auth)\s*[:=]\s*["'][A-Za-z0-9+/=]{20,}["']/i,
    fileTypes: ['.ts', '.json'],
    fix: 'Use environment variables for secrets',
    owasp: 'A3:2017 - Sensitive Data Exposure',
  },
  {
    id: 'SEC-008',
    name: 'Console Log Sensitive Data',
    description: 'Logging potentially sensitive data',
    severity: 'medium',
    pattern: /console\.(log|info|debug)\s*\([^)]*(?:password|token|secret|key|auth)[^)]*\)/i,
    fileTypes: ['.ts'],
    fix: 'Remove sensitive data from logs or use log masking',
    owasp: 'A3:2017 - Sensitive Data Exposure',
  },

  // Insecure Communication
  {
    id: 'SEC-009',
    name: 'HTTP URLs',
    description: 'Using insecure HTTP instead of HTTPS',
    severity: 'medium',
    pattern: /["']http:\/\/(?!localhost|127\.0\.0\.1)/,
    fileTypes: ['.ts', '.html', '.json'],
    fix: 'Use HTTPS for all external URLs',
    owasp: 'A3:2017 - Sensitive Data Exposure',
  },

  // Prototype Pollution
  {
    id: 'SEC-010',
    name: 'Object.assign with User Input',
    description: 'Object.assign can lead to prototype pollution',
    severity: 'medium',
    pattern: /Object\.assign\s*\(\s*\{\s*\}\s*,/,
    fileTypes: ['.ts'],
    fix: 'Validate and sanitize object keys before merging',
    owasp: 'A1:2017 - Injection',
  },
  {
    id: 'SEC-011',
    name: '__proto__ Access',
    description: 'Direct __proto__ access can lead to prototype pollution',
    severity: 'high',
    pattern: /__proto__|constructor\.prototype/,
    fileTypes: ['.ts'],
    fix: 'Avoid __proto__ access, use Object.getPrototypeOf()',
    owasp: 'A1:2017 - Injection',
  },

  // DOM Clobbering
  {
    id: 'SEC-012',
    name: 'DOM ID Conflicts',
    description: 'Element IDs that could conflict with global properties',
    severity: 'low',
    pattern: /id\s*=\s*["'](window|document|location|navigator|history|localStorage|sessionStorage)["']/i,
    fileTypes: ['.html'],
    fix: 'Use unique, namespaced IDs',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },

  // URL Handling
  {
    id: 'SEC-013',
    name: 'javascript: URL',
    description: 'javascript: URLs can execute arbitrary code',
    severity: 'critical',
    pattern: /href\s*=\s*["']javascript:/i,
    fileTypes: ['.html', '.ts'],
    fix: 'Use Angular event handlers instead of javascript: URLs',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },
  {
    id: 'SEC-014',
    name: 'data: URL',
    description: 'data: URLs can contain executable content',
    severity: 'medium',
    pattern: /(?:src|href)\s*=\s*["']data:(?!image)/i,
    fileTypes: ['.html', '.ts'],
    fix: 'Validate data: URLs and restrict to safe types',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },

  // Event Handlers
  {
    id: 'SEC-015',
    name: 'Inline Event Handlers',
    description: 'Inline event handlers in templates',
    severity: 'low',
    pattern: /\bon\w+\s*=\s*["'][^"']+["']/,
    fileTypes: ['.html'],
    fix: 'Use Angular event binding syntax instead',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },

  // Storage Security
  {
    id: 'SEC-016',
    name: 'Unencrypted localStorage',
    description: 'Storing potentially sensitive data in localStorage',
    severity: 'medium',
    pattern: /localStorage\.setItem\s*\(\s*["'][^"']*(?:token|auth|password|secret)[^"']*["']/i,
    fileTypes: ['.ts'],
    fix: 'Encrypt sensitive data before storing or use secure storage',
    owasp: 'A3:2017 - Sensitive Data Exposure',
  },

  // CORS
  {
    id: 'SEC-017',
    name: 'Wildcard CORS',
    description: 'Using wildcard (*) in CORS configuration',
    severity: 'medium',
    pattern: /Access-Control-Allow-Origin['":\s]+\*/,
    fileTypes: ['.ts', '.json'],
    fix: 'Specify allowed origins explicitly',
    owasp: 'A5:2017 - Broken Access Control',
  },

  // TypeScript Specific
  {
    id: 'SEC-018',
    name: 'any Type for User Input',
    description: 'Using any type for potentially untrusted data',
    severity: 'low',
    pattern: /:\s*any\s*[;=)]/,
    fileTypes: ['.ts'],
    fix: 'Use specific types and validate input',
    owasp: 'A1:2017 - Injection',
  },

  // Angular Specific
  {
    id: 'SEC-019',
    name: 'Disabled Angular Sanitization',
    description: 'Disabling Angular\'s built-in sanitization',
    severity: 'high',
    pattern: /SECURITY_CONTEXT\.NONE/,
    fileTypes: ['.ts'],
    fix: 'Avoid disabling sanitization unless absolutely necessary',
    owasp: 'A7:2017 - Cross-Site Scripting (XSS)',
  },
  {
    id: 'SEC-020',
    name: 'Dynamic Component Loading',
    description: 'Loading components dynamically without validation',
    severity: 'medium',
    pattern: /createComponent\s*\(\s*[^)]*\)/,
    fileTypes: ['.ts'],
    fix: 'Validate component types before dynamic loading',
    owasp: 'A1:2017 - Injection',
  },
];

// =============================================================================
// SCANNING
// =============================================================================

/**
 * @typedef {Object} SecurityIssue
 * @property {string} id - Rule ID
 * @property {string} name - Rule name
 * @property {string} severity - 'critical' | 'high' | 'medium' | 'low'
 * @property {string} file - File path
 * @property {number} line - Line number
 * @property {string} code - Code snippet
 * @property {string} fix - Suggested fix
 * @property {string} owasp - OWASP reference
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

function scanDirectory(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

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

/**
 * Scan a file for security issues
 * @param {string} filePath
 * @returns {SecurityIssue[]}
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  const ext = path.extname(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  for (const rule of SECURITY_RULES) {
    // Check if rule applies to this file type
    if (!rule.fileTypes.includes(ext)) {
      continue;
    }

    // Scan each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (rule.pattern.test(line)) {
        // Check for false positives
        if (isFalsePositive(line, rule)) {
          continue;
        }

        issues.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          file: relativePath,
          line: i + 1,
          code: line.trim().substring(0, 100),
          fix: rule.fix,
          owasp: rule.owasp,
        });
      }
    }
  }

  return issues;
}

/**
 * Check for false positives
 */
function isFalsePositive(line, rule) {
  // Skip comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
    return true;
  }

  // Skip test files content
  if (line.includes('.spec.') || line.includes('describe(') || line.includes('it(')) {
    return true;
  }

  // Rule-specific false positive checks
  if (rule.id === 'SEC-007') {
    // Skip example/documentation strings
    if (line.includes('example') || line.includes('placeholder') || line.includes('YOUR_')) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// REPORTING
// =============================================================================

function generateReport(issues) {
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');

  return {
    summary: {
      total: issues.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    issues,
    byRule: groupBy(issues, 'id'),
    byFile: groupBy(issues, 'file'),
    byOwasp: groupBy(issues, 'owasp'),
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

function printReport(report, showFixes) {
  console.log('\n🔒 Security Audit Report');
  console.log('═'.repeat(50));
  console.log(`Total issues: ${report.summary.total}`);
  console.log(`  🔴 Critical: ${report.summary.critical}`);
  console.log(`  🟠 High: ${report.summary.high}`);
  console.log(`  🟡 Medium: ${report.summary.medium}`);
  console.log(`  🟢 Low: ${report.summary.low}`);
  console.log('═'.repeat(50));

  if (report.issues.length === 0) {
    console.log('\n✅ No security issues detected!\n');
    return;
  }

  // Group by severity
  const severityOrder = ['critical', 'high', 'medium', 'low'];

  for (const severity of severityOrder) {
    const issues = report.issues.filter(i => i.severity === severity);
    if (issues.length === 0) continue;

    const icon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[severity];
    console.log(`\n${icon} ${severity.toUpperCase()} (${issues.length}):\n`);

    for (const issue of issues) {
      console.log(`  [${issue.id}] ${issue.name}`);
      console.log(`    File: ${issue.file}:${issue.line}`);
      console.log(`    Code: ${issue.code}`);
      console.log(`    OWASP: ${issue.owasp}`);
      if (showFixes) {
        console.log(`    Fix: ${issue.fix}`);
      }
      console.log('');
    }
  }

  // OWASP Summary
  console.log('\n📊 Issues by OWASP Category:');
  for (const [owasp, issues] of Object.entries(report.byOwasp)) {
    console.log(`  ${owasp}: ${issues.length}`);
  }
  console.log('');
}

function printJsonReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const strictMode = args.includes('--strict');
  const showFixes = args.includes('--fix');

  console.log('🔍 Running security audit...\n');

  const files = getFilesToScan();
  const allIssues = [];

  for (const file of files) {
    const issues = scanFile(file);
    allIssues.push(...issues);
  }

  const report = generateReport(allIssues);

  if (jsonOutput) {
    printJsonReport(report);
  } else {
    printReport(report, showFixes);
  }

  // Exit codes
  if (report.summary.critical > 0) {
    console.log('❌ Critical security issues found!\n');
    process.exit(1);
  }

  if (strictMode && (report.summary.high > 0 || report.summary.medium > 0)) {
    console.log('❌ Security issues found (strict mode)!\n');
    process.exit(1);
  }

  console.log('✅ Security audit passed\n');
  process.exit(0);
}

main();










