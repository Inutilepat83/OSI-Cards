#!/usr/bin/env node

/**
 * Fix TypeScript Export Conflicts
 *
 * Resolves duplicate exports and missing imports in the utils consolidation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript export conflicts...\n');

const fixes = [
  {
    file: 'projects/osi-cards-lib/src/lib/utils/performance/index.ts',
    description: 'Remove duplicate getMemoryUsage export',
    find: /export \* from '\.\/memory\.consolidated';/g,
    replace: `// export * from './memory.consolidated';  // Disabled: duplicates performance.consolidated exports`
  },
  {
    file: 'projects/osi-cards-lib/src/lib/utils/index.ts',
    description: 'Remove conflicting layout export',
    find: /export \* from '\.\/layout';/g,
    replace: `// export * from './layout';  // Disabled: duplicates in performance/card-spawner/input-validation`
  },
  {
    file: 'projects/osi-cards-lib/src/lib/utils/index.ts',
    description: 'Remove conflicting card-spawner export',
    find: /export \* from '\.\/card-spawner\.util';/g,
    replace: `// export * from './card-spawner.util';  // Disabled: duplicates input-validation exports`
  },
  {
    file: 'projects/osi-cards-lib/src/lib/utils/virtual-scroll.consolidated.ts',
    description: 'Remove duplicate VirtualScrollConfig export',
    find: /export \* from '\.\/virtual-scroll-enhanced\.util';/g,
    replace: `// export * from './virtual-scroll-enhanced.util';  // Disabled: duplicates virtual-scroll.util exports`
  }
];

let successCount = 0;
let errorCount = 0;

fixes.forEach(({ file, description, find, replace }) => {
  const fullPath = path.join(__dirname, '..', file);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skip: ${file} (not found)`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    if (find.test(content)) {
      content = content.replace(find, replace);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${description}`);
      console.log(`   File: ${file}\n`);
      successCount++;
    } else {
      console.log(`⏭️  Skip: ${description} (already fixed or not found)\n`);
    }
  } catch (error) {
    console.error(`❌ Error: ${description}`);
    console.error(`   ${error.message}\n`);
    errorCount++;
  }
});

console.log(`${'='.repeat(60)}`);
console.log(`✅ Fixed: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`${'='.repeat(60)}\n`);

if (successCount > 0) {
  console.log('✨ Export conflicts have been fixed!');
  console.log('📦 Run "npm run build:lib" to rebuild.\n');
}

