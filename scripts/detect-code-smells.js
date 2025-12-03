#!/usr/bin/env node

/**
 * Code Smell Detection Script
 * Identifies potential code quality issues and anti-patterns
 */

const fs = require('fs');
const path = require('path');

/**
 * Code smells to detect
 */
const CODE_SMELLS = {
  // Long methods
  longMethod: {
    pattern: /(?:function|method)\s+\w+[^{]*{[\s\S]{2000,}?}/g,
    severity: 'high',
    message: 'Method is too long (>2000 characters)',
  },

  // God classes (many responsibilities)
  godClass: {
    pattern: /class\s+\w+\s+{[\s\S]{5000,}?}/g,
    severity: 'high',
    message: 'Class is too large (>5000 characters)',
  },

  // TODO/FIXME comments
  todoComments: {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)[\s:]/gi,
    severity: 'low',
    message: 'TODO comment found',
  },

  // console.log (should use logger)
  consoleLog: {
    pattern: /console\.log\(/g,
    severity: 'medium',
    message: 'console.log found (use logger instead)',
  },

  // Commented out code
  commentedCode: {
    pattern: /\/\/\s*(const|let|var|function|class|if|for|while)\s+/g,
    severity: 'medium',
    message: 'Commented out code found',
  },

  // Magic numbers
  magicNumbers: {
    pattern: /(?<![.\w])[0-9]{4,}(?![.\w])/g,
    severity: 'low',
    message: 'Magic number found (consider extracting to constant)',
  },

  // Long parameter lists
  longParams: {
    pattern: /\([^)]{150,}\)/g,
    severity: 'medium',
    message: 'Long parameter list (consider options object)',
  },

  // Nested callbacks (callback hell)
  callbackHell: {
    pattern: /{\s*\w+\([^{]*{\s*\w+\([^{]*{\s*\w+\(/g,
    severity: 'high',
    message: 'Deeply nested callbacks (consider async/await)',
  },

  // Any type usage
  anyType: {
    pattern: /:\s*any(?![a-zA-Z])/g,
    severity: 'medium',
    message: 'Explicit any type (reduce type safety)',
  },

  // Non-null assertions
  nonNullAssertion: {
    pattern: /!\.|\!\[/g,
    severity: 'low',
    message: 'Non-null assertion (potential runtime error)',
  },

  // Empty catch blocks
  emptyCatch: {
    pattern: /catch\s*\([^)]*\)\s*{\s*}/g,
    severity: 'high',
    message: 'Empty catch block (swallows errors)',
  },

  // Disabled ESLint rules
  disabledLint: {
    pattern: /eslint-disable/g,
    severity: 'medium',
    message: 'ESLint rule disabled',
  },

  // Large if-else chains
  largeIfElse: {
    pattern: /if\s*\([^)]+\)\s*{[^}]*}\s*else\s*if\s*\([^)]+\)\s*{[^}]*}\s*else\s*if/g,
    severity: 'medium',
    message: 'Large if-else chain (consider switch or strategy pattern)',
  },

  // Duplicate string literals
  duplicateStrings: {
    pattern: /'([^']{15,})'/g,
    severity: 'low',
    message: 'Duplicate string literal (consider constant)',
  },
};

// Results
const results = {
  files: 0,
  smells: {},
  summary: {
    high: 0,
    medium: 0,
    low: 0,
  },
};

// Initialize smell counters
Object.keys(CODE_SMELLS).forEach((smell) => {
  results.smells[smell] = [];
});

/**
 * Main function
 */
function detectCodeSmells() {
  console.log('🔍 Detecting Code Smells...\n');

  const srcDirs = ['src/app', 'projects/osi-cards-lib/src'];

  srcDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      scanDirectory(fullPath);
    }
  });

  generateReport();
}

/**
 * Scan directory recursively
 */
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldSkip(item)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile() && item.endsWith('.ts') && !shouldSkip(item)) {
      scanFile(fullPath);
    }
  });
}

/**
 * Check if path should be skipped
 */
function shouldSkip(name) {
  const skipPatterns = ['node_modules', 'dist', '.spec.ts', '.stories.ts', 'testing', 'mocks'];
  return skipPatterns.some((pattern) => name.includes(pattern));
}

/**
 * Scan file for code smells
 */
function scanFile(filePath) {
  results.files++;

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check each code smell
  Object.entries(CODE_SMELLS).forEach(([smellName, smellConfig]) => {
    const matches = content.match(smellConfig.pattern);

    if (matches) {
      matches.forEach((match) => {
        const lineNumber = getLineNumber(content, match);

        results.smells[smellName].push({
          file: relativePath,
          line: lineNumber,
          excerpt: truncate(match, 80),
          severity: smellConfig.severity,
          message: smellConfig.message,
        });

        // Update summary
        results.summary[smellConfig.severity]++;
      });
    }
  });
}

/**
 * Get line number of match in content
 */
function getLineNumber(content, match) {
  const index = content.indexOf(match);
  if (index === -1) return 0;

  const before = content.substring(0, index);
  return before.split('\n').length;
}

/**
 * Truncate string
 */
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Generate report
 */
function generateReport() {
  console.log('📊 Code Smell Detection Report\n');
  console.log('='.repeat(80));

  console.log(`\n📁 Files Scanned: ${results.files}\n`);

  // Summary
  console.log('📈 Summary:');
  console.log(`   🔴 High Severity: ${results.summary.high}`);
  console.log(`   🟡 Medium Severity: ${results.summary.medium}`);
  console.log(`   ⚪ Low Severity: ${results.summary.low}`);
  console.log(`   📊 Total Smells: ${results.summary.high + results.summary.medium + results.summary.low}\n`);

  // Detailed smells
  const sortedSmells = Object.entries(results.smells)
    .filter(([_, occurrences]) => occurrences.length > 0)
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      const aSeverity = CODE_SMELLS[a[0]].severity;
      const bSeverity = CODE_SMELLS[b[0]].severity;
      return severityOrder[aSeverity] - severityOrder[bSeverity];
    });

  sortedSmells.forEach(([smellName, occurrences]) => {
    const config = CODE_SMELLS[smellName];
    const icon = config.severity === 'high' ? '🔴' : config.severity === 'medium' ? '🟡' : '⚪';

    console.log(`${icon} ${smellName} (${occurrences.length} occurrences)`);
    console.log(`   ${config.message}\n`);

    if (occurrences.length <= 10) {
      occurrences.forEach((occurrence) => {
        console.log(`   ${occurrence.file}:${occurrence.line}`);
        console.log(`   → ${occurrence.excerpt}\n`);
      });
    } else {
      console.log(`   Showing first 10 of ${occurrences.length} occurrences:\n`);
      occurrences.slice(0, 10).forEach((occurrence) => {
        console.log(`   ${occurrence.file}:${occurrence.line}`);
      });
      console.log();
    }
  });

  console.log('='.repeat(80));

  // Quality score
  const score = calculateQualityScore();
  console.log(`\n📊 Code Quality Score: ${score.toFixed(1)}/100`);
  console.log(`   Grade: ${getGrade(score)}\n`);

  // Recommendations
  console.log('💡 Top Recommendations:');
  generateRecommendations();

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    filesScanned: results.files,
    smells: results.smells,
    summary: results.summary,
    score,
    grade: getGrade(score),
  };

  fs.writeFileSync('code-smells-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: code-smells-report.json\n');

  // Exit with error if too many high severity issues
  if (results.summary.high > 20) {
    console.error('❌ Too many high severity code smells');
    process.exit(1);
  }
}

/**
 * Calculate quality score
 */
function calculateQualityScore() {
  let score = 100;

  // Penalize based on severity
  score -= results.summary.high * 3;
  score -= results.summary.medium * 1;
  score -= results.summary.low * 0.2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get letter grade
 */
function getGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate recommendations
 */
function generateRecommendations() {
  const recommendations = [];

  // Prioritize high severity issues
  if (results.summary.high > 0) {
    const highIssues = Object.entries(results.smells)
      .filter(([name, _]) => CODE_SMELLS[name].severity === 'high')
      .filter(([_, occurrences]) => occurrences.length > 0)
      .sort((a, b) => b[1].length - a[1].length);

    if (highIssues.length > 0) {
      const [topSmell, occurrences] = highIssues[0];
      recommendations.push(
        `Fix ${occurrences.length} instances of "${topSmell}" (high severity)`
      );
    }
  }

  // Address medium severity issues
  const mediumSmells = Object.entries(results.smells)
    .filter(([name, _]) => CODE_SMELLS[name].severity === 'medium')
    .filter(([_, occurrences]) => occurrences.length > 5)
    .sort((a, b) => b[1].length - a[1].length);

  if (mediumSmells.length > 0) {
    const [topSmell, occurrences] = mediumSmells[0];
    recommendations.push(
      `Address ${occurrences.length} instances of "${topSmell}"`
    );
  }

  // Suggest refactoring
  if (results.smells.longMethod?.length > 0) {
    recommendations.push(
      'Refactor long methods into smaller, focused functions'
    );
  }

  if (results.smells.godClass?.length > 0) {
    recommendations.push(
      'Break down large classes into smaller, cohesive classes'
    );
  }

  if (recommendations.length === 0) {
    console.log('   ✅ Code quality is excellent! No major improvements needed.');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log();
}

// Run detection
try {
  detectCodeSmells();
} catch (error) {
  console.error('❌ Code smell detection failed:', error);
  process.exit(1);
}

