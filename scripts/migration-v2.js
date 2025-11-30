#!/usr/bin/env node

/**
 * OSI Cards Migration Script v2
 * 
 * Helps migrate from v1.x to v2.x of the OSI Cards library.
 * This script automates common migration tasks and identifies
 * areas that require manual intervention.
 * 
 * Usage:
 *   node scripts/migration-v2.js [--dry-run] [--path <directory>]
 *   npm run migrate:v2
 *   npm run migrate:v2 -- --dry-run
 * 
 * Options:
 *   --dry-run    Preview changes without modifying files
 *   --path       Target directory (defaults to ./src)
 *   --verbose    Show detailed output
 *   --fix        Automatically fix issues where possible
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_PATH = './src';

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

// ============================================================================
// MIGRATION RULES
// ============================================================================

/**
 * Migration rule definition
 */
const migrationRules = [
  // Import path changes
  {
    id: 'import-paths',
    name: 'Update import paths',
    description: 'Updates old import paths to new structure',
    pattern: /from\s+['"]osi-cards\/lib\/(.*?)['"]/g,
    replacement: "from 'osi-cards-lib'",
    severity: 'error',
    autoFix: true,
  },
  
  // Deprecated API usage
  {
    id: 'deprecated-streaming-service',
    name: 'StreamingService renamed',
    description: 'StreamingService has been renamed to OSICardsStreamingService',
    pattern: /\bStreamingService\b(?!.*OSI)/g,
    replacement: 'OSICardsStreamingService',
    severity: 'error',
    autoFix: true,
  },
  
  // Type changes
  {
    id: 'card-action-type',
    name: 'CardAction type property',
    description: 'CardAction.type now uses string literals instead of ButtonType',
    pattern: /type:\s*ButtonType\./g,
    replacement: "type: '",
    severity: 'warning',
    autoFix: false,
    manualNote: 'Replace ButtonType.PRIMARY with "primary", ButtonType.SECONDARY with "secondary", etc.',
  },
  
  // Component selector changes
  {
    id: 'selector-prefix',
    name: 'Component selector prefix',
    description: 'Component selectors now use osi- prefix instead of app-',
    pattern: /<app-(ai-card-renderer|masonry-grid|card-preview)/g,
    replacement: '<osi-$1',
    severity: 'warning',
    autoFix: true,
  },
  
  // Closing tag changes
  {
    id: 'selector-prefix-closing',
    name: 'Component closing tag prefix',
    description: 'Update closing tags for renamed selectors',
    pattern: /<\/app-(ai-card-renderer|masonry-grid|card-preview)>/g,
    replacement: '</osi-$1>',
    severity: 'warning',
    autoFix: true,
  },
  
  // Event name changes
  {
    id: 'event-names',
    name: 'Output event names',
    description: 'Some event names have been renamed for consistency',
    pattern: /\(fieldClick\)=/g,
    replacement: '(fieldInteraction)=',
    severity: 'warning',
    autoFix: true,
  },
  
  // Section type aliases
  {
    id: 'section-type-metrics',
    name: 'Section type "metrics" deprecated',
    description: 'Section type "metrics" is now an alias for "analytics"',
    pattern: /type:\s*['"]metrics['"]/g,
    replacement: "type: 'analytics'",
    severity: 'info',
    autoFix: true,
  },
  
  // CSS class changes
  {
    id: 'css-class-card',
    name: 'CSS class changes',
    description: 'Card wrapper class renamed from .ai-card to .osi-card',
    pattern: /\.ai-card(?![a-zA-Z-])/g,
    replacement: '.osi-card',
    severity: 'warning',
    autoFix: true,
  },
  
  // Input property changes
  {
    id: 'input-changes',
    name: 'Input property renames',
    description: 'Some input properties have been renamed',
    pattern: /\[cardData\]=/g,
    replacement: '[cardConfig]=',
    severity: 'error',
    autoFix: true,
  },
  
  // Theme token changes
  {
    id: 'theme-tokens',
    name: 'Theme token prefix',
    description: 'CSS custom properties now use --osi- prefix',
    pattern: /--card-([a-zA-Z-]+)/g,
    replacement: '--osi-$1',
    severity: 'warning',
    autoFix: true,
  },
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Find all TypeScript and HTML files in directory
 */
function findFiles(dir, extensions = ['.ts', '.html', '.scss', '.css']) {
  const files = [];
  
  function walk(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist
        if (!['node_modules', 'dist', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Check a file against all migration rules
 */
function checkFile(filePath, options) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  let modifiedContent = content;
  
  for (const rule of migrationRules) {
    const matches = content.match(rule.pattern);
    
    if (matches) {
      issues.push({
        rule,
        matches: matches.length,
        file: filePath,
      });
      
      if (rule.autoFix && options.fix) {
        modifiedContent = modifiedContent.replace(rule.pattern, rule.replacement);
      }
    }
  }
  
  return {
    file: filePath,
    issues,
    modified: modifiedContent !== content,
    modifiedContent,
  };
}

/**
 * Apply fixes to a file
 */
function applyFixes(filePath, content, dryRun) {
  if (dryRun) {
    log(`  Would update: ${filePath}`, 'cyan');
    return;
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  log(`  Updated: ${filePath}`, 'green');
}

/**
 * Generate migration report
 */
function generateReport(results, options) {
  const issues = {
    error: [],
    warning: [],
    info: [],
  };
  
  for (const result of results) {
    for (const issue of result.issues) {
      issues[issue.rule.severity].push(issue);
    }
  }
  
  log('\n' + '═'.repeat(60), 'blue');
  log('OSI Cards Migration Report', 'cyan');
  log('═'.repeat(60) + '\n', 'blue');
  
  // Summary
  const totalIssues = issues.error.length + issues.warning.length + issues.info.length;
  log(`Total files scanned: ${results.length}`, 'blue');
  log(`Total issues found: ${totalIssues}`, totalIssues > 0 ? 'yellow' : 'green');
  
  if (issues.error.length > 0) {
    log(`\n❌ Errors (must fix): ${issues.error.length}`, 'red');
    for (const issue of issues.error) {
      log(`   ${issue.file}`, 'reset');
      log(`   └─ ${issue.rule.name}: ${issue.matches} occurrence(s)`, 'reset');
      if (issue.rule.manualNote) {
        log(`      Note: ${issue.rule.manualNote}`, 'yellow');
      }
    }
  }
  
  if (issues.warning.length > 0) {
    log(`\n⚠️  Warnings: ${issues.warning.length}`, 'yellow');
    for (const issue of issues.warning) {
      log(`   ${issue.file}`, 'reset');
      log(`   └─ ${issue.rule.name}: ${issue.matches} occurrence(s)`, 'reset');
    }
  }
  
  if (options.verbose && issues.info.length > 0) {
    log(`\nℹ️  Info: ${issues.info.length}`, 'blue');
    for (const issue of issues.info) {
      log(`   ${issue.file}`, 'reset');
      log(`   └─ ${issue.rule.name}: ${issue.matches} occurrence(s)`, 'reset');
    }
  }
  
  // Fixed files
  const fixedFiles = results.filter(r => r.modified);
  if (fixedFiles.length > 0) {
    log(`\n✅ Files ${options.dryRun ? 'that would be' : ''} updated: ${fixedFiles.length}`, 'green');
    for (const result of fixedFiles) {
      log(`   ${result.file}`, 'reset');
    }
  }
  
  // Manual steps
  const manualRules = migrationRules.filter(r => !r.autoFix);
  const hasManualSteps = issues.error.some(i => !i.rule.autoFix) || 
                         issues.warning.some(i => !i.rule.autoFix);
  
  if (hasManualSteps) {
    log('\n📋 Manual Migration Steps Required:', 'yellow');
    for (const rule of manualRules) {
      const hasIssues = [...issues.error, ...issues.warning].some(i => i.rule.id === rule.id);
      if (hasIssues && rule.manualNote) {
        log(`   • ${rule.name}`, 'reset');
        log(`     ${rule.manualNote}`, 'cyan');
      }
    }
  }
  
  log('\n' + '═'.repeat(60), 'blue');
  
  if (totalIssues === 0) {
    log('✨ No migration issues found! Your code is ready for v2.', 'green');
  } else if (options.dryRun) {
    log('Run without --dry-run to apply automatic fixes.', 'cyan');
  }
  
  log('═'.repeat(60) + '\n', 'blue');
  
  return issues.error.length;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    fix: args.includes('--fix') || !args.includes('--dry-run'),
    path: DEFAULT_PATH,
  };
  
  // Parse path argument
  const pathIndex = args.indexOf('--path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    options.path = args[pathIndex + 1];
  }
  
  log('\n🔄 OSI Cards Migration Script v2\n', 'cyan');
  log(`Target directory: ${path.resolve(options.path)}`, 'blue');
  log(`Mode: ${options.dryRun ? 'Dry run (preview only)' : 'Live (will modify files)'}`, 'blue');
  log(`Auto-fix: ${options.fix ? 'Enabled' : 'Disabled'}\n`, 'blue');
  
  // Check if path exists
  if (!fs.existsSync(options.path)) {
    log(`Error: Directory not found: ${options.path}`, 'red');
    process.exit(1);
  }
  
  // Find files
  log('Scanning files...', 'blue');
  const files = findFiles(options.path);
  log(`Found ${files.length} files to check\n`, 'blue');
  
  // Check files
  const results = [];
  for (const file of files) {
    const result = checkFile(file, options);
    results.push(result);
    
    if (result.modified) {
      applyFixes(file, result.modifiedContent, options.dryRun);
    }
  }
  
  // Generate report
  const errorCount = generateReport(results, options);
  
  process.exit(errorCount > 0 ? 1 : 0);
}

main();

