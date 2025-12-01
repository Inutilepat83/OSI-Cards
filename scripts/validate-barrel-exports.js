#!/usr/bin/env node

/**
 * Barrel Exports Validation Script
 * 
 * Validates that all public-facing modules in index.ts files properly export
 * all expected symbols. Helps ensure the library's public API is complete
 * and consistent.
 * 
 * Usage:
 *   node scripts/validate-barrel-exports.js
 *   npm run validate:exports
 * 
 * Options:
 *   --fix    Attempt to fix missing exports (creates suggestions)
 *   --strict Fail on warnings
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LIB_ROOT = path.resolve(__dirname, '../projects/osi-cards-lib/src/lib');
const INDEX_FILES = [
  'index.ts',
  'models/index.ts',
  'services/index.ts',
  'components/index.ts',
  'utils/index.ts',
  'icons/index.ts',
  'themes/index.ts',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Parse exports from an index file
 */
function parseIndexExports(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, exports: [], reExports: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];
  const reExports = [];

  // Match export * from './...'
  const reExportRegex = /export\s+\*\s+from\s+['"](\.\/[^'"]+)['"]/g;
  let match;
  while ((match = reExportRegex.exec(content)) !== null) {
    reExports.push(match[1]);
  }

  // Match export { ... } from './...'
  const namedExportRegex = /export\s+\{([^}]+)\}\s+from\s+['"](\.\/[^'"]+)['"]/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim());
    exports.push(...names.filter(n => n.length > 0));
  }

  // Match direct export statements
  const directExportRegex = /export\s+(class|interface|type|const|function|enum)\s+(\w+)/g;
  while ((match = directExportRegex.exec(content)) !== null) {
    exports.push(match[2]);
  }

  return { exists: true, exports, reExports };
}

/**
 * Get all TypeScript files in a directory (non-recursive)
 */
function getTypescriptFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => 
      file.endsWith('.ts') && 
      !file.endsWith('.spec.ts') && 
      !file.endsWith('.stories.ts') &&
      file !== 'index.ts'
    )
    .map(file => file.replace(/\.ts$/, ''));
}

/**
 * Check if a file exports any public members
 */
function getFileExports(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];

  // Match export declarations
  const exportRegex = /^export\s+(class|interface|type|const|function|enum|abstract\s+class)\s+(\w+)/gm;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push({
      type: match[1],
      name: match[2],
    });
  }

  return exports;
}

/**
 * Validate a single index file
 */
function validateIndexFile(indexPath, baseDir) {
  const fullPath = path.join(LIB_ROOT, indexPath);
  const dir = path.dirname(fullPath);
  const result = {
    path: indexPath,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  const parsed = parseIndexExports(fullPath);

  if (!parsed.exists) {
    result.errors.push(`Index file does not exist: ${indexPath}`);
    return result;
  }

  // Get all TypeScript files in the directory
  const tsFiles = getTypescriptFiles(dir);

  // Check that each file is either re-exported or has an explicit export
  const exportedPaths = parsed.reExports.map(p => p.replace(/^\.\//, '').replace(/\.ts$/, ''));
  
  for (const file of tsFiles) {
    // Check if this file is covered by a re-export
    const isReExported = exportedPaths.some(exp => {
      // Handle both direct matches and path-like matches
      return exp === file || exp.startsWith(file + '/');
    });

    if (!isReExported) {
      // Check if the file has exports
      const filePath = path.join(dir, `${file}.ts`);
      const fileExports = getFileExports(filePath);

      if (fileExports.length > 0) {
        const exportNames = fileExports.map(e => e.name).join(', ');
        result.warnings.push(
          `File "${file}.ts" has exports (${exportNames}) but is not included in ${indexPath}`
        );
        result.suggestions.push(`export * from './${file}';`);
      }
    }
  }

  // Check for missing file references
  for (const reExport of parsed.reExports) {
    const exportPath = path.join(dir, reExport);
    const withExt = exportPath.endsWith('.ts') ? exportPath : `${exportPath}.ts`;
    const asDir = path.join(exportPath, 'index.ts');

    if (!fs.existsSync(withExt) && !fs.existsSync(asDir) && !fs.existsSync(exportPath)) {
      result.errors.push(`Re-export target does not exist: ${reExport}`);
    }
  }

  return result;
}

/**
 * Main validation function
 */
function validateAllExports() {
  log('\n🔍 Validating Barrel Exports\n', 'cyan');
  log(`Checking ${INDEX_FILES.length} index files...\n`, 'blue');

  const results = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const indexPath of INDEX_FILES) {
    const result = validateIndexFile(indexPath);
    results.push(result);

    if (result.errors.length > 0 || result.warnings.length > 0) {
      log(`📁 ${indexPath}`, 'yellow');

      for (const error of result.errors) {
        log(`  ❌ ${error}`, 'red');
        errorCount++;
      }

      for (const warning of result.warnings) {
        log(`  ⚠️  ${warning}`, 'yellow');
        warningCount++;
      }

      if (result.suggestions.length > 0) {
        log(`  💡 Suggestions:`, 'blue');
        for (const suggestion of result.suggestions) {
          log(`     ${suggestion}`, 'cyan');
        }
      }

      console.log();
    }
  }

  // Summary
  log('─'.repeat(50), 'blue');
  
  if (errorCount === 0 && warningCount === 0) {
    log('\n✅ All barrel exports are valid!\n', 'green');
    return 0;
  }

  log(`\n📊 Summary:`, 'blue');
  if (errorCount > 0) {
    log(`   ${errorCount} error(s)`, 'red');
  }
  if (warningCount > 0) {
    log(`   ${warningCount} warning(s)`, 'yellow');
  }
  console.log();

  // Check for --strict flag
  const isStrict = process.argv.includes('--strict');
  if (isStrict && warningCount > 0) {
    return 1;
  }

  return errorCount > 0 ? 1 : 0;
}

/**
 * Generate a report of all exports
 */
function generateExportsReport() {
  log('\n📋 Exports Report\n', 'cyan');

  for (const indexPath of INDEX_FILES) {
    const fullPath = path.join(LIB_ROOT, indexPath);
    const parsed = parseIndexExports(fullPath);

    log(`📁 ${indexPath}`, 'yellow');
    
    if (!parsed.exists) {
      log(`   (file does not exist)`, 'red');
      continue;
    }

    log(`   Re-exports: ${parsed.reExports.length}`, 'blue');
    for (const reExport of parsed.reExports) {
      log(`     • ${reExport}`, 'reset');
    }

    if (parsed.exports.length > 0) {
      log(`   Named exports: ${parsed.exports.length}`, 'blue');
      for (const exp of parsed.exports.slice(0, 10)) {
        log(`     • ${exp}`, 'reset');
      }
      if (parsed.exports.length > 10) {
        log(`     ... and ${parsed.exports.length - 10} more`, 'reset');
      }
    }

    console.log();
  }
}

// Run validation
if (process.argv.includes('--report')) {
  generateExportsReport();
  process.exit(0);
}

const exitCode = validateAllExports();
process.exit(exitCode);







