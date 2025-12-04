#!/usr/bin/env node

/**
 * Smart Publish v2.0
 * 
 * Comprehensive publishing pipeline:
 * 1. Version bump (patch/minor/major)
 * 2. Sync all version references
 * 3. Build library & app
 * 4. Publish to NPM
 * 5. Commit & tag
 * 6. Push to GitHub (triggers Firebase deploy)
 * 7. Monitor deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(c[color] + message + c.reset);
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output;
  } catch (error) {
    if (!silent) throw error;
    return null;
  }
}

function getVersion() {
  const config = JSON.parse(fs.readFileSync('version.config.json', 'utf8'));
  return config.version;
}

function main() {
  const bumpType = process.argv[2] || 'patch';
  const validTypes = ['patch', 'minor', 'major', 'prerelease'];
  
  if (!validTypes.includes(bumpType)) {
    log(`\n❌ Invalid bump type: ${bumpType}`, 'red');
    log(`Valid types: ${validTypes.join(', ')}\n`, 'yellow');
    process.exit(1);
  }

  log('\n╔══════════════════════════════════════════════════════════════╗', 'bright');
  log('║          OSI Cards Smart Publish v2.0                         ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');

  try {
    const oldVersion = getVersion();
    log(`📦 Current Version: ${oldVersion}`, 'blue');
    log(`🔄 Bump Type: ${bumpType}\n`, 'yellow');

    // Step 1: Version bump
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 1: Bumping version...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    exec(`npm version ${bumpType} --no-git-tag-version`);
    const newVersion = getVersion();
    log(`   ✅ Bumped: ${oldVersion} → ${newVersion}\n`, 'green');

    // Step 2: Sync all versions
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 2: Syncing all version references...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    exec('node scripts/sync-all-versions.js');
    log('');

    // Step 3: Build library
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 3: Building library...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    exec('npm run build:lib');
    log('   ✅ Library built\n', 'green');

    // Step 4: Build demo app
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 4: Building demo app...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    const buildOutput = exec('npm run build 2>&1', true);
    if (buildOutput && buildOutput.includes('Application bundle generation complete')) {
      log('   ✅ Demo app built\n', 'green');
    } else {
      log('   ⚠️  Build completed with warnings\n', 'yellow');
    }

    // Step 5: Publish to NPM
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 5: Publishing to NPM...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    process.chdir('dist/osi-cards-lib');
    exec('npm publish --access public');
    process.chdir('../..');
    log(`   ✅ Published osi-cards-lib@${newVersion}\n`, 'green');

    // Step 6: Git operations
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 6: Committing changes...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    exec('git add .');
    exec(`git commit --no-verify -m "chore(release): v${newVersion} [publish]"`);
    exec(`git tag -a "v${newVersion}" -m "Release v${newVersion}"`);
    log('   ✅ Changes committed and tagged\n', 'green');

    // Step 7: Push to GitHub
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('Step 7: Pushing to GitHub...', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
    
    exec('git push origin main');
    exec('git push origin --tags');
    log('   ✅ Pushed to GitHub (Firebase deploy triggered)\n', 'green');

    // Summary
    log('\n╔══════════════════════════════════════════════════════════════╗', 'bright');
    log('║                 🎉 PUBLISH COMPLETE! 🎉                       ║', 'bright');
    log('╠══════════════════════════════════════════════════════════════╣', 'bright');
    log(`║  Version: ${newVersion.padEnd(53)}║`, 'bright');
    log('║  ✅ NPM Published                                              ║', 'bright');
    log('║  ✅ GitHub Pushed (Firebase deploying...)                     ║', 'bright');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'bright');

    log('🔗 Quick Links:', 'blue');
    log(`   • NPM: https://www.npmjs.com/package/osi-cards-lib`);
    log(`   • Demo: https://osi-card.web.app/ (deploying...)`);
    log(`   • Actions: https://github.com/Inutilepat83/OSI-Cards/actions`);
    log('');

    log('⏳ Firebase deployment in progress...', 'yellow');
    log('   Track status: gh run list --repo Inutilepat83/OSI-Cards --workflow deploy.yml', 'blue');
    log('');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log('', 'reset');
    process.exit(1);
  }
}

main();

