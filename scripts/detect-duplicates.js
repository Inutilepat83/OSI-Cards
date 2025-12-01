#!/usr/bin/env node
/**
 * Duplicate File Detection Script
 * Detects duplicate files between src/app and projects/osi-cards-lib
 *
 * Usage:
 *   node scripts/detect-duplicates.js          # Check for duplicates
 *   node scripts/detect-duplicates.js --ci     # Fail on duplicates (for CI)
 *   node scripts/detect-duplicates.js --json   # Output JSON format
 */

const fs = require('fs');
const path = require('path');

const SRC_DIRS = [
  'src/app/shared/components',
  'src/app/shared/services',
  'src/app/shared/utils',
  'src/app/core/services',
];

const LIB_DIRS = [
  'projects/osi-cards-lib/src/lib/components',
  'projects/osi-cards-lib/src/lib/services',
  'projects/osi-cards-lib/src/lib/utils',
];

// Files that are intentionally different and should not be flagged
const ALLOWED_DUPLICATES = [
  'index.ts',  // Barrel exports are expected to exist in both
];

function findFiles(dir, extension = '.ts') {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results.push(...findFiles(fullPath, extension));
    } else if (file.name.endsWith(extension) && !file.name.includes('.spec.')) {
      results.push(fullPath);
    }
  }

  return results;
}

function detectDuplicates() {
  const srcFiles = SRC_DIRS.flatMap(dir => findFiles(dir, '.ts'));
  const libFiles = LIB_DIRS.flatMap(dir => findFiles(dir, '.ts'));

  const duplicates = [];

  for (const srcFile of srcFiles) {
    const srcName = path.basename(srcFile);

    // Skip allowed duplicates
    if (ALLOWED_DUPLICATES.includes(srcName)) {
      continue;
    }

    const libMatch = libFiles.find(f => path.basename(f) === srcName);

    if (libMatch) {
      const srcContent = fs.readFileSync(srcFile, 'utf8');
      const libContent = fs.readFileSync(libMatch, 'utf8');

      const srcLines = srcContent.split('\n').length;
      const libLines = libContent.split('\n').length;

      duplicates.push({
        name: srcName,
        src: {
          path: srcFile,
          lines: srcLines,
        },
        lib: {
          path: libMatch,
          lines: libLines,
        },
        recommendation: srcLines > libLines
          ? 'Review: src has more code - merge to lib then delete src'
          : 'Delete src: lib version is more complete',
      });
    }
  }

  // Also check for CSS/SCSS duplicates
  const srcCss = SRC_DIRS.flatMap(dir => [
    ...findFiles(dir, '.css'),
    ...findFiles(dir, '.scss'),
  ]);
  const libCss = LIB_DIRS.flatMap(dir => [
    ...findFiles(dir, '.css'),
    ...findFiles(dir, '.scss'),
  ]);

  for (const srcFile of srcCss) {
    const srcName = path.basename(srcFile);
    const libMatch = libCss.find(f => path.basename(f) === srcName);

    if (libMatch) {
      const srcLines = fs.readFileSync(srcFile, 'utf8').split('\n').length;
      const libLines = fs.readFileSync(libMatch, 'utf8').split('\n').length;

      duplicates.push({
        name: srcName,
        src: {
          path: srcFile,
          lines: srcLines,
        },
        lib: {
          path: libMatch,
          lines: libLines,
        },
        recommendation: 'Style duplicate - consolidate to lib',
      });
    }
  }

  // Check for HTML duplicates
  const srcHtml = SRC_DIRS.flatMap(dir => findFiles(dir, '.html'));
  const libHtml = LIB_DIRS.flatMap(dir => findFiles(dir, '.html'));

  for (const srcFile of srcHtml) {
    const srcName = path.basename(srcFile);
    const libMatch = libHtml.find(f => path.basename(f) === srcName);

    if (libMatch) {
      const srcLines = fs.readFileSync(srcFile, 'utf8').split('\n').length;
      const libLines = fs.readFileSync(libMatch, 'utf8').split('\n').length;

      duplicates.push({
        name: srcName,
        src: {
          path: srcFile,
          lines: srcLines,
        },
        lib: {
          path: libMatch,
          lines: libLines,
        },
        recommendation: 'HTML template duplicate - consolidate to lib',
      });
    }
  }

  return duplicates;
}

function formatReport(duplicates) {
  if (duplicates.length === 0) {
    return '✅ No duplicate files detected between src/app and projects/osi-cards-lib';
  }

  let report = `\n❌ DUPLICATE FILES DETECTED: ${duplicates.length}\n`;
  report += '='.repeat(60) + '\n\n';

  // Group by type
  const byType = {
    typescript: duplicates.filter(d => d.name.endsWith('.ts')),
    styles: duplicates.filter(d => d.name.endsWith('.css') || d.name.endsWith('.scss')),
    html: duplicates.filter(d => d.name.endsWith('.html')),
  };

  for (const [type, items] of Object.entries(byType)) {
    if (items.length === 0) continue;

    report += `📁 ${type.toUpperCase()} (${items.length})\n`;
    report += '-'.repeat(40) + '\n';

    for (const dup of items) {
      report += `\n  ${dup.name}\n`;
      report += `    src: ${dup.src.path} (${dup.src.lines} lines)\n`;
      report += `    lib: ${dup.lib.path} (${dup.lib.lines} lines)\n`;
      report += `    → ${dup.recommendation}\n`;
    }
    report += '\n';
  }

  report += '='.repeat(60) + '\n';
  report += 'ACTION REQUIRED: Consolidate duplicates to library only.\n';
  report += 'See docs/ARCHITECTURE.md for guidelines.\n';

  return report;
}

// Main execution
const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const isJson = args.includes('--json');

const duplicates = detectDuplicates();

if (isJson) {
  console.log(JSON.stringify(duplicates, null, 2));
} else {
  console.log(formatReport(duplicates));
}

// Exit with error code in CI mode if duplicates found
if (isCI && duplicates.length > 0) {
  process.exit(1);
}

