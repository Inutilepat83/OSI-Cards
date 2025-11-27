#!/usr/bin/env node
/**
 * Bundle Analyzer Script
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '..', 'dist', 'osi-cards');
const MAX_INITIAL_BYTES = 650 * 1024; // 650 KB
const MAX_GZIPPED_BYTES = 200 * 1024; // 200 KB gzipped

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundle() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ Build directory not found. Run "npm run build:prod" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  console.log('\n📦 Bundle Size Analysis\n');
  console.log('='.repeat(60));

  // Analyze JS files
  console.log('\n📄 JavaScript Files:');
  console.log('-'.repeat(60));
  let totalJs = 0;
  const jsSizes = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const size = getFileSize(filePath);
    totalJs += size;
    jsSizes.push({ file, size });
  });

  jsSizes
    .sort((a, b) => b.size - a.size)
    .forEach(({ file, size }) => {
      const percentage = ((size / totalJs) * 100).toFixed(1);
      console.log(`  ${file.padEnd(40)} ${formatBytes(size).padStart(12)} (${percentage}%)`);
    });

  // Analyze CSS files
  console.log('\n🎨 CSS Files:');
  console.log('-'.repeat(60));
  let totalCss = 0;
  const cssSizes = [];
  
  cssFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const size = getFileSize(filePath);
    totalCss += size;
    cssSizes.push({ file, size });
  });

  cssSizes
    .sort((a, b) => b.size - a.size)
    .forEach(({ file, size }) => {
      const percentage = ((size / totalCss) * 100).toFixed(1);
      console.log(`  ${file.padEnd(40)} ${formatBytes(size).padStart(12)} (${percentage}%)`);
    });

  // Calculate initial bundle (main + runtime + polyfills + styles)
  const mainJs = jsFiles.find(f => /^main\..*\.js$/.test(f));
  const runtimeJs = jsFiles.find(f => /^runtime\..*\.js$/.test(f));
  const polyfillsJs = jsFiles.find(f => /^polyfills\..*\.js$/.test(f));
  const stylesCss = cssFiles.find(f => /^styles\..*\.css$/.test(f));

  const initialFiles = [mainJs, runtimeJs, polyfillsJs, stylesCss].filter(Boolean);
  const initialSize = initialFiles.reduce((sum, file) => {
    return sum + getFileSize(path.join(distDir, file));
  }, 0);

  console.log('\n📊 Summary:');
  console.log('-'.repeat(60));
  console.log(`  Total JS:        ${formatBytes(totalJs)}`);
  console.log(`  Total CSS:       ${formatBytes(totalCss)}`);
  console.log(`  Initial Bundle:  ${formatBytes(initialSize)}`);
  console.log(`  Limit:           ${formatBytes(MAX_INITIAL_BYTES)}`);
  
  // Check gzipped size if gzip is available
  try {
    const gzippedSize = execSync(`gzip -c ${path.join(distDir, mainJs || '')} | wc -c`, { encoding: 'utf8' }).trim();
    const gzippedBytes = parseInt(gzippedSize, 10);
    console.log(`  Main JS (gzip):  ${formatBytes(gzippedBytes)}`);
    console.log(`  Gzip Limit:      ${formatBytes(MAX_GZIPPED_BYTES)}`);
    
    if (gzippedBytes > MAX_GZIPPED_BYTES) {
      console.log('\n⚠️  Warning: Gzipped size exceeds recommended limit!');
    }
  } catch (e) {
    // gzip not available, skip
  }

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('-'.repeat(60));
  
  if (initialSize > MAX_INITIAL_BYTES) {
    console.log('  ❌ Initial bundle exceeds limit!');
    console.log('     - Enable lazy loading for routes');
    console.log('     - Split vendor chunks');
    console.log('     - Remove unused dependencies');
    console.log('     - Use tree-shaking for optional dependencies');
  } else {
    console.log('  ✅ Initial bundle size is within limits');
  }

  // Check for large files
  const largeFiles = jsSizes.filter(f => f.size > 100 * 1024); // > 100KB
  if (largeFiles.length > 0) {
    console.log('\n  📌 Large files (>100KB):');
    largeFiles.forEach(({ file, size }) => {
      console.log(`     - ${file}: ${formatBytes(size)}`);
      console.log(`       Consider code splitting or lazy loading`);
    });
  }

  // Check for optional dependencies
  console.log('\n  📌 Optional Dependencies:');
  console.log('     - chart.js: Lazy load if ChartSection is used');
  console.log('     - leaflet: Lazy load if MapSection is used');
  console.log('     - primeng: Lazy load if needed');

  console.log('\n' + '='.repeat(60) + '\n');

  // Generate JSON report for CI/CD
  const report = {
    timestamp: new Date().toISOString(),
    totalJs: totalJs,
    totalCss: totalCss,
    initialSize: initialSize,
    limit: MAX_INITIAL_BYTES,
    passed: initialSize <= MAX_INITIAL_BYTES,
    files: {
      js: jsSizes.map(f => ({ file: f.file, size: f.size })),
      css: cssSizes.map(f => ({ file: f.file, size: f.size }))
    }
  };

  // Write report to file for CI/CD
  const reportPath = path.join(__dirname, '..', 'bundle-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Bundle report written to: ${reportPath}`);

  // Exit with error if limit exceeded
  if (initialSize > MAX_INITIAL_BYTES) {
    console.error('❌ Bundle size gate failed.');
    process.exit(1);
  } else {
    console.log('✅ Bundle size check passed!\n');
  }
}

analyzeBundle();

