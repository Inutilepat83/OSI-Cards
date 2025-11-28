#!/usr/bin/env node

/**
 * OnPush Change Detection Audit Script
 * 
 * Scans all Angular components to identify those missing OnPush change detection strategy.
 * This helps ensure optimal performance by using OnPush everywhere possible.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMPONENT_DIRS = [
  'src/app/shared/components',
  'src/app/features',
  'src/app/core'
];

const EXCLUDE_PATTERNS = [
  /\.spec\.ts$/,
  /\.stories\.ts$/,
  /node_modules/,
  /dist/
];

const results = {
  withOnPush: [],
  withoutOnPush: [],
  noComponent: [],
  errors: []
};

/**
 * Check if a file is a component file
 */
function isComponentFile(filePath) {
  return filePath.endsWith('.component.ts') && 
         !filePath.includes('.spec.') &&
         !filePath.includes('.stories.');
}

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Check if component uses OnPush
 */
function hasOnPush(content) {
  // Check for ChangeDetectionStrategy.OnPush in decorator
  // Pattern 1: changeDetection: ChangeDetectionStrategy.OnPush
  // Pattern 2: changeDetection: ChangeDetectionStrategy.OnPush, (with comma)
  const hasOnPushStrategy = /changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(content);
  
  // Also check if ChangeDetectionStrategy is imported (can be on multiple lines)
  const hasOnPushImport = /import.*ChangeDetectionStrategy.*from.*['"]@angular\/core['"]/.test(content) ||
                         /import\s*\{[^}]*ChangeDetectionStrategy[^}]*\}\s*from\s*['"]@angular\/core['"]/.test(content);
  
  // If we see the strategy in decorator, it's using OnPush (import might be elsewhere or combined)
  // But we should warn if import is missing
  return hasOnPushStrategy;
}

/**
 * Check if file contains a component decorator
 */
function isComponent(content) {
  return /@Component\s*\(/.test(content);
}

/**
 * Scan a directory recursively for component files
 */
function scanDirectory(dir, baseDir = '') {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir || process.cwd(), fullPath);

    if (shouldExclude(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, baseDir);
    } else if (entry.isFile() && isComponentFile(relativePath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        if (!isComponent(content)) {
          results.noComponent.push(relativePath);
          continue;
        }

        if (hasOnPush(content)) {
          results.withOnPush.push(relativePath);
        } else {
          results.withoutOnPush.push(relativePath);
        }
      } catch (error) {
        results.errors.push({ file: relativePath, error: error.message });
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting OnPush Change Detection Audit...\n');

  const baseDir = process.cwd();
  
  for (const dir of COMPONENT_DIRS) {
    const fullPath = path.join(baseDir, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`Scanning: ${dir}`);
      scanDirectory(fullPath, baseDir);
    } else {
      console.warn(`⚠️  Directory not found: ${dir}`);
    }
  }

  // Print results
  console.log('\n📊 Audit Results:\n');
  console.log(`✅ Components with OnPush: ${results.withOnPush.length}`);
  console.log(`❌ Components without OnPush: ${results.withoutOnPush.length}`);
  console.log(`ℹ️  Files without @Component: ${results.noComponent.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}\n`);

  if (results.withoutOnPush.length > 0) {
    console.log('❌ Components missing OnPush:\n');
    results.withoutOnPush.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('⚠️  Errors encountered:\n');
    results.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
    console.log('');
  }

  // Calculate percentage
  const totalComponents = results.withOnPush.length + results.withoutOnPush.length;
  if (totalComponents > 0) {
    const percentage = ((results.withOnPush.length / totalComponents) * 100).toFixed(1);
    console.log(`📈 OnPush Coverage: ${percentage}% (${results.withOnPush.length}/${totalComponents})\n`);
  }

  // Exit with error code if components are missing OnPush
  if (results.withoutOnPush.length > 0) {
    console.log('💡 Recommendation: Add ChangeDetectionStrategy.OnPush to all components for better performance.\n');
    process.exit(1);
  } else {
    console.log('✅ All components use OnPush change detection strategy!\n');
    process.exit(0);
  }
}

main();

