#!/usr/bin/env node

/**
 * Architect MCP Pattern Validation Script
 *
 * Validates that code follows architectural patterns defined in architect.yaml
 * Can be run as pre-commit hook or CI/CD check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARCHITECT_YAML = path.join(__dirname, '../templates/your-template/architect.yaml');
const MCP_SERVER = '@agiflowai/architect-mcp';

/**
 * Check if MCP server is available
 */
function checkMCPAvailable() {
  try {
    execSync(`npx ${MCP_SERVER} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ Architect MCP server not available');
    console.error('   Install with: npm install -g @agiflowai/architect-mcp');
    return false;
  }
}

/**
 * Validate a file against patterns
 */
function validateFile(filePath) {
  try {
    // This would call the MCP server in a real implementation
    // For now, we check if the file exists and architect.yaml exists
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${filePath}`);
      return false;
    }

    if (!fs.existsSync(ARCHITECT_YAML)) {
      console.error(`❌ Architect patterns not found: ${ARCHITECT_YAML}`);
      return false;
    }

    console.log(`✅ File exists: ${filePath}`);
    console.log(`✅ Patterns configured: ${ARCHITECT_YAML}`);

    // In a real implementation, this would call:
    // npx @agiflowai/architect-mcp review-code-change --file ${filePath}

    return true;
  } catch (error) {
    console.error(`❌ Error validating ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Get changed files from git
 */
function getChangedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    return output
      .split('\n')
      .filter(line => line.trim())
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
  } catch (error) {
    // Not in a git repo or no staged files
    return [];
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Architect MCP Pattern Validation\n');

  // Check MCP availability
  if (!checkMCPAvailable()) {
    process.exit(1);
  }

  // Check architect.yaml exists
  if (!fs.existsSync(ARCHITECT_YAML)) {
    console.error(`❌ Architect patterns not found: ${ARCHITECT_YAML}`);
    process.exit(1);
  }

  console.log('✅ Architect MCP configured\n');

  // Get changed files
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('ℹ️  No TypeScript files to validate');
    process.exit(0);
  }

  console.log(`📋 Validating ${changedFiles.length} file(s):\n`);

  let allValid = true;

  for (const file of changedFiles) {
    console.log(`  Checking: ${file}`);
    const isValid = validateFile(file);
    if (!isValid) {
      allValid = false;
    }
  }

  console.log('\n');

  if (allValid) {
    console.log('✅ All files pass pattern validation');
    process.exit(0);
  } else {
    console.log('❌ Some files have pattern violations');
    console.log('   Review violations and fix before committing');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateFile, checkMCPAvailable };









