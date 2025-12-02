#!/usr/bin/env node

/**
 * Tree Shaking Audit Script
 * 
 * Analyzes the codebase to identify potential tree-shaking issues:
 * - Unused exports
 * - Barrel file patterns that prevent tree-shaking
 * - Side-effect imports
 * - Large dependency imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '..', 'src');
const ISSUES = {
  barrelFiles: [],
  unusedExports: [],
  sideEffectImports: [],
  largeImports: []
};

/**
 * Check if a file is a barrel file (index.ts that re-exports)
 */
function isBarrelFile(filePath) {
  if (!filePath.endsWith('index.ts')) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  // Check for re-export patterns
  const hasReExports = /export\s+\*\s+from/.test(content) || 
                       /export\s+\{[^}]+\}\s+from/.test(content);
  
  return hasReExports;
}

/**
 * Analyze barrel files for tree-shaking issues
 */
function analyzeBarrelFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      analyzeBarrelFiles(fullPath);
    } else if (file.isFile() && file.name === 'index.ts') {
      if (isBarrelFile(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const reExportCount = (content.match(/export\s+\*\s+from/g) || []).length;
        const namedExportCount = (content.match(/export\s+\{[^}]+\}\s+from/g) || []).length;
        
        ISSUES.barrelFiles.push({
          file: path.relative(process.cwd(), fullPath),
          reExports: reExportCount + namedExportCount,
          size: content.length
        });
      }
    }
  }
}

/**
 * Check for side-effect imports (imports without explicit usage)
 */
function checkSideEffectImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sideEffectPattern = /^import\s+['"][^'"]+['"];?\s*$/gm;
  const matches = content.match(sideEffectPattern) || [];
  
  if (matches.length > 0) {
    ISSUES.sideEffectImports.push({
      file: path.relative(process.cwd(), filePath),
      imports: matches.map(m => m.trim())
    });
  }
}

/**
 * Check for large dependency imports
 */
function checkLargeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const largeLibraries = [
    'rxjs',
    '@angular/common',
    '@angular/core',
    'lodash',
    'moment',
    'chart.js',
    'leaflet'
  ];
  
  const imports = [];
  largeLibraries.forEach(lib => {
    const pattern = new RegExp(`import\\s+.*from\\s+['"]${lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (pattern.test(content)) {
      imports.push(lib);
    }
  });
  
  if (imports.length > 0) {
    ISSUES.largeImports.push({
      file: path.relative(process.cwd(), filePath),
      libraries: imports
    });
  }
}

/**
 * Recursively scan TypeScript files
 */
function scanTypeScriptFiles(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, dist, etc.
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanTypeScriptFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      checkSideEffectImports(fullPath);
      checkLargeImports(fullPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting Tree Shaking Audit...\n');
  
  // Analyze barrel files
  console.log('📦 Analyzing barrel files...');
  analyzeBarrelFiles(SOURCE_DIR);
  
  // Scan TypeScript files
  console.log('📄 Scanning TypeScript files...');
  scanTypeScriptFiles(SOURCE_DIR);
  
  // Print results
  console.log('\n📊 Tree Shaking Audit Results:\n');
  console.log('='.repeat(60));
  
  // Barrel files
  if (ISSUES.barrelFiles.length > 0) {
    console.log(`\n📦 Barrel Files Found: ${ISSUES.barrelFiles.length}`);
    console.log('   (Barrel files can prevent tree-shaking if not used carefully)');
    ISSUES.barrelFiles.slice(0, 10).forEach(({ file, reExports }) => {
      console.log(`   - ${file} (${reExports} re-exports)`);
    });
    if (ISSUES.barrelFiles.length > 10) {
      console.log(`   ... and ${ISSUES.barrelFiles.length - 10} more`);
    }
  } else {
    console.log('\n✅ No barrel files found (or none detected)');
  }
  
  // Side-effect imports
  if (ISSUES.sideEffectImports.length > 0) {
    console.log(`\n⚠️  Side-Effect Imports Found: ${ISSUES.sideEffectImports.length}`);
    console.log('   (These imports may prevent tree-shaking)');
    ISSUES.sideEffectImports.slice(0, 5).forEach(({ file, imports }) => {
      console.log(`   - ${file}`);
      imports.slice(0, 2).forEach(imp => {
        console.log(`     ${imp}`);
      });
      if (imports.length > 2) {
        console.log(`     ... and ${imports.length - 2} more`);
      }
    });
    if (ISSUES.sideEffectImports.length > 5) {
      console.log(`   ... and ${ISSUES.sideEffectImports.length - 5} more files`);
    }
  } else {
    console.log('\n✅ No obvious side-effect imports found');
  }
  
  // Large imports
  if (ISSUES.largeImports.length > 0) {
    console.log(`\n📚 Large Library Imports Found: ${ISSUES.largeImports.length}`);
    console.log('   (Consider lazy loading these libraries)');
    const libCounts = {};
    ISSUES.largeImports.forEach(({ libraries }) => {
      libraries.forEach(lib => {
        libCounts[lib] = (libCounts[lib] || 0) + 1;
      });
    });
    Object.entries(libCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lib, count]) => {
        console.log(`   - ${lib}: ${count} file(s)`);
      });
  } else {
    console.log('\n✅ No large library imports detected');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('-'.repeat(60));
  console.log('   1. Use named imports instead of barrel file re-exports when possible');
  console.log('   2. Import only what you need from large libraries');
  console.log('   3. Consider lazy loading for optional dependencies (chart.js, leaflet)');
  console.log('   4. Use sideEffects: false in package.json for better tree-shaking');
  console.log('   5. Review barrel files and split if they become too large');
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    barrelFiles: ISSUES.barrelFiles.length,
    sideEffectImports: ISSUES.sideEffectImports.length,
    largeImports: ISSUES.largeImports.length,
    details: ISSUES
  };
  
  const reportPath = path.join(__dirname, '..', 'tree-shaking-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report written to: ${reportPath}\n`);
}

main();















