#!/usr/bin/env node
/**
 * OSI Cards Library - SCSS to CSS Compilation Script
 * 
 * This script compiles the SCSS stylesheets to CSS for direct import
 * in applications that don't use SCSS or want pre-compiled styles.
 * 
 * Usage:
 *   node scripts/compile-styles.js
 * 
 * Output:
 *   dist/osi-cards-lib/styles/
 *     ├── osi-cards.css              (global styles)
 *     ├── osi-cards-scoped.css       (scoped styles with .osi-cards-container)
 *     ├── osi-cards-standalone.css   (fully isolated styles)
 *     ├── osi-cards-tokens.css       (tokens only for host apps)
 *     └── bundles/
 *         ├── ai-card.css            (AI card bundle for Shadow DOM)
 *         ├── sections.css           (all sections bundle)
 *         └── section-*.css          (individual section bundles)
 */

const sass = require('sass');
const fs = require('fs');
const path = require('path');

// Configuration
const srcDir = path.join(__dirname, '../projects/osi-cards-lib/src/lib/styles');
const distDir = path.join(__dirname, '../dist/osi-cards-lib/styles');
const bundlesDistDir = path.join(distDir, 'bundles');

// Main styles to compile (legacy entry points)
const mainStyles = [
  { input: '_styles.scss', output: 'osi-cards.css', description: 'Global styles', optional: true },
  { input: '_styles-scoped.scss', output: 'osi-cards-scoped.css', description: 'Scoped styles', optional: false },
  { input: '_styles-standalone.scss', output: 'osi-cards-standalone.css', description: 'Standalone isolated styles', optional: false }
];

// New bundle styles for Shadow DOM components
const bundleStyles = [
  { input: 'bundles/_tokens-only.scss', output: 'osi-cards-tokens.css', description: 'Tokens only (for host apps)', optional: false },
  { input: 'bundles/_all.scss', output: 'bundles/all.css', description: 'All components bundle', optional: true },
  { input: 'bundles/_ai-card.scss', output: 'bundles/ai-card.css', description: 'AI Card bundle', optional: true },
  { input: 'bundles/_sections.scss', output: 'bundles/sections.css', description: 'All sections bundle', optional: true },
  { input: 'bundles/_base.scss', output: 'bundles/base.css', description: 'Base bundle', optional: true }
];

// Individual section bundles (optional, for tree-shaking)
const sectionBundles = [
  { input: 'bundles/_section-analytics.scss', output: 'bundles/section-analytics.css', description: 'Analytics section', optional: true },
  { input: 'bundles/_section-contact.scss', output: 'bundles/section-contact.css', description: 'Contact section', optional: true },
  { input: 'bundles/_section-chart.scss', output: 'bundles/section-chart.css', description: 'Chart section', optional: true },
  { input: 'bundles/_section-list.scss', output: 'bundles/section-list.css', description: 'List section', optional: true },
  { input: 'bundles/_section-news.scss', output: 'bundles/section-news.css', description: 'News section', optional: true },
  { input: 'bundles/_section-overview.scss', output: 'bundles/section-overview.css', description: 'Overview section', optional: true }
];

// Ensure dist directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Compile a single SCSS file
function compileStyle({ input, output, description }, baseDir = srcDir, outDir = distDir) {
  const inputPath = path.join(baseDir, input);
  const outputPath = path.join(outDir, output);
  const mapPath = `${outputPath}.map`;

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    return { success: false, reason: 'not_found' };
  }

  // Ensure output directory exists
  ensureDir(path.dirname(outputPath));

  try {
    console.log(`📦 Compiling ${input} -> ${output}`);
    
    // Compile SCSS to CSS
    const result = sass.compile(inputPath, {
      style: 'compressed',
      sourceMap: true,
      loadPaths: [
        srcDir,
        path.join(srcDir, 'core'),
        path.join(srcDir, 'components'),
        path.join(srcDir, 'layout'),
        path.join(srcDir, 'tokens'),
        path.join(srcDir, 'reset'),
        path.join(srcDir, 'bundles')
      ]
    });

    // Write CSS file
    const cssContent = result.css + `\n/*# sourceMappingURL=${path.basename(mapPath)} */`;
    fs.writeFileSync(outputPath, cssContent);

    // Write source map
    if (result.sourceMap) {
      fs.writeFileSync(mapPath, JSON.stringify(result.sourceMap));
    }

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   ✅ ${description}: ${sizeKB} KB`);
    
    return { success: true, size: sizeKB };
  } catch (error) {
    console.error(`   ❌ Error compiling ${input}:`);
    console.error(`      ${error.message}`);
    if (error.span) {
      console.error(`      Line ${error.span.start.line}, Column ${error.span.start.column}`);
    }
    return { success: false, reason: 'error', error };
  }
}

// Generate expanded (readable) versions for debugging
function compileExpandedStyle({ input, output }) {
  const inputPath = path.join(srcDir, input);
  const outputPath = path.join(distDir, output.replace('.css', '.expanded.css'));

  if (!fs.existsSync(inputPath)) {
    return false;
  }

  // Ensure output directory exists
  ensureDir(path.dirname(outputPath));

  try {
    const result = sass.compile(inputPath, {
      style: 'expanded',
      loadPaths: [
        srcDir,
        path.join(srcDir, 'core'),
        path.join(srcDir, 'components'),
        path.join(srcDir, 'layout'),
        path.join(srcDir, 'tokens'),
        path.join(srcDir, 'reset'),
        path.join(srcDir, 'bundles')
      ]
    });

    fs.writeFileSync(outputPath, result.css);
    return true;
  } catch (error) {
    // Silently skip expanded version on error
    return false;
  }
}

// Main execution
function main() {
  console.log('\n🎨 OSI Cards - Compiling SCSS to CSS\n');
  console.log(`   Source: ${srcDir}`);
  console.log(`   Output: ${distDir}\n`);

  // Ensure output directories exist
  ensureDir(distDir);
  ensureDir(bundlesDistDir);

  let successCount = 0;
  let failCount = 0;
  let optionalSkipCount = 0;

  // Compile main styles
  console.log('📁 Main Styles:');
  for (const style of mainStyles) {
    const result = compileStyle(style);
    if (result.success) {
      successCount++;
      compileExpandedStyle(style);
    } else if (style.optional) {
      optionalSkipCount++;
      console.log(`   ℹ️  Skipped (optional): ${style.description}`);
    } else {
      failCount++;
    }
  }

  // Compile bundle styles
  console.log('\n📁 Component Bundles:');
  for (const style of bundleStyles) {
    const result = compileStyle(style);
    if (result.success) {
      successCount++;
      compileExpandedStyle(style);
    } else if (style.optional) {
      optionalSkipCount++;
      if (result.reason !== 'not_found') {
        console.log(`   ℹ️  Skipped (optional): ${style.description}`);
      }
    } else {
      failCount++;
    }
  }

  // Compile individual section bundles
  console.log('\n📁 Section Bundles (for tree-shaking):');
  for (const style of sectionBundles) {
    const result = compileStyle(style);
    if (result.success) {
      successCount++;
    } else if (style.optional) {
      optionalSkipCount++;
      // Don't log individual section skips - too noisy
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log(`✨ Compilation complete:`);
  console.log(`   ${successCount} succeeded`);
  if (failCount > 0) console.log(`   ${failCount} failed`);
  if (optionalSkipCount > 0) console.log(`   ${optionalSkipCount} optional skipped`);
  console.log('');

  // Exit with error code only if required compilations failed
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run the script
main();
