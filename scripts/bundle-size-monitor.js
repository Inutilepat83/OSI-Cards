#!/usr/bin/env node

/**
 * Bundle Size Monitor
 * 
 * Monitors bundle sizes and compares against baseline to detect regressions.
 * Can be used in CI/CD to alert on size increases.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

const distDir = path.join(__dirname, '..', 'dist', 'osi-cards');
const baselineFile = path.join(__dirname, '..', '.bundle-size-baseline.json');

// Thresholds for regression detection
const REGRESSION_THRESHOLDS = {
  warning: 0.05,  // 5% increase triggers warning
  error: 0.10     // 10% increase triggers error
};

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Get gzipped size
 */
async function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = await gzip(content);
    return gzipped.length;
  } catch {
    return 0;
  }
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate bundle sizes
 */
async function calculateBundleSizes() {
  if (!fs.existsSync(distDir)) {
    throw new Error('Build directory not found. Run build first.');
  }

  const files = fs.readdirSync(distDir);
  const bundles = {};

  // Find main bundle files
  const mainJs = files.find(f => /^main\..*\.js$/.test(f));
  const stylesCss = files.find(f => /^styles\..*\.css$/.test(f));
  const polyfillsJs = files.find(f => /^polyfills\..*\.js$/.test(f));
  const runtimeJs = files.find(f => /^runtime\..*\.js$/.test(f));

  // Calculate initial bundle
  const initialFiles = [mainJs, stylesCss, polyfillsJs, runtimeJs].filter(Boolean);
  let initialSize = 0;
  let initialGzipped = 0;

  for (const file of initialFiles) {
    const filePath = path.join(distDir, file);
    initialSize += getFileSize(filePath);
    if (file.endsWith('.js')) {
      initialGzipped += await getGzippedSize(filePath);
    }
  }

  bundles['initial'] = {
    size: initialSize,
    gzipped: initialGzipped,
    files: initialFiles
  };

  // Calculate individual bundle sizes
  const jsBundles = files.filter(f => f.endsWith('.js'));
  for (const bundle of jsBundles) {
    const bundlePath = path.join(distDir, bundle);
    bundles[bundle] = {
      size: getFileSize(bundlePath),
      gzipped: await getGzippedSize(bundlePath),
      files: [bundle]
    };
  }

  // Calculate CSS sizes
  const cssFiles = files.filter(f => f.endsWith('.css'));
  for (const cssFile of cssFiles) {
    const cssPath = path.join(distDir, cssFile);
    bundles[cssFile] = {
      size: getFileSize(cssPath),
      gzipped: 0, // CSS is already compressed
      files: [cssFile]
    };
  }

  return bundles;
}

/**
 * Load baseline
 */
function loadBaseline() {
  if (fs.existsSync(baselineFile)) {
    try {
      return JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save baseline
 */
function saveBaseline(bundles) {
  const baseline = {
    timestamp: new Date().toISOString(),
    bundles
  };
  fs.writeFileSync(baselineFile, JSON.stringify(baseline, null, 2));
  console.log(`✅ Baseline saved to ${baselineFile}`);
}

/**
 * Compare with baseline
 */
function compareWithBaseline(current, baseline) {
  const regressions = [];
  const improvements = [];

  for (const [name, currentData] of Object.entries(current)) {
    const baselineData = baseline.bundles[name];
    
    if (!baselineData) {
      // New bundle
      continue;
    }

    const sizeDiff = currentData.size - baselineData.size;
    const sizePercent = (sizeDiff / baselineData.size) * 100;
    const gzippedDiff = currentData.gzipped - baselineData.gzipped;
    const gzippedPercent = currentData.gzipped > 0 && baselineData.gzipped > 0
      ? (gzippedDiff / baselineData.gzipped) * 100
      : 0;

    if (sizePercent > REGRESSION_THRESHOLDS.error * 100) {
      regressions.push({
        name,
        type: 'error',
        sizeDiff,
        sizePercent,
        gzippedDiff,
        gzippedPercent,
        current: currentData.size,
        baseline: baselineData.size
      });
    } else if (sizePercent > REGRESSION_THRESHOLDS.warning * 100) {
      regressions.push({
        name,
        type: 'warning',
        sizeDiff,
        sizePercent,
        gzippedDiff,
        gzippedPercent,
        current: currentData.size,
        baseline: baselineData.size
      });
    } else if (sizePercent < -5) {
      // Improvement (5% or more reduction)
      improvements.push({
        name,
        sizeDiff,
        sizePercent,
        current: currentData.size,
        baseline: baselineData.size
      });
    }
  }

  return { regressions, improvements };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  try {
    const bundles = await calculateBundleSizes();

    if (command === 'baseline') {
      // Save current as baseline
      saveBaseline(bundles);
      return;
    }

    if (command === 'check') {
      // Compare with baseline
      const baseline = loadBaseline();

      if (!baseline) {
        console.log('⚠️  No baseline found. Creating baseline...');
        saveBaseline(bundles);
        console.log('✅ Baseline created. Run again to compare.');
        return;
      }

      console.log('📊 Bundle Size Comparison\n');
      console.log(`Baseline: ${new Date(baseline.timestamp).toLocaleString()}\n`);

      const { regressions, improvements } = compareWithBaseline(bundles, baseline);

      // Print current sizes
      console.log('Current Bundle Sizes:');
      console.log('─'.repeat(70));
      for (const [name, data] of Object.entries(bundles)) {
        const sizeStr = formatBytes(data.size);
        const gzipStr = data.gzipped > 0 ? ` (gzipped: ${formatBytes(data.gzipped)})` : '';
        console.log(`  ${name}: ${sizeStr}${gzipStr}`);
      }
      console.log('─'.repeat(70));

      // Print improvements
      if (improvements.length > 0) {
        console.log('\n✅ Improvements:');
        for (const imp of improvements) {
          console.log(`  ${imp.name}: ${formatBytes(imp.sizeDiff)} (${imp.sizePercent.toFixed(2)}% reduction)`);
        }
      }

      // Print regressions
      if (regressions.length > 0) {
        const errors = regressions.filter(r => r.type === 'error');
        const warnings = regressions.filter(r => r.type === 'warning');

        if (warnings.length > 0) {
          console.log('\n⚠️  Warnings (size increase > 5%):');
          for (const reg of warnings) {
            console.log(`  ${reg.name}: +${formatBytes(reg.sizeDiff)} (${reg.sizePercent.toFixed(2)}% increase)`);
            if (reg.gzippedDiff > 0) {
              console.log(`    Gzipped: +${formatBytes(reg.gzippedDiff)} (${reg.gzippedPercent.toFixed(2)}% increase)`);
            }
          }
        }

        if (errors.length > 0) {
          console.log('\n❌ Errors (size increase > 10%):');
          for (const reg of errors) {
            console.log(`  ${reg.name}: +${formatBytes(reg.sizeDiff)} (${reg.sizePercent.toFixed(2)}% increase)`);
            if (reg.gzippedDiff > 0) {
              console.log(`    Gzipped: +${formatBytes(reg.gzippedDiff)} (${reg.gzippedPercent.toFixed(2)}% increase)`);
            }
          }
          console.log('\n❌ Bundle size regression detected! Please review and optimize.');
          process.exit(1);
        }

        if (warnings.length > 0) {
          console.log('\n⚠️  Bundle size warnings detected. Consider optimizing.');
        }
      } else {
        console.log('\n✅ No bundle size regressions detected!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();



























