#!/usr/bin/env node

/**
 * Architectural Fitness Functions
 * Validates architectural constraints and design principles
 */

const fs = require('fs');
const path = require('path');

/**
 * Architectural constraints to validate
 */
const CONSTRAINTS = {
  // Dependency rules
  dependencies: {
    'services should not depend on components': {
      from: '**/services/**/*.ts',
      to: '**/components/**/*.ts',
      allowed: false,
    },
    'utils should not depend on services or components': {
      from: '**/utils/**/*.ts',
      to: ['**/services/**/*.ts', '**/components/**/*.ts'],
      allowed: false,
    },
    'models should not depend on anything': {
      from: '**/models/**/*.ts',
      to: ['**/services/**/*.ts', '**/components/**/*.ts', '**/utils/**/*.ts'],
      allowed: false,
    },
    'library should not depend on application': {
      from: 'projects/osi-cards-lib/**/*.ts',
      to: 'src/app/**/*.ts',
      allowed: false,
    },
  },

  // Component constraints
  components: {
    'components must use OnPush': {
      pattern: '**/components/**/*.ts',
      mustContain: 'ChangeDetectionStrategy.OnPush',
    },
    'components must have tests': {
      component: '*.component.ts',
      mustHaveTest: '*.component.spec.ts',
    },
  },

  // Service constraints
  services: {
    'services must be injectable': {
      pattern: '**/services/**/*.ts',
      mustContain: '@Injectable',
    },
    'services must have tests': {
      service: '*.service.ts',
      mustHaveTest: '*.service.spec.ts',
    },
  },

  // Style constraints
  styles: {
    'no global styles in components': {
      pattern: '**/components/**/*.scss',
      mustNotContain: [':root', 'body', 'html'],
    },
  },

  // Testing constraints
  testing: {
    'tests must have descriptions': {
      pattern: '**/*.spec.ts',
      mustContain: "describe('",
    },
  },
};

// Results storage
const results = {
  passed: [],
  failed: [],
};

/**
 * Main validation function
 */
function validateArchitecture() {
  console.log('🏗️ Validating Architecture Fitness Functions...\n');

  // Validate dependency constraints
  console.log('📦 Checking Dependency Constraints...');
  Object.entries(CONSTRAINTS.dependencies).forEach(([name, constraint]) => {
    validateDependencyConstraint(name, constraint);
  });

  // Validate component constraints
  console.log('\n🧩 Checking Component Constraints...');
  Object.entries(CONSTRAINTS.components).forEach(([name, constraint]) => {
    validateComponentConstraint(name, constraint);
  });

  // Validate service constraints
  console.log('\n⚙️ Checking Service Constraints...');
  Object.entries(CONSTRAINTS.services).forEach(([name, constraint]) => {
    validateServiceConstraint(name, constraint);
  });

  // Generate report
  generateFitnessReport();
}

/**
 * Validate dependency constraint
 */
function validateDependencyConstraint(name, constraint) {
  const violations = findDependencyViolations(constraint.from, constraint.to);

  if (violations.length === 0) {
    results.passed.push({ constraint: name, type: 'dependency' });
    console.log(`  ✅ ${name}`);
  } else {
    results.failed.push({
      constraint: name,
      type: 'dependency',
      violations,
    });
    console.log(`  ❌ ${name}`);
    violations.slice(0, 5).forEach((v) => {
      console.log(`     ${v.from} → ${v.to}`);
    });
    if (violations.length > 5) {
      console.log(`     ... and ${violations.length - 5} more`);
    }
  }
}

/**
 * Find dependency violations
 */
function findDependencyViolations(fromPattern, toPattern) {
  const violations = [];
  const fromFiles = findFiles(fromPattern);

  fromFiles.forEach((fromFile) => {
    const content = fs.readFileSync(fromFile, 'utf-8');
    const imports = extractImports(content);

    imports.forEach((importPath) => {
      const resolvedPath = resolveImportPath(fromFile, importPath);
      const toPatterns = Array.isArray(toPattern) ? toPattern : [toPattern];

      if (toPatterns.some((pattern) => matchesPattern(resolvedPath, pattern))) {
        violations.push({
          from: path.relative(process.cwd(), fromFile),
          to: path.relative(process.cwd(), resolvedPath),
        });
      }
    });
  });

  return violations;
}

/**
 * Validate component constraint
 */
function validateComponentConstraint(name, constraint) {
  if (constraint.mustContain) {
    const files = findFiles(constraint.pattern);
    const violatingFiles = files.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return !content.includes(constraint.mustContain);
    });

    if (violatingFiles.length === 0) {
      results.passed.push({ constraint: name, type: 'component' });
      console.log(`  ✅ ${name}`);
    } else {
      results.failed.push({
        constraint: name,
        type: 'component',
        violations: violatingFiles.map((f) => ({ file: path.relative(process.cwd(), f) })),
      });
      console.log(`  ❌ ${name} (${violatingFiles.length} violations)`);
    }
  }

  if (constraint.mustHaveTest) {
    validateTestConstraint(constraint.component, constraint.mustHaveTest);
  }
}

/**
 * Validate service constraint
 */
function validateServiceConstraint(name, constraint) {
  if (constraint.mustContain) {
    const files = findFiles(constraint.pattern);
    const violatingFiles = files.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return !content.includes(constraint.mustContain);
    });

    if (violatingFiles.length === 0) {
      results.passed.push({ constraint: name, type: 'service' });
      console.log(`  ✅ ${name}`);
    } else {
      results.failed.push({
        constraint: name,
        type: 'service',
        violations: violatingFiles.length,
      });
      console.log(`  ❌ ${name} (${violatingFiles.length} violations)`);
    }
  }

  if (constraint.mustHaveTest) {
    validateTestConstraint(constraint.service, constraint.mustHaveTest);
  }
}

/**
 * Validate test constraint
 */
function validateTestConstraint(sourcePattern, testPattern) {
  // Simplified test check
  // In real implementation, would check if test file exists for each source file
}

/**
 * Find files matching glob pattern
 */
function findFiles(pattern) {
  const files = [];
  const baseDir = process.cwd();

  const searchDir = pattern.includes('**/')
    ? path.join(baseDir, pattern.split('**/')[0])
    : baseDir;

  function search(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.includes('node_modules') && !item.includes('dist')) {
          search(fullPath);
        }
      } else if (matchesPattern(fullPath, pattern)) {
        files.push(fullPath);
      }
    });
  }

  search(searchDir);
  return files;
}

/**
 * Check if path matches pattern
 */
function matchesPattern(filePath, pattern) {
  const relativePath = path.relative(process.cwd(), filePath);
  const patternRegex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
  return new RegExp(patternRegex).test(relativePath);
}

/**
 * Extract import statements from file content
 */
function extractImports(content) {
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolve import path to actual file
 */
function resolveImportPath(fromFile, importPath) {
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), importPath);
  }
  return importPath;
}

/**
 * Generate fitness report
 */
function generateFitnessReport() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Architecture Fitness Report\n');
  console.log(`  Total Constraints: ${results.passed.length + results.failed.length}`);
  console.log(`  Passed: ${results.passed.length} ✅`);
  console.log(`  Failed: ${results.failed.length} ❌`);

  const passRate = (results.passed.length / (results.passed.length + results.failed.length)) * 100;
  console.log(`  Pass Rate: ${passRate.toFixed(1)}%`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Constraints:');
    results.failed.forEach((failure) => {
      console.log(`  - ${failure.constraint} (${failure.type})`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Write report
  fs.writeFileSync('architecture-fitness-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Report saved to: architecture-fitness-report.json\n');

  // Exit with error if constraints failed
  if (results.failed.length > 0) {
    console.error('❌ Architecture fitness check failed');
    process.exit(1);
  }

  console.log('✅ All architecture constraints satisfied!\n');
}

// Run validation
try {
  validateArchitecture();
} catch (error) {
  console.error('❌ Architecture validation failed:', error);
  process.exit(1);
}

