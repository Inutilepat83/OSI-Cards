#!/usr/bin/env node

/**
 * Verify that styles can be properly imported from the library
 * This script checks:
 * 1. All style files exist in dist
 * 2. All imports in _styles-scoped.scss resolve correctly
 * 3. Package.json exports are correct
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

const DIST_LIB = path.join(__dirname, '..', 'dist', 'osi-cards-lib');
const STYLES_DIR = path.join(DIST_LIB, 'styles');
const SCOPED_STYLES = path.join(STYLES_DIR, '_styles-scoped.scss');
const PACKAGE_JSON = path.join(DIST_LIB, 'package.json');

// Required imports from _styles-scoped.scss
const REQUIRED_IMPORTS = [
  'core/bootstrap-reset',
  'core/variables-unified',
  'core/mixins',
  'core/surface-layers',
  'core/global-unified',
  'core/utilities',
  'core/animations',
  'layout/tilt',
  'layout/masonry',
  'layout/feature-grid',
  'components/streaming-effects',
  'components/hero-card',
  'components/cards/ai-card',
  'components/sections/sections-all',
];

function checkFileExists(filePath, description) {
  // SCSS partials typically have underscore prefix
  const withUnderscore = path.join(STYLES_DIR, `_${path.basename(filePath)}.scss`);
  const withoutUnderscore = path.join(STYLES_DIR, `${filePath}.scss`);
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);

  // Try with underscore in the directory path
  const withDirUnderscore = dirPath ? path.join(STYLES_DIR, dirPath, `_${fileName}.scss`) : null;

  let fullPath = null;
  if (fs.existsSync(withDirUnderscore)) {
    fullPath = withDirUnderscore;
  } else if (fs.existsSync(withoutUnderscore)) {
    fullPath = withoutUnderscore;
  } else if (fs.existsSync(withUnderscore)) {
    fullPath = withUnderscore;
  }

  if (!fullPath || !fs.existsSync(fullPath)) {
    log(
      `✗ Missing: ${filePath}.scss (tried: ${withDirUnderscore}, ${withoutUnderscore}, ${withUnderscore})`,
      colors.red
    );
    return false;
  }
  log(`✓ Found: ${path.relative(STYLES_DIR, fullPath)}`, colors.green);
  return true;
}

function verifyPackageExports() {
  if (!fs.existsSync(PACKAGE_JSON)) {
    log('✗ package.json not found', colors.red);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const exports = pkg.exports || {};

  const requiredExports = ['./styles/_styles-scoped', './styles/_styles-scoped.scss'];

  let allFound = true;
  for (const exp of requiredExports) {
    if (exports[exp]) {
      log(`✓ Export found: ${exp}`, colors.green);
    } else {
      log(`✗ Export missing: ${exp}`, colors.red);
      allFound = false;
    }
  }

  return allFound;
}

function main() {
  log('\n═══════════════════════════════════════════════════════', colors.blue);
  log('  Verifying OSI Cards Library Styles Import', colors.blue);
  log('═══════════════════════════════════════════════════════\n', colors.blue);

  // Check if dist folder exists
  if (!fs.existsSync(DIST_LIB)) {
    log('✗ dist/osi-cards-lib not found. Run "npm run build:lib" first.', colors.red);
    process.exit(1);
  }

  // Check if scoped styles file exists
  if (!fs.existsSync(SCOPED_STYLES)) {
    log('✗ _styles-scoped.scss not found in dist', colors.red);
    process.exit(1);
  }
  log('✓ _styles-scoped.scss found', colors.green);

  // Check all required imports
  log('\nChecking required style imports...\n', colors.blue);
  let allImportsExist = true;
  for (const imp of REQUIRED_IMPORTS) {
    if (!checkFileExists(imp, imp)) {
      allImportsExist = false;
    }
  }

  // Check package.json exports
  log('\nChecking package.json exports...\n', colors.blue);
  const exportsOk = verifyPackageExports();

  // Summary
  log('\n═══════════════════════════════════════════════════════', colors.blue);
  if (allImportsExist && exportsOk) {
    log('✓ All style files and exports are correct!', colors.green);
    log('\nThe library styles can be imported using:', colors.blue);
    log("  @import 'osi-cards-lib/styles/_styles-scoped';", colors.yellow);
    process.exit(0);
  } else {
    log('✗ Some issues found. Please fix them before publishing.', colors.red);
    process.exit(1);
  }
}

main();
