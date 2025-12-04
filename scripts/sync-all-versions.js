#!/usr/bin/env node

/**
 * Comprehensive Version Synchronization Script
 *
 * Ensures version consistency across ALL project files:
 * - package.json files
 * - Documentation files
 * - UI templates
 * - Section registry
 * - Generated code
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function loadVersionConfig() {
  const configPath = path.join(process.cwd(), 'version.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('version.config.json not found');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function updateJSONFile(filePath, version) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  content.version = version;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function updateMarkdownVersion(filePath, oldVersion, newVersion) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update version badges and references
  content = content.replace(/v\d+\.\d+\.\d+/g, `v${newVersion}`);
  content = content.replace(/version \d+\.\d+\.\d+/gi, `version ${newVersion}`);
  content = content.replace(/What's New in v\d+\.\d+\.\d+/gi, `What's New in v${newVersion}`);
  content = content.replace(/@\d+\.\d+\.\d+/g, `@${newVersion}`);

  fs.writeFileSync(filePath, content, 'utf8');
}

function updateTypeScriptTemplate(filePath, version) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update hardcoded version strings
  content = content.replace(
    /<span class="version">v[\d.]+<\/span>/g,
    `<span class="version">v${version}</span>`
  );
  content = content.replace(
    /version">v[\d.]+</g,
    `version">v${version}<`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

function updateSectionRegistry(filePath, version) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  content.version = version;
  content.registryVersion = version;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function main() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'bright');
  log('║          Version Synchronization - All Files                 ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');

  try {
    const config = loadVersionConfig();
    const version = config.version;

    log(`📦 Source Version: ${version}`, 'blue');
    log('');

    const updates = [];

    // 1. Update package.json files
    log('1️⃣  Updating package.json files...', 'yellow');
    const packageFiles = [
      'package.json',
      'projects/osi-cards-lib/package.json'
    ];

    packageFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        updateJSONFile(filePath, version);
        log(`   ✓ ${file}`, 'green');
        updates.push(file);
      }
    });
    log('');

    // 2. Update section registry
    log('2️⃣  Updating section registry...', 'yellow');
    const registryPath = path.join(process.cwd(), 'projects/osi-cards-lib/section-registry.json');
    if (fs.existsSync(registryPath)) {
      updateSectionRegistry(registryPath, version);
      log('   ✓ section-registry.json', 'green');
      updates.push('section-registry.json');
    }
    log('');

    // 3. Update documentation templates
    log('3️⃣  Updating documentation UI...', 'yellow');
    const docsWrapperPath = path.join(process.cwd(), 'src/app/features/documentation/docs-wrapper.component.ts');
    if (fs.existsSync(docsWrapperPath)) {
      updateTypeScriptTemplate(docsWrapperPath, version);
      log('   ✓ docs-wrapper.component.ts', 'green');
      updates.push('docs-wrapper.component.ts');
    }
    log('');

    // 4. Update README.md
    log('4️⃣  Updating README.md...', 'yellow');
    const readmePath = path.join(process.cwd(), 'README.md');
    if (fs.existsSync(readmePath)) {
      updateMarkdownVersion(readmePath, null, version);
      log('   ✓ README.md', 'green');
      updates.push('README.md');
    }
    log('');

    // 5. Update lib README
    log('5️⃣  Updating library README...', 'yellow');
    const libReadmePath = path.join(process.cwd(), 'projects/osi-cards-lib/README.md');
    if (fs.existsSync(libReadmePath)) {
      updateMarkdownVersion(libReadmePath, null, version);
      log('   ✓ projects/osi-cards-lib/README.md', 'green');
      updates.push('lib/README.md');
    }
    log('');

  // 6. Update version.ts via generate-version.js
  log('6️⃣  Updating version.ts...', 'yellow');
  require('child_process').execSync('node scripts/generate-version.js', { stdio: 'inherit' });
  updates.push('version.ts');
  log('');

  // Get git info for summary
  const gitHash = require('child_process')
    .execSync('git rev-parse --short HEAD', { encoding: 'utf8' })
    .trim();
  const gitBranch = require('child_process')
    .execSync('git branch --show-current', { encoding: 'utf8' })
    .trim();

  // 7. Update manifest.json
    log('7️⃣  Updating manifest files...', 'yellow');
    const manifestPath = path.join(process.cwd(), 'src/assets/configs/generated/manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.registryVersion = version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      log('   ✓ manifest.json', 'green');
      updates.push('manifest.json');
    }
    log('');

    // Summary
    log('╔══════════════════════════════════════════════════════════════╗', 'bright');
    log('║                  SYNCHRONIZATION COMPLETE                     ║', 'bright');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');

    log(`📦 Version: ${version}`, 'blue');
    log(`📝 Updated: ${updates.length} files`, 'green');
    log(`🔨 Git: ${gitBranch}@${gitHash}`, 'blue');
    log('');

    log('✅ All version references synchronized!', 'green');
    log('');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

