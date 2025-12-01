#!/usr/bin/env node

/**
 * Build Standalone CSS Distribution
 * 
 * Compiles SCSS to standalone CSS files for non-Angular consumers.
 * Creates minified and non-minified versions with source maps.
 * 
 * Usage: node scripts/build-standalone-css.js
 */

const sass = require('sass');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../projects/osi-cards-lib/src/lib/styles'),
  outputDir: path.join(__dirname, '../dist/osi-cards-lib/styles'),
  entryFiles: [
    { input: '_styles-standalone.scss', output: 'osi-cards.css' },
    { input: '_styles-scoped.scss', output: 'osi-cards-scoped.css' },
    { input: 'bundles/_ai-card.scss', output: 'osi-cards-ai-card.css' },
    { input: 'bundles/_card-skeleton.scss', output: 'osi-cards-skeleton.css' },
    { input: 'bundles/_tokens-only.scss', output: 'osi-cards-tokens.css' }
  ]
};

// Ensure output directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Compile SCSS file
function compileScss(inputPath, outputPath, minified = false) {
  try {
    const result = sass.compile(inputPath, {
      style: minified ? 'compressed' : 'expanded',
      sourceMap: true,
      sourceMapIncludeSources: true,
      loadPaths: [
        CONFIG.srcDir,
        path.join(CONFIG.srcDir, 'tokens'),
        path.join(CONFIG.srcDir, 'core'),
        path.join(CONFIG.srcDir, 'bundles'),
        path.join(CONFIG.srcDir, 'reset'),
        path.join(CONFIG.srcDir, 'components'),
        path.join(CONFIG.srcDir, 'layout')
      ]
    });

    // Write CSS file
    fs.writeFileSync(outputPath, result.css);
    console.log(`✓ Built: ${path.basename(outputPath)}`);

    // Write source map if available
    if (result.sourceMap) {
      const mapPath = outputPath + '.map';
      fs.writeFileSync(mapPath, JSON.stringify(result.sourceMap));
      console.log(`✓ Built: ${path.basename(mapPath)}`);
    }

    return true;
  } catch (error) {
    console.error(`✗ Error building ${inputPath}:`, error.message);
    return false;
  }
}

// Add CSS header with version and build info
function addCSSHeader(cssPath, version = '1.0.0') {
  const css = fs.readFileSync(cssPath, 'utf8');
  const header = `/**
 * OSI Cards Library - Standalone CSS
 * Version: ${version}
 * Built: ${new Date().toISOString()}
 * 
 * This CSS file provides complete style encapsulation for OSI Cards.
 * Import this file in your application to use OSI Cards without Angular.
 * 
 * Usage:
 *   <link rel="stylesheet" href="osi-cards.css">
 *   <div class="osi-cards-container" data-theme="day">
 *     <!-- Your card content -->
 *   </div>
 * 
 * Themes: Add data-theme="day" or data-theme="night" to your container.
 */

`;
  fs.writeFileSync(cssPath, header + css);
}

// Main build function
async function build() {
  console.log('\n🎨 Building OSI Cards Standalone CSS...\n');

  ensureDir(CONFIG.outputDir);

  let successCount = 0;
  let failCount = 0;

  for (const entry of CONFIG.entryFiles) {
    const inputPath = path.join(CONFIG.srcDir, entry.input);
    
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠ Skipping ${entry.input} (file not found)`);
      continue;
    }

    // Build non-minified version
    const outputPath = path.join(CONFIG.outputDir, entry.output);
    if (compileScss(inputPath, outputPath, false)) {
      addCSSHeader(outputPath);
      successCount++;
    } else {
      failCount++;
    }

    // Build minified version
    const minOutputPath = path.join(CONFIG.outputDir, entry.output.replace('.css', '.min.css'));
    if (compileScss(inputPath, minOutputPath, true)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Build complete: ${successCount} succeeded, ${failCount} failed\n`);

  return failCount === 0;
}

// Run build
build()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });







