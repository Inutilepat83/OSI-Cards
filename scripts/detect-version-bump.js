#!/usr/bin/env node

/**
 * Detect Version Bump from Conventional Commits
 * 
 * Analyzes git commit messages to determine the appropriate semantic version bump
 * based on Conventional Commits specification (https://www.conventionalcommits.org/)
 * 
 * Outputs:
 * - version-type: 'major', 'minor', 'patch', or 'none'
 * - should-release: 'true' or 'false'
 * - new-version: the new version string (if applicable)
 * - has-changes: 'true' if there are commits to analyze
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BREAKING_CHANGE_PATTERNS = [
  /^BREAKING CHANGE:/,
  /^BREAKING:/,
  /^!:/,
  /^.*!:/,
  /(^|\n)BREAKING CHANGE:/,
  /(^|\n)BREAKING:/
];

const COMMIT_TYPES = {
  major: ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'ci', 'chore'],
  minor: ['feat'],
  patch: ['fix', 'perf', 'refactor']
};

/**
 * Get commits since last tag or base branch
 */
function getCommits() {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME || 'push';
    const ref = process.env.GITHUB_REF || 'refs/heads/main';
    const baseRef = process.env.GITHUB_BASE_REF || null;
    
    let sinceRef;
    
    if (eventName === 'pull_request' && baseRef) {
      sinceRef = baseRef;
    } else {
      // Get last tag
      try {
        sinceRef = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      } catch {
        // No tags exist, get all commits
        sinceRef = 'HEAD';
      }
    }
    
    // Get commits since last tag/base
    const commits = execSync(`git log ${sinceRef}..HEAD --pretty=format:"%H|%s|%b"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }).trim();
    
    return commits ? commits.split('\n').filter(Boolean) : [];
  } catch (error) {
    console.warn('Error getting commits:', error.message);
    return [];
  }
}

/**
 * Parse commit message to extract type and breaking change info
 */
function parseCommit(commitLine) {
  const [hash, subject, ...bodyParts] = commitLine.split('|');
  const body = bodyParts.join('|');
  const fullMessage = `${subject}\n${body}`;
  
  // Check for breaking change indicators
  const isBreaking = BREAKING_CHANGE_PATTERNS.some(pattern => 
    pattern.test(fullMessage)
  );
  
  // Extract commit type (feat:, fix:, etc.)
  const typeMatch = subject.match(/^(\w+)(\(.+\))?(!)?:/);
  const type = typeMatch ? typeMatch[1] : null;
  const hasBreakingIndicator = typeMatch && typeMatch[3] === '!';
  
  return {
    hash: hash?.trim(),
    type,
    subject: subject?.trim(),
    body: body?.trim(),
    isBreaking: isBreaking || hasBreakingIndicator,
    fullMessage
  };
}

/**
 * Determine version bump type from commits
 */
function detectVersionBump(commits) {
  if (!commits || commits.length === 0) {
    return {
      type: 'none',
      shouldRelease: false,
      reason: 'No new commits'
    };
  }
  
  let hasMajor = false;
  let hasMinor = false;
  let hasPatch = false;
  
  for (const commitLine of commits) {
    const commit = parseCommit(commitLine);
    
    if (commit.isBreaking) {
      hasMajor = true;
    } else if (commit.type === 'feat') {
      hasMinor = true;
    } else if (commit.type === 'fix' || commit.type === 'perf') {
      hasPatch = true;
    } else if (commit.type) {
      // Other commit types don't trigger version bumps
      // but we track them for completeness
    }
  }
  
  // Determine version type
  let versionType = 'none';
  if (hasMajor) {
    versionType = 'major';
  } else if (hasMinor) {
    versionType = 'minor';
  } else if (hasPatch) {
    versionType = 'patch';
  }
  
  return {
    type: versionType,
    shouldRelease: versionType !== 'none',
    reason: versionType === 'none' 
      ? 'No version-bumping commits found'
      : `Found ${versionType} changes`
  };
}

/**
 * Calculate new version
 */
function calculateNewVersion(versionType) {
  if (versionType === 'none') {
    return null;
  }
  
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Parse current version
    const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?/);
    if (!match) {
      throw new Error(`Invalid version format: ${currentVersion}`);
    }
    
    let [major, minor, patch] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    
    // Bump version
    switch (versionType) {
      case 'major':
        major += 1;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor += 1;
        patch = 0;
        break;
      case 'patch':
        patch += 1;
        break;
    }
    
    return `${major}.${minor}.${patch}`;
  } catch (error) {
    console.error('Error calculating new version:', error.message);
    return null;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analyzing commits for version bump...\n');
  
  // Get commits
  const commits = getCommits();
  console.log(`Found ${commits.length} commit(s) to analyze\n`);
  
  // Detect version bump
  const result = commits.length === 0 
    ? { type: 'none', shouldRelease: false, reason: 'No new commits', hasChanges: false }
    : detectVersionBump(commits);
    
  result.hasChanges = commits.length > 0;
  const newVersion = result.type !== 'none' ? calculateNewVersion(result.type) : null;
  
  console.log(`Version bump type: ${result.type}`);
  console.log(`Reason: ${result.reason}`);
  if (newVersion) {
    console.log(`New version: ${newVersion}`);
  }
  console.log(`Should release: ${result.shouldRelease}\n`);
  
  // Output for GitHub Actions using modern format
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    const output = [
      `version-type=${result.type}`,
      `should-release=${result.shouldRelease}`,
      `new-version=${newVersion || ''}`,
      `has-changes=${result.hasChanges}`
    ].join('\n') + '\n';
    
    fs.appendFileSync(githubOutput, output, 'utf8');
    console.log('✓ Output written to GITHUB_OUTPUT');
  } else {
    console.log('⚠️  GITHUB_OUTPUT not set, outputting to console:');
    console.log(`version-type=${result.type}`);
    console.log(`should-release=${result.shouldRelease}`);
    console.log(`new-version=${newVersion || ''}`);
    console.log(`has-changes=${result.hasChanges}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { detectVersionBump, parseCommit, getCommits };

