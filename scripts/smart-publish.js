#!/usr/bin/env node

/**
 * Smart Publish Script
 * 
 * Automatically checks npm for the latest published version,
 * bumps the version if needed, builds, and publishes.
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

const PACKAGE_NAME = 'osi-cards-lib';
const ROOT_PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const LIB_PACKAGE_JSON = path.join(__dirname, '..', 'projects', 'osi-cards-lib', 'package.json');
const DIST_PACKAGE_JSON = path.join(__dirname, '..', 'dist', 'osi-cards-lib', 'package.json');
const VERSION_FILE = path.join(__dirname, '..', 'src', 'version.ts');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Parse semantic version string
 */
function parseVersion(version) {
  const clean = version.replace(/^v/, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
    raw: clean
  };
}

/**
 * Format version components into string
 */
function formatVersion(components) {
  let version = `${components.major}.${components.minor}.${components.patch}`;
  if (components.prerelease) {
    version += `-${components.prerelease}`;
  }
  return version;
}

/**
 * Compare two versions: returns -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
  const vA = parseVersion(a);
  const vB = parseVersion(b);
  
  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  if (vA.patch !== vB.patch) return vA.patch - vB.patch;
  return 0;
}

/**
 * Increment version
 */
function incrementVersion(version, type = 'patch') {
  const v = parseVersion(version);
  
  switch (type) {
    case 'major':
      v.major += 1;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor += 1;
      v.patch = 0;
      break;
    case 'patch':
    default:
      v.patch += 1;
      break;
  }
  
  v.prerelease = null;
  return formatVersion(v);
}

/**
 * Get latest published version from npm
 */
function getNpmVersion(packageName) {
  try {
    const result = execSync(`npm view ${packageName} version 2>/dev/null`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch (error) {
    // Package might not exist yet
    return null;
  }
}

/**
 * Get all published versions from npm
 */
function getNpmVersions(packageName) {
  try {
    const result = execSync(`npm view ${packageName} versions --json 2>/dev/null`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const versions = JSON.parse(result);
    return Array.isArray(versions) ? versions : [versions];
  } catch (error) {
    return [];
  }
}

/**
 * Read package.json
 */
function readPackageJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Write package.json
 */
function writePackageJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Update version in all package.json files
 */
function updateAllVersions(newVersion) {
  // Update root package.json
  const rootPkg = readPackageJson(ROOT_PACKAGE_JSON);
  rootPkg.version = newVersion;
  writePackageJson(ROOT_PACKAGE_JSON, rootPkg);
  logSuccess(`Updated root package.json to ${newVersion}`);
  
  // Update library package.json
  const libPkg = readPackageJson(LIB_PACKAGE_JSON);
  libPkg.version = newVersion;
  writePackageJson(LIB_PACKAGE_JSON, libPkg);
  logSuccess(`Updated library package.json to ${newVersion}`);
}

/**
 * Generate version.ts file
 */
function generateVersionFile(version) {
  const buildDate = new Date().toISOString();
  let buildHash = 'unknown';
  let buildBranch = 'unknown';
  
  try {
    buildHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    buildBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {}
  
  const content = `/**
 * Auto-generated version file
 * Do not edit manually - this file is generated by smart-publish.js
 * Updated during build process
 */

export const VERSION = '${version}';
export const BUILD_DATE = '${buildDate}';
export const BUILD_HASH = '${buildHash}';
export const BUILD_BRANCH = '${buildBranch}';

export interface VersionInfo {
  version: string;
  buildDate: string;
  buildHash: string;
  buildBranch: string;
}

export const VERSION_INFO: VersionInfo = {
  version: VERSION,
  buildDate: BUILD_DATE,
  buildHash: BUILD_HASH,
  buildBranch: BUILD_BRANCH
};

/**
 * Get formatted version string
 */
export function getVersionString(): string {
  return \`\${VERSION} (\${BUILD_BRANCH}@\${BUILD_HASH})\`;
}

/**
 * Check if current build is a production build
 */
export function isProductionBuild(): boolean {
  return BUILD_BRANCH === 'main' || BUILD_BRANCH === 'master';
}
`;
  
  fs.writeFileSync(VERSION_FILE, content, 'utf8');
  logSuccess(`Generated version.ts`);
}

/**
 * Build the library
 */
function buildLibrary() {
  logStep('BUILD', 'Building library...');
  
  try {
    execSync('npm run build:lib', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Library built successfully');
    return true;
  } catch (error) {
    logError('Build failed');
    return false;
  }
}

/**
 * Publish to npm
 */
function publishToNpm(dryRun = false) {
  const distDir = path.join(__dirname, '..', 'dist', 'osi-cards-lib');
  
  logStep('PUBLISH', dryRun ? 'Running publish dry-run...' : 'Publishing to npm...');
  
  try {
    const cmd = dryRun ? 'npm pack' : 'npm publish --access public';
    execSync(cmd, { 
      stdio: 'inherit',
      cwd: distDir
    });
    logSuccess(dryRun ? 'Dry run completed' : 'Published successfully');
    return true;
  } catch (error) {
    logError('Publish failed');
    return false;
  }
}

/**
 * Commit version bump
 */
function commitVersionBump(version, skipCommit = false) {
  if (skipCommit) {
    logWarning('Skipping git commit');
    return;
  }
  
  try {
    execSync('git add -A', { stdio: 'pipe' });
    execSync(`git commit --no-verify -m "chore(release): bump version to ${version}"`, { stdio: 'pipe' });
    logSuccess(`Committed version bump to ${version}`);
  } catch (error) {
    logWarning('Could not commit (maybe no changes or not a git repo)');
  }
}

/**
 * Push to remote
 */
function pushToRemote(skipPush = false) {
  if (skipPush) {
    logWarning('Skipping git push');
    return;
  }
  
  try {
    execSync('git push origin main', { stdio: 'pipe' });
    logSuccess('Pushed to remote');
  } catch (error) {
    logWarning('Could not push to remote');
  }
}

/**
 * Main smart publish function
 */
async function smartPublish(options = {}) {
  const {
    bumpType = 'patch',
    dryRun = false,
    skipCommit = false,
    skipPush = false,
    force = false
  } = options;

  console.log('\n' + colors.bright + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bright + '                    OSI Cards Smart Publish                     ' + colors.reset);
  console.log(colors.bright + '═══════════════════════════════════════════════════════════════' + colors.reset);

  // Step 1: Get current local version
  logStep('1', 'Checking local version...');
  const localPkg = readPackageJson(LIB_PACKAGE_JSON);
  const localVersion = localPkg.version;
  log(`   Local version: ${localVersion}`, 'cyan');

  // Step 2: Get npm version
  logStep('2', 'Checking npm registry...');
  const npmVersion = getNpmVersion(PACKAGE_NAME);
  const npmVersions = getNpmVersions(PACKAGE_NAME);
  
  if (npmVersion) {
    log(`   Latest npm version: ${npmVersion}`, 'cyan');
    log(`   Total published versions: ${npmVersions.length}`, 'cyan');
  } else {
    log('   Package not yet published on npm', 'yellow');
  }

  // Step 3: Determine new version
  logStep('3', 'Calculating new version...');
  
  let newVersion;
  const baseVersion = npmVersion || localVersion;
  
  // Check if local version already exists on npm
  if (npmVersions.includes(localVersion)) {
    log(`   Version ${localVersion} already exists on npm`, 'yellow');
    newVersion = incrementVersion(baseVersion, bumpType);
    log(`   Auto-incrementing ${bumpType}: ${baseVersion} → ${newVersion}`, 'green');
  } else if (npmVersion && compareVersions(localVersion, npmVersion) <= 0) {
    log(`   Local version ${localVersion} is not higher than npm version ${npmVersion}`, 'yellow');
    newVersion = incrementVersion(npmVersion, bumpType);
    log(`   Auto-incrementing ${bumpType}: ${npmVersion} → ${newVersion}`, 'green');
  } else {
    newVersion = localVersion;
    log(`   Using local version: ${newVersion}`, 'green');
  }

  // Ensure new version doesn't exist
  while (npmVersions.includes(newVersion)) {
    log(`   Version ${newVersion} already exists, incrementing again...`, 'yellow');
    newVersion = incrementVersion(newVersion, 'patch');
  }

  log(`\n   ${colors.bright}Final version to publish: ${newVersion}${colors.reset}`, 'green');

  if (dryRun) {
    logWarning('\n   DRY RUN MODE - No changes will be made\n');
  }

  // Step 4: Update version files
  if (!dryRun) {
    logStep('4', 'Updating version files...');
    updateAllVersions(newVersion);
    generateVersionFile(newVersion);
  } else {
    logStep('4', 'Would update version files (dry run)');
  }

  // Step 5: Build library
  logStep('5', 'Building library...');
  if (!buildLibrary()) {
    logError('\nBuild failed. Aborting publish.');
    process.exit(1);
  }

  // Update dist package.json with correct version
  if (fs.existsSync(DIST_PACKAGE_JSON)) {
    const distPkg = readPackageJson(DIST_PACKAGE_JSON);
    distPkg.version = newVersion;
    writePackageJson(DIST_PACKAGE_JSON, distPkg);
    logSuccess(`Updated dist package.json to ${newVersion}`);
  }

  // Step 6: Commit changes
  if (!dryRun) {
    logStep('6', 'Committing changes...');
    commitVersionBump(newVersion, skipCommit);
  }

  // Step 7: Publish
  logStep('7', dryRun ? 'Dry run publish...' : 'Publishing to npm...');
  if (!publishToNpm(dryRun)) {
    logError('\nPublish failed.');
    process.exit(1);
  }

  // Step 8: Push to git
  if (!dryRun && !skipPush) {
    logStep('8', 'Pushing to git...');
    pushToRemote(skipPush);
  }

  // Done!
  console.log('\n' + colors.bright + '═══════════════════════════════════════════════════════════════' + colors.reset);
  if (dryRun) {
    log('   DRY RUN COMPLETE', 'yellow');
    log(`   Would have published version: ${newVersion}`, 'cyan');
  } else {
    log('   🎉 PUBLISH SUCCESSFUL!', 'green');
    log(`   Published: ${PACKAGE_NAME}@${newVersion}`, 'cyan');
    log(`   npm: https://www.npmjs.com/package/${PACKAGE_NAME}`, 'cyan');
  }
  console.log(colors.bright + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  bumpType: 'patch',
  dryRun: false,
  skipCommit: false,
  skipPush: false,
  force: false
};

// Parse arguments
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
    case '--force':
    case '-f':
      options.force = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Smart Publish Script

Automatically checks npm for existing versions and bumps appropriately.

Usage:
  node scripts/smart-publish.js [options]

Options:
  patch         Increment patch version (default)
  minor         Increment minor version  
  major         Increment major version
  dry, --dry    Dry run (no actual publish)
  --skip-commit Skip git commit
  --skip-push   Skip git push
  --force, -f   Force publish even if version exists
  --help, -h    Show this help

Examples:
  npm run publish:smart          # Auto-increment patch and publish
  npm run publish:smart minor    # Auto-increment minor and publish
  npm run publish:smart dry      # Dry run
`);
      process.exit(0);
  }
}

// Run
smartPublish(options).catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});



