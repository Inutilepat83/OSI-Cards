/**
 * Report Generator
 * 
 * Generates human-readable and machine-readable test reports
 * for visual consistency testing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StyleComparisonResult, getFailures, getCriticalFailures } from './style-comparator';
import { Severity } from '../fixtures/critical-styles';

/**
 * Report output options
 */
export interface ReportOptions {
  outputDir?: string;
  jsonReport?: boolean;
  consoleOutput?: boolean;
  htmlReport?: boolean;
}

const DEFAULT_OPTIONS: ReportOptions = {
  outputDir: 'e2e/reports',
  jsonReport: true,
  consoleOutput: true,
  htmlReport: false
};

/**
 * Generate a formatted console report
 */
export function generateConsoleReport(result: StyleComparisonResult): string {
  const lines: string[] = [];
  const width = 66;
  
  // Header
  lines.push('╔' + '═'.repeat(width) + '╗');
  lines.push('║' + centerText(`VISUAL CONSISTENCY TEST - ${result.test.environment || 'Test'}`, width) + '║');
  lines.push('╠' + '═'.repeat(width) + '╣');
  lines.push('║' + padText(`Baseline: ${shortenUrl(result.baseline.url)}`, width) + '║');
  lines.push('║' + padText(`Test: ${shortenUrl(result.test.url)}`, width) + '║');
  lines.push('╠' + '═'.repeat(width) + '╣');
  lines.push('║' + padText('RESULTS', width) + '║');
  lines.push('║' + '─'.repeat(width) + '║');
  
  // Element results
  for (const element of result.elements) {
    const status = element.failedProperties === 0 ? '✓' : '✗';
    const propCount = `(${element.matchedProperties}/${element.totalProperties} properties match)`;
    const elementLine = `${status} ${element.name}`;
    
    lines.push('║' + padText(`${elementLine.padEnd(30)} ${propCount}`, width) + '║');
    
    // Show failures for this element
    if (element.failedProperties > 0) {
      const failures = element.properties.filter(p => !p.match);
      for (const failure of failures.slice(0, 3)) { // Show max 3 failures per element
        const failLine = `  └─ ${failure.property}: expected "${truncate(failure.expected, 15)}" got "${truncate(failure.actual, 15)}"`;
        lines.push('║' + padText(failLine, width) + '║');
      }
      if (failures.length > 3) {
        lines.push('║' + padText(`  └─ ... and ${failures.length - 3} more`, width) + '║');
      }
    }
  }
  
  // CSS Variables section
  const cssVarFailures = result.cssVariables.filter(v => !v.match);
  if (cssVarFailures.length > 0) {
    lines.push('║' + '─'.repeat(width) + '║');
    lines.push('║' + padText('CSS VARIABLES', width) + '║');
    for (const failure of cssVarFailures) {
      const failLine = `✗ ${failure.property}: "${truncate(failure.expected, 12)}" → "${truncate(failure.actual, 12)}"`;
      lines.push('║' + padText(failLine, width) + '║');
    }
  }
  
  // Summary
  lines.push('╠' + '═'.repeat(width) + '╣');
  const summaryStatus = result.status === 'PASS' ? '✓ PASS' : '✗ FAIL';
  const summaryLine = `${summaryStatus}: ${result.summary.passedProperties}/${result.summary.totalProperties} (${result.summary.passRate}%)`;
  lines.push('║' + centerText(summaryLine, width) + '║');
  lines.push('╚' + '═'.repeat(width) + '╝');
  
  return lines.join('\n');
}

/**
 * Generate a detailed JSON report
 */
export function generateJsonReport(result: StyleComparisonResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Generate an HTML report
 */
export function generateHtmlReport(result: StyleComparisonResult): string {
  const failures = getFailures(result);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Consistency Report - ${result.test.environment || 'Test'}</title>
  <style>
    :root {
      --pass: #10b981;
      --fail: #ef4444;
      --warn: #f59e0b;
      --bg: #0f0f0f;
      --surface: #1a1a1a;
      --text: #e5e5e5;
      --muted: #737373;
      --brand: #ff7900;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'SF Mono', 'Monaco', monospace;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: var(--surface);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      font-size: 1.5rem;
      color: var(--brand);
      margin-bottom: 1rem;
    }
    .status {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: bold;
    }
    .status.pass { background: var(--pass); color: white; }
    .status.fail { background: var(--fail); color: white; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 8px;
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: var(--brand); }
    .stat-label { font-size: 0.875rem; color: var(--muted); }
    .section {
      background: var(--surface);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .section h2 {
      font-size: 1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .element-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background: rgba(255,255,255,0.02);
    }
    .element-row.failed { border-left: 3px solid var(--fail); }
    .element-row.passed { border-left: 3px solid var(--pass); }
    .failure-detail {
      font-size: 0.75rem;
      color: var(--muted);
      margin-left: 1rem;
      padding: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 4px;
      margin-top: 0.5rem;
    }
    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .badge.critical { background: var(--fail); }
    .badge.high { background: var(--warn); }
    .badge.medium { background: rgba(255,255,255,0.2); }
    .badge.low { background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Visual Consistency Report</h1>
      <div>
        <span class="status ${result.status.toLowerCase()}">${result.status}</span>
        <span style="margin-left: 1rem; color: var(--muted);">
          ${result.test.environment || 'Test Environment'}
        </span>
      </div>
      <div class="summary">
        <div class="stat">
          <div class="stat-value">${result.summary.passRate}%</div>
          <div class="stat-label">Pass Rate</div>
        </div>
        <div class="stat">
          <div class="stat-value">${result.summary.passedProperties}/${result.summary.totalProperties}</div>
          <div class="stat-label">Properties Matched</div>
        </div>
        <div class="stat">
          <div class="stat-value">${result.summary.elementsFound}/${result.summary.totalElements}</div>
          <div class="stat-label">Elements Found</div>
        </div>
        <div class="stat">
          <div class="stat-value">${result.summary.failedProperties}</div>
          <div class="stat-label">Failures</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Element Comparison</h2>
      ${result.elements.map(el => `
        <div class="element-row ${el.failedProperties > 0 ? 'failed' : 'passed'}">
          <div>
            <strong>${el.name}</strong>
            <span style="color: var(--muted); font-size: 0.75rem; margin-left: 0.5rem;">
              ${el.selector}
            </span>
          </div>
          <div>${el.matchedProperties}/${el.totalProperties}</div>
        </div>
        ${el.properties.filter(p => !p.match).map(p => `
          <div class="failure-detail">
            <span class="badge ${p.severity}">${p.severity}</span>
            <strong>${p.property}</strong>: 
            expected <code>"${p.expected}"</code> 
            got <code>"${p.actual}"</code>
          </div>
        `).join('')}
      `).join('')}
    </div>
    
    ${failures.cssVariables.length > 0 ? `
    <div class="section">
      <h2>CSS Variables</h2>
      ${failures.cssVariables.map(v => `
        <div class="element-row failed">
          <div><code>${v.property}</code></div>
          <div>
            <span style="color: var(--muted);">expected:</span> ${v.expected}
            <span style="color: var(--muted); margin-left: 1rem;">got:</span> ${v.actual}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div style="color: var(--muted); font-size: 0.75rem; margin-top: 2rem; text-align: center;">
      Generated: ${result.timestamp} | Baseline: ${shortenUrl(result.baseline.url)}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Save reports to disk
 */
export async function saveReports(
  result: StyleComparisonResult,
  options: ReportOptions = {}
): Promise<string[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const savedFiles: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const envName = result.test.environment?.toLowerCase().replace(/\s+/g, '-') || 'test';
  
  // Ensure output directory exists
  if (opts.outputDir) {
    if (!fs.existsSync(opts.outputDir)) {
      fs.mkdirSync(opts.outputDir, { recursive: true });
    }
  }
  
  // Console output
  if (opts.consoleOutput) {
    console.log('\n' + generateConsoleReport(result) + '\n');
  }
  
  // JSON report
  if (opts.jsonReport && opts.outputDir) {
    const jsonPath = path.join(opts.outputDir, `visual-consistency-${envName}-${timestamp}.json`);
    fs.writeFileSync(jsonPath, generateJsonReport(result));
    savedFiles.push(jsonPath);
  }
  
  // HTML report
  if (opts.htmlReport && opts.outputDir) {
    const htmlPath = path.join(opts.outputDir, `visual-consistency-${envName}-${timestamp}.html`);
    fs.writeFileSync(htmlPath, generateHtmlReport(result));
    savedFiles.push(htmlPath);
  }
  
  return savedFiles;
}

/**
 * Generate a summary report for multiple environments
 */
export function generateMultiEnvSummary(results: StyleComparisonResult[]): string {
  const lines: string[] = [];
  const width = 70;
  
  lines.push('');
  lines.push('╔' + '═'.repeat(width) + '╗');
  lines.push('║' + centerText('MULTI-ENVIRONMENT VISUAL CONSISTENCY SUMMARY', width) + '║');
  lines.push('╠' + '═'.repeat(width) + '╣');
  
  for (const result of results) {
    const status = result.status === 'PASS' ? '✓' : '✗';
    const envName = (result.test.environment || 'Unknown').padEnd(25);
    const passRate = `${result.summary.passRate}%`.padStart(6);
    const failures = result.summary.failedProperties.toString().padStart(3);
    
    lines.push('║' + padText(`${status} ${envName} ${passRate} pass | ${failures} failures`, width) + '║');
  }
  
  lines.push('╠' + '═'.repeat(width) + '╣');
  
  const allPass = results.every(r => r.status === 'PASS');
  const totalFailures = results.reduce((sum, r) => sum + r.summary.failedProperties, 0);
  const avgPassRate = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.summary.passRate, 0) / results.length * 100) / 100
    : 0;
  
  const finalStatus = allPass ? '✓ ALL ENVIRONMENTS PASS' : `✗ ${totalFailures} TOTAL FAILURES`;
  lines.push('║' + centerText(finalStatus, width) + '║');
  lines.push('║' + centerText(`Average Pass Rate: ${avgPassRate}%`, width) + '║');
  lines.push('╚' + '═'.repeat(width) + '╝');
  lines.push('');
  
  return lines.join('\n');
}

// Helper functions

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
}

function padText(text: string, width: number): string {
  return ' ' + text.slice(0, width - 2).padEnd(width - 2) + ' ';
}

function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search ? '?' + u.search.slice(0, 20) : '');
  } catch {
    return url.slice(0, 40);
  }
}









