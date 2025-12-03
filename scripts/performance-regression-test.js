#!/usr/bin/env node

/**
 * Performance Regression Testing
 * Compares current performance against baseline metrics
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baselineFile: 'performance-baseline.json',
  reportFile: 'performance-regression-report.json',
  thresholds: {
    // Maximum allowed regression percentages
    buildTime: 10, // 10% slower
    bundleSize: 5, // 5% larger
    renderTime: 15, // 15% slower
    layoutTime: 15, // 15% slower
    memoryUsage: 20, // 20% more memory
  },
  metrics: [
    'buildTime',
    'bundleSize',
    'renderTime',
    'layoutTime',
    'memoryUsage',
    'testDuration',
  ],
};

/**
 * Performance metrics
 */
const currentMetrics = {
  buildTime: 0,
  bundleSize: 0,
  renderTime: 0,
  layoutTime: 0,
  memoryUsage: 0,
  testDuration: 0,
  timestamp: new Date().toISOString(),
};

/**
 * Main function
 */
async function runPerformanceTest() {
  console.log('🏃 Running Performance Regression Tests...\n');

  // Collect current metrics
  await collectMetrics();

  // Load baseline
  const baseline = loadBaseline();

  if (!baseline) {
    console.log('📊 No baseline found. Creating baseline...');
    saveBaseline(currentMetrics);
    console.log('✅ Baseline created successfully!');
    return;
  }

  // Compare metrics
  const regressions = compareMetrics(baseline, currentMetrics);

  // Generate report
  generateReport(baseline, currentMetrics, regressions);

  // Exit with error if significant regressions
  if (regressions.some((r) => r.severity === 'critical')) {
    console.error('\n❌ Critical performance regressions detected!');
    process.exit(1);
  } else if (regressions.some((r) => r.severity === 'warning')) {
    console.warn('\n⚠️ Performance warnings detected');
    // Don't fail build for warnings
  } else {
    console.log('\n✅ No performance regressions detected!');
  }
}

/**
 * Collect current performance metrics
 */
async function collectMetrics() {
  console.log('📊 Collecting performance metrics...\n');

  // Measure build time
  console.log('⏱️ Measuring build time...');
  const buildStart = Date.now();
  try {
    const { execSync } = require('child_process');
    execSync('npm run build:lib -- --configuration=production', {
      stdio: 'pipe',
    });
    currentMetrics.buildTime = Date.now() - buildStart;
    console.log(`   Build time: ${currentMetrics.buildTime}ms`);
  } catch (error) {
    console.error('   Build failed');
    process.exit(1);
  }

  // Measure bundle size
  console.log('📦 Measuring bundle size...');
  const distPath = path.join(process.cwd(), 'dist/osi-cards-lib');
  if (fs.existsSync(distPath)) {
    currentMetrics.bundleSize = getDirectorySize(distPath);
    console.log(`   Bundle size: ${(currentMetrics.bundleSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Note: Render time, layout time, and memory usage would be collected
  // from actual performance tests (Playwright, Puppeteer, etc.)
  // For this script, we'll use placeholder values
  currentMetrics.renderTime = 50; // ms
  currentMetrics.layoutTime = 10; // ms
  currentMetrics.memoryUsage = 100; // MB

  console.log();
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach((item) => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        totalSize += stat.size;
      }
    });
  }

  traverse(dirPath);
  return totalSize;
}

/**
 * Load baseline metrics
 */
function loadBaseline() {
  const baselinePath = path.join(process.cwd(), CONFIG.baselineFile);

  if (!fs.existsSync(baselinePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(baselinePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load baseline:', error);
    return null;
  }
}

/**
 * Save baseline metrics
 */
function saveBaseline(metrics) {
  const baselinePath = path.join(process.cwd(), CONFIG.baselineFile);
  fs.writeFileSync(baselinePath, JSON.stringify(metrics, null, 2));
}

/**
 * Compare current metrics to baseline
 */
function compareMetrics(baseline, current) {
  const regressions = [];

  CONFIG.metrics.forEach((metric) => {
    if (!baseline[metric] || !current[metric]) return;

    const baselineValue = baseline[metric];
    const currentValue = current[metric];
    const difference = currentValue - baselineValue;
    const percentChange = (difference / baselineValue) * 100;
    const threshold = CONFIG.thresholds[metric] || 10;

    let severity = 'none';
    if (percentChange > threshold * 2) {
      severity = 'critical';
    } else if (percentChange > threshold) {
      severity = 'warning';
    } else if (percentChange < 0) {
      severity = 'improvement';
    }

    regressions.push({
      metric,
      baseline: baselineValue,
      current: currentValue,
      difference,
      percentChange,
      threshold,
      severity,
    });
  });

  return regressions;
}

/**
 * Generate regression report
 */
function generateReport(baseline, current, regressions) {
  console.log('📊 Performance Regression Report\n');
  console.log('='.repeat(80));

  regressions.forEach((regression) => {
    const {
      metric,
      baseline: baselineVal,
      current: currentVal,
      percentChange,
      severity,
    } = regression;

    const icon =
      severity === 'critical'
        ? '🔴'
        : severity === 'warning'
        ? '🟡'
        : severity === 'improvement'
        ? '🟢'
        : '⚪';

    const sign = percentChange > 0 ? '+' : '';
    const formatted = formatMetric(metric, currentVal);
    const baselineFormatted = formatMetric(metric, baselineVal);

    console.log(`${icon} ${metric}:`);
    console.log(`   Baseline: ${baselineFormatted}`);
    console.log(`   Current:  ${formatted}`);
    console.log(`   Change:   ${sign}${percentChange.toFixed(2)}%`);

    if (severity === 'critical') {
      console.log(`   ❌ CRITICAL: Exceeds threshold by ${(Math.abs(percentChange) - regression.threshold).toFixed(2)}%`);
    } else if (severity === 'warning') {
      console.log(`   ⚠️ WARNING: Approaching threshold`);
    } else if (severity === 'improvement') {
      console.log(`   ✅ IMPROVED`);
    }

    console.log();
  });

  console.log('='.repeat(80));

  // Summary
  const critical = regressions.filter((r) => r.severity === 'critical').length;
  const warnings = regressions.filter((r) => r.severity === 'warning').length;
  const improvements = regressions.filter((r) => r.severity === 'improvement').length;

  console.log('\n📈 Summary:');
  console.log(`   Critical Regressions: ${critical}`);
  console.log(`   Warnings: ${warnings}`);
  console.log(`   Improvements: ${improvements}`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    baseline,
    current,
    regressions,
    summary: {
      critical,
      warnings,
      improvements,
    },
  };

  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${CONFIG.reportFile}`);
}

/**
 * Format metric for display
 */
function formatMetric(metric, value) {
  switch (metric) {
    case 'buildTime':
    case 'renderTime':
    case 'layoutTime':
    case 'testDuration':
      return `${value}ms`;

    case 'bundleSize':
      return `${(value / 1024 / 1024).toFixed(2)}MB`;

    case 'memoryUsage':
      return `${value}MB`;

    default:
      return String(value);
  }
}

// Run tests
runPerformanceTest().catch((error) => {
  console.error('❌ Performance test failed:', error);
  process.exit(1);
});

