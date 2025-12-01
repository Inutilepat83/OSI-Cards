#!/usr/bin/env node
/**
 * Git Hooks Setup Script
 * 
 * Sets up Git hooks for automatic documentation pre-rendering.
 * This script is run automatically by npm prepare, but can also
 * be run manually if needed.
 * 
 * Usage:
 *   node scripts/setup-hooks.js
 *   npm run prepare
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const HUSKY_DIR = path.join(ROOT_DIR, '.husky');

console.log('🔧 Setting up Git hooks...\n');

// Ensure husky is installed
try {
  execSync('npx husky install', { cwd: ROOT_DIR, stdio: 'inherit' });
  console.log('✅ Husky installed\n');
} catch (error) {
  console.warn('⚠️  Husky install failed (may already be set up)');
}

// Ensure output directories exist
const dirs = [
  path.join(ROOT_DIR, 'src/assets/docs/rendered'),
  path.join(ROOT_DIR, 'docs-static')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created: ${path.relative(ROOT_DIR, dir)}`);
  }
}

// Add .gitkeep files to keep directories in git
for (const dir of dirs) {
  const gitkeepPath = path.join(dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Keep this directory in git\n');
  }
}

console.log('\n✨ Git hooks setup complete!');
console.log('\nThe pre-commit hook will now:');
console.log('  1. Run lint-staged (linting & formatting)');
console.log('  2. Check file sizes');
console.log('  3. Pre-render documentation if doc files changed');
console.log('\nTo manually pre-render documentation:');
console.log('  npm run docs:prerender');

