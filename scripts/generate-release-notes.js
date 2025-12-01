#!/usr/bin/env node

/**
 * Generate Release Notes from Conventional Commits
 *
 * Generates comprehensive release notes and changelog entries
 * based on git commits following Conventional Commits specification.
 *
 * Features:
 * - Parses conventional commits (feat, fix, docs, etc.)
 * - Groups changes by type
 * - Highlights breaking changes
 * - Generates both CHANGELOG.md and RELEASE_NOTES.md
 * - Includes dynamic dates
 * - Optional commit hash and author inclusion
 *
 * Usage:
 *   node scripts/generate-release-notes.js --version 1.2.3
 *   node scripts/generate-release-notes.js --version 1.2.3 --output CHANGELOG.md
 *   node scripts/generate-release-notes.js --from-config
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const ROOT_DIR = path.join(__dirname, '..');
const VERSION_CONFIG = path.join(ROOT_DIR, 'version.config.json');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');
const RELEASE_NOTES_PATH = path.join(ROOT_DIR, 'RELEASE_NOTES.md');

const COMMIT_TYPE_CONFIG = {
  feat: { label: '✨ Features', priority: 1, include: true },
  fix: { label: '🐛 Bug Fixes', priority: 2, include: true },
  perf: { label: '⚡ Performance', priority: 3, include: true },
  refactor: { label: '♻️ Refactoring', priority: 4, include: true },
  docs: { label: '📚 Documentation', priority: 5, include: true },
  style: { label: '💄 Style', priority: 6, include: false },
  test: { label: '✅ Tests', priority: 7, include: false },
  build: { label: '📦 Build', priority: 8, include: true },
  ci: { label: '👷 CI/CD', priority: 9, include: false },
  chore: { label: '🔧 Chores', priority: 10, include: false },
  revert: { label: '⏪ Reverted', priority: 11, include: true },
  deps: { label: '📦 Dependencies', priority: 12, include: true }
};

// Colors for console
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logSuccess(msg) { log(`✓ ${msg}`, 'green'); }
function logWarning(msg) { log(`⚠ ${msg}`, 'yellow'); }
function logError(msg) { log(`✗ ${msg}`, 'red'); }

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date = new Date()) {
  return date.toISOString();
}

function exec(cmd, fallback = null) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════
// Git Operations
// ═══════════════════════════════════════════════════════════════

function getLastTag() {
  return exec('git describe --tags --abbrev=0 2>/dev/null');
}

function getCommitsSinceTag(tag = null) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const commits = exec(
    `git log ${range} --pretty=format:"%H|%s|%b|%an|%ae|%ad" --date=short`
  );

  if (!commits) return [];
  return commits.split('\n').filter(Boolean);
}

function parseCommit(commitLine) {
  if (!commitLine || typeof commitLine !== 'string') {
    return null;
  }

  const parts = commitLine.split('|');
  const hash = parts[0] || '';
  const subject = parts[1] || '';
  const body = parts[2] || '';
  const author = parts[3] || '';
  const email = parts[4] || '';
  const date = parts[5] || '';

  // Skip if no subject
  if (!subject.trim()) {
    return null;
  }

  // Parse conventional commit format: type(scope)!: description
  const typeMatch = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);

  if (!typeMatch) {
    return {
      hash: hash.trim().substring(0, 7),
      type: null,
      scope: null,
      description: subject.trim(),
      body: body.trim(),
      author: author.trim(),
      email: email.trim(),
      date: date.trim(),
      isBreaking: false,
      breakingChange: null
    };
  }

  const [, type, scope, breaking, description] = typeMatch;

  // Check for BREAKING CHANGE in body
  const breakingMatch = body?.match(/BREAKING CHANGE[:\s]+(.+?)(?:\n|$)/i);

  return {
    hash: hash.trim().substring(0, 7),
    type: type?.toLowerCase() || null,
    scope: scope?.trim() || null,
    description: description?.trim() || subject.trim(),
    body: body.trim(),
    author: author.trim(),
    email: email.trim(),
    date: date.trim(),
    isBreaking: breaking === '!' || !!breakingMatch,
    breakingChange: breakingMatch?.[1]?.trim() || null
  };
}

function groupCommitsByType(commits) {
  const groups = {};
  const breakingChanges = [];

  for (const commitLine of commits) {
    const commit = parseCommit(commitLine);

    // Skip invalid commits
    if (!commit) continue;

    if (commit.isBreaking) {
      breakingChanges.push(commit);
    }

    if (commit.type && COMMIT_TYPE_CONFIG[commit.type]) {
      if (!groups[commit.type]) {
        groups[commit.type] = [];
      }
      groups[commit.type].push(commit);
    }
  }

  return { groups, breakingChanges };
}

// ═══════════════════════════════════════════════════════════════
// Release Notes Generation
// ═══════════════════════════════════════════════════════════════

function formatCommitLine(commit, options = {}) {
  const { includeHash = true, includeAuthor = false } = options;

  let line = '- ';

  // Add scope if present
  if (commit.scope) {
    line += `**${commit.scope}**: `;
  }

  // Add description
  line += commit.description;

  // Add hash
  if (includeHash && commit.hash) {
    line += ` (\`${commit.hash}\`)`;
  }

  // Add author
  if (includeAuthor && commit.author) {
    line += ` - @${commit.author}`;
  }

  return line;
}

function generateReleaseNotes(version, commits, options = {}) {
  const { groups, breakingChanges } = groupCommitsByType(commits);
  const today = formatDate();
  const timestamp = formatDateTime();

  let notes = `## [${version}] - ${today}\n\n`;
  notes += `> Released: ${timestamp}\n\n`;

  // Breaking changes first (highest priority)
  if (breakingChanges.length > 0) {
    notes += `### ⚠️ BREAKING CHANGES\n\n`;
    for (const commit of breakingChanges) {
      notes += formatCommitLine(commit, options) + '\n';
      if (commit.breakingChange) {
        notes += `  > ${commit.breakingChange}\n`;
      }
    }
    notes += '\n';
  }

  // Sort types by priority
  const sortedTypes = Object.entries(groups)
    .filter(([type]) => COMMIT_TYPE_CONFIG[type]?.include)
    .sort((a, b) => {
      const priorityA = COMMIT_TYPE_CONFIG[a[0]]?.priority || 99;
      const priorityB = COMMIT_TYPE_CONFIG[b[0]]?.priority || 99;
      return priorityA - priorityB;
    });

  // Add each type section
  for (const [type, typeCommits] of sortedTypes) {
    const config = COMMIT_TYPE_CONFIG[type];
    if (!config) continue;

    notes += `### ${config.label}\n\n`;

    for (const commit of typeCommits) {
      notes += formatCommitLine(commit, options) + '\n';
    }

    notes += '\n';
  }

  // If no notable changes
  if (sortedTypes.length === 0 && breakingChanges.length === 0) {
    notes += `### Changes\n\n`;
    notes += `- Release ${version}\n\n`;
  }

  return notes;
}

// ═══════════════════════════════════════════════════════════════
// File Operations
// ═══════════════════════════════════════════════════════════════

function updateChangelog(version, releaseNotes) {
  let changelog = '';

  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } else {
    changelog = `# Changelog

All notable changes to OSI Cards will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

`;
  }

  // Check if version already exists
  if (changelog.includes(`## [${version}]`)) {
    logWarning(`Version ${version} already exists in CHANGELOG.md`);
    return false;
  }

  // Insert after [Unreleased]
  if (changelog.includes('## [Unreleased]')) {
    // Find the [Unreleased] section and its content
    const unreleasedMatch = changelog.match(/(## \[Unreleased\][\s\S]*?)(?=## \[|$)/);

    if (unreleasedMatch) {
      // Replace the unreleased section with fresh one + new version
      changelog = changelog.replace(
        unreleasedMatch[0],
        `## [Unreleased]\n\n### Added\n- TBD\n\n${releaseNotes}`
      );
    }
  } else {
    // Prepend to changelog
    const header = `# Changelog\n\n`;
    changelog = `${header}## [Unreleased]\n\n### Added\n- TBD\n\n${releaseNotes}${changelog.replace(/^# Changelog\s*\n*/, '')}`;
  }

  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf8');
  return true;
}

function writeReleaseNotes(version, releaseNotes) {
  const content = `# Release Notes - v${version}

${releaseNotes}

---

## Installation

\`\`\`bash
npm install osi-cards-lib@${version}
\`\`\`

## Links

- [Full Changelog](./CHANGELOG.md)
- [npm Package](https://www.npmjs.com/package/osi-cards-lib)
- [GitHub Releases](https://github.com/Inutilepat83/OSI-Cards/releases)
`;

  fs.writeFileSync(RELEASE_NOTES_PATH, content, 'utf8');
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

function main() {
  console.log(`\n${c.bright}📝 OSI Cards Release Notes Generator${c.reset}\n`);

  // Parse arguments
  const args = process.argv.slice(2);
  let version = null;
  let fromConfig = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) {
      version = args[i + 1];
      i++;
    } else if (args[i] === '--from-config') {
      fromConfig = true;
    }
  }

  // Get version from config if not provided
  if (!version && fromConfig && fs.existsSync(VERSION_CONFIG)) {
    const config = JSON.parse(fs.readFileSync(VERSION_CONFIG, 'utf8'));
    version = config.version;
  }

  if (!version) {
    logError('Version is required');
    console.log(`\n${c.cyan}Usage:${c.reset}`);
    console.log('  node scripts/generate-release-notes.js --version 1.2.3');
    console.log('  node scripts/generate-release-notes.js --from-config');
    process.exit(1);
  }

  log(`Version: ${c.green}${version}${c.reset}`);

  // Get commits since last tag
  const lastTag = getLastTag();
  log(`Last tag: ${lastTag || 'none'}`);

  const commits = getCommitsSinceTag(lastTag);
  log(`Commits found: ${commits.length}`);

  // Generate release notes
  const releaseNotes = generateReleaseNotes(version, commits, {
    includeHash: true,
    includeAuthor: false
  });

  // Update CHANGELOG.md
  if (updateChangelog(version, releaseNotes)) {
    logSuccess(`Updated CHANGELOG.md`);
  }

  // Write RELEASE_NOTES.md
  writeReleaseNotes(version, releaseNotes);
  logSuccess(`Generated RELEASE_NOTES.md`);

  // Preview
  console.log(`\n${c.cyan}━━━ Release Notes Preview ━━━${c.reset}\n`);
  console.log(releaseNotes);

  console.log(`${c.green}✅ Release notes generated successfully!${c.reset}\n`);
}

// Run
if (require.main === module) {
  main();
}

module.exports = { generateReleaseNotes, updateChangelog };
