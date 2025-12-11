#!/usr/bin/env node
/**
 * Generate Release Notes
 *
 * Automatically generates release notes from git commits.
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s|||%b|||%an"`)
      .toString()
      .split('\n')
      .filter(Boolean);

    return commits.map(commit => {
      const [subject, body, author] = commit.split('|||');
      return { subject, body, author };
    });
  } catch {
    // No previous tag
    return [];
  }
}

function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    performance: [],
    docs: [],
    breaking: [],
    other: [],
  };

  commits.forEach(commit => {
    const subject = commit.subject;

    if (subject.startsWith('feat')) {
      categories.features.push(subject.replace(/^feat(\([^)]+\))?:\s*/, ''));
    } else if (subject.startsWith('fix')) {
      categories.fixes.push(subject.replace(/^fix(\([^)]+\))?:\s*/, ''));
    } else if (subject.startsWith('perf')) {
      categories.performance.push(subject.replace(/^perf(\([^)]+\))?:\s*/, ''));
    } else if (subject.startsWith('docs')) {
      categories.docs.push(subject.replace(/^docs(\([^)]+\))?:\s*/, ''));
    } else {
      categories.other.push(subject);
    }

    if (subject.includes('!') || commit.body?.includes('BREAKING CHANGE')) {
      categories.breaking.push({
        title: subject,
        description: commit.body || '',
      });
    }
  });

  return categories;
}

function generateReleaseNotes() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  const commits = getCommitsSinceLastTag();
  const categories = categorizeCommits(commits);

  let notes = `# Release v${version}\n\n`;
  notes += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  notes += '---\n\n';

  if (categories.features.length > 0) {
    notes += '## ✨ Features\n\n';
    categories.features.forEach(feat => {
      notes += `- ${feat}\n`;
    });
    notes += '\n';
  }

  if (categories.fixes.length > 0) {
    notes += '## 🐛 Bug Fixes\n\n';
    categories.fixes.forEach(fix => {
      notes += `- ${fix}\n`;
    });
    notes += '\n';
  }

  if (categories.performance.length > 0) {
    notes += '## ⚡ Performance\n\n';
    categories.performance.forEach(perf => {
      notes += `- ${perf}\n`;
    });
    notes += '\n';
  }

  if (categories.docs.length > 0) {
    notes += '## 📝 Documentation\n\n';
    categories.docs.forEach(doc => {
      notes += `- ${doc}\n`;
    });
    notes += '\n';
  }

  if (categories.breaking.length > 0) {
    notes += '## ⚠️ BREAKING CHANGES\n\n';
    categories.breaking.forEach(breaking => {
      notes += `- **${breaking.title}**\n`;
      if (breaking.description) {
        notes += `  ${breaking.description}\n`;
      }
    });
    notes += '\n';
  }

  notes += '---\n\n';
  notes += `**Full Changelog**: https://github.com/your-org/osi-cards/compare/v${version}\n`;

  return notes;
}

// Generate and output
const notes = generateReleaseNotes();
console.log(notes);

// Optionally write to file
if (process.argv.includes('--write')) {
  fs.writeFileSync('RELEASE_NOTES.md', notes);
  console.log('\n✅ Release notes written to RELEASE_NOTES.md');
}

