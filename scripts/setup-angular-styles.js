#!/usr/bin/env node

/**
 * Setup Script for OSI Cards Library
 *
 * Automatically adds library styles to angular.json
 * This script can be run manually or as a post-install hook
 *
 * Usage:
 *   node scripts/setup-angular-styles.js
 *   OR
 *   npm run setup:styles (if added to package.json)
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function findAngularJson(startPath = process.cwd()) {
  let currentPath = startPath;
  const rootPath = path.parse(currentPath).root;

  while (currentPath !== rootPath) {
    const angularJsonPath = path.join(currentPath, 'angular.json');
    if (fs.existsSync(angularJsonPath)) {
      return angularJsonPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

function updateAngularJson(angularJsonPath) {
  try {
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    let modified = false;

    // Find all projects
    for (const projectName in angularJson.projects) {
      const project = angularJson.projects[projectName];

      if (project.projectType === 'application' && project.architect?.build?.options) {
        const buildOptions = project.architect.build.options;

        // Check if styles array exists
        if (!buildOptions.styles) {
          buildOptions.styles = [];
        }

        // Check if library styles are already added
        const libraryStylePath = 'node_modules/osi-cards-lib/styles/_styles-scoped.scss';
        const hasLibraryStyles = buildOptions.styles.some(
          (style) => style.includes('osi-cards-lib') && style.includes('_styles-scoped')
        );

        if (!hasLibraryStyles) {
          // Add library styles after the main styles file
          const mainStyleIndex = buildOptions.styles.findIndex(
            (style) =>
              style.includes('styles.sass') ||
              style.includes('styles.scss') ||
              style.includes('styles.css')
          );

          if (mainStyleIndex >= 0) {
            buildOptions.styles.splice(mainStyleIndex + 1, 0, libraryStylePath);
          } else {
            buildOptions.styles.unshift(libraryStylePath);
          }
          modified = true;
          log(`✓ Added library styles to project: ${projectName}`, colors.green);
        } else {
          log(`ℹ Library styles already configured in project: ${projectName}`, colors.blue);
        }

        // Ensure stylePreprocessorOptions exists
        if (!buildOptions.stylePreprocessorOptions) {
          buildOptions.stylePreprocessorOptions = {};
        }

        // Add includePaths if not present
        if (!buildOptions.stylePreprocessorOptions.includePaths) {
          buildOptions.stylePreprocessorOptions.includePaths = [];
        }

        const hasIncludePath = buildOptions.stylePreprocessorOptions.includePaths.some((path) =>
          path.includes('osi-cards-lib')
        );

        if (!hasIncludePath) {
          buildOptions.stylePreprocessorOptions.includePaths.push(
            'node_modules/osi-cards-lib/styles'
          );
          modified = true;
          log(`✓ Added includePaths to project: ${projectName}`, colors.green);
        }

        // Ensure sass options exist
        if (!buildOptions.stylePreprocessorOptions.sass) {
          buildOptions.stylePreprocessorOptions.sass = {};
        }

        if (!buildOptions.stylePreprocessorOptions.sass.silenceDeprecations) {
          buildOptions.stylePreprocessorOptions.sass.silenceDeprecations = ['import'];
          modified = true;
          log(`✓ Added SASS deprecation silence to project: ${projectName}`, colors.green);
        }
      }
    }

    if (modified) {
      // Write back with proper formatting
      fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n', 'utf8');
      log('\n✅ Successfully updated angular.json!', colors.green);
      log('\nNext steps:', colors.blue);
      log('1. Remove the @import from your styles.sass/scss file if present', colors.yellow);
      log('2. Rebuild your app: ng build or npm start', colors.yellow);
      return true;
    } else {
      log('\nℹ angular.json is already configured correctly.', colors.blue);
      return false;
    }
  } catch (error) {
    log(`\n✗ Error updating angular.json: ${error.message}`, colors.red);
    return false;
  }
}

function main() {
  log('\n═══════════════════════════════════════════════════════', colors.blue);
  log('  OSI Cards Library - Angular Styles Setup', colors.blue);
  log('═══════════════════════════════════════════════════════\n', colors.blue);

  const angularJsonPath = findAngularJson();

  if (!angularJsonPath) {
    log("✗ angular.json not found. Make sure you're in an Angular project directory.", colors.red);
    process.exit(1);
  }

  log(`Found angular.json at: ${angularJsonPath}\n`, colors.blue);

  const success = updateAngularJson(angularJsonPath);

  if (success) {
    process.exit(0);
  } else {
    process.exit(0); // Still exit successfully if already configured
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateAngularJson, findAngularJson };
