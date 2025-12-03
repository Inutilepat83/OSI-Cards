#!/usr/bin/env node

/**
 * Code Quality Audit Script
 * Analyzes codebase for quality metrics and generates report
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxComplexity: 10,
  maxFileLength: 400,
  maxFunctionLength: 75,
  minTestCoverage: 95,
  maxDependencies: 5,
  sourceDirs: ['src', 'projects/osi-cards-lib/src'],
  excludePatterns: ['*.spec.ts', '*.stories.ts', 'node_modules', 'dist'],
};

// Metrics storage
const metrics = {
  files: {
    total: 0,
    oversized: [],
    complex: [],
  },
  functions: {
    total: 0,
    oversized: [],
  },
  classes: {
    total: 0,
    oversized: [],
  },
  dependencies: {
    circular: [],
    excessive: [],
  },
  issues: [],
};

/**
 * Main audit function
 */
function runAudit() {
  console.log('🔍 Starting Code Quality Audit...\n');

  // Analyze files
  CONFIG.sourceDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      analyzeDirectory(fullPath);
    }
  });

  // Generate report
  generateReport();
}

/**
 * Analyze directory recursively
 */
function analyzeDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldExclude(item)) {
        analyzeDirectory(fullPath);
      }
    } else if (stat.isFile() && item.endsWith('.ts') && !shouldExclude(item)) {
      analyzeFile(fullPath);
    }
  });
}

/**
 * Check if path should be excluded
 */
function shouldExclude(name) {
  return CONFIG.excludePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(name);
    }
    return name.includes(pattern);
  });
}

/**
 * Analyze individual file
 */
function analyzeFile(filePath) {
  metrics.files.total++;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check file length
  if (lines.length > CONFIG.maxFileLength) {
    metrics.files.oversized.push({
      file: relativePath,
      lines: lines.length,
      recommended: CONFIG.maxFileLength,
    });
  }

  // Analyze functions
  analyzeFunctions(content, relativePath);

  // Analyze classes
  analyzeClasses(content, relativePath);

  // Check for code smells
  detectCodeSmells(content, relativePath);
}

/**
 * Analyze functions in file
 */
function analyzeFunctions(content, filePath) {
  const functionRegex = /(?:function\s+\w+|(?:public|private|protected)?\s*\w+\s*\([^)]*\)\s*:\s*\w+\s*{)/g;
  const matches = content.match(functionRegex) || [];

  metrics.functions.total += matches.length;

  // Simplified function length check
  const functionBlocks = content.split(/(?:function\s+\w+|(?:public|private|protected)?\s*\w+\s*\([^)]*\))/);

  functionBlocks.forEach((block, index) => {
    if (index === 0) return; // Skip before first function

    const lines = block.split('\n').length;
    if (lines > CONFIG.maxFunctionLength) {
      metrics.functions.oversized.push({
        file: filePath,
        function: `Function ${index}`,
        lines,
        recommended: CONFIG.maxFunctionLength,
      });
    }
  });
}

/**
 * Analyze classes in file
 */
function analyzeClasses(content, filePath) {
  const classRegex = /class\s+(\w+)/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    metrics.classes.total++;
  }
}

/**
 * Detect code smells
 */
function detectCodeSmells(content, filePath) {
  const issues = [];

  // Check for any usage
  if (content.includes(': any') || content.includes('<any>')) {
    issues.push({
      file: filePath,
      type: 'any-usage',
      severity: 'warning',
      message: 'File contains "any" type usage',
    });
  }

  // Check for console.log
  if (content.includes('console.log')) {
    issues.push({
      file: filePath,
      type: 'console-log',
      severity: 'warning',
      message: 'File contains console.log statements',
    });
  }

  // Check for TODO comments
  if (content.includes('TODO') || content.includes('FIXME')) {
    issues.push({
      file: filePath,
      type: 'todo-comment',
      severity: 'info',
      message: 'File contains TODO/FIXME comments',
    });
  }

  // Check for magic numbers (simplified)
  const magicNumberRegex = /(?<![.\w])(?!-?[0-1]\b)-?\d{3,}(?![.\w])/g;
  if (magicNumberRegex.test(content)) {
    issues.push({
      file: filePath,
      type: 'magic-numbers',
      severity: 'warning',
      message: 'File contains potential magic numbers',
    });
  }

  // Check for long parameter lists
  const longParamsRegex = /\([^)]{100,}\)/g;
  if (longParamsRegex.test(content)) {
    issues.push({
      file: filePath,
      type: 'long-params',
      severity: 'warning',
      message: 'File contains functions with many parameters',
    });
  }

  metrics.issues.push(...issues);
}

/**
 * Generate audit report
 */
function generateReport() {
  console.log('📊 Code Quality Audit Report\n');
  console.log('=' .repeat(60));
  console.log('\n📁 File Metrics:');
  console.log(`  Total files analyzed: ${metrics.files.total}`);
  console.log(`  Oversized files (>${CONFIG.maxFileLength} lines): ${metrics.files.oversized.length}`);

  if (metrics.files.oversized.length > 0) {
    console.log('\n  Top 10 oversized files:');
    metrics.files.oversized
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10)
      .forEach((file) => {
        console.log(`    ❌ ${file.file} - ${file.lines} lines (recommended: ${file.recommended})`);
      });
  }

  console.log('\n⚙️ Function Metrics:');
  console.log(`  Total functions: ${metrics.functions.total}`);
  console.log(`  Oversized functions (>${CONFIG.maxFunctionLength} lines): ${metrics.functions.oversized.length}`);

  if (metrics.functions.oversized.length > 0 && metrics.functions.oversized.length <= 20) {
    console.log('\n  Oversized functions:');
    metrics.functions.oversized.forEach((func) => {
      console.log(`    ❌ ${func.file} - ${func.function} - ${func.lines} lines`);
    });
  }

  console.log('\n🏛️ Class Metrics:');
  console.log(`  Total classes: ${metrics.classes.total}`);

  // Code smells
  const groupedIssues = groupIssuesByType(metrics.issues);

  console.log('\n⚠️ Code Smells:');
  console.log(`  Total issues found: ${metrics.issues.length}`);

  Object.entries(groupedIssues).forEach(([type, issues]) => {
    console.log(`\n  ${type} (${issues.length} occurrences):`);

    if (issues.length <= 10) {
      issues.forEach((issue) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`    ${icon} ${issue.file}`);
      });
    } else {
      console.log(`    Found in ${issues.length} files (showing first 10)`);
      issues.slice(0, 10).forEach((issue) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`    ${icon} ${issue.file}`);
      });
    }
  });

  // Quality score
  const score = calculateQualityScore();
  console.log('\n📈 Overall Quality Score:');
  console.log(`  ${score.toFixed(1)}/100`);
  console.log(`  Grade: ${getGrade(score)}`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  generateRecommendations();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Audit complete!\n');

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    score,
    grade: getGrade(score),
  };

  fs.writeFileSync('code-quality-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Detailed report saved to: code-quality-report.json\n');

  // Exit with error if quality score is too low
  if (score < 70) {
    console.error('❌ Quality score below acceptable threshold (70)');
    process.exit(1);
  }
}

/**
 * Group issues by type
 */
function groupIssuesByType(issues) {
  return issues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {});
}

/**
 * Calculate quality score
 */
function calculateQualityScore() {
  let score = 100;

  // Penalize oversized files (max -20 points)
  const oversizedFilePenalty = Math.min(20, metrics.files.oversized.length * 2);
  score -= oversizedFilePenalty;

  // Penalize oversized functions (max -15 points)
  const oversizedFunctionPenalty = Math.min(15, metrics.functions.oversized.length * 0.5);
  score -= oversizedFunctionPenalty;

  // Penalize code smells (max -30 points)
  const errorIssues = metrics.issues.filter((i) => i.severity === 'error').length;
  const warningIssues = metrics.issues.filter((i) => i.severity === 'warning').length;
  const issuesPenalty = Math.min(30, errorIssues * 2 + warningIssues * 0.5);
  score -= issuesPenalty;

  return Math.max(0, score);
}

/**
 * Get letter grade for score
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

  if (metrics.files.oversized.length > 0) {
    recommendations.push(
      `Refactor ${metrics.files.oversized.length} oversized files to be under ${CONFIG.maxFileLength} lines`
    );
  }

  if (metrics.functions.oversized.length > 0) {
    recommendations.push(
      `Break down ${metrics.functions.oversized.length} oversized functions into smaller units`
    );
  }

  const anyUsage = metrics.issues.filter((i) => i.type === 'any-usage');
  if (anyUsage.length > 0) {
    recommendations.push(`Replace "any" types with proper types in ${anyUsage.length} files`);
  }

  const consoleLogs = metrics.issues.filter((i) => i.type === 'console-log');
  if (consoleLogs.length > 0) {
    recommendations.push(`Remove console.log statements from ${consoleLogs.length} files`);
  }

  if (recommendations.length === 0) {
    console.log('  🎉 No major issues found! Keep up the good work.');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
}

// Run audit
try {
  runAudit();
} catch (error) {
  console.error('❌ Audit failed:', error);
  process.exit(1);
}

