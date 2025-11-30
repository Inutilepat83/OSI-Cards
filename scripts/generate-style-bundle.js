#!/usr/bin/env node

/**
 * Generate Style Bundle
 * 
 * Auto-discovers section SCSS files and generates import bundles.
 * Creates multiple bundle variants:
 * - Complete bundle (all sections)
 * - Core bundle (essential sections only)
 * - Per-section individual imports
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const STYLES_DIR = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'styles');
const SECTIONS_STYLES_DIR = path.join(STYLES_DIR, 'components', 'sections');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Get all SCSS files in sections directory
 */
function discoverStyleFiles() {
  const files = [];
  
  if (fs.existsSync(SECTIONS_STYLES_DIR)) {
    fs.readdirSync(SECTIONS_STYLES_DIR).forEach(file => {
      if (file.endsWith('.scss') && file.startsWith('_')) {
        files.push(file);
      }
    });
  }
  
  return files;
}

/**
 * Generate the main section types bundle
 */
function generateMainBundle(registry) {
  const outputPath = path.join(SECTIONS_STYLES_DIR, '_section-types.generated.scss');
  
  // Get style files from registry
  const registryStyles = Object.entries(registry.sections)
    .filter(([_, def]) => def.stylePath)
    .map(([type, def]) => ({
      type,
      file: path.basename(def.stylePath)
    }));
  
  // Header comment
  let content = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from section-registry.json
// Run: npm run generate:styles
// Total sections: ${registryStyles.length}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION TYPE STYLES
// All section-specific styles imported from registry
// ═══════════════════════════════════════════════════════════════════════════

`;

  // Group by category
  const coreTypes = ['info', 'overview', 'list', 'fallback'];
  const dataTypes = ['analytics', 'chart', 'financials'];
  const entityTypes = ['contact-card', 'network-card', 'product', 'solutions'];
  const contentTypes = ['event', 'news', 'quotation', 'text-reference', 'social-media'];
  const specialTypes = ['map', 'brand-colors'];
  
  const addGroup = (name, types) => {
    content += `\n// ${name}\n`;
    registryStyles
      .filter(s => types.includes(s.type))
      .forEach(s => {
        content += `@import '${s.file}'; // ${s.type}\n`;
      });
  };
  
  addGroup('Core Sections', coreTypes);
  addGroup('Data Visualization Sections', dataTypes);
  addGroup('Entity Sections', entityTypes);
  addGroup('Content Sections', contentTypes);
  addGroup('Special Sections', specialTypes);
  
  // Add any remaining sections not in categories
  const categorized = [...coreTypes, ...dataTypes, ...entityTypes, ...contentTypes, ...specialTypes];
  const uncategorized = registryStyles.filter(s => !categorized.includes(s.type));
  
  if (uncategorized.length > 0) {
    content += '\n// Other Sections\n';
    uncategorized.forEach(s => {
      content += `@import '${s.file}'; // ${s.type}\n`;
    });
  }
  
  fs.writeFileSync(outputPath, content, 'utf8');
  return { path: outputPath, count: registryStyles.length };
}

/**
 * Generate CSS custom properties file for sections
 */
function generateCSSVariables(registry) {
  const outputPath = path.join(STYLES_DIR, 'tokens', '_section-tokens.generated.scss');
  
  let content = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from section-registry.json
// Section-specific CSS custom properties

// ═══════════════════════════════════════════════════════════════════════════
// SECTION TOKENS
// Default values for section-specific styling
// ═══════════════════════════════════════════════════════════════════════════

:root {
`;

  Object.entries(registry.sections).forEach(([type, def]) => {
    const varPrefix = `--osi-section-${type}`;
    content += `
  // ${def.name}
  ${varPrefix}-columns: ${def.rendering.defaultColumns};
  ${varPrefix}-collapse: ${def.rendering.supportsCollapse ? '1' : '0'};
`;
  });
  
  content += `}

// Section type display properties
@mixin section-type-vars($type) {
`;

  Object.entries(registry.sections).forEach(([type, def]) => {
    content += `  @if $type == '${type}' {
    --section-columns: var(--osi-section-${type}-columns, ${def.rendering.defaultColumns});
  }
`;
  });
  
  content += `}
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  return { path: outputPath };
}

/**
 * Generate style manifest for documentation
 */
function generateStyleManifest(registry) {
  const outputPath = path.join(STYLES_DIR, 'style-manifest.json');
  
  const discoveredFiles = discoverStyleFiles();
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    registryVersion: registry.version,
    sections: Object.entries(registry.sections).map(([type, def]) => ({
      type,
      stylePath: def.stylePath,
      hasStyle: def.stylePath ? discoveredFiles.includes(path.basename(def.stylePath)) : false
    })),
    discoveredFiles,
    bundles: {
      complete: '_section-types.generated.scss',
      tokens: 'tokens/_section-tokens.generated.scss'
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
  return { path: outputPath };
}

/**
 * Main
 */
function main() {
  log('\n🎨 Generating Style Bundles', colors.cyan);
  log('═'.repeat(50), colors.cyan);
  
  const registry = loadRegistry();
  log(`\n📄 Registry: v${registry.version}`, colors.blue);
  
  // Ensure directories exist
  if (!fs.existsSync(path.join(STYLES_DIR, 'tokens'))) {
    fs.mkdirSync(path.join(STYLES_DIR, 'tokens'), { recursive: true });
  }
  
  // Generate files
  const mainBundle = generateMainBundle(registry);
  log(`  ✓ Generated ${path.basename(mainBundle.path)} (${mainBundle.count} sections)`, colors.green);
  
  const cssVars = generateCSSVariables(registry);
  log(`  ✓ Generated ${path.basename(cssVars.path)}`, colors.green);
  
  const manifest = generateStyleManifest(registry);
  log(`  ✓ Generated ${path.basename(manifest.path)}`, colors.green);
  
  log('\n═'.repeat(50), colors.cyan);
  log('✅ Style generation complete!\n', colors.green);
}

main();

