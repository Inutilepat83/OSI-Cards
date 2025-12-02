#!/usr/bin/env node

/**
 * Dependency check script
 * Checks for security vulnerabilities and outdated packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run npm audit
 */
function runAudit() {
  try {
    console.log('Running npm audit...');
    const result = execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
    const audit = JSON.parse(result);
    
    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      const critical = audit.metadata?.vulnerabilities?.critical || 0;
      const high = audit.metadata?.vulnerabilities?.high || 0;
      const moderate = audit.metadata?.vulnerabilities?.moderate || 0;
      const low = audit.metadata?.vulnerabilities?.low || 0;
      
      if (critical > 0 || high > 0) {
        console.error('❌ Security vulnerabilities found!');
        console.error(`  Critical: ${critical}`);
        console.error(`  High: ${high}`);
        console.error(`  Moderate: ${moderate}`);
        console.error(`  Low: ${low}`);
        console.error('\nRun "npm audit fix" to attempt automatic fixes.');
        return false;
      }
      
      if (moderate > 0 || low > 0) {
        console.warn('⚠️  Security vulnerabilities found (moderate/low severity)');
        console.warn(`  Moderate: ${moderate}`);
        console.warn(`  Low: ${low}`);
        console.warn('Consider running "npm audit fix"');
      }
    } else {
      console.log('✅ No security vulnerabilities found');
    }
    
    return true;
  } catch (error) {
    console.error('Error running npm audit:', error.message);
    return false;
  }
}

/**
 * Check for outdated packages
 */
function checkOutdated() {
  try {
    console.log('Checking for outdated packages...');
    const result = execSync('npm outdated --json', { encoding: 'utf-8', stdio: 'pipe' });
    const outdated = JSON.parse(result);
    
    const count = Object.keys(outdated).length;
    if (count > 0) {
      console.warn(`⚠️  ${count} package(s) are outdated`);
      console.warn('Run "npm outdated" to see details');
      console.warn('Run "npm update" to update packages (check for breaking changes first)');
    } else {
      console.log('✅ All packages are up to date');
    }
    
    return true;
  } catch (error) {
    // npm outdated returns non-zero exit code when packages are outdated
    // This is expected, so we don't treat it as an error
    return true;
  }
}

/**
 * Main function
 */
function main() {
  const checkType = process.argv[2] || 'all';
  
  let allPassed = true;
  
  if (checkType === 'all' || checkType === 'audit') {
    if (!runAudit()) {
      allPassed = false;
    }
  }
  
  if (checkType === 'all' || checkType === 'outdated') {
    checkOutdated();
  }
  
  if (!allPassed) {
    process.exit(1);
  }
  
  process.exit(0);
}

main();
















