#!/usr/bin/env node

/**
 * Dependency Analysis Script
 * Analyzes project dependencies for issues and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

/**
 * Load package.json files
 */
function loadPackageJson(pkgPath) {
  try {
    const content = fs.readFileSync(pkgPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Main analysis function
 */
function analyzeDependencies() {
  console.log('📦 Analyzing Dependencies...\n');

  // Load package files
  const rootPkg = loadPackageJson(path.join(process.cwd(), 'package.json'));
  const libPkg = loadPackageJson(
    path.join(process.cwd(), 'projects/osi-cards-lib/package.json')
  );

  if (!rootPkg) {
    console.error('❌ Could not load root package.json');
    process.exit(1);
  }

  const analysis = {
    root: analyzeSinglePackage(rootPkg, 'Root'),
    library: libPkg ? analyzeSinglePackage(libPkg, 'Library') : null,
  };

  // Check for version mismatches
  checkVersionMismatches(rootPkg, libPkg);

  // Check for circular dependencies (simplified)
  checkCircularDependencies();

  // Check for unused dependencies
  checkUnusedDependencies(rootPkg);

  // Generate report
  generateDependencyReport(analysis);
}

/**
 * Analyze single package
 */
function analyzeSinglePackage(pkg, name) {
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const peerDeps = pkg.peerDependencies || {};
  const optionalDeps = pkg.optionalDependencies || {};

  return {
    name,
    version: pkg.version,
    dependencies: {
      production: Object.keys(deps).length,
      development: Object.keys(devDeps).length,
      peer: Object.keys(peerDeps).length,
      optional: Object.keys(optionalDeps).length,
      total:
        Object.keys(deps).length +
        Object.keys(devDeps).length +
        Object.keys(peerDeps).length +
        Object.keys(optionalDeps).length,
    },
    angular: findAngularDependencies(deps, devDeps),
    heavy: findHeavyDependencies(deps),
  };
}

/**
 * Find Angular dependencies
 */
function findAngularDependencies(deps, devDeps) {
  const allDeps = { ...deps, ...devDeps };
  const angular = Object.keys(allDeps).filter((dep) => dep.startsWith('@angular/'));

  return {
    count: angular.length,
    packages: angular,
  };
}

/**
 * Find heavy dependencies (known large packages)
 */
function findHeavyDependencies(deps) {
  const heavyPackages = [
    'chart.js',
    'leaflet',
    '@angular/material',
    'primeng',
    'moment',
    'lodash',
    'rxjs',
  ];

  const found = Object.keys(deps).filter((dep) =>
    heavyPackages.some((heavy) => dep.includes(heavy))
  );

  return {
    count: found.length,
    packages: found,
  };
}

/**
 * Check for version mismatches
 */
function checkVersionMismatches(rootPkg, libPkg) {
  if (!libPkg) return;

  console.log('🔍 Checking Version Consistency...\n');

  const rootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
  const libDeps = { ...libPkg.dependencies, ...libPkg.peerDependencies };

  const mismatches = [];

  Object.keys(libDeps).forEach((dep) => {
    if (rootDeps[dep] && rootDeps[dep] !== libDeps[dep]) {
      mismatches.push({
        package: dep,
        root: rootDeps[dep],
        library: libDeps[dep],
      });
    }
  });

  if (mismatches.length === 0) {
    console.log('  ✅ All versions consistent\n');
  } else {
    console.log(`  ⚠️ Found ${mismatches.length} version mismatches:\n`);
    mismatches.forEach((mismatch) => {
      console.log(`     ${mismatch.package}`);
      console.log(`       Root:    ${mismatch.root}`);
      console.log(`       Library: ${mismatch.library}\n`);
    });
  }
}

/**
 * Check for circular dependencies (simplified)
 */
function checkCircularDependencies() {
  console.log('🔄 Checking for Circular Dependencies...\n');

  // This is a simplified check
  // Full implementation would parse import statements and build dependency graph

  console.log('  ℹ️ Circular dependency detection requires static analysis');
  console.log('  → Consider using madge or dependency-cruiser\n');
}

/**
 * Check for unused dependencies
 */
function checkUnusedDependencies(pkg) {
  console.log('🗑️ Checking for Unused Dependencies...\n');

  // This is a simplified check
  // Full implementation would scan source files for imports

  console.log('  ℹ️ Unused dependency detection requires source scanning');
  console.log('  → Consider using depcheck\n');
}

/**
 * Generate report
 */
function generateDependencyReport(analysis) {
  console.log('📊 Dependency Analysis Report\n');
  console.log('='.repeat(80));

  // Root package
  if (analysis.root) {
    console.log(`\n📦 ${analysis.root.name} (v${analysis.root.version})`);
    console.log(`   Production: ${analysis.root.dependencies.production}`);
    console.log(`   Development: ${analysis.root.dependencies.development}`);
    console.log(`   Peer: ${analysis.root.dependencies.peer}`);
    console.log(`   Total: ${analysis.root.dependencies.total}`);
    console.log(`   Angular packages: ${analysis.root.angular.count}`);
    console.log(`   Heavy packages: ${analysis.root.heavy.count}`);

    if (analysis.root.heavy.count > 0) {
      console.log('\n   Heavy dependencies:');
      analysis.root.heavy.packages.forEach((pkg) => {
        console.log(`     - ${pkg}`);
      });
    }
  }

  // Library package
  if (analysis.library) {
    console.log(`\n📦 ${analysis.library.name} (v${analysis.library.version})`);
    console.log(`   Production: ${analysis.library.dependencies.production}`);
    console.log(`   Peer: ${analysis.library.dependencies.peer}`);
    console.log(`   Optional: ${analysis.library.dependencies.optional}`);
    console.log(`   Total: ${analysis.library.dependencies.total}`);
  }

  console.log('\n' + '='.repeat(80));

  // Recommendations
  console.log('\n💡 Recommendations:\n');

  if (analysis.root && analysis.root.dependencies.production > 30) {
    console.log('   ⚠️ High number of production dependencies');
    console.log('   → Consider reducing dependencies or lazy loading\n');
  }

  if (analysis.root && analysis.root.heavy.count > 5) {
    console.log('   ⚠️ Multiple heavy dependencies detected');
    console.log('   → Consider lazy loading or alternative lighter packages\n');
  }

  console.log('   ✅ Run "npm audit" for security check');
  console.log('   ✅ Run "npm outdated" to check for updates');
  console.log('   ✅ Use "depcheck" to find unused dependencies');
  console.log('   ✅ Use "madge" to detect circular dependencies\n');

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    analysis,
  };

  fs.writeFileSync('dependency-analysis-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Report saved to: dependency-analysis-report.json\n');
}

// Run analysis
try {
  analyzeDependencies();
} catch (error) {
  console.error('❌ Dependency analysis failed:', error);
  process.exit(1);
}

