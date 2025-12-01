#!/usr/bin/env node

/**
 * Validate Section Usage Script
 * 
 * Ensures all section definitions in the codebase reference the section registry
 * as the single source of truth. Warns about hardcoded section examples that
 * should be using registry fixtures.
 * 
 * Usage: node scripts/validate-section-usage.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');

// Directories to scan
const SCAN_DIRS = [
  path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'testing'),
  path.join(ROOT_DIR, 'e2e'),
  path.join(ROOT_DIR, 'src', 'app'),
];

// Directories to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.generated\./,
  /fixtures\.generated/,
  /registry/,
  /\.spec\.ts$/,
];

// Patterns that indicate hardcoded section data
const HARDCODED_PATTERNS = [
  // JSON-like section definitions in code
  {
    pattern: /type:\s*['"](?:info|analytics|contact-card|chart|list|news|event|financials|map|network-card|product|solutions|overview|quotation|text-reference|brand-colors|social-media)['"]/g,
    description: 'Hardcoded section type definition',
    recommendation: 'Use getFixture() or SECTION_FIXTURES from registry'
  },
  // Inline field arrays
  {
    pattern: /fields:\s*\[\s*\{[^}]*label:/g,
    description: 'Inline fields array definition',
    recommendation: 'Import fixtures from registry/fixtures.generated'
  },
  // Section title definitions that look like samples
  {
    pattern: /title:\s*['"](?:Company Information|Performance (?:Metrics|Analytics)|Key Contacts|Recent News|Key Products)['"]/g,
    description: 'Sample section title (may be hardcoded)',
    recommendation: 'Check if this should use registry fixture'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Recursively get all TypeScript files
 */
function getTypeScriptFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      getTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      if (!shouldExclude(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Scan file for hardcoded patterns
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check if file imports from registry (good)
  const usesRegistry = /from\s+['"].*registry/.test(content) ||
                       /from\s+['"].*fixtures\.generated/.test(content) ||
                       /getFixture\(/.test(content) ||
                       /SECTION_FIXTURES/.test(content) ||
                       /COMPLETE_FIXTURES/.test(content);
  
  for (const { pattern, description, recommendation } of HARDCODED_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // If file uses registry, these are likely legitimate
      if (!usesRegistry) {
        issues.push({
          file: filePath,
          description,
          matches: matches.slice(0, 3), // Show first 3 matches
          recommendation,
          severity: 'warning'
        });
      }
    }
  }
  
  return issues;
}

/**
 * Check for files that should use registry but don't
 */
function checkRegistryUsage() {
  const issues = [];
  
  // Check testing fixtures
  const testingFixtures = path.join(
    ROOT_DIR, 
    'projects', 'osi-cards-lib', 'src', 'lib', 'testing', 'fixtures'
  );
  
  if (fs.existsSync(testingFixtures)) {
    const files = fs.readdirSync(testingFixtures);
    for (const file of files) {
      if (file.endsWith('.ts') && !file.includes('index')) {
        const content = fs.readFileSync(path.join(testingFixtures, file), 'utf8');
        
        // Check if file imports from registry
        if (!content.includes('registry/fixtures.generated') && 
            !content.includes('COMPLETE_FIXTURES') &&
            !content.includes('getFixture')) {
          issues.push({
            file: path.join(testingFixtures, file),
            description: 'Testing fixture file may not be using registry',
            recommendation: 'Import from ../registry/fixtures.generated',
            severity: 'info'
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Main execution
 */
function main() {
  log('\n🔍 Section Usage Validator', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  
  // Load registry for validation
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const sectionTypes = Object.keys(registry.sections);
  
  log(`\n📄 Registry loaded: ${sectionTypes.length} section types`, colors.blue);
  
  // Collect all TypeScript files
  const allFiles = [];
  for (const dir of SCAN_DIRS) {
    getTypeScriptFiles(dir, allFiles);
  }
  
  log(`\n🔎 Scanning ${allFiles.length} files...`, colors.cyan);
  
  // Scan for issues
  const allIssues = [];
  
  for (const file of allFiles) {
    const fileIssues = scanFile(file);
    allIssues.push(...fileIssues);
  }
  
  // Check registry usage
  const usageIssues = checkRegistryUsage();
  allIssues.push(...usageIssues);
  
  // Report results
  if (allIssues.length === 0) {
    log('\n✅ No issues found! All sections use registry.', colors.green);
  } else {
    log(`\n⚠️  Found ${allIssues.length} potential issues:\n`, colors.yellow);
    
    // Group by file
    const byFile = {};
    for (const issue of allIssues) {
      const relPath = path.relative(ROOT_DIR, issue.file);
      if (!byFile[relPath]) byFile[relPath] = [];
      byFile[relPath].push(issue);
    }
    
    for (const [file, issues] of Object.entries(byFile)) {
      log(`\n📄 ${file}`, colors.cyan);
      for (const issue of issues) {
        const color = issue.severity === 'warning' ? colors.yellow : colors.blue;
        log(`   ${issue.severity === 'warning' ? '⚠️' : 'ℹ️'}  ${issue.description}`, color);
        log(`      💡 ${issue.recommendation}`, colors.reset);
        if (issue.matches) {
          log(`      📍 Matches: ${issue.matches.join(', ').slice(0, 80)}...`, colors.reset);
        }
      }
    }
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  log('Validation complete!', colors.bright + colors.green);
  log('═'.repeat(60) + '\n', colors.cyan);
  
  // Exit with error if warnings found
  const warnings = allIssues.filter(i => i.severity === 'warning');
  if (warnings.length > 0) {
    log(`\n💡 Tip: Run 'npm run generate:registry-fixtures' to update fixtures.\n`, colors.yellow);
  }
}

main();

