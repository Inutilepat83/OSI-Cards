/**
 * Stryker Mutation Testing Configuration (Improvement Plan Point #14)
 * 
 * Configuration for mutation testing to ensure test quality.
 * Target: 70% mutation score
 * 
 * Run with: npx stryker run
 * 
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  // Project type
  packageManager: 'npm',
  
  // Files to mutate
  mutate: [
    'projects/osi-cards-lib/src/lib/**/*.ts',
    '!projects/osi-cards-lib/src/lib/**/*.spec.ts',
    '!projects/osi-cards-lib/src/lib/**/*.mock.ts',
    '!projects/osi-cards-lib/src/lib/**/*.stories.ts',
    '!projects/osi-cards-lib/src/lib/**/index.ts',
    '!projects/osi-cards-lib/src/lib/**/*.generated.ts',
    '!projects/osi-cards-lib/src/lib/testing/**/*.ts',
    '!projects/osi-cards-lib/src/lib/workers/*.ts'
  ],
  
  // Test runner configuration
  testRunner: 'karma',
  karma: {
    projectType: 'angular-cli',
    configFile: 'karma.conf.js',
    config: {
      browsers: ['ChromeHeadless']
    }
  },
  
  // Reporters
  reporters: [
    'html',
    'clear-text',
    'progress',
    'dashboard'
  ],
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html'
  },
  
  // Mutation score thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Mutator configuration
  mutator: {
    excludedMutations: [
      // Skip string mutations in templates/messages
      'StringLiteral',
      // Skip mutations that cause infinite loops
      'UpdateOperator'
    ]
  },
  
  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Concurrency
  concurrency: 4,
  
  // Timeouts
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  
  // Dashboard integration (optional)
  dashboard: {
    project: 'github.com/Inutilepat83/OSI-Cards',
    version: process.env.BRANCH_NAME || 'main',
    module: 'osi-cards-lib'
  },
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules',
    'dist',
    'e2e',
    'coverage',
    'reports'
  ],
  
  // Temp directory
  tempDirName: '.stryker-tmp',
  
  // Clean temp files
  cleanTempDir: true,
  
  // Incremental mode for faster reruns
  incremental: true,
  incrementalFile: '.stryker-incremental.json',
  
  // Plugins
  plugins: [
    '@stryker-mutator/karma-runner',
    '@stryker-mutator/typescript-checker'
  ],
  
  // TypeScript checker
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.spec.json',
  
  // Warnings
  warnings: true,
  
  // Log level
  logLevel: 'info',
  
  // File log level
  fileLogLevel: 'trace'
};

