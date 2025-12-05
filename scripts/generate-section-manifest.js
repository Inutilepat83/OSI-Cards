#!/usr/bin/env node

/**
 * Generate Section Manifest
 * 
 * Creates a manifest file containing all section metadata for use in:
 * - Build-time optimizations
 * - Documentation generation
 * - Development tooling
 * - CLI commands
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'section-manifest.generated.ts');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
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

function generateManifest() {
  log('\n📋 Generating Section Manifest', colors.cyan);
  log('═'.repeat(50), colors.cyan);

  const registry = loadRegistry();
  
  const sections = Object.entries(registry.sections).map(([type, def]) => ({
    type,
    name: def.name,
    description: def.description,
    selector: def.selector,
    componentPath: def.componentPath,
    stylePath: def.stylePath,
    useCases: def.useCases || [],
    bestPractices: def.bestPractices || [],
    rendering: def.rendering,
    aliases: def.aliases || [],
    isInternal: def.isInternal || false
  }));

  const manifest = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:manifest
 */

export interface SectionManifestEntry {
  type: string;
  name: string;
  description: string;
  selector: string;
  componentPath: string;
  stylePath?: string;
  useCases: string[];
  bestPractices: string[];
  rendering: {
    usesFields: boolean;
    usesItems: boolean;
    usesChartData?: boolean;
    defaultColumns: number;
    supportsCollapse: boolean;
    supportsEmoji: boolean;
    requiresExternalLib?: string;
  };
  aliases: string[];
  isInternal: boolean;
}

/**
 * Complete manifest of all registered section types
 */
export const SECTION_MANIFEST: SectionManifestEntry[] = ${JSON.stringify(sections, null, 2)};

/**
 * Get manifest entry by section type
 */
export function getManifestEntry(type: string): SectionManifestEntry | undefined {
  const typeLower = type.toLowerCase();
  return SECTION_MANIFEST.find(s => 
    s.type === typeLower || s.aliases.includes(typeLower)
  );
}

/**
 * Get all public section types
 */
export function getPublicSectionTypes(): string[] {
  return SECTION_MANIFEST
    .filter(s => !s.isInternal)
    .map(s => s.type);
}

/**
 * Get sections that use external libraries
 */
export function getSectionsRequiringExternalLibs(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  
  SECTION_MANIFEST.forEach(s => {
    if (s.rendering.requiresExternalLib) {
      const lib = s.rendering.requiresExternalLib;
      if (!map.has(lib)) {
        map.set(lib, []);
      }
      map.get(lib)!.push(s.type);
    }
  });
  
  return map;
}

/**
 * Manifest metadata
 */
export const MANIFEST_META = {
  generatedAt: '${new Date().toISOString()}',
  registryVersion: '${registry.version}',
  totalSections: ${sections.length},
  publicSections: ${sections.filter(s => !s.isInternal).length}
};
`;

  fs.writeFileSync(OUTPUT_PATH, manifest, 'utf8');
  log(`  ✓ Generated ${OUTPUT_PATH}`, colors.green);
  log(`    - ${sections.length} sections`, colors.blue);
  log('═'.repeat(50) + '\n', colors.cyan);
}

generateManifest();










