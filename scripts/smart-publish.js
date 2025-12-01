#!/usr/bin/env node

/**
 * Smart Publish Script
 *
 * Comprehensive publishing workflow that:
 * - Checks npm for existing versions
 * - Auto-bumps version if needed
 * - Syncs all version files
 * - Generates release notes
 * - Builds the library
 * - Publishes to npm
 * - Creates git tag
 * - Pushes to remote
 *
 * Usage:
 *   npm run publish:smart         - Auto-increment patch and publish
 *   npm run publish:smart:minor   - Auto-increment minor and publish
 *   npm run publish:smart:major   - Auto-increment major and publish
 *   npm run publish:smart:dry     - Dry run (no actual publish)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_NAME = 'osi-cards-lib';
const VERSION_CONFIG = path.join(ROOT_DIR, 'version.config.json');
const ROOT_PACKAGE = path.join(ROOT_DIR, 'package.json');
const LIB_PACKAGE = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'package.json');
const DIST_PACKAGE = path.join(ROOT_DIR, 'dist', 'osi-cards-lib', 'package.json');

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logStep(step, msg) {
  console.log(`\n${c.cyan}[${step}]${c.reset} ${msg}`);
}

function logSuccess(msg) { log(`✓ ${msg}`, 'green'); }
function logError(msg) { log(`✗ ${msg}`, 'red'); }
function logWarning(msg) { log(`⚠ ${msg}`, 'yellow'); }
function logInfo(msg) { log(`ℹ ${msg}`, 'cyan'); }

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function exec(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', ...options }).trim();
}

function execSafe(cmd, fallback = null) {
  try {
    return exec(cmd);
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════
// Version Management
// ═══════════════════════════════════════════════════════════════

function parseVersion(version) {
  const clean = version.replace(/^v/, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?/);
  if (!match) throw new Error(`Invalid version: ${version}`);
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    raw: clean
  };
}

function formatVersion(v) {
  let version = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) version += `-${v.prerelease}`;
  return version;
}

function bumpVersion(version, type = 'patch') {
  const v = parseVersion(version);
  switch (type) {
    case 'major': v.major += 1; v.minor = 0; v.patch = 0; break;
    case 'minor': v.minor += 1; v.patch = 0; break;
    case 'patch': default: v.patch += 1; break;
  }
  v.prerelease = null;
  return formatVersion(v);
}

function compareVersions(a, b) {
  const vA = parseVersion(a);
  const vB = parseVersion(b);
  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  return vA.patch - vB.patch;
}

// ═══════════════════════════════════════════════════════════════
// NPM Operations
// ═══════════════════════════════════════════════════════════════

function getNpmVersion(packageName) {
  return execSafe(`npm view ${packageName} version 2>/dev/null`);
}

function getNpmVersions(packageName) {
  try {
    const result = exec(`npm view ${packageName} versions --json 2>/dev/null`);
    const versions = JSON.parse(result);
    return Array.isArray(versions) ? versions : [versions];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// Version Sync (delegating to version-sync.js)
// ═══════════════════════════════════════════════════════════════

function syncAllVersions(version) {
  logInfo(`Syncing version ${version} across all files...`);

  // Update version.config.json
  let config = {};
  if (fs.existsSync(VERSION_CONFIG)) {
    config = readJSON(VERSION_CONFIG);
  }
  config.version = version;
  config.lastUpdated = new Date().toISOString();
  config.releaseDate = new Date().toISOString();
  writeJSON(VERSION_CONFIG, config);
  logSuccess('Updated version.config.json');

  // Run version-sync.js
  try {
    execSync('node scripts/version-sync.js', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    logError('Version sync failed');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Release Notes Generation
// ═══════════════════════════════════════════════════════════════

function generateReleaseNotes(version) {
  logInfo('Generating release notes...');

  try {
    execSync(`node scripts/generate-release-notes.js --version ${version}`, {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    return true;
  } catch {
    logWarning('Release notes generation skipped');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Build & Publish
// ═══════════════════════════════════════════════════════════════

function buildLibrary() {
  logInfo('Building library...');
  try {
    execSync('npm run build:lib', { cwd: ROOT_DIR, stdio: 'inherit' });
    logSuccess('Library built successfully');
    return true;
  } catch {
    logError('Build failed');
    return false;
  }
}

function updateDistVersion(version) {
  if (fs.existsSync(DIST_PACKAGE)) {
    const pkg = readJSON(DIST_PACKAGE);
    pkg.version = version;
    writeJSON(DIST_PACKAGE, pkg);
    logSuccess('Updated dist/osi-cards-lib/package.json');
  }
}

function publishToNpm(dryRun = false) {
  const distDir = path.join(ROOT_DIR, 'dist', 'osi-cards-lib');

  try {
    const cmd = dryRun ? 'npm pack' : 'npm publish --access public';
    execSync(cmd, { cwd: distDir, stdio: 'inherit' });
    logSuccess(dryRun ? 'Dry run completed' : 'Published to npm');
    return true;
  } catch {
    logError('Publish failed');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Git Operations
// ═══════════════════════════════════════════════════════════════

function getGitInfo() {
  return {
    hash: execSafe('git rev-parse --short HEAD', 'unknown'),
    branch: execSafe('git rev-parse --abbrev-ref HEAD', 'unknown'),
    isDirty: (execSafe('git status --porcelain', '') || '').length > 0
  };
}

function commitChanges(version, skipCommit = false) {
  if (skipCommit) {
    logWarning('Skipping git commit');
    return true;
  }

  try {
    execSync('git add -A', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync(`git commit --no-verify -m "chore(release): v${version}"`, {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    logSuccess(`Committed: chore(release): v${version}`);
    return true;
  } catch {
    logWarning('No changes to commit or commit failed');
    return false;
  }
}

function createGitTag(version, skipTag = false) {
  if (skipTag) {
    logWarning('Skipping git tag');
    return true;
  }

  const tagName = `v${version}`;
  try {
    // Check if tag exists
    const existingTag = execSafe(`git tag -l "${tagName}"`);
    if (existingTag) {
      logWarning(`Tag ${tagName} already exists`);
      return false;
    }

    execSync(`git tag -a ${tagName} -m "Release ${version}"`, {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    logSuccess(`Created tag: ${tagName}`);
    return true;
  } catch {
    logWarning('Failed to create git tag');
    return false;
  }
}

function pushToRemote(skipPush = false) {
  if (skipPush) {
    logWarning('Skipping git push');
    return true;
  }

  try {
    execSync('git push origin main --follow-tags', { cwd: ROOT_DIR, stdio: 'pipe' });
    logSuccess('Pushed to remote with tags');
    return true;
  } catch {
    logWarning('Failed to push to remote');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Main Workflow
// ═══════════════════════════════════════════════════════════════

async function smartPublish(options = {}) {
  const {
    bumpType = 'patch',
    dryRun = false,
    skipCommit = false,
    skipPush = false,
    skipTag = false,
    force = false
  } = options;

  const startTime = Date.now();
  const git = getGitInfo();

  console.log('\n' + c.bright + '╔═══════════════════════════════════════════════════════════════╗' + c.reset);
  console.log(c.bright + '║              OSI Cards Smart Publish v2.0                      ║' + c.reset);
  console.log(c.bright + '╚═══════════════════════════════════════════════════════════════╝' + c.reset);

  if (dryRun) {
    console.log(c.yellow + '\n🔸 DRY RUN MODE - No changes will be published\n' + c.reset);
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 1: Gather Version Info
  // ═══════════════════════════════════════════════════════════════
  logStep('1/8', 'Gathering version information...');

  // Load local version
  let localVersion = '0.0.0';
  if (fs.existsSync(VERSION_CONFIG)) {
    localVersion = readJSON(VERSION_CONFIG).version;
  } else if (fs.existsSync(LIB_PACKAGE)) {
    localVersion = readJSON(LIB_PACKAGE).version;
  }
  logInfo(`Local version: ${localVersion}`);

  // Check npm
  const npmVersion = getNpmVersion(PACKAGE_NAME);
  const npmVersions = getNpmVersions(PACKAGE_NAME);
  if (npmVersion) {
    logInfo(`npm latest: ${npmVersion}`);
    logInfo(`npm versions: ${npmVersions.length} published`);
  } else {
    logInfo('Package not yet published on npm');
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 2: Calculate New Version
  // ═══════════════════════════════════════════════════════════════
  logStep('2/8', `Calculating new version (${bumpType})...`);

  let newVersion;
  const baseVersion = npmVersion || localVersion;

  if (npmVersions.includes(localVersion)) {
    logWarning(`Version ${localVersion} already on npm`);
    newVersion = bumpVersion(baseVersion, bumpType);
    logInfo(`Bumping ${bumpType}: ${baseVersion} → ${newVersion}`);
  } else if (npmVersion && compareVersions(localVersion, npmVersion) <= 0) {
    logWarning(`Local ${localVersion} <= npm ${npmVersion}`);
    newVersion = bumpVersion(npmVersion, bumpType);
    logInfo(`Bumping ${bumpType}: ${npmVersion} → ${newVersion}`);
  } else {
    newVersion = bumpVersion(localVersion, bumpType);
    logInfo(`Bumping ${bumpType}: ${localVersion} → ${newVersion}`);
  }

  // Ensure version is unique
  while (npmVersions.includes(newVersion)) {
    logWarning(`${newVersion} exists, incrementing...`);
    newVersion = bumpVersion(newVersion, 'patch');
  }

  console.log(`\n   ${c.bright}📦 New Version: ${c.green}${newVersion}${c.reset}\n`);

  if (dryRun) {
    logWarning('DRY RUN - Would publish this version');
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 3: Sync All Versions
  // ═══════════════════════════════════════════════════════════════
  logStep('3/8', 'Synchronizing version files...');

  if (!dryRun) {
    if (!syncAllVersions(newVersion)) {
      logError('Version sync failed. Aborting.');
      process.exit(1);
    }
  } else {
    logInfo('Would sync all version files');
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 4: Generate Release Notes
  // ═══════════════════════════════════════════════════════════════
  logStep('4/8', 'Generating release notes...');

  if (!dryRun) {
    generateReleaseNotes(newVersion);
  } else {
    logInfo('Would generate release notes');
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 5: Build Library
  // ═══════════════════════════════════════════════════════════════
  logStep('5/8', 'Building library...');

  if (!buildLibrary()) {
    logError('Build failed. Aborting publish.');
    process.exit(1);
  }

  // Update dist package.json
  if (!dryRun) {
    updateDistVersion(newVersion);
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 6: Commit Changes
  // ═══════════════════════════════════════════════════════════════
  logStep('6/8', 'Committing changes...');

  if (!dryRun) {
    commitChanges(newVersion, skipCommit);
    createGitTag(newVersion, skipTag);
  } else {
    logInfo('Would commit and tag');
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 7: Publish to npm
  // ═══════════════════════════════════════════════════════════════
  logStep('7/8', dryRun ? 'Testing publish (dry run)...' : 'Publishing to npm...');

  if (!publishToNpm(dryRun)) {
    logError('Publish failed.');
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════
  // Step 8: Push to Remote
  // ═══════════════════════════════════════════════════════════════
  logStep('8/8', 'Pushing to git remote...');

  if (!dryRun && !skipPush) {
    pushToRemote(skipPush);
  } else {
    logInfo(dryRun ? 'Would push to remote' : 'Skipped push');
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + c.bright + '╔═══════════════════════════════════════════════════════════════╗' + c.reset);

  if (dryRun) {
    console.log(c.yellow + '║                     DRY RUN COMPLETE                          ║' + c.reset);
    console.log(c.bright + '╠═══════════════════════════════════════════════════════════════╣' + c.reset);
    console.log(`║  Would publish: ${c.cyan}${PACKAGE_NAME}@${newVersion}${c.reset}`.padEnd(76) + '║');
  } else {
    console.log(c.green + '║                   🎉 PUBLISH SUCCESSFUL!                       ║' + c.reset);
    console.log(c.bright + '╠═══════════════════════════════════════════════════════════════╣' + c.reset);
    console.log(`║  Published: ${c.green}${PACKAGE_NAME}@${newVersion}${c.reset}`.padEnd(76) + '║');
    console.log(`║  npm: ${c.cyan}https://www.npmjs.com/package/${PACKAGE_NAME}${c.reset}`.padEnd(76) + '║');
    console.log(`║  Tag: ${c.cyan}v${newVersion}${c.reset}`.padEnd(76) + '║');
  }

  console.log(`║  Duration: ${duration}s`.padEnd(65) + '║');
  console.log(`║  Date: ${new Date().toISOString()}`.padEnd(65) + '║');
  console.log(c.bright + '╚═══════════════════════════════════════════════════════════════╝' + c.reset + '\n');
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const options = {
  bumpType: 'patch',
  dryRun: false,
  skipCommit: false,
  skipPush: false,
  skipTag: false,
  force: false
};

for (const arg of args) {
  switch (arg) {
    case 'minor':
    case '--minor':
      options.bumpType = 'minor';
      break;
    case 'major':
    case '--major':
      options.bumpType = 'major';
      break;
    case 'patch':
    case '--patch':
      options.bumpType = 'patch';
      break;
    case 'dry':
    case '--dry':
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--skip-commit':
      options.skipCommit = true;
      break;
    case '--skip-push':
      options.skipPush = true;
      break;
    case '--skip-tag':
      options.skipTag = true;
      break;
    case '--force':
    case '-f':
      options.force = true;
      break;
    case '--help':
    case '-h':
      console.log(`
${c.bright}OSI Cards Smart Publish${c.reset}

Comprehensive publishing workflow with version sync and release notes.

${c.cyan}Usage:${c.reset}
  node scripts/smart-publish.js [options]
  npm run publish:smart [options]

${c.cyan}Version Bump:${c.reset}
  patch         Bump patch version (default): 1.0.0 → 1.0.1
  minor         Bump minor version: 1.0.0 → 1.1.0
  major         Bump major version: 1.0.0 → 2.0.0

${c.cyan}Options:${c.reset}
  dry, --dry    Dry run - preview without publishing
  --skip-commit Skip git commit
  --skip-push   Skip git push
  --skip-tag    Skip git tag creation
  --force, -f   Force publish even if version exists
  --help, -h    Show this help

${c.cyan}Examples:${c.reset}
  npm run publish:smart          # Bump patch and publish
  npm run publish:smart minor    # Bump minor and publish
  npm run publish:smart dry      # Dry run
  npm run publish:smart:minor    # Bump minor and publish

${c.cyan}Workflow:${c.reset}
  1. Check local and npm versions
  2. Calculate new version
  3. Sync all version files (version.config.json → all targets)
  4. Generate release notes from commits
  5. Build library
  6. Commit and tag
  7. Publish to npm
  8. Push to git remote
`);
      process.exit(0);
  }
}

smartPublish(options).catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
