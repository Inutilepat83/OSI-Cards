#!/usr/bin/env node

/**
 * JSDoc Coverage Audit Script (Point 27)
 *
 * Measures and reports JSDoc coverage across the codebase.
 * Identifies undocumented public APIs and generates coverage reports.
 *
 * Usage:
 *   node scripts/audit-jsdoc.js
 *   node scripts/audit-jsdoc.js --report (generate HTML report)
 *   node scripts/audit-jsdoc.js --json (JSON output)
 *   node scripts/audit-jsdoc.js --threshold 80 (fail if below threshold)
 *
 * Exit codes:
 *   0 - Coverage meets threshold
 *   1 - Coverage below threshold
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  srcDirs: ['src/app', 'projects/osi-cards-lib/src'],
  extensions: ['.ts'],
  ignore: ['node_modules', 'dist', '.spec.ts', '.stories.ts', '.d.ts'],
  defaultThreshold: 60,
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * @typedef {Object} DocumentationStatus
 * @property {string} file - File path
 * @property {number} line - Line number
 * @property {string} type - 'class' | 'method' | 'property' | 'function' | 'interface'
 * @property {string} name - Symbol name
 * @property {boolean} hasJSDoc - Whether it has JSDoc
 * @property {boolean} hasDescription - Whether JSDoc has description
 * @property {boolean} hasParams - Whether JSDoc has @param tags
 * @property {boolean} hasReturns - Whether JSDoc has @returns tag
 * @property {boolean} hasExample - Whether JSDoc has @example tag
 * @property {string} [visibility] - 'public' | 'private' | 'protected'
 */

/**
 * @typedef {Object} CoverageReport
 * @property {number} totalSymbols - Total public symbols
 * @property {number} documentedSymbols - Symbols with JSDoc
 * @property {number} coveragePercent - Coverage percentage
 * @property {Object} byType - Coverage by symbol type
 * @property {Object} byFile - Coverage by file
 * @property {DocumentationStatus[]} undocumented - Undocumented symbols
 */

// =============================================================================
// FILE SCANNING
// =============================================================================

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

// =============================================================================
// PARSING
// =============================================================================

/**
 * Parse TypeScript file for documentable symbols
 * @param {string} filePath
 * @returns {DocumentationStatus[]}
 */
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const symbols = [];

  // Track JSDoc blocks
  let currentJSDoc = null;
  let jsDocStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Start of JSDoc
    if (trimmed.startsWith('/**')) {
      currentJSDoc = [trimmed];
      jsDocStartLine = i;
      continue;
    }

    // Inside JSDoc
    if (currentJSDoc !== null) {
      currentJSDoc.push(trimmed);
      if (trimmed.endsWith('*/')) {
        // JSDoc complete, will be used for next symbol
      }
      continue;
    }

    // Check for documentable symbols
    const symbol = parseSymbol(line, i + 1, filePath);
    if (symbol) {
      // Check if previous lines contain JSDoc
      const jsDocContent = currentJSDoc ? currentJSDoc.join('\n') : '';
      symbol.hasJSDoc = jsDocContent.includes('/**');
      symbol.hasDescription = hasDescription(jsDocContent);
      symbol.hasParams = jsDocContent.includes('@param');
      symbol.hasReturns = jsDocContent.includes('@returns') || jsDocContent.includes('@return');
      symbol.hasExample = jsDocContent.includes('@example');

      // Only track public symbols
      if (symbol.visibility !== 'private') {
        symbols.push(symbol);
      }

      currentJSDoc = null;
    }

    // Reset JSDoc if we hit a non-documentable line
    if (!trimmed.startsWith('*') && !trimmed.startsWith('//') && trimmed !== '') {
      currentJSDoc = null;
    }
  }

  return symbols;
}

/**
 * Parse a line for documentable symbols
 * @param {string} line
 * @param {number} lineNumber
 * @param {string} filePath
 * @returns {DocumentationStatus|null}
 */
function parseSymbol(line, lineNumber, filePath) {
  const trimmed = line.trim();

  // Class declaration
  const classMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
  if (classMatch) {
    return {
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      type: 'class',
      name: classMatch[1],
      visibility: trimmed.startsWith('export') ? 'public' : 'private',
      hasJSDoc: false,
      hasDescription: false,
      hasParams: false,
      hasReturns: false,
      hasExample: false,
    };
  }

  // Interface declaration
  const interfaceMatch = trimmed.match(/^(?:export\s+)?interface\s+(\w+)/);
  if (interfaceMatch) {
    return {
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      type: 'interface',
      name: interfaceMatch[1],
      visibility: trimmed.startsWith('export') ? 'public' : 'private',
      hasJSDoc: false,
      hasDescription: false,
      hasParams: false,
      hasReturns: false,
      hasExample: false,
    };
  }

  // Function declaration
  const functionMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
  if (functionMatch) {
    return {
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      type: 'function',
      name: functionMatch[1],
      visibility: trimmed.startsWith('export') ? 'public' : 'private',
      hasJSDoc: false,
      hasDescription: false,
      hasParams: false,
      hasReturns: false,
      hasExample: false,
    };
  }

  // Method declaration (in class)
  const methodMatch = trimmed.match(/^(?:public\s+|protected\s+|private\s+)?(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?/);
  if (methodMatch && !trimmed.includes('constructor') && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while')) {
    const visibility = trimmed.startsWith('private') ? 'private' :
                       trimmed.startsWith('protected') ? 'protected' : 'public';
    return {
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      type: 'method',
      name: methodMatch[1],
      visibility,
      hasJSDoc: false,
      hasDescription: false,
      hasParams: false,
      hasReturns: false,
      hasExample: false,
    };
  }

  return null;
}

/**
 * Check if JSDoc has a meaningful description
 * @param {string} jsDoc
 * @returns {boolean}
 */
function hasDescription(jsDoc) {
  if (!jsDoc) return false;

  // Remove JSDoc markers and tags
  const cleaned = jsDoc
    .replace(/\/\*\*|\*\/|\*/g, '')
    .replace(/@\w+[^\n]*/g, '')
    .trim();

  return cleaned.length > 10; // Meaningful description
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate coverage report
 * @param {DocumentationStatus[]} allSymbols
 * @returns {CoverageReport}
 */
function generateReport(allSymbols) {
  const publicSymbols = allSymbols.filter(s => s.visibility !== 'private');
  const documented = publicSymbols.filter(s => s.hasJSDoc && s.hasDescription);

  // Group by type
  const byType = {};
  for (const symbol of publicSymbols) {
    if (!byType[symbol.type]) {
      byType[symbol.type] = { total: 0, documented: 0 };
    }
    byType[symbol.type].total++;
    if (symbol.hasJSDoc && symbol.hasDescription) {
      byType[symbol.type].documented++;
    }
  }

  // Group by file
  const byFile = {};
  for (const symbol of publicSymbols) {
    if (!byFile[symbol.file]) {
      byFile[symbol.file] = { total: 0, documented: 0 };
    }
    byFile[symbol.file].total++;
    if (symbol.hasJSDoc && symbol.hasDescription) {
      byFile[symbol.file].documented++;
    }
  }

  return {
    totalSymbols: publicSymbols.length,
    documentedSymbols: documented.length,
    coveragePercent: publicSymbols.length > 0
      ? Math.round((documented.length / publicSymbols.length) * 100)
      : 100,
    byType,
    byFile,
    undocumented: publicSymbols.filter(s => !s.hasJSDoc || !s.hasDescription),
  };
}

/**
 * Print report to console
 * @param {CoverageReport} report
 */
function printReport(report) {
  console.log('\n📚 JSDoc Coverage Report');
  console.log('═'.repeat(50));
  console.log(`Total public symbols: ${report.totalSymbols}`);
  console.log(`Documented symbols: ${report.documentedSymbols}`);
  console.log(`Coverage: ${report.coveragePercent}%`);
  console.log('═'.repeat(50));

  console.log('\n📊 Coverage by Type:');
  for (const [type, stats] of Object.entries(report.byType)) {
    const percent = stats.total > 0 ? Math.round((stats.documented / stats.total) * 100) : 100;
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    console.log(`  ${type.padEnd(12)} ${bar} ${percent}% (${stats.documented}/${stats.total})`);
  }

  if (report.undocumented.length > 0) {
    console.log('\n⚠️  Undocumented Symbols (top 20):');
    const topUndocumented = report.undocumented.slice(0, 20);
    for (const symbol of topUndocumented) {
      console.log(`  ${symbol.type.padEnd(10)} ${symbol.name.padEnd(30)} ${symbol.file}:${symbol.line}`);
    }
    if (report.undocumented.length > 20) {
      console.log(`  ... and ${report.undocumented.length - 20} more`);
    }
  }

  console.log('');
}

/**
 * Generate HTML report
 * @param {CoverageReport} report
 */
function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSDoc Coverage Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .coverage { font-size: 3rem; font-weight: bold; color: ${report.coveragePercent >= 80 ? '#22c55e' : report.coveragePercent >= 60 ? '#eab308' : '#ef4444'}; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }
    .stat { background: #f3f4f6; padding: 1rem; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    .progress { width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .progress-bar { height: 100%; background: #22c55e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 JSDoc Coverage Report</h1>
    <div class="coverage">${report.coveragePercent}%</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${report.totalSymbols}</div>
      <div>Total Symbols</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.documentedSymbols}</div>
      <div>Documented</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.undocumented.length}</div>
      <div>Undocumented</div>
    </div>
  </div>

  <h2>Coverage by Type</h2>
  <table>
    <thead>
      <tr><th>Type</th><th>Documented</th><th>Total</th><th>Coverage</th></tr>
    </thead>
    <tbody>
      ${Object.entries(report.byType).map(([type, stats]) => {
        const percent = stats.total > 0 ? Math.round((stats.documented / stats.total) * 100) : 100;
        return `<tr>
          <td>${type}</td>
          <td>${stats.documented}</td>
          <td>${stats.total}</td>
          <td><div class="progress"><div class="progress-bar" style="width: ${percent}%"></div></div> ${percent}%</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <h2>Undocumented Symbols</h2>
  <table>
    <thead>
      <tr><th>Type</th><th>Name</th><th>File</th><th>Line</th></tr>
    </thead>
    <tbody>
      ${report.undocumented.map(s => `
        <tr>
          <td>${s.type}</td>
          <td>${s.name}</td>
          <td>${s.file}</td>
          <td>${s.line}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

  const reportPath = path.join(process.cwd(), 'jsdoc-coverage-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`📄 HTML report generated: ${reportPath}`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const generateHtml = args.includes('--report');
  const thresholdArg = args.find(a => a.startsWith('--threshold'));
  const threshold = thresholdArg
    ? parseInt(thresholdArg.split('=')[1] || args[args.indexOf('--threshold') + 1])
    : CONFIG.defaultThreshold;

  console.log('🔍 Scanning for JSDoc coverage...\n');

  const files = getFilesToScan();
  const allSymbols = [];

  for (const file of files) {
    const symbols = parseFile(file);
    allSymbols.push(...symbols);
  }

  const report = generateReport(allSymbols);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);

    if (generateHtml) {
      generateHtmlReport(report);
    }
  }

  // Check threshold
  if (report.coveragePercent < threshold) {
    console.log(`\n❌ Coverage ${report.coveragePercent}% is below threshold ${threshold}%\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ Coverage ${report.coveragePercent}% meets threshold ${threshold}%\n`);
    process.exit(0);
  }
}

main();



