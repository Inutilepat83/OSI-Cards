#!/usr/bin/env node

/**
 * Fix SCSS Import Conflicts
 *
 * Replaces problematic dual imports with namespaced imports to avoid mixin conflicts
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const sectionsDir = path.join(__dirname, '../projects/osi-cards-lib/src/lib/components/sections');

// Find all section SCSS files (excluding partials that start with _)
const scssFiles = [
  ...glob.sync(`${sectionsDir}/**/*.scss`, { ignore: [`${sectionsDir}/**/_*.scss`] })
];

console.log(`Found ${scssFiles.length} SCSS files to fix\n`);

let fixedCount = 0;
let skippedCount = 0;
let errorCount = 0;

scssFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Pattern 1: Both imports as global
    const pattern1 = /@use ['"]\.\.\/\.\.\/\.\.\/styles\/components\/sections\/design-system['"] as \*;\s*\n@use ['"]\.\.\/\.\.\/\.\.\/styles\/components\/sections\/sections-base['"] as \*;/g;

    // Pattern 2: Reversed order
    const pattern2 = /@use ['"]\.\.\/\.\.\/\.\.\/styles\/components\/sections\/sections-base['"] as \*;\s*\n@use ['"]\.\.\/\.\.\/\.\.\/styles\/components\/sections\/design-system['"] as \*;/g;

    // Replacement: sections-base as global, design-system as namespaced
    const replacement = `@use '../../../styles/components/sections/sections-base' as *;\n@use '../../../styles/components/sections/design-system' as design;`;

    if (pattern1.test(content)) {
      content = content.replace(pattern1, replacement);
    } else if (pattern2.test(content)) {
      content = content.replace(pattern2, replacement);
    }

    // Fix known mixin calls that need namespacing
    const mixinFixes = [
      { old: /@include list-stack\(/g, new: '@include design.list-stack(' },
      { old: /@include section-responsive-grid\(/g, new: '@include design.section-responsive-grid(' },
      { old: /@include grid-2col\(/g, new: '@include design.grid-2col(' },
      { old: /@include grid-auto-fit\(/g, new: '@include design.grid-auto-fit(' },
    ];

    mixinFixes.forEach(({ old, new: replacement }) => {
      if (old.test(content)) {
        content = content.replace(old, replacement);
      }
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(sectionsDir, file)}`);
      fixedCount++;
    } else {
      console.log(`⏭️  Skipped: ${path.relative(sectionsDir, file)} (no changes needed)`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
    errorCount++;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Fixed: ${fixedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log(`${'='.repeat(60)}\n`);

if (fixedCount > 0) {
  console.log('✨ SCSS imports have been fixed!');
  console.log('📦 Run "npm run build:lib" to rebuild the library.\n');
}

