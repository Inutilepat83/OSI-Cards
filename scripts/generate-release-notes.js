#!/usr/bin/env node

/**
 * Generate Release Notes from Conventional Commits
 * 
 * Generates release notes/changelog entries based on git commits
 * following the Conventional Commits specification.
 * 
 * Usage:
 *   node scripts/generate-release-notes.js --version 1.2.3 --output CHANGELOG.md
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMIT_TYPE_LABELS = {
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Performance',
  refactor: 'Refactored',
  docs: 'Documentation',
  style: 'Style',
  test: 'Tests',
  build: 'Build',
  ci: 'CI/CD',
  chore: 'Chores',
  revert: 'Reverted'
};

/**
 * Get commits since last tag
 */
function getCommitsSinceLastTag() {
  try {
    // Get last tag
    let sinceRef;
    try {
      sinceRef = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch {
      // No tags exist, get all commits
      sinceRef = null;
    }
    
    // Get commits
    const range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
    const commits = execSync(
      `git log ${range} --pretty=format:"%H|%s|%b|%an|%ae|%ad" --date=short`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
    ).trim();
    
    return commits ? commits.split('\n').filter(Boolean) : [];
  } catch (error) {
    console.error('Error getting commits:', error.message);
    return [];
  }
}

/**
 * Parse commit message
 */
function parseCommit(commitLine) {
  const parts = commitLine.split('|');
  const [hash, subject, body, author, email, date] = parts;
  
  // Extract type and scope
  const typeMatch = subject.match(/^(\w+)(?:\((.+)\))?(!)?:/);
  const type = typeMatch ? typeMatch[1] : null;
  const scope = typeMatch ? typeMatch[2] : null;
  const isBreaking = typeMatch && typeMatch[3] === '!';
  
  // Extract description
  const description = subject.replace(/^[\w()!]+:\s*/, '').trim();
  
  // Check for breaking change in body
  const breakingChangeMatch = body.match(/(?:^|\n)BREAKING CHANGE[:\s]+(.+?)(?:\n|$)/);
  const breakingChange = breakingChangeMatch ? breakingChangeMatch[1].trim() : null;
  
  return {
    hash: hash?.trim(),
    type,
    scope,
    description,
    body: body?.trim(),
    author: author?.trim(),
    email: email?.trim(),
    date: date?.trim(),
    isBreaking: isBreaking || !!breakingChange,
    breakingChange
  };
}

/**
 * Group commits by type
 */
function groupCommitsByType(commits) {
  const groups = {};
  const breakingChanges = [];
  
  for (const commitLine of commits) {
    const commit = parseCommit(commitLine);
    
    if (commit.isBreaking) {
      breakingChanges.push(commit);
    }
    
    if (commit.type) {
      if (!groups[commit.type]) {
        groups[commit.type] = [];
      }
      groups[commit.type].push(commit);
    }
  }
  
  return { groups, breakingChanges };
}

/**
 * Format commit description for changelog
 */
function formatCommitDescription(commit) {
  let description = commit.description;
  
  // Add scope if present
  if (commit.scope) {
    description = `**${commit.scope}**: ${description}`;
  }
  
  return description;
}

/**
 * Generate release notes
 */
function generateReleaseNotes(version, commits) {
  const { groups, breakingChanges } = groupCommitsByType(commits);
  const today = new Date().toISOString().split('T')[0];
  
  let notes = `## [${version}] - ${today}\n\n`;
  
  // Breaking changes first
  if (breakingChanges.length > 0) {
    notes += `### ⚠️ Breaking Changes\n\n`;
    for (const commit of breakingChanges) {
      notes += `- ${formatCommitDescription(commit)}\n`;
      if (commit.breakingChange) {
        notes += `  \n  **Note:** ${commit.breakingChange}\n\n`;
      }
    }
    notes += '\n';
  }
  
  // Grouped by type
  for (const [type, typeCommits] of Object.entries(groups)) {
    const label = COMMIT_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
    notes += `### ${label}\n\n`;
    
    for (const commit of typeCommits) {
      notes += `- ${formatCommitDescription(commit)}\n`;
    }
    
    notes += '\n';
  }
  
  return notes;
}

/**
 * Update changelog file
 */
function updateChangelog(version, outputPath) {
  const changelogPath = path.join(__dirname, '..', outputPath || 'CHANGELOG.md');
  let changelog = '';
  
  // Read existing changelog
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, 'utf8');
  } else {
    changelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
  }
  
  // Get commits
  const commits = getCommitsSinceLastTag();
  
  if (commits.length === 0) {
    console.log('No new commits found. Creating placeholder entry.');
    const today = new Date().toISOString().split('T')[0];
    const placeholder = `## [${version}] - ${today}\n\n### Added\n- Release ${version}\n\n`;
    
    if (changelog.includes('## [Unreleased]')) {
      changelog = changelog.replace('## [Unreleased]', placeholder + '## [Unreleased]');
    } else {
      changelog = changelog + '\n' + placeholder;
    }
  } else {
    // Generate release notes
    const releaseNotes = generateReleaseNotes(version, commits);
    
    // Insert after "## [Unreleased]" or at the beginning
    if (changelog.includes('## [Unreleased]')) {
      changelog = changelog.replace('## [Unreleased]', `## [Unreleased]\n\n${releaseNotes}`);
    } else {
      changelog = `# Changelog\n\n${releaseNotes}\n${changelog.replace(/^# Changelog\n\n/, '')}`;
    }
  }
  
  // Write changelog
  fs.writeFileSync(changelogPath, changelog, 'utf8');
  console.log(`✓ Updated ${changelogPath}`);
  
  // Output release notes for GitHub release
  const releaseNotesOnly = generateReleaseNotes(version, commits);
  const releaseNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');
  fs.writeFileSync(releaseNotesPath, releaseNotesOnly, 'utf8');
  console.log(`✓ Generated release notes: ${releaseNotesPath}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    version: null,
    output: 'CHANGELOG.md'
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) {
      options.version = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    }
  }
  
  return options;
}

/**
 * Main function
 */
function main() {
  const options = parseArgs();
  
  if (!options.version) {
    console.error('Error: --version is required');
    console.log('Usage: node scripts/generate-release-notes.js --version 1.2.3 [--output CHANGELOG.md]');
    process.exit(1);
  }
  
  console.log(`📝 Generating release notes for version ${options.version}...\n`);
  updateChangelog(options.version, options.output);
  console.log('\n✅ Release notes generated successfully!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateReleaseNotes, updateChangelog };

