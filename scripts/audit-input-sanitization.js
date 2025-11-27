#!/usr/bin/env node

/**
 * Input Sanitization Audit Script
 * 
 * Scans the codebase for potential input sanitization issues:
 * - innerHTML usage without sanitization
 * - User input in URLs without validation
 * - JSON parsing without validation
 * - Direct DOM manipulation with user data
 * - Missing sanitization in templates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ISSUES = {
  INNER_HTML: 'innerHTML',
  DANGEROUS_URL: 'dangerous-url',
  UNSAFE_JSON: 'unsafe-json',
  DIRECT_DOM: 'direct-dom',
  MISSING_SANITIZATION: 'missing-sanitization',
  UNSAFE_EVAL: 'unsafe-eval'
};

const issues = [];
const scannedFiles = [];

/**
 * Recursively find all TypeScript and HTML files
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, .angular, etc.
      if (!['node_modules', 'dist', '.angular', '.git', 'coverage', 'test-results'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Check for innerHTML usage without sanitization
 */
function checkInnerHTML(content, filePath) {
  const lines = content.split('\n');
  const innerHTMLRegex = /\.innerHTML\s*=/g;
  const safeHtmlRegex = /safeHtml|DomSanitizer|sanitize/i;
  
  lines.forEach((line, index) => {
    if (innerHTMLRegex.test(line)) {
      // Check if sanitization is used nearby
      const context = content.substring(
        Math.max(0, content.indexOf(line) - 200),
        Math.min(content.length, content.indexOf(line) + 200)
      );
      
      if (!safeHtmlRegex.test(context)) {
        issues.push({
          type: ISSUES.INNER_HTML,
          file: filePath,
          line: index + 1,
          severity: 'high',
          message: 'innerHTML used without sanitization',
          code: line.trim()
        });
      }
    }
  });
}

/**
 * Check for dangerous URL construction
 */
function checkDangerousUrls(content, filePath) {
  const lines = content.split('\n');
  const urlPatterns = [
    /window\.location\s*=/,
    /location\.href\s*=/,
    /document\.location\s*=/,
    /new\s+URL\([^)]*\+/,
    /href\s*=\s*["']\s*\+/
  ];
  
  lines.forEach((line, index) => {
    urlPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        // Check if URL validation is used
        const hasValidation = /UrlUtil|validateUrl|sanitizeUrl/i.test(line);
        if (!hasValidation) {
          issues.push({
            type: ISSUES.DANGEROUS_URL,
            file: filePath,
            line: index + 1,
            severity: 'high',
            message: 'URL construction without validation',
            code: line.trim()
          });
        }
      }
    });
  });
}

/**
 * Check for unsafe JSON parsing
 */
function checkUnsafeJson(content, filePath) {
  const lines = content.split('\n');
  const jsonParseRegex = /JSON\.parse\([^)]+\)/g;
  
  lines.forEach((line, index) => {
    const matches = line.match(jsonParseRegex);
    if (matches) {
      // Check if validation is used
      const hasValidation = /CardValidationService|validateCardJson|try\s*\{/i.test(
        content.substring(Math.max(0, content.indexOf(line) - 100), content.indexOf(line) + 100)
      );
      
      if (!hasValidation) {
        issues.push({
          type: ISSUES.UNSAFE_JSON,
          file: filePath,
          line: index + 1,
          severity: 'medium',
          message: 'JSON.parse without validation or error handling',
          code: line.trim()
        });
      }
    }
  });
}

/**
 * Check for direct DOM manipulation with user data
 */
function checkDirectDom(content, filePath) {
  const lines = content.split('\n');
  const domPatterns = [
    /document\.(createElement|write|writeln)/,
    /\.appendChild\([^)]*\+/,
    /\.insertAdjacentHTML\(/
  ];
  
  lines.forEach((line, index) => {
    domPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        const hasSanitization = /sanitize|SafeHtml/i.test(line);
        if (!hasSanitization) {
          issues.push({
            type: ISSUES.DIRECT_DOM,
            file: filePath,
            line: index + 1,
            severity: 'high',
            message: 'Direct DOM manipulation with potentially unsafe data',
            code: line.trim()
          });
        }
      }
    });
  });
}

/**
 * Check for missing sanitization in templates
 */
function checkTemplateSanitization(content, filePath) {
  if (!filePath.endsWith('.html')) return;
  
  const lines = content.split('\n');
  const unsafePatterns = [
    /\[innerHTML\]\s*=\s*[^|]*$/,
    /innerHTML\s*=\s*[^|]*$/
  ];
  
  lines.forEach((line, index) => {
    unsafePatterns.forEach(pattern => {
      if (pattern.test(line) && !line.includes('safeHtml')) {
        issues.push({
          type: ISSUES.MISSING_SANITIZATION,
          file: filePath,
          line: index + 1,
          severity: 'high',
          message: 'innerHTML binding without safeHtml pipe',
          code: line.trim()
        });
      }
    });
  });
}

/**
 * Check for unsafe eval usage
 */
function checkUnsafeEval(content, filePath) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (/eval\(|new\s+Function\(/i.test(line)) {
      issues.push({
        type: ISSUES.UNSAFE_EVAL,
        file: filePath,
        line: index + 1,
        severity: 'critical',
        message: 'eval() or Function() constructor usage detected',
        code: line.trim()
      });
    }
  });
}

/**
 * Scan a file for security issues
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    scannedFiles.push(filePath);
    
    checkInnerHTML(content, filePath);
    checkDangerousUrls(content, filePath);
    checkUnsafeJson(content, filePath);
    checkDirectDom(content, filePath);
    checkTemplateSanitization(content, filePath);
    checkUnsafeEval(content, filePath);
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('INPUT SANITIZATION AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`\nScanned ${scannedFiles.length} files`);
  console.log(`Found ${issues.length} potential issues\n`);
  
  if (issues.length === 0) {
    console.log('✅ No security issues found!');
    return;
  }
  
  // Group by severity
  const bySeverity = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };
  
  issues.forEach(issue => {
    bySeverity[issue.severity] = bySeverity[issue.severity] || [];
    bySeverity[issue.severity].push(issue);
  });
  
  // Print by severity
  ['critical', 'high', 'medium', 'low'].forEach(severity => {
    const severityIssues = bySeverity[severity];
    if (severityIssues.length > 0) {
      console.log(`\n${severity.toUpperCase()} SEVERITY (${severityIssues.length} issues):`);
      console.log('-'.repeat(80));
      
      severityIssues.forEach(issue => {
        console.log(`\n[${issue.type}] ${issue.file}:${issue.line}`);
        console.log(`  ${issue.message}`);
        console.log(`  Code: ${issue.code}`);
      });
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Critical: ${bySeverity.critical.length}`);
  console.log(`High: ${bySeverity.high.length}`);
  console.log(`Medium: ${bySeverity.medium.length}`);
  console.log(`Low: ${bySeverity.low.length}`);
  console.log(`Total: ${issues.length}`);
  
  // Exit with error code if critical or high issues found
  if (bySeverity.critical.length > 0 || bySeverity.high.length > 0) {
    console.log('\n❌ Security audit failed: Critical or high severity issues found');
    process.exit(1);
  } else {
    console.log('\n⚠️  Security audit completed with warnings');
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Starting input sanitization audit...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);
  
  console.log(`Found ${files.length} files to scan...`);
  
  files.forEach(file => {
    scanFile(file);
  });
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, generateReport };

