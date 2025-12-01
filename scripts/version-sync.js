#!/usr/bin/env node

/**
 * Unified Version Sync Script
 *
 * Synchronizes version across all project files from a single source of truth.
 * This ensures version consistency across:
 * - package.json (root)
 * - projects/osi-cards-lib/package.json
 * - src/version.ts
 * - docs/openapi.yaml
 * - CHANGELOG.md
 *
 * Usage:
 *   node scripts/version-sync.js              - Sync current version
 *   node scripts/version-sync.js patch        - Bump patch and sync
 *   node scripts/version-sync.js minor        - Bump minor and sync
 *   node scripts/version-sync.js major        - Bump major and sync
 *   node scripts/version-sync.js --show       - Show version status
 *   node scripts/version-sync.js --check      - Check if versions are in sync
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const ROOT_DIR = path.join(__dirname, '..');
const VERSION_CONFIG = path.join(ROOT_DIR, 'version.config.json');
const ROOT_PACKAGE = path.join(ROOT_DIR, 'package.json');
const LIB_PACKAGE = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'package.json');
const VERSION_TS = path.join(ROOT_DIR, 'src', 'version.ts');
const OPENAPI_YAML = path.join(ROOT_DIR, 'docs', 'openapi.yaml');
const CHANGELOG = path.join(ROOT_DIR, 'CHANGELOG.md');

// Colors for console output
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logSuccess(msg) { log(`✓ ${msg}`, 'green'); }
function logError(msg) { log(`✗ ${msg}`, 'red'); }
function logWarning(msg) { log(`⚠ ${msg}`, 'yellow'); }
function logInfo(msg) { log(`ℹ ${msg}`, 'cyan'); }
function logStep(step, msg) { log(`\n${c.cyan}[${step}]${c.reset} ${msg}`); }

function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const isDirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
    return { hash, branch, isDirty };
  } catch {
    return { hash: 'unknown', branch: 'unknown', isDirty: false };
  }
}

function formatDate(date = new Date()) {
  return date.toISOString();
}

function formatDateShort(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════
// Version Parsing & Bumping
// ═══════════════════════════════════════════════════════════════

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$/);
  if (!match) throw new Error(`Invalid version format: ${version}`);
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null
  };
}

function formatVersion(v) {
  let version = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) version += `-${v.prerelease}`;
  if (v.build) version += `+${v.build}`;
  return version;
}

function bumpVersion(currentVersion, type) {
  const v = parseVersion(currentVersion);

  switch (type) {
    case 'major':
      v.major += 1;
      v.minor = 0;
      v.patch = 0;
      v.prerelease = null;
      break;
    case 'minor':
      v.minor += 1;
      v.patch = 0;
      v.prerelease = null;
      break;
    case 'patch':
      v.patch += 1;
      v.prerelease = null;
      break;
    case 'prerelease':
      if (v.prerelease) {
        const match = v.prerelease.match(/^(\w+)\.(\d+)$/);
        if (match) {
          v.prerelease = `${match[1]}.${parseInt(match[2], 10) + 1}`;
        } else {
          v.prerelease = `${v.prerelease}.0`;
        }
      } else {
        v.patch += 1;
        v.prerelease = 'rc.0';
      }
      break;
  }

  return formatVersion(v);
}

// ═══════════════════════════════════════════════════════════════
// File Operations
// ═══════════════════════════════════════════════════════════════

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadVersionConfig() {
  if (!fs.existsSync(VERSION_CONFIG)) {
    // Create default config from package.json
    const pkg = readJSON(ROOT_PACKAGE);
    const config = {
      version: pkg.version,
      name: 'osi-cards',
      lastUpdated: formatDate(),
      releaseDate: null
    };
    writeJSON(VERSION_CONFIG, config);
    return config;
  }
  return readJSON(VERSION_CONFIG);
}

function saveVersionConfig(config) {
  config.lastUpdated = formatDate();
  writeJSON(VERSION_CONFIG, config);
}

// ═══════════════════════════════════════════════════════════════
// Sync Functions
// ═══════════════════════════════════════════════════════════════

function syncPackageJson(filePath, version) {
  const pkg = readJSON(filePath);
  const oldVersion = pkg.version;
  pkg.version = version;
  writeJSON(filePath, pkg);
  return { file: path.relative(ROOT_DIR, filePath), oldVersion, newVersion: version };
}

function syncVersionTs(version) {
  const git = getGitInfo();
  const buildDate = formatDate();

  const content = `/**
 * Auto-generated version file
 * Do not edit manually - generated by scripts/version-sync.js
 *
 * Source of truth: version.config.json
 * Last synced: ${buildDate}
 */

export const VERSION = '${version}';
export const BUILD_DATE = '${buildDate}';
export const BUILD_HASH = '${git.hash}';
export const BUILD_BRANCH = '${git.branch}';

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
  buildBranch: BUILD_BRANCH,
};

/**
 * Get formatted version string
 * @example "1.5.2 (main@abc1234)"
 */
export function getVersionString(): string {
  return \`\${VERSION} (\${BUILD_BRANCH}@\${BUILD_HASH})\`;
}

/**
 * Get short version for display
 * @example "v1.5.2"
 */
export function getShortVersion(): string {
  return \`v\${VERSION}\`;
}

/**
 * Get full build info for debugging
 */
export function getBuildInfo(): string {
  return \`OSI Cards \${VERSION} | Built: \${new Date(BUILD_DATE).toLocaleDateString()} | \${BUILD_BRANCH}@\${BUILD_HASH}\`;
}

/**
 * Check if current build is a production build
 */
export function isProductionBuild(): boolean {
  return BUILD_BRANCH === 'main' || BUILD_BRANCH === 'master';
}

/**
 * Check if current build is a prerelease
 */
export function isPrerelease(): boolean {
  return VERSION.includes('-');
}
`;

  fs.writeFileSync(VERSION_TS, content, 'utf8');
  return { file: 'src/version.ts', version, buildDate, git };
}

function syncOpenAPI(version) {
  if (!fs.existsSync(OPENAPI_YAML)) {
    logWarning('OpenAPI file not found, skipping');
    return null;
  }

  let content = fs.readFileSync(OPENAPI_YAML, 'utf8');

  // Update version in info section
  const versionRegex = /(info:\s*\n\s*title:[^\n]*\n\s*version:\s*)['"]?[\d.]+(-[\w.]+)?['"]?/;
  const match = content.match(versionRegex);
  const oldVersion = match ? match[0].match(/version:\s*['"]?([\d.]+-?[\w.]*)/)?.[1] : 'unknown';

  content = content.replace(
    versionRegex,
    `$1${version}`
  );

  // Also update any version references in description
  content = content.replace(
    /OSI Cards Library v[\d.]+(-[\w.]+)?/g,
    `OSI Cards Library v${version}`
  );

  fs.writeFileSync(OPENAPI_YAML, content, 'utf8');
  return { file: 'docs/openapi.yaml', oldVersion, newVersion: version };
}

function updateChangelogUnreleased(version) {
  if (!fs.existsSync(CHANGELOG)) {
    logWarning('CHANGELOG.md not found, skipping');
    return null;
  }

  let content = fs.readFileSync(CHANGELOG, 'utf8');
  const today = formatDateShort();

  // Check if version already exists
  if (content.includes(`## [${version}]`)) {
    return { file: 'CHANGELOG.md', status: 'exists', version };
  }

  // Replace [Unreleased] with new version and add new [Unreleased]
  if (content.includes('## [Unreleased]')) {
    content = content.replace(
      '## [Unreleased]',
      `## [Unreleased]\n\n### Added\n- TBD\n\n## [${version}] - ${today}`
    );
    fs.writeFileSync(CHANGELOG, content, 'utf8');
    return { file: 'CHANGELOG.md', status: 'updated', version, date: today };
  }

  return { file: 'CHANGELOG.md', status: 'no-unreleased', version };
}

// ═══════════════════════════════════════════════════════════════
// Main Functions
// ═══════════════════════════════════════════════════════════════

function showVersionStatus() {
  console.log('\n' + c.bright + '═══════════════════════════════════════════════════════════════' + c.reset);
  console.log(c.bright + '                    OSI Cards Version Status                     ' + c.reset);
  console.log(c.bright + '═══════════════════════════════════════════════════════════════' + c.reset);

  const config = loadVersionConfig();
  const git = getGitInfo();

  console.log(`\n${c.cyan}📦 Central Config:${c.reset}`);
  console.log(`   Version:      ${c.green}${config.version}${c.reset}`);
  console.log(`   Last Updated: ${config.lastUpdated}`);

  console.log(`\n${c.cyan}📁 File Versions:${c.reset}`);

  // Check all files
  const files = [
    { name: 'package.json', path: ROOT_PACKAGE },
    { name: 'lib/package.json', path: LIB_PACKAGE },
    { name: 'src/version.ts', path: VERSION_TS },
    { name: 'docs/openapi.yaml', path: OPENAPI_YAML }
  ];

  let allInSync = true;

  for (const file of files) {
    let fileVersion = 'not found';

    if (fs.existsSync(file.path)) {
      try {
        if (file.path.endsWith('.json')) {
          const data = readJSON(file.path);
          fileVersion = data.version || 'no version field';
        } else if (file.path.endsWith('.ts')) {
          const content = fs.readFileSync(file.path, 'utf8');
          const match = content.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
          fileVersion = match ? match[1] : 'no version found';
        } else if (file.path.endsWith('.yaml')) {
          const content = fs.readFileSync(file.path, 'utf8');
          const match = content.match(/version:\s*['"]?([\d.]+-?[\w.]*)/);
          fileVersion = match ? match[1] : 'no version found';
        }
      } catch (e) {
        fileVersion = `error: ${e.message}`;
      }
    }

    const inSync = fileVersion === config.version;
    if (!inSync) allInSync = false;

    const status = inSync ? c.green + '✓' : c.red + '✗';
    const versionColor = inSync ? c.green : c.red;
    console.log(`   ${status} ${file.name.padEnd(20)} ${versionColor}${fileVersion}${c.reset}`);
  }

  console.log(`\n${c.cyan}🔧 Git Info:${c.reset}`);
  console.log(`   Branch: ${git.branch}`);
  console.log(`   Commit: ${git.hash}`);
  console.log(`   Dirty:  ${git.isDirty ? c.yellow + 'Yes' : c.green + 'No'}${c.reset}`);

  console.log(`\n${c.cyan}📊 Status:${c.reset}`);
  if (allInSync) {
    console.log(`   ${c.green}✓ All versions are synchronized${c.reset}`);
  } else {
    console.log(`   ${c.red}✗ Versions are out of sync!${c.reset}`);
    console.log(`   ${c.yellow}Run: npm run version:sync${c.reset}`);
  }

  console.log('\n' + c.bright + '═══════════════════════════════════════════════════════════════' + c.reset + '\n');

  return allInSync;
}

function syncAllVersions(newVersion = null, updateChangelog = false) {
  console.log('\n' + c.bright + '═══════════════════════════════════════════════════════════════' + c.reset);
  console.log(c.bright + '                    OSI Cards Version Sync                       ' + c.reset);
  console.log(c.bright + '═══════════════════════════════════════════════════════════════' + c.reset);

  const config = loadVersionConfig();
  const version = newVersion || config.version;

  logStep('1', `Target version: ${c.green}${version}${c.reset}`);

  const results = [];

  // Sync package.json files
  logStep('2', 'Syncing package.json files...');
  results.push(syncPackageJson(ROOT_PACKAGE, version));
  results.push(syncPackageJson(LIB_PACKAGE, version));

  // Sync version.ts
  logStep('3', 'Generating version.ts...');
  results.push(syncVersionTs(version));

  // Sync OpenAPI
  logStep('4', 'Syncing OpenAPI spec...');
  const openApiResult = syncOpenAPI(version);
  if (openApiResult) results.push(openApiResult);

  // Update changelog if requested
  if (updateChangelog) {
    logStep('5', 'Updating CHANGELOG.md...');
    const changelogResult = updateChangelogUnreleased(version);
    if (changelogResult) results.push(changelogResult);
  }

  // Update version config
  config.version = version;
  saveVersionConfig(config);

  // Print results
  console.log(`\n${c.cyan}📋 Sync Results:${c.reset}`);
  for (const result of results) {
    if (result.oldVersion && result.newVersion) {
      if (result.oldVersion === result.newVersion) {
        logInfo(`${result.file}: ${result.oldVersion} (unchanged)`);
      } else {
        logSuccess(`${result.file}: ${result.oldVersion} → ${result.newVersion}`);
      }
    } else if (result.version) {
      logSuccess(`${result.file}: ${result.version}`);
    } else {
      logSuccess(`${result.file}: synced`);
    }
  }

  console.log('\n' + c.bright + '═══════════════════════════════════════════════════════════════' + c.reset);
  console.log(`${c.green}✅ Version sync complete: ${version}${c.reset}`);
  console.log(c.bright + '═══════════════════════════════════════════════════════════════' + c.reset + '\n');

  return version;
}

function bumpAndSync(type) {
  const config = loadVersionConfig();
  const currentVersion = config.version;
  const newVersion = bumpVersion(currentVersion, type);

  console.log(`\n${c.cyan}🚀 Bumping ${type} version...${c.reset}`);
  console.log(`   ${currentVersion} → ${c.green}${newVersion}${c.reset}\n`);

  return syncAllVersions(newVersion, true);
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'patch':
  case 'minor':
  case 'major':
  case 'prerelease':
    bumpAndSync(command);
    break;

  case '--show':
  case 'show':
  case 'status':
    showVersionStatus();
    break;

  case '--check':
  case 'check':
    const inSync = showVersionStatus();
    process.exit(inSync ? 0 : 1);
    break;

  case '--help':
  case '-h':
  case 'help':
    console.log(`
${c.bright}OSI Cards Version Sync${c.reset}

Synchronizes version across all project files from version.config.json

${c.cyan}Usage:${c.reset}
  node scripts/version-sync.js [command]
  npm run version:sync [command]

${c.cyan}Commands:${c.reset}
  (none)      Sync current version to all files
  patch       Bump patch version and sync (1.0.0 → 1.0.1)
  minor       Bump minor version and sync (1.0.0 → 1.1.0)
  major       Bump major version and sync (1.0.0 → 2.0.0)
  prerelease  Create prerelease version (1.0.0 → 1.0.1-rc.0)
  show        Show version status across all files
  check       Check if versions are in sync (exit 1 if not)

${c.cyan}Files Synced:${c.reset}
  • package.json
  • projects/osi-cards-lib/package.json
  • src/version.ts
  • docs/openapi.yaml
  • CHANGELOG.md (on bump only)

${c.cyan}Examples:${c.reset}
  npm run version:sync           # Sync current version
  npm run version:sync patch     # Bump patch and sync
  npm run version:sync show      # Show status
`);
    break;

  default:
    syncAllVersions();
}

