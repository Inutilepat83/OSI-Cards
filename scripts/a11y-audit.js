#!/usr/bin/env node

/**
 * Accessibility Audit Script (Point 70)
 *
 * WCAG compliance audit for the codebase.
 * Checks HTML templates and components for accessibility issues.
 *
 * Usage:
 *   node scripts/a11y-audit.js
 *   node scripts/a11y-audit.js --report (generate HTML report)
 *   node scripts/a11y-audit.js --json (JSON output)
 *   node scripts/a11y-audit.js --level AA (WCAG level: A, AA, AAA)
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
  extensions: ['.html', '.ts'],
  ignore: ['node_modules', 'dist', '.spec.ts', '.stories.ts'],
};

// =============================================================================
// WCAG RULES
// =============================================================================

const A11Y_RULES = [
  // WCAG 1.1.1 - Non-text Content (Level A)
  {
    id: 'A11Y-001',
    name: 'Missing alt attribute',
    description: 'Images must have alt attributes',
    wcag: '1.1.1',
    level: 'A',
    impact: 'critical',
    pattern: /<img(?![^>]*\balt\s*=)[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add alt attribute: <img alt="Description" ...>',
  },
  {
    id: 'A11Y-002',
    name: 'Empty alt on decorative image',
    description: 'Decorative images should have alt=""',
    wcag: '1.1.1',
    level: 'A',
    impact: 'minor',
    pattern: /<img[^>]*\balt\s*=\s*["']\s*["'][^>]*(?!role\s*=\s*["']presentation["'])[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add role="presentation" for decorative images with empty alt',
  },

  // WCAG 1.3.1 - Info and Relationships (Level A)
  {
    id: 'A11Y-003',
    name: 'Form input without label',
    description: 'Form inputs must have associated labels',
    wcag: '1.3.1',
    level: 'A',
    impact: 'critical',
    pattern: /<input(?![^>]*(?:aria-label|aria-labelledby|id\s*=\s*["'][^"']*["'][^>]*<label[^>]*for))[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add label element with for attribute or aria-label',
  },
  {
    id: 'A11Y-004',
    name: 'Missing heading hierarchy',
    description: 'Headings should not skip levels',
    wcag: '1.3.1',
    level: 'A',
    impact: 'moderate',
    pattern: /<h1[^>]*>.*?<\/h1>(?:(?!<h[12])[^])*<h[3-6]/gi,
    fileTypes: ['.html'],
    fix: 'Ensure heading levels are sequential (h1 -> h2 -> h3)',
  },

  // WCAG 1.4.1 - Use of Color (Level A)
  {
    id: 'A11Y-005',
    name: 'Color-only indication',
    description: 'Information should not be conveyed by color alone',
    wcag: '1.4.1',
    level: 'A',
    impact: 'serious',
    pattern: /(?:class|style)\s*=\s*["'][^"']*(?:color|background)[^"']*["'](?![^>]*(?:aria-|role))/gi,
    fileTypes: ['.html'],
    fix: 'Add text, icon, or pattern in addition to color',
  },

  // WCAG 2.1.1 - Keyboard (Level A)
  {
    id: 'A11Y-006',
    name: 'Non-interactive element with click handler',
    description: 'Click handlers on non-interactive elements need keyboard support',
    wcag: '2.1.1',
    level: 'A',
    impact: 'critical',
    pattern: /<(?:div|span|p)[^>]*\(click\)\s*=/gi,
    fileTypes: ['.html'],
    fix: 'Use <button> or add tabindex="0" and keydown handler',
  },
  {
    id: 'A11Y-007',
    name: 'Missing tabindex on interactive element',
    description: 'Custom interactive elements need tabindex',
    wcag: '2.1.1',
    level: 'A',
    impact: 'serious',
    pattern: /<(?:div|span)[^>]*(?:role\s*=\s*["'](?:button|link|checkbox|radio)["'])[^>]*(?!tabindex)[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add tabindex="0" to make element focusable',
  },

  // WCAG 2.4.1 - Bypass Blocks (Level A)
  {
    id: 'A11Y-008',
    name: 'Missing skip link',
    description: 'Pages should have skip links for keyboard users',
    wcag: '2.4.1',
    level: 'A',
    impact: 'moderate',
    pattern: /<body[^>]*>(?:(?!skip|main-content)[^]){0,500}<main/gi,
    fileTypes: ['.html'],
    fix: 'Add skip link: <a href="#main-content" class="skip-link">Skip to content</a>',
  },

  // WCAG 2.4.4 - Link Purpose (Level A)
  {
    id: 'A11Y-009',
    name: 'Ambiguous link text',
    description: 'Links should have descriptive text',
    wcag: '2.4.4',
    level: 'A',
    impact: 'serious',
    pattern: /<a[^>]*>(?:click here|read more|learn more|here|more)<\/a>/gi,
    fileTypes: ['.html'],
    fix: 'Use descriptive link text that makes sense out of context',
  },
  {
    id: 'A11Y-010',
    name: 'Empty link',
    description: 'Links must have accessible text',
    wcag: '2.4.4',
    level: 'A',
    impact: 'critical',
    pattern: /<a[^>]*>\s*<\/a>/gi,
    fileTypes: ['.html'],
    fix: 'Add link text or aria-label',
  },

  // WCAG 2.4.6 - Headings and Labels (Level AA)
  {
    id: 'A11Y-011',
    name: 'Empty heading',
    description: 'Headings must have content',
    wcag: '2.4.6',
    level: 'AA',
    impact: 'serious',
    pattern: /<h[1-6][^>]*>\s*<\/h[1-6]>/gi,
    fileTypes: ['.html'],
    fix: 'Add meaningful heading text',
  },

  // WCAG 2.5.3 - Label in Name (Level A)
  {
    id: 'A11Y-012',
    name: 'Accessible name mismatch',
    description: 'Visible label should match accessible name',
    wcag: '2.5.3',
    level: 'A',
    impact: 'serious',
    pattern: /<button[^>]*aria-label\s*=\s*["'][^"']*["'][^>]*>[^<]+<\/button>/gi,
    fileTypes: ['.html'],
    fix: 'Ensure aria-label includes visible text',
  },

  // WCAG 3.1.1 - Language of Page (Level A)
  {
    id: 'A11Y-013',
    name: 'Missing lang attribute',
    description: 'HTML element should have lang attribute',
    wcag: '3.1.1',
    level: 'A',
    impact: 'serious',
    pattern: /<html(?![^>]*\blang\s*=)[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add lang attribute: <html lang="en">',
  },

  // WCAG 4.1.1 - Parsing (Level A)
  {
    id: 'A11Y-014',
    name: 'Duplicate ID',
    description: 'IDs must be unique',
    wcag: '4.1.1',
    level: 'A',
    impact: 'serious',
    pattern: /id\s*=\s*["']([^"']+)["'](?=[^]*id\s*=\s*["']\1["'])/gi,
    fileTypes: ['.html'],
    fix: 'Use unique IDs for each element',
  },

  // WCAG 4.1.2 - Name, Role, Value (Level A)
  {
    id: 'A11Y-015',
    name: 'Missing ARIA role',
    description: 'Custom widgets need appropriate ARIA roles',
    wcag: '4.1.2',
    level: 'A',
    impact: 'critical',
    pattern: /<div[^>]*class\s*=\s*["'][^"']*(?:modal|dialog|menu|tab|accordion)[^"']*["'](?![^>]*role\s*=)[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add appropriate role attribute',
  },
  {
    id: 'A11Y-016',
    name: 'Missing aria-expanded',
    description: 'Expandable elements need aria-expanded',
    wcag: '4.1.2',
    level: 'A',
    impact: 'serious',
    pattern: /<(?:button|div)[^>]*(?:toggle|expand|collapse)[^>]*(?!aria-expanded)[^>]*>/gi,
    fileTypes: ['.html'],
    fix: 'Add aria-expanded="true|false" attribute',
  },

  // Angular-specific
  {
    id: 'A11Y-017',
    name: 'Missing cdkTrapFocus in modal',
    description: 'Modals should trap focus',
    wcag: '2.4.3',
    level: 'A',
    impact: 'serious',
    pattern: /role\s*=\s*["']dialog["'](?![^>]*cdkTrapFocus)/gi,
    fileTypes: ['.html'],
    fix: 'Add cdkTrapFocus directive to modal',
  },
  {
    id: 'A11Y-018',
    name: 'Missing aria-live for dynamic content',
    description: 'Dynamic content should use aria-live',
    wcag: '4.1.3',
    level: 'A',
    impact: 'serious',
    pattern: /\*ngIf\s*=\s*["'][^"']*(?:loading|error|success)[^"']*["'](?![^>]*aria-live)/gi,
    fileTypes: ['.html'],
    fix: 'Add aria-live="polite" or aria-live="assertive"',
  },

  // Reduced motion
  {
    id: 'A11Y-019',
    name: 'Animation without reduced motion check',
    description: 'Animations should respect prefers-reduced-motion',
    wcag: '2.3.3',
    level: 'AAA',
    impact: 'moderate',
    pattern: /animation(?:-[a-z]+)?\s*:/gi,
    fileTypes: ['.ts'],
    fix: 'Add @media (prefers-reduced-motion: reduce) query',
  },

  // Color contrast (basic check)
  {
    id: 'A11Y-020',
    name: 'Potential low contrast',
    description: 'Text may have insufficient contrast',
    wcag: '1.4.3',
    level: 'AA',
    impact: 'serious',
    pattern: /color\s*:\s*(?:#[a-f0-9]{3,6}|(?:light|pale)[a-z]+)/gi,
    fileTypes: ['.ts', '.html'],
    fix: 'Ensure text has 4.5:1 contrast ratio (3:1 for large text)',
  },
];

// =============================================================================
// SCANNING
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

function scanFile(filePath, wcagLevel) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  const ext = path.extname(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  const levelPriority = { 'A': 1, 'AA': 2, 'AAA': 3 };
  const targetLevel = levelPriority[wcagLevel] || 2;

  for (const rule of A11Y_RULES) {
    // Filter by WCAG level
    if (levelPriority[rule.level] > targetLevel) {
      continue;
    }

    // Check if rule applies to this file type
    if (!rule.fileTypes.includes(ext)) {
      continue;
    }

    // Scan content
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      issues.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        wcag: rule.wcag,
        level: rule.level,
        impact: rule.impact,
        file: relativePath,
        line: lineNumber,
        code: match[0].substring(0, 80),
        fix: rule.fix,
      });
    }
  }

  return issues;
}

// =============================================================================
// REPORTING
// =============================================================================

function generateReport(issues) {
  const critical = issues.filter(i => i.impact === 'critical');
  const serious = issues.filter(i => i.impact === 'serious');
  const moderate = issues.filter(i => i.impact === 'moderate');
  const minor = issues.filter(i => i.impact === 'minor');

  return {
    summary: {
      total: issues.length,
      critical: critical.length,
      serious: serious.length,
      moderate: moderate.length,
      minor: minor.length,
    },
    issues,
    byWcag: groupBy(issues, 'wcag'),
    byLevel: groupBy(issues, 'level'),
    byFile: groupBy(issues, 'file'),
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

function printReport(report) {
  console.log('\n♿ Accessibility Audit Report');
  console.log('═'.repeat(50));
  console.log(`Total issues: ${report.summary.total}`);
  console.log(`  🔴 Critical: ${report.summary.critical}`);
  console.log(`  🟠 Serious: ${report.summary.serious}`);
  console.log(`  🟡 Moderate: ${report.summary.moderate}`);
  console.log(`  🟢 Minor: ${report.summary.minor}`);
  console.log('═'.repeat(50));

  if (report.issues.length === 0) {
    console.log('\n✅ No accessibility issues detected!\n');
    return;
  }

  // Group by impact
  const impactOrder = ['critical', 'serious', 'moderate', 'minor'];

  for (const impact of impactOrder) {
    const issues = report.issues.filter(i => i.impact === impact);
    if (issues.length === 0) continue;

    const icon = { critical: '🔴', serious: '🟠', moderate: '🟡', minor: '🟢' }[impact];
    console.log(`\n${icon} ${impact.toUpperCase()} (${issues.length}):\n`);

    for (const issue of issues.slice(0, 10)) {
      console.log(`  [${issue.id}] ${issue.name}`);
      console.log(`    WCAG: ${issue.wcag} (Level ${issue.level})`);
      console.log(`    File: ${issue.file}:${issue.line}`);
      console.log(`    Fix: ${issue.fix}`);
      console.log('');
    }

    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more\n`);
    }
  }

  // WCAG Summary
  console.log('\n📊 Issues by WCAG Criterion:');
  for (const [wcag, issues] of Object.entries(report.byWcag)) {
    console.log(`  ${wcag}: ${issues.length}`);
  }
  console.log('');
}

function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Audit Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
    .stat { padding: 1rem; border-radius: 8px; text-align: center; }
    .stat-critical { background: #fef2f2; color: #dc2626; }
    .stat-serious { background: #fff7ed; color: #ea580c; }
    .stat-moderate { background: #fefce8; color: #ca8a04; }
    .stat-minor { background: #f0fdf4; color: #16a34a; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    .impact-critical { color: #dc2626; }
    .impact-serious { color: #ea580c; }
    .impact-moderate { color: #ca8a04; }
    .impact-minor { color: #16a34a; }
  </style>
</head>
<body>
  <h1>♿ Accessibility Audit Report</h1>

  <div class="summary">
    <div class="stat stat-critical">
      <div class="stat-value">${report.summary.critical}</div>
      <div>Critical</div>
    </div>
    <div class="stat stat-serious">
      <div class="stat-value">${report.summary.serious}</div>
      <div>Serious</div>
    </div>
    <div class="stat stat-moderate">
      <div class="stat-value">${report.summary.moderate}</div>
      <div>Moderate</div>
    </div>
    <div class="stat stat-minor">
      <div class="stat-value">${report.summary.minor}</div>
      <div>Minor</div>
    </div>
  </div>

  <h2>All Issues (${report.issues.length})</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Issue</th>
        <th>WCAG</th>
        <th>Impact</th>
        <th>File</th>
        <th>Line</th>
      </tr>
    </thead>
    <tbody>
      ${report.issues.map(i => `
        <tr>
          <td>${i.id}</td>
          <td>${i.name}</td>
          <td>${i.wcag} (${i.level})</td>
          <td class="impact-${i.impact}">${i.impact}</td>
          <td>${i.file}</td>
          <td>${i.line}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

  const reportPath = path.join(process.cwd(), 'a11y-audit-report.html');
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
  const levelArg = args.find(a => a.startsWith('--level'));
  const wcagLevel = levelArg ? levelArg.split('=')[1] || args[args.indexOf('--level') + 1] || 'AA' : 'AA';

  console.log(`🔍 Running accessibility audit (WCAG ${wcagLevel})...\n`);

  const files = getFilesToScan();
  const allIssues = [];

  for (const file of files) {
    const issues = scanFile(file, wcagLevel);
    allIssues.push(...issues);
  }

  const report = generateReport(allIssues);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);

    if (generateHtml) {
      generateHtmlReport(report);
    }
  }

  // Exit codes
  if (report.summary.critical > 0) {
    console.log('❌ Critical accessibility issues found!\n');
    process.exit(1);
  }

  console.log('✅ Accessibility audit passed\n');
  process.exit(0);
}

main();



