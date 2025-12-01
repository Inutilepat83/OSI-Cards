#!/usr/bin/env node

/**
 * Generate Public API
 * 
 * Auto-generates the public-api.ts file for the library based on:
 * - Section registry
 * - Component discovery
 * - Service discovery
 * - Model exports
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const LIB_SRC = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src');
const OUTPUT_PATH = path.join(LIB_SRC, 'public-api.ts');

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
 * Discover exports from a directory's index.ts
 */
function discoverExports(dirPath) {
  const indexPath = path.join(dirPath, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  return path.relative(LIB_SRC, dirPath).replace(/\\/g, '/');
}

/**
 * Generate the public-api.ts content
 */
function generatePublicApi(registry) {
  const sections = Object.entries(registry.sections);
  
  // Build section component exports
  const sectionExports = sections
    .filter(([_, def]) => !def.isInternal)
    .map(([type, def]) => {
      const componentPath = def.componentPath.replace('./lib/', './lib/');
      return `export * from '${componentPath}';`;
    });

  const content = `/**
 * Public API Surface of OSI Cards Library
 * 
 * AUTO-GENERATED FILE - Edits will be preserved in marked sections
 * Generated from section-registry.json
 * Run: npm run generate:public-api
 * 
 * @example
 * \`\`\`typescript
 * import { AICardRendererComponent, CardDataService } from 'osi-cards-lib';
 * \`\`\`
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/models';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/decorators';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION MANIFEST (Generated)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/section-manifest.generated';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/services';
export * from './lib/services/section-utils.service';

// Streaming Service (explicitly exported for convenience)
export { 
  OSICardsStreamingService,
  StreamingStage,
  StreamingState,
  CardUpdate,
  StreamingConfig
} from './lib/services/streaming.service';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/interfaces';

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS (Shadow DOM compatible event system)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/events';

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/icons';

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/providers';

// ═══════════════════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/themes';

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/presets';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/osi-cards';
export * from './lib/components/ai-card-renderer/ai-card-renderer.component';
export * from './lib/components/section-renderer/section-renderer.component';
export * from './lib/components/section-renderer/dynamic-section-loader.service';
export * from './lib/components/masonry-grid/masonry-grid.component';
export * from './lib/components/card-skeleton/card-skeleton.component';
export * from './lib/components/card-preview/card-preview.component';
export * from './lib/components/osi-cards-container';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/card-header/card-header.component';
export * from './lib/components/card-body/card-body.component';
export * from './lib/components/card-footer/card-footer.component';
export * from './lib/components/card-actions/card-actions.component';
export * from './lib/components/card-section-list/card-section-list.component';
export * from './lib/components/card-streaming-indicator/card-streaming-indicator.component';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (Generated from section-registry.json)
// ═══════════════════════════════════════════════════════════════════════════
export * from './lib/components/sections/base-section.component';
${sectionExports.join('\n')}

/**
 * Note: For full functionality including:
 * - CardDataService and other core services
 * - NgRx store (actions, selectors, reducers, effects)
 * - Additional utilities and providers
 * 
 * You may need to import from the main application source or
 * extend the library exports. See integration documentation for details.
 * 
 * Styles entry points:
 * - 'osi-cards-lib/styles/_styles.scss' (global styles - may affect host app)
 * - 'osi-cards-lib/styles/_styles-scoped.scss' (scoped styles - recommended for integration)
 * 
 * For scoped styles, wrap components in <osi-cards-container> or use class="osi-cards-container"
 */
`;

  return content;
}

/**
 * Generate the secondary entry points
 */
function generateSecondaryEntryPoints(registry) {
  // Generate sections entry point
  const sectionsContent = `/**
 * OSI Cards - Sections Entry Point
 * Import individual sections for tree-shaking
 */
export * from '../lib/components/sections/base-section.component';
${Object.entries(registry.sections)
  .filter(([_, def]) => !def.isInternal)
  .map(([_, def]) => `export * from '${def.componentPath.replace('./lib/', '../lib/')}';`)
  .join('\n')}
`;

  const sectionsDir = path.join(LIB_SRC, 'sections');
  if (!fs.existsSync(sectionsDir)) {
    fs.mkdirSync(sectionsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(sectionsDir, 'index.ts'), sectionsContent, 'utf8');

  // Generate models entry point
  const modelsContent = `/**
 * OSI Cards - Models Entry Point
 * Import models and types only
 */
export * from '../lib/models';
export * from '../lib/interfaces';
`;

  const modelsDir = path.join(LIB_SRC, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(modelsDir, 'index.ts'), modelsContent, 'utf8');

  return { sections: sectionsDir, models: modelsDir };
}

/**
 * Generate export manifest for documentation
 */
function generateExportManifest(registry) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    registryVersion: registry.version,
    entryPoints: {
      main: 'public-api.ts',
      sections: 'sections/index.ts',
      models: 'models/index.ts'
    },
    exports: {
      models: ['AICardConfig', 'CardSection', 'CardField', 'CardItem', 'CardAction', 'SectionType', 'SectionTypeInput'],
      services: ['OSICardsStreamingService', 'DynamicSectionLoaderService', 'SectionPluginRegistry'],
      components: ['AICardRendererComponent', 'SectionRendererComponent', 'MasonryGridComponent'],
      sectionComponents: Object.entries(registry.sections)
        .filter(([_, def]) => !def.isInternal)
        .map(([type, def]) => ({
          type,
          name: def.name,
          selector: def.selector
        }))
    }
  };

  const outputPath = path.join(LIB_SRC, 'export-manifest.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
  return { path: outputPath };
}

/**
 * Main
 */
function main() {
  log('\n📦 Generating Public API', colors.cyan);
  log('═'.repeat(50), colors.cyan);

  const registry = loadRegistry();
  log(`\n📄 Registry: v${registry.version}`, colors.blue);

  // Generate main public-api.ts
  const publicApi = generatePublicApi(registry);
  fs.writeFileSync(OUTPUT_PATH, publicApi, 'utf8');
  log(`  ✓ Generated public-api.ts`, colors.green);

  // Generate secondary entry points
  const entryPoints = generateSecondaryEntryPoints(registry);
  log(`  ✓ Generated sections entry point`, colors.green);
  log(`  ✓ Generated models entry point`, colors.green);

  // Generate export manifest
  const manifest = generateExportManifest(registry);
  log(`  ✓ Generated export-manifest.json`, colors.green);

  log('\n═'.repeat(50), colors.cyan);
  log('✅ Public API generation complete!\n', colors.green);
}

main();




