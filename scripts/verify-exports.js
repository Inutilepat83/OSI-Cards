#!/usr/bin/env node
/**
 * Export Verification Script
 * 
 * Verifies that all components, services, and utilities from the library
 * are properly exported and can be imported by consumers.
 * 
 * Usage: node scripts/verify-exports.js
 */

const fs = require('fs');
const path = require('path');

const LIBRARY_PATH = path.join(__dirname, '../projects/osi-cards-lib/src');
const PUBLIC_API_PATH = path.join(LIBRARY_PATH, 'public-api.ts');
const DIST_PATH = path.join(__dirname, '../dist/osi-cards-lib');

// Define expected exports by category
const EXPECTED_EXPORTS = {
  components: [
    'AICardRendererComponent',
    'OSICardsComponent',
    'OSICardsContainerComponent',
    'SectionRendererComponent',
    'MasonryGridComponent',
    'CardSkeletonComponent',
    'CardPreviewComponent',
    'CardHeaderComponent',
    'CardBodyComponent',
    'CardFooterComponent',
    'CardActionsComponent',
    'CardSectionListComponent',
    'CardStreamingIndicatorComponent', // To be added
    // Section components
    'AnalyticsSectionComponent',
    'BrandColorsSectionComponent',
    'ChartSectionComponent',
    'ContactCardSectionComponent',
    'EventSectionComponent',
    'FallbackSectionComponent',
    'FinancialsSectionComponent',
    'InfoSectionComponent',
    'ListSectionComponent',
    'MapSectionComponent',
    'NetworkCardSectionComponent',
    'NewsSectionComponent',
    'OverviewSectionComponent',
    'ProductSectionComponent',
    'QuotationSectionComponent',
    'SocialMediaSectionComponent',
    'SolutionsSectionComponent',
    'TextReferenceSectionComponent',
  ],
  services: [
    'MagneticTiltService',
    'IconService',
    'SectionNormalizationService',
    'SectionUtilsService',
    'OSICardsStreamingService',
    'ThemeService',
    'SectionPluginRegistryService',
    'EventMiddlewareService',
  ],
  utilities: [
    'cardDiff',
    'getBreakpointFromWidth',
    'calculateColumns',
    'generateWidthExpression',
    'generateLeftExpression',
    // Animation utilities (to be added)
    'applyWillChange',
    'removeWillChange',
    'createTransform',
    'applyTransform',
    'resetTransform',
    'isAnimating',
  ],
  models: [
    'AICardConfig',
    'CardSection',
    'CardField',
    'CardItem',
    'CardAction',
  ],
  interfaces: [
    'SectionPlugin',
    'EventMiddleware',
  ],
  types: [
    'StreamingStage',
    'StreamingState',
    'CardUpdate',
    'StreamingConfig',
    'Breakpoint',
    'CardChangeType',
  ],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`═══════════════════════════════════════════════════════════════`, colors.cyan);
  log(` ${title}`, colors.bright + colors.cyan);
  log(`═══════════════════════════════════════════════════════════════`, colors.cyan);
}

function logResult(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  const detailStr = details ? ` (${details})` : '';
  log(`  ${icon} ${name}${detailStr}`, color);
}

// Check if public-api.ts exists
function checkPublicApiExists() {
  logSection('Checking Public API File');
  
  if (fs.existsSync(PUBLIC_API_PATH)) {
    logResult('public-api.ts exists', true);
    return true;
  } else {
    logResult('public-api.ts exists', false, 'File not found');
    return false;
  }
}

// Parse public-api.ts to find exports
function parsePublicApi() {
  logSection('Parsing Public API Exports');
  
  const content = fs.readFileSync(PUBLIC_API_PATH, 'utf-8');
  const exports = {
    wildcardExports: [],
    namedExports: [],
  };
  
  // Find wildcard exports (export * from '...')
  const wildcardRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = wildcardRegex.exec(content)) !== null) {
    exports.wildcardExports.push(match[1]);
  }
  
  // Find named exports (export { ... } from '...')
  const namedRegex = /export\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = namedRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' ')[0]);
    exports.namedExports.push(...names);
  }
  
  log(`  Found ${exports.wildcardExports.length} wildcard exports`, colors.blue);
  log(`  Found ${exports.namedExports.length} named exports`, colors.blue);
  
  return exports;
}

// Check if dist folder exists
function checkDistExists() {
  logSection('Checking Distribution Build');
  
  if (fs.existsSync(DIST_PATH)) {
    logResult('dist/osi-cards-lib exists', true);
    
    // Check for index.d.ts
    const indexDts = path.join(DIST_PATH, 'index.d.ts');
    if (fs.existsSync(indexDts)) {
      logResult('index.d.ts exists', true);
    } else {
      logResult('index.d.ts exists', false);
    }
    
    return true;
  } else {
    logResult('dist/osi-cards-lib exists', false, 'Run ng build osi-cards-lib first');
    return false;
  }
}

// Check component files exist in library
function checkComponentFiles() {
  logSection('Checking Component Files');
  
  const componentsPath = path.join(LIBRARY_PATH, 'lib/components');
  const results = { passed: 0, failed: 0, missing: [] };
  
  const componentPaths = [
    // Main components
    'ai-card-renderer/ai-card-renderer.component.ts',
    'masonry-grid/masonry-grid.component.ts',
    'card-skeleton/card-skeleton.component.ts',
    'card-preview/card-preview.component.ts',
    'osi-cards/osi-cards.component.ts',
    'osi-cards-container/osi-cards-container.component.ts',
    'section-renderer/section-renderer.component.ts',
    // Composable components
    'card-header/card-header.component.ts',
    'card-body/card-body.component.ts',
    'card-footer/card-footer.component.ts',
    'card-actions/card-actions.component.ts',
    'card-section-list/card-section-list.component.ts',
    'card-streaming-indicator/card-streaming-indicator.component.ts',
    // Sections
    'sections/analytics-section/analytics-section.component.ts',
    'sections/brand-colors-section/brand-colors-section.component.ts',
    'sections/chart-section/chart-section.component.ts',
    'sections/contact-card-section/contact-card-section.component.ts',
    'sections/event-section/event-section.component.ts',
    'sections/fallback-section/fallback-section.component.ts',
    'sections/financials-section/financials-section.component.ts',
    'sections/info-section.component.ts',
    'sections/list-section/list-section.component.ts',
    'sections/map-section/map-section.component.ts',
    'sections/network-card-section/network-card-section.component.ts',
    'sections/news-section/news-section.component.ts',
    'sections/overview-section/overview-section.component.ts',
    'sections/product-section/product-section.component.ts',
    'sections/quotation-section/quotation-section.component.ts',
    'sections/social-media-section/social-media-section.component.ts',
    'sections/solutions-section/solutions-section.component.ts',
    'sections/text-reference-section/text-reference-section.component.ts',
  ];
  
  for (const componentPath of componentPaths) {
    const fullPath = path.join(componentsPath, componentPath);
    const exists = fs.existsSync(fullPath);
    const name = componentPath.split('/').pop().replace('.ts', '');
    
    if (exists) {
      results.passed++;
      logResult(name, true);
    } else {
      results.failed++;
      results.missing.push(componentPath);
      logResult(name, false, 'File missing');
    }
  }
  
  return results;
}

// Check service files exist
function checkServiceFiles() {
  logSection('Checking Service Files');
  
  const servicesPath = path.join(LIBRARY_PATH, 'lib/services');
  const results = { passed: 0, failed: 0, missing: [] };
  
  const servicePaths = [
    'magnetic-tilt.service.ts',
    'icon.service.ts',
    'section-normalization.service.ts',
    'section-utils.service.ts',
    'streaming.service.ts',
    'section-plugin-registry.service.ts',
    'event-middleware.service.ts',
  ];
  
  for (const servicePath of servicePaths) {
    const fullPath = path.join(servicesPath, servicePath);
    const exists = fs.existsSync(fullPath);
    const name = servicePath.replace('.ts', '');
    
    if (exists) {
      results.passed++;
      logResult(name, true);
    } else {
      results.failed++;
      results.missing.push(servicePath);
      logResult(name, false, 'File missing');
    }
  }
  
  return results;
}

// Check utility files exist
function checkUtilityFiles() {
  logSection('Checking Utility Files');
  
  const utilsPath = path.join(LIBRARY_PATH, 'lib/utils');
  const results = { passed: 0, failed: 0, missing: [] };
  
  const utilPaths = [
    'card-diff.util.ts',
    'responsive.util.ts',
    'card-spawner.util.ts',
    'style-validator.util.ts',
    'grid-config.util.ts',
    'smart-grid.util.ts',
    'smart-grid-logger.util.ts',
    'animation-optimization.util.ts',
  ];
  
  for (const utilPath of utilPaths) {
    const fullPath = path.join(utilsPath, utilPath);
    const exists = fs.existsSync(fullPath);
    const name = utilPath.replace('.ts', '');
    
    if (exists) {
      results.passed++;
      logResult(name, true);
    } else {
      results.failed++;
      results.missing.push(utilPath);
      logResult(name, false, 'File missing');
    }
  }
  
  return results;
}

// Check style files exist
function checkStyleFiles() {
  logSection('Checking Style Files');
  
  const stylesPath = path.join(LIBRARY_PATH, 'lib/styles');
  const results = { passed: 0, failed: 0, missing: [] };
  
  const stylePaths = [
    '_styles.scss',
    '_styles-scoped.scss',
    '_styles-standalone.scss',
    '_components.scss',
    'core/_animations.scss',
    'core/_variables.scss',
    'components/_streaming-effects.scss',
    'components/_empty-state.scss',
    'components/_ai-card-renderer.scss',
    'layout/_masonry.scss',
    'layout/_tilt.scss',
    'bundles/_ai-card.scss',
    'bundles/_all.scss',
    'bundles/_sections.scss',
  ];
  
  for (const stylePath of stylePaths) {
    const fullPath = path.join(stylesPath, stylePath);
    const exists = fs.existsSync(fullPath);
    const name = stylePath;
    
    if (exists) {
      results.passed++;
      logResult(name, true);
    } else {
      results.failed++;
      results.missing.push(stylePath);
      logResult(name, false, 'File missing');
    }
  }
  
  return results;
}

// Main verification function
function verify() {
  log('\n🔍 OSI Cards Library Export Verification\n', colors.bright + colors.cyan);
  log('════════════════════════════════════════════════════════════════════\n', colors.cyan);
  
  const results = {
    publicApi: checkPublicApiExists(),
    components: checkComponentFiles(),
    services: checkServiceFiles(),
    utilities: checkUtilityFiles(),
    styles: checkStyleFiles(),
    dist: checkDistExists(),
  };
  
  // Summary
  logSection('Summary');
  
  const totalPassed = 
    (results.publicApi ? 1 : 0) +
    results.components.passed +
    results.services.passed +
    results.utilities.passed +
    results.styles.passed +
    (results.dist ? 1 : 0);
    
  const totalFailed =
    (results.publicApi ? 0 : 1) +
    results.components.failed +
    results.services.failed +
    results.utilities.failed +
    results.styles.failed +
    (results.dist ? 0 : 1);
  
  log(`  Total Passed: ${totalPassed}`, colors.green);
  log(`  Total Failed: ${totalFailed}`, totalFailed > 0 ? colors.red : colors.green);
  
  if (totalFailed > 0) {
    console.log('');
    log('  Missing items:', colors.yellow);
    
    if (results.components.missing.length > 0) {
      log('    Components:', colors.yellow);
      results.components.missing.forEach(m => log(`      - ${m}`, colors.red));
    }
    
    if (results.services.missing.length > 0) {
      log('    Services:', colors.yellow);
      results.services.missing.forEach(m => log(`      - ${m}`, colors.red));
    }
    
    if (results.utilities.missing.length > 0) {
      log('    Utilities:', colors.yellow);
      results.utilities.missing.forEach(m => log(`      - ${m}`, colors.red));
    }
    
    if (results.styles.missing.length > 0) {
      log('    Styles:', colors.yellow);
      results.styles.missing.forEach(m => log(`      - ${m}`, colors.red));
    }
  }
  
  console.log('');
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run verification
verify();

