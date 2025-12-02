#!/usr/bin/env node

/**
 * Lighthouse CI Script (Point 80)
 *
 * Automated performance budgets using Lighthouse.
 * Runs Lighthouse audits and enforces performance thresholds.
 *
 * Usage:
 *   node scripts/lighthouse-ci.js
 *   node scripts/lighthouse-ci.js --url http://localhost:4200
 *   node scripts/lighthouse-ci.js --budget strict
 *   node scripts/lighthouse-ci.js --json
 *
 * Exit codes:
 *   0 - All budgets met
 *   1 - Budget violations
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  defaultUrl: 'http://localhost:4200',
  outputDir: 'lighthouse-reports',
  budgets: {
    // Relaxed budgets for development
    development: {
      performance: 60,
      accessibility: 90,
      bestPractices: 80,
      seo: 80,
      pwa: 50,
      fcp: 3000,  // First Contentful Paint (ms)
      lcp: 4000,  // Largest Contentful Paint (ms)
      cls: 0.25,  // Cumulative Layout Shift
      tbt: 600,   // Total Blocking Time (ms)
    },
    // Strict budgets for production
    production: {
      performance: 80,
      accessibility: 100,
      bestPractices: 90,
      seo: 90,
      pwa: 70,
      fcp: 2000,
      lcp: 2500,
      cls: 0.1,
      tbt: 300,
    },
    // Strict budgets for CI
    strict: {
      performance: 90,
      accessibility: 100,
      bestPractices: 95,
      seo: 95,
      pwa: 80,
      fcp: 1500,
      lcp: 2000,
      cls: 0.05,
      tbt: 200,
    },
  },
};

// =============================================================================
// LIGHTHOUSE RUNNER
// =============================================================================

/**
 * Check if Lighthouse is installed
 */
function checkLighthouseInstalled() {
  try {
    execSync('npx lighthouse --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run Lighthouse audit
 */
async function runLighthouse(url, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      'lighthouse',
      url,
      '--output=json',
      '--output=html',
      `--output-path=${outputPath}`,
      '--chrome-flags="--headless --no-sandbox --disable-gpu"',
      '--quiet',
    ];

    console.log(`🔍 Running Lighthouse audit on ${url}...`);

    const process = spawn('npx', args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Lighthouse failed: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse Lighthouse results
 */
function parseResults(jsonPath) {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const report = JSON.parse(content);

  return {
    scores: {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories['best-practices'].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      pwa: report.categories.pwa ? Math.round(report.categories.pwa.score * 100) : null,
    },
    metrics: {
      fcp: report.audits['first-contentful-paint']?.numericValue || 0,
      lcp: report.audits['largest-contentful-paint']?.numericValue || 0,
      cls: report.audits['cumulative-layout-shift']?.numericValue || 0,
      tbt: report.audits['total-blocking-time']?.numericValue || 0,
      tti: report.audits['interactive']?.numericValue || 0,
      si: report.audits['speed-index']?.numericValue || 0,
    },
    audits: report.audits,
    fetchTime: report.fetchTime,
    finalUrl: report.finalUrl,
  };
}

// =============================================================================
// BUDGET CHECKING
// =============================================================================

/**
 * Check results against budget
 */
function checkBudget(results, budget) {
  const violations = [];
  const warnings = [];

  // Check category scores
  const categories = ['performance', 'accessibility', 'bestPractices', 'seo'];
  for (const category of categories) {
    const actual = results.scores[category];
    const threshold = budget[category];

    if (actual < threshold) {
      violations.push({
        type: 'score',
        category,
        actual,
        threshold,
        message: `${category} score ${actual} is below threshold ${threshold}`,
      });
    } else if (actual < threshold + 10) {
      warnings.push({
        type: 'score',
        category,
        actual,
        threshold,
        message: `${category} score ${actual} is close to threshold ${threshold}`,
      });
    }
  }

  // Check Web Vitals
  const vitals = [
    { key: 'fcp', name: 'First Contentful Paint', unit: 'ms' },
    { key: 'lcp', name: 'Largest Contentful Paint', unit: 'ms' },
    { key: 'cls', name: 'Cumulative Layout Shift', unit: '' },
    { key: 'tbt', name: 'Total Blocking Time', unit: 'ms' },
  ];

  for (const vital of vitals) {
    const actual = results.metrics[vital.key];
    const threshold = budget[vital.key];

    if (actual > threshold) {
      violations.push({
        type: 'metric',
        metric: vital.key,
        name: vital.name,
        actual: Math.round(actual),
        threshold,
        unit: vital.unit,
        message: `${vital.name} ${Math.round(actual)}${vital.unit} exceeds threshold ${threshold}${vital.unit}`,
      });
    }
  }

  return { violations, warnings };
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Print results to console
 */
function printResults(results, budgetCheck) {
  console.log('\n📊 Lighthouse Results');
  console.log('═'.repeat(50));

  // Scores
  console.log('\n📈 Category Scores:');
  const scoreIcons = {
    performance: '⚡',
    accessibility: '♿',
    bestPractices: '✅',
    seo: '🔍',
    pwa: '📱',
  };

  for (const [category, score] of Object.entries(results.scores)) {
    if (score === null) continue;
    const icon = scoreIcons[category] || '📊';
    const color = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`  ${icon} ${category.padEnd(15)} ${color} ${score}`);
  }

  // Web Vitals
  console.log('\n⏱️  Web Vitals:');
  const vitalNames = {
    fcp: 'First Contentful Paint',
    lcp: 'Largest Contentful Paint',
    cls: 'Cumulative Layout Shift',
    tbt: 'Total Blocking Time',
    tti: 'Time to Interactive',
    si: 'Speed Index',
  };

  for (const [key, value] of Object.entries(results.metrics)) {
    const name = vitalNames[key] || key;
    const formatted = key === 'cls' ? value.toFixed(3) : `${Math.round(value)}ms`;
    console.log(`  ${name.padEnd(25)} ${formatted}`);
  }

  // Budget check
  if (budgetCheck.violations.length > 0) {
    console.log('\n❌ Budget Violations:');
    for (const v of budgetCheck.violations) {
      console.log(`  - ${v.message}`);
    }
  }

  if (budgetCheck.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const w of budgetCheck.warnings) {
      console.log(`  - ${w.message}`);
    }
  }

  console.log('');
}

/**
 * Generate JSON report
 */
function generateJsonReport(results, budgetCheck, budget) {
  return {
    timestamp: new Date().toISOString(),
    url: results.finalUrl,
    scores: results.scores,
    metrics: results.metrics,
    budget,
    violations: budgetCheck.violations,
    warnings: budgetCheck.warnings,
    passed: budgetCheck.violations.length === 0,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const urlArg = args.find(a => a.startsWith('--url'));
  const budgetArg = args.find(a => a.startsWith('--budget'));

  const url = urlArg ? urlArg.split('=')[1] || args[args.indexOf('--url') + 1] : CONFIG.defaultUrl;
  const budgetName = budgetArg ? budgetArg.split('=')[1] || args[args.indexOf('--budget') + 1] : 'development';
  const budget = CONFIG.budgets[budgetName] || CONFIG.budgets.development;

  // Check if Lighthouse is installed
  if (!checkLighthouseInstalled()) {
    console.error('❌ Lighthouse is not installed. Run: npm install -g lighthouse');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(CONFIG.outputDir, `lighthouse-${timestamp}`);

  try {
    // Run Lighthouse
    await runLighthouse(url, outputPath);

    // Parse results
    const jsonPath = `${outputPath}.report.json`;
    const results = parseResults(jsonPath);

    // Check budget
    const budgetCheck = checkBudget(results, budget);

    if (jsonOutput) {
      const report = generateJsonReport(results, budgetCheck, budget);
      console.log(JSON.stringify(report, null, 2));
    } else {
      printResults(results, budgetCheck);
      console.log(`📄 Full report: ${outputPath}.report.html`);
    }

    // Exit code based on violations
    if (budgetCheck.violations.length > 0) {
      console.log('\n❌ Performance budget not met!\n');
      process.exit(1);
    }

    console.log('\n✅ All performance budgets met!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);

    // Provide helpful message if server not running
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm run start\n');
    }

    process.exit(1);
  }
}

main();



