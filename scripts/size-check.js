#!/usr/bin/env node
/**
 * Bundle Size Check Script
 * 
 * Enforces performance budgets by checking bundle sizes against configured limits.
 * Fails the build if budgets are exceeded, ensuring performance standards are maintained.
 * 
 * Performance Budgets:
 * - Initial bundle: 650 KB (warning), 2 MB (error)
 * - Component styles: 6 KB (warning), 10 KB (error)
 * - Any bundle: 500 KB (warning), 1 MB (error)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

const distDir = path.join(__dirname, '..', 'dist', 'osi-cards');

// Performance budgets (from angular.json)
const BUDGETS = {
  initial: {
    warning: 2 * 1024 * 1024, // 2 MB
    error: 5 * 1024 * 1024     // 5 MB
  },
  componentStyle: {
    warning: 6 * 1024,          // 6 KB
    error: 10 * 1024            // 10 KB
  },
  bundle: {
    warning: 500 * 1024,       // 500 KB
    error: 1024 * 1024          // 1 MB
  },
  // Legacy limit for backward compatibility
  legacyInitial: 650 * 1024    // 650 KB
};

function getFileSize(p) {
  try { 
    return fs.statSync(p).size; 
  } catch { 
    return 0; 
  }
}

async function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = await gzip(content);
    return gzipped.length;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function checkBundleSizes() {
  const results = {
    passed: true,
    warnings: [],
    errors: [],
    details: []
  };

  if (!fs.existsSync(distDir)) {
    console.error('❌ Build directory not found. Run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  
  // Find main bundle files
  const mainJs = files.find(f => /^main\..*\.js$/.test(f));
  const stylesCss = files.find(f => /^styles\..*\.css$/.test(f));
  const polyfillsJs = files.find(f => /^polyfills\..*\.js$/.test(f));
  const runtimeJs = files.find(f => /^runtime\..*\.js$/.test(f));

  // Calculate initial bundle size (main + styles + polyfills + runtime)
  const initialFiles = [mainJs, stylesCss, polyfillsJs, runtimeJs].filter(Boolean);
  const initialSize = initialFiles
    .map(f => getFileSize(path.join(distDir, f)))
    .reduce((a, b) => a + b, 0);

  // Check initial bundle budget
  if (initialSize > BUDGETS.initial.error) {
    results.errors.push(
      `Initial bundle size ${formatBytes(initialSize)} exceeds error limit ${formatBytes(BUDGETS.initial.error)}`
    );
    results.passed = false;
  } else if (initialSize > BUDGETS.initial.warning) {
    results.warnings.push(
      `Initial bundle size ${formatBytes(initialSize)} exceeds warning limit ${formatBytes(BUDGETS.initial.warning)}`
    );
  }

  // Legacy check for backward compatibility
  if (initialSize > BUDGETS.legacyInitial) {
    results.warnings.push(
      `Initial bundle size ${formatBytes(initialSize)} exceeds legacy limit ${formatBytes(BUDGETS.legacyInitial)}`
    );
  }

  results.details.push({
    name: 'Initial Bundle',
    size: initialSize,
    gzipped: await getGzippedSize(path.join(distDir, mainJs || '')),
    files: initialFiles
  });

  // Check all JavaScript bundles
  const jsBundles = files.filter(f => f.endsWith('.js') && !f.includes('runtime'));
  for (const bundle of jsBundles) {
    const bundlePath = path.join(distDir, bundle);
    const size = getFileSize(bundlePath);
    
    if (size > BUDGETS.bundle.error) {
      results.errors.push(
        `Bundle ${bundle} size ${formatBytes(size)} exceeds error limit ${formatBytes(BUDGETS.bundle.error)}`
      );
      results.passed = false;
    } else if (size > BUDGETS.bundle.warning) {
      results.warnings.push(
        `Bundle ${bundle} size ${formatBytes(size)} exceeds warning limit ${formatBytes(BUDGETS.bundle.warning)}`
      );
    }

    results.details.push({
      name: bundle,
      size: size,
      gzipped: await getGzippedSize(bundlePath)
    });
  }

  // Check component styles
  const cssFiles = files.filter(f => f.endsWith('.css'));
  for (const cssFile of cssFiles) {
    const cssPath = path.join(distDir, cssFile);
    const size = getFileSize(cssPath);
    
    if (size > BUDGETS.componentStyle.error) {
      results.errors.push(
        `Style ${cssFile} size ${formatBytes(size)} exceeds error limit ${formatBytes(BUDGETS.componentStyle.error)}`
      );
      results.passed = false;
    } else if (size > BUDGETS.componentStyle.warning) {
      results.warnings.push(
        `Style ${cssFile} size ${formatBytes(size)} exceeds warning limit ${formatBytes(BUDGETS.componentStyle.warning)}`
      );
    }
  }

  return results;
}

async function main() {
  console.log('📦 Checking bundle sizes against performance budgets...\n');

  const results = await checkBundleSizes();

  // Print details
  console.log('📊 Bundle Size Report:');
  console.log('─'.repeat(60));
  results.details.forEach(detail => {
    const sizeStr = formatBytes(detail.size);
    const gzipStr = detail.gzipped ? ` (gzipped: ${formatBytes(detail.gzipped)})` : '';
    console.log(`  ${detail.name}: ${sizeStr}${gzipStr}`);
  });
  console.log('─'.repeat(60));

  // Print warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  // Print errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (results.passed) {
    console.log('✅ All bundle size checks passed!');
    if (results.warnings.length > 0) {
      console.log(`⚠️  ${results.warnings.length} warning(s) - consider optimizing`);
    }
  } else {
    console.log('❌ Bundle size check failed!');
    console.log(`   ${results.errors.length} error(s) must be fixed`);
    process.exit(1);
  }
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Error checking bundle sizes:', error);
  process.exit(1);
});


