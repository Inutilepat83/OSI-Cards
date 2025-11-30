#!/usr/bin/env node

/**
 * Change Detection Audit Script
 * Checks all Angular components to ensure they use OnPush change detection strategy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMPONENT_EXTENSIONS = ['.ts'];
const IGNORE_DIRS = ['node_modules', 'dist', '.angular', 'coverage', 'e2e-results'];
const IGNORE_FILES = ['.spec.ts', '.test.ts'];

/**
 * Check if path should be ignored
 */
function shouldIgnore(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  for (const dir of IGNORE_DIRS) {
    if (relativePath.includes(dir)) {
      return true;
    }
  }
  
  const filename = path.basename(filePath);
  for (const pattern of IGNORE_FILES) {
    if (filename.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find all TypeScript component files
 */
function findComponentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (shouldIgnore(filePath)) {
      continue;
    }
    
    if (stat.isDirectory()) {
      findComponentFiles(filePath, fileList);
    } else if (COMPONENT_EXTENSIONS.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Check if component uses OnPush change detection
 */
function checkChangeDetection(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if it's a component (has @Component decorator)
    if (!content.includes('@Component')) {
      return { isComponent: false };
    }
    
    // Check for ChangeDetectionStrategy import
    const hasChangeDetectionImport = content.includes('ChangeDetectionStrategy');
    
    // Check for OnPush usage
    const hasOnPush = content.includes('ChangeDetectionStrategy.OnPush') || 
                      content.includes('changeDetection: ChangeDetectionStrategy.OnPush');
    
    // Check for Default strategy (explicit)
    const hasDefault = content.includes('ChangeDetectionStrategy.Default');
    
    // Extract component selector for reporting
    const selectorMatch = content.match(/selector:\s*['"]([^'"]+)['"]/);
    const selector = selectorMatch ? selectorMatch[1] : 'unknown';
    
    return {
      isComponent: true,
      hasChangeDetectionImport,
      hasOnPush,
      hasDefault,
      selector,
      filePath
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return { isComponent: false, error: error.message };
  }
}

/**
 * Main function
 */
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
  }
  
  console.log('🔍 Auditing change detection strategies...\n');
  
  const componentFiles = findComponentFiles(srcDir);
  const results = [];
  let componentsChecked = 0;
  let onPushCount = 0;
  let defaultCount = 0;
  let missingCount = 0;
  
  for (const file of componentFiles) {
    const result = checkChangeDetection(file);
    
    if (result.isComponent) {
      componentsChecked++;
      
      if (result.hasOnPush) {
        onPushCount++;
      } else if (result.hasDefault) {
        defaultCount++;
        results.push({
          type: 'default',
          file: file,
          selector: result.selector
        });
      } else {
        missingCount++;
        results.push({
          type: 'missing',
          file: file,
          selector: result.selector
        });
      }
    }
  }
  
  // Print summary
  console.log('📊 Change Detection Audit Results\n');
  console.log(`Total components checked: ${componentsChecked}`);
  console.log(`✅ Using OnPush: ${onPushCount}`);
  console.log(`⚠️  Using Default: ${defaultCount}`);
  console.log(`❌ Missing strategy: ${missingCount}\n`);
  
  // Print details for components not using OnPush
  if (results.length > 0) {
    console.log('Components not using OnPush:\n');
    
    const defaultComponents = results.filter(r => r.type === 'default');
    if (defaultComponents.length > 0) {
      console.log('Using Default strategy:');
      for (const comp of defaultComponents) {
        console.log(`  - ${comp.selector} (${comp.file})`);
      }
      console.log('');
    }
    
    const missingComponents = results.filter(r => r.type === 'missing');
    if (missingComponents.length > 0) {
      console.log('Missing change detection strategy:');
      for (const comp of missingComponents) {
        console.log(`  - ${comp.selector} (${comp.file})`);
      }
      console.log('');
    }
    
    console.log('💡 Recommendation: Use OnPush change detection for better performance.');
    console.log('   Add: changeDetection: ChangeDetectionStrategy.OnPush\n');
    
    process.exit(1);
  } else {
    console.log('✅ All components are using OnPush change detection!\n');
    process.exit(0);
  }
}

main();








