#!/usr/bin/env node

/**
 * File size check script for pre-commit hook
 * Prevents committing files that are too large
 */

const fs = require('fs');
const path = require('path');

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  '.ts': 50 * 1024,      // 50 KB for TypeScript files
  '.js': 50 * 1024,      // 50 KB for JavaScript files
  '.html': 20 * 1024,    // 20 KB for HTML files
  '.scss': 30 * 1024,    // 30 KB for SCSS files
  '.css': 30 * 1024,     // 30 KB for CSS files
  '.json': 100 * 1024,   // 100 KB for JSON files
  '.md': 200 * 1024,     // 200 KB for Markdown files
  default: 100 * 1024    // 100 KB default
};

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  'dist',
  '.angular',
  'coverage',
  '.git',
  'e2e-results',
  'performance-reports'
];

// Files to ignore
const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock'
];

/**
 * Get file extension
 */
function getExtension(filename) {
  const ext = path.extname(filename);
  return ext || 'default';
}

/**
 * Check if path should be ignored
 */
function shouldIgnore(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check ignore directories
  for (const dir of IGNORE_DIRS) {
    if (relativePath.includes(dir)) {
      return true;
    }
  }
  
  // Check ignore files
  const filename = path.basename(filePath);
  if (IGNORE_FILES.includes(filename)) {
    return true;
  }
  
  return false;
}

/**
 * Check file size
 */
function checkFileSize(filePath) {
  if (shouldIgnore(filePath)) {
    return { valid: true };
  }
  
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const ext = getExtension(filePath);
    const maxSize = MAX_FILE_SIZES[ext] || MAX_FILE_SIZES.default;
    
    if (size > maxSize) {
      return {
        valid: false,
        size,
        maxSize,
        ext,
        filePath
      };
    }
    
    return { valid: true };
  } catch (error) {
    // File might not exist (deleted), skip
    return { valid: true };
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main function
 */
function main() {
  const files = process.argv.slice(2);
  const errors = [];
  
  for (const file of files) {
    const result = checkFileSize(file);
    if (!result.valid) {
      errors.push({
        file: result.filePath,
        size: formatBytes(result.size),
        maxSize: formatBytes(result.maxSize),
        extension: result.ext
      });
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ File size check failed!\n');
    console.error('The following files exceed the maximum allowed size:\n');
    
    for (const error of errors) {
      console.error(`  ${error.file}`);
      console.error(`    Size: ${error.size} (max: ${error.maxSize} for ${error.extension} files)\n`);
    }
    
    console.error('Please split large files or reduce their size before committing.');
    process.exit(1);
  }
  
  console.log('✅ File size check passed');
  process.exit(0);
}

main();














