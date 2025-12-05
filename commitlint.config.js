/**
 * Commitlint Configuration
 * 
 * Enforces conventional commits format for better changelog generation
 * and semantic versioning.
 * 
 * Format: <type>(<scope>): <subject>
 * 
 * Types:
 * - feat: A new feature
 * - fix: A bug fix
 * - docs: Documentation changes
 * - style: Code style changes (formatting, semicolons, etc.)
 * - refactor: Code refactoring without feature/fix
 * - perf: Performance improvements
 * - test: Adding or updating tests
 * - build: Build system or dependencies changes
 * - ci: CI/CD configuration changes
 * - chore: Other changes (maintenance)
 * - revert: Revert a previous commit
 * 
 * Scopes (optional):
 * - core: Core library changes
 * - components: Component changes
 * - sections: Section component changes
 * - services: Service changes
 * - styles: Style changes
 * - docs: Documentation
 * - tests: Test changes
 * - deps: Dependency updates
 * 
 * @example
 * feat(sections): add new chart section type
 * fix(streaming): resolve memory leak in buffer
 * docs: update theming guide
 * refactor(core): extract constants to separate file
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the allowed values
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style (formatting)
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Maintenance
        'revert',   // Revert commit
      ],
    ],
    
    // Type is required
    'type-empty': [2, 'never'],
    
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    
    // Subject is required
    'subject-empty': [2, 'never'],
    
    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],
    
    // Subject should be sentence-case or lower-case
    'subject-case': [
      2,
      'always',
      ['sentence-case', 'lower-case', 'start-case'],
    ],
    
    // Subject max length
    'subject-max-length': [2, 'always', 100],
    
    // Scope should be lowercase
    'scope-case': [2, 'always', 'lower-case'],
    
    // Scope should be one of allowed values (optional)
    'scope-enum': [
      1, // Warning only, not error
      'always',
      [
        'core',
        'components',
        'sections',
        'services',
        'styles',
        'docs',
        'tests',
        'deps',
        'models',
        'utils',
        'themes',
        'streaming',
        'layout',
        'animation',
        'a11y',
        'i18n',
        'types',
        'factories',
        'constants',
        'errors',
        'events',
        'icons',
        'presets',
        'providers',
        'directives',
        'decorators',
      ],
    ],
    
    // Header max length (type + scope + subject)
    'header-max-length': [2, 'always', 120],
    
    // Body max line length
    'body-max-line-length': [2, 'always', 200],
    
    // Footer max line length
    'footer-max-line-length': [2, 'always', 200],
    
    // Body should be preceded by blank line
    'body-leading-blank': [2, 'always'],
    
    // Footer should be preceded by blank line
    'footer-leading-blank': [2, 'always'],
  },
  
  // Help text displayed on validation failure
  helpUrl: 'https://www.conventionalcommits.org/',
  
  // Prompt configuration for interactive commit
  prompt: {
    questions: {
      type: {
        description: "Select the type of change you're committing",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Changes that do not affect code meaning (formatting)',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'Code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: 'Changes that affect build system or dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'Changes to CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g., component or file name)',
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Describe the breaking change',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'If issues are closed, describe the impact',
      },
      issues: {
        description: 'Add issue references (e.g., "fix #123", "re #123")',
      },
    },
  },
};










