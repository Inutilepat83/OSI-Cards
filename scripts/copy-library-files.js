#!/usr/bin/env node

/**
 * Copy necessary files to dist/osi-cards-lib for npm publishing
 * - README.md
 * - LICENSE (if exists)
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'osi-cards-lib');
const libPath = path.join(__dirname, '..', 'projects', 'osi-cards-lib');
const rootPath = path.join(__dirname, '..');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/osi-cards-lib does not exist. Run "npm run build:lib" first.');
  process.exit(1);
}

// Copy README.md
const readmeSource = path.join(libPath, 'README.md');
const readmeDest = path.join(distPath, 'README.md');
if (fs.existsSync(readmeSource)) {
  fs.copyFileSync(readmeSource, readmeDest);
  console.log('✅ Copied README.md');
} else {
  console.warn('⚠️  README.md not found in projects/osi-cards-lib/');
}

// Copy LICENSE if it exists in root
const licenseSource = path.join(rootPath, 'LICENSE');
const licenseDest = path.join(distPath, 'LICENSE');
if (fs.existsSync(licenseSource)) {
  fs.copyFileSync(licenseSource, licenseDest);
  console.log('✅ Copied LICENSE');
}

// Copy .npmignore if it exists
const npmignoreSource = path.join(libPath, '.npmignore');
const npmignoreDest = path.join(distPath, '.npmignore');
if (fs.existsSync(npmignoreSource)) {
  fs.copyFileSync(npmignoreSource, npmignoreDest);
  console.log('✅ Copied .npmignore');
}

console.log('✅ Library files copied successfully');



