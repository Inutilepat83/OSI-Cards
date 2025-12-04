#!/usr/bin/env node
/**
 * Accessibility Audit Script
 *
 * Checks for common accessibility issues in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Accessibility Audit...\n');

const issues = [];

// Check 1: Images without alt text
console.log('Checking images for alt text...');
function checkImagesForAlt(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkImagesForAlt(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const imgMatches = content.match(/<img[^>]*>/g);

      if (imgMatches) {
        imgMatches.forEach((img) => {
          if (!img.includes('alt=')) {
            issues.push({
              type: 'missing-alt',
              file: fullPath,
              line: content.split('\n').findIndex((l) => l.includes(img)) + 1,
              message: 'Image missing alt attribute',
            });
          }
        });
      }
    }
  });
}

// Check 2: Buttons without aria-label
console.log('Checking buttons for accessibility...');
function checkButtons(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkButtons(fullPath);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const buttonMatches = content.match(/<button[^>]*>(\s*<[^>]+>\s*)*<\/button>/g);

      if (buttonMatches) {
        buttonMatches.forEach((button) => {
          const hasText = button.match(/>([^<]+)</);
          const hasAriaLabel = button.includes('aria-label');
          const hasTitle = button.includes('title');

          if (!hasText && !hasAriaLabel && !hasTitle) {
            issues.push({
              type: 'button-no-text',
              file: fullPath,
              message: 'Button without text or aria-label',
            });
          }
        });
      }
    }
  });
}

// Check 3: Color contrast (basic check for hardcoded colors)
console.log('Checking for hardcoded colors...');
function checkColors(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkColors(fullPath);
    } else if (file.endsWith('.scss') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const colorMatches = content.match(/color:\s*#[0-9a-fA-F]{3,6}/g);

      if (colorMatches && colorMatches.length > 5) {
        issues.push({
          type: 'hardcoded-colors',
          file: fullPath,
          message: `Found ${colorMatches.length} hardcoded colors. Consider using CSS variables for theming.`,
        });
      }
    }
  });
}

// Run checks
checkImagesForAlt('./src');
checkButtons('./src');
checkColors('./src');
checkImagesForAlt('./projects');
checkButtons('./projects');

// Report results
console.log('\n📊 Audit Results:\n');

if (issues.length === 0) {
  console.log('✅ No accessibility issues found!');
} else {
  console.log(`⚠️  Found ${issues.length} potential accessibility issues:\n`);

  const byType = {};
  issues.forEach((issue) => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  });

  console.log('Summary:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  • ${type}: ${count} issues`);
  });

  console.log('\nDetails:');
  issues.slice(0, 10).forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.type}`);
    console.log(`   File: ${issue.file.replace(process.cwd(), '.')}`);
    if (issue.line) console.log(`   Line: ${issue.line}`);
    console.log(`   ${issue.message}`);
  });

  if (issues.length > 10) {
    console.log(`\n... and ${issues.length - 10} more issues`);
  }
}

console.log('\n✅ Accessibility audit complete');
console.log('\n💡 Tip: Run "npm run audit:a11y:report" for detailed report');

process.exit(issues.length > 0 ? 1 : 0);
