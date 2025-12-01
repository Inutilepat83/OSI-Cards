/**
 * Semantic Release Configuration (Point 91)
 * 
 * Automates versioning and changelog generation based on conventional commits.
 * 
 * Commit Types:
 * - feat: Minor version bump
 * - fix: Patch version bump
 * - perf: Patch version bump
 * - BREAKING CHANGE: Major version bump
 * 
 * Usage:
 * - npm run release:dry-run (preview release)
 * - npm run release (actual release)
 */

module.exports = {
  branches: [
    'main',
    { name: 'next', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  
  plugins: [
    // Analyze commits to determine version bump
    ['@semantic-release/commit-analyzer', {
      preset: 'angular',
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { type: 'docs', scope: 'README', release: 'patch' },
        { type: 'style', release: false },
        { type: 'test', release: false },
        { type: 'ci', release: false },
        { type: 'chore', release: false },
        { breaking: true, release: 'major' }
      ],
      parserOpts: {
        noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
      }
    }],
    
    // Generate release notes
    ['@semantic-release/release-notes-generator', {
      preset: 'angular',
      writerOpts: {
        groupBy: 'type',
        commitGroupsSort: ['feat', 'fix', 'perf', 'refactor', 'docs'],
        commitsSort: ['scope', 'subject']
      },
      presetConfig: {
        types: [
          { type: 'feat', section: '✨ Features' },
          { type: 'fix', section: '🐛 Bug Fixes' },
          { type: 'perf', section: '⚡ Performance' },
          { type: 'refactor', section: '♻️ Refactoring' },
          { type: 'docs', section: '📚 Documentation' },
          { type: 'test', section: '✅ Tests', hidden: true },
          { type: 'ci', section: '🔧 CI/CD', hidden: true },
          { type: 'chore', section: '🔨 Maintenance', hidden: true }
        ]
      }
    }],
    
    // Update CHANGELOG.md
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Changelog\n\nAll notable changes to OSI Cards will be documented in this file.\n\nThis project adheres to [Semantic Versioning](https://semver.org/).'
    }],
    
    // Update package.json version
    ['@semantic-release/npm', {
      npmPublish: false, // Don't publish to npm (library is internal)
      pkgRoot: 'dist/osi-cards-lib'
    }],
    
    // Commit version changes
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    
    // Create GitHub release
    ['@semantic-release/github', {
      assets: [
        { path: 'dist/osi-cards-lib/**/*', label: 'OSI Cards Library' },
        { path: 'docs/**/*', label: 'Documentation' }
      ],
      successComment: '🎉 This PR is included in version ${nextRelease.version}',
      failComment: '❌ The release from branch ${branch.name} failed'
    }]
  ],
  
  // Tag format
  tagFormat: 'v${version}',
  
  // Prepare hook - run before release
  prepare: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ],
  
  // Success hook - run after successful release
  success: [
    '@semantic-release/github'
  ],
  
  // Fail hook - run on failure
  fail: [
    '@semantic-release/github'
  ]
};

