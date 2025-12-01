#!/usr/bin/env node

/**
 * Generate TypeScript Fixtures from Section Registry
 * 
 * This script generates typed test fixtures from the section-registry.json.
 * It creates a single source of truth for all section examples used in:
 * - Unit tests
 * - Integration tests
 * - E2E tests
 * - Documentation
 * - Demo applications
 * 
 * Usage: node scripts/generate-registry-fixtures.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'registry', 'fixtures.generated.ts');
const SECTION_REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'src', 'lib', 'registry', 'section-registry.ts');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Load the registry
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry not found at: ${REGISTRY_PATH}`);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

/**
 * Generate the section registry TypeScript file
 */
function generateSectionRegistry(registry) {
  log('\n📄 Generating Section Registry TypeScript...', colors.cyan);
  
  const sectionTypes = Object.keys(registry.sections).filter(
    type => !registry.sections[type].isInternal
  );
  
  const content = `/**
 * Section Registry - Single Source of Truth
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:registry-fixtures
 * 
 * This file provides typed access to all section definitions from the registry.
 */

import type { CardSection } from '../models/card.model';
import { SectionType } from '../models/generated-section-types';

/**
 * Section definition from registry
 */
export interface SectionDefinition {
  name: string;
  description: string;
  componentPath: string;
  stylePath?: string;
  selector: string;
  useCases: string[];
  bestPractices: string[];
  rendering: {
    usesFields: boolean;
    usesItems: boolean;
    usesChartData?: boolean;
    defaultColumns: number;
    supportsCollapse?: boolean;
    supportsEmoji?: boolean;
    requiresExternalLib?: string;
  };
  aliases?: string[];
  isInternal?: boolean;
}

/**
 * Registry metadata
 */
export const REGISTRY_VERSION = '${registry.version}';
export const REGISTRY_DESCRIPTION = '${registry.description}';

/**
 * All public section types (excludes internal sections)
 */
export const PUBLIC_SECTION_TYPES: SectionType[] = [
${sectionTypes.map(type => `  '${type}'`).join(',\n')}
];

/**
 * Section type aliases mapping
 */
export const TYPE_ALIASES: Record<string, SectionType> = ${JSON.stringify(registry.typeAliases || {}, null, 2).replace(/"/g, "'")};

/**
 * Default section type for unknown types
 */
export const DEFAULT_SECTION_TYPE: SectionType = '${registry.defaultSection || 'fallback'}';

/**
 * Section definitions from registry
 */
export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
${Object.entries(registry.sections).map(([type, def]) => `  '${type}': {
    name: '${def.name}',
    description: '${def.description.replace(/'/g, "\\'")}',
    componentPath: '${def.componentPath}',
    stylePath: ${def.stylePath ? `'${def.stylePath}'` : 'undefined'},
    selector: '${def.selector}',
    useCases: ${JSON.stringify(def.useCases || [])},
    bestPractices: ${JSON.stringify(def.bestPractices || [])},
    rendering: {
      usesFields: ${def.rendering.usesFields},
      usesItems: ${def.rendering.usesItems},
      usesChartData: ${def.rendering.usesChartData || false},
      defaultColumns: ${def.rendering.defaultColumns},
      supportsCollapse: ${def.rendering.supportsCollapse || false},
      supportsEmoji: ${def.rendering.supportsEmoji || false},
      requiresExternalLib: ${def.rendering.requiresExternalLib ? `'${def.rendering.requiresExternalLib}'` : 'undefined'}
    },
    aliases: ${JSON.stringify(def.aliases || [])},
    isInternal: ${def.isInternal || false}
  }`).join(',\n')}
};

/**
 * Get section definition by type
 */
export function getSectionDefinition(type: SectionType): SectionDefinition {
  return SECTION_DEFINITIONS[type];
}

/**
 * Check if a section type uses fields
 */
export function sectionUsesFields(type: SectionType): boolean {
  return SECTION_DEFINITIONS[type]?.rendering.usesFields ?? false;
}

/**
 * Check if a section type uses items
 */
export function sectionUsesItems(type: SectionType): boolean {
  return SECTION_DEFINITIONS[type]?.rendering.usesItems ?? false;
}

/**
 * Get default column count for a section type
 */
export function getDefaultColumns(type: SectionType): number {
  return SECTION_DEFINITIONS[type]?.rendering.defaultColumns ?? 1;
}
`;

  fs.writeFileSync(SECTION_REGISTRY_PATH, content, 'utf8');
  log(`  ✓ Generated ${SECTION_REGISTRY_PATH}`, colors.green);
}

/**
 * Sanitize fixture data to ensure TypeScript compatibility
 * Maps registry status values to valid CardField status types
 */
function sanitizeFixture(fixture) {
  if (!fixture) return fixture;
  
  const statusMapping = {
    'confirmed': 'active',
    'planned': 'pending',
    'tentative': 'pending',
    'published': 'active',
    'draft': 'pending',
    'archived': 'inactive'
  };
  
  const sanitized = JSON.parse(JSON.stringify(fixture));
  
  // Sanitize fields
  if (sanitized.fields && Array.isArray(sanitized.fields)) {
    sanitized.fields = sanitized.fields.map(field => {
      if (field.status && statusMapping[field.status]) {
        field.status = statusMapping[field.status];
      }
      return field;
    });
  }
  
  // Sanitize items
  if (sanitized.items && Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map(item => {
      if (item.status && statusMapping[item.status]) {
        item.status = statusMapping[item.status];
      }
      return item;
    });
  }
  
  return sanitized;
}

/**
 * Generate the fixtures TypeScript file
 */
function generateFixtures(registry) {
  log('\n📄 Generating TypeScript Fixtures...', colors.cyan);
  
  const sectionTypes = Object.keys(registry.sections);
  
  // Build complete fixtures (exclude internal sections like fallback)
  const completeFixtures = [];
  const minimalFixtures = [];
  const edgeCaseFixtures = [];
  
  sectionTypes.forEach(type => {
    const def = registry.sections[type];
    // Skip internal sections for fixtures
    if (def.isInternal) return;
    
    if (def.testFixtures) {
      if (def.testFixtures.complete) {
        completeFixtures.push({ type, fixture: sanitizeFixture(def.testFixtures.complete) });
      }
      if (def.testFixtures.minimal) {
        minimalFixtures.push({ type, fixture: sanitizeFixture(def.testFixtures.minimal) });
      }
      if (def.testFixtures.edgeCases) {
        edgeCaseFixtures.push({ type, fixture: sanitizeFixture(def.testFixtures.edgeCases) });
      }
    }
  });

  const content = `/**
 * Section Test Fixtures - Single Source of Truth
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Generated from section-registry.json
 * Run: npm run generate:registry-fixtures
 * 
 * These fixtures are the ONLY source of test data for all section types.
 * Do NOT create hardcoded section examples elsewhere in the codebase.
 */

import type { CardSection, AICardConfig } from '../models/card.model';
import { SectionType } from '../models/generated-section-types';

// ============================================================================
// FIXTURE TYPES
// ============================================================================

/**
 * Available fixture types
 */
export type FixtureCategory = 'complete' | 'minimal' | 'edgeCases';

/**
 * Section fixtures record by type
 */
export type SectionFixtures = Record<SectionType, CardSection>;

// ============================================================================
// COMPLETE FIXTURES (All fields populated)
// ============================================================================

/**
 * Complete section fixtures - all fields populated with realistic data
 * Use for: visual regression tests, documentation examples, demos
 */
export const COMPLETE_FIXTURES: Partial<SectionFixtures> = {
${completeFixtures.map(({ type, fixture }) => 
  `  '${type}': ${JSON.stringify(fixture, null, 4).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')}`
).join(',\n')}
};

// ============================================================================
// MINIMAL FIXTURES (Required fields only)
// ============================================================================

/**
 * Minimal section fixtures - only required fields
 * Use for: unit tests, validation tests, boundary testing
 */
export const MINIMAL_FIXTURES: Partial<SectionFixtures> = {
${minimalFixtures.map(({ type, fixture }) => 
  `  '${type}': ${JSON.stringify(fixture, null, 4).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')}`
).join(',\n')}
};

// ============================================================================
// EDGE CASE FIXTURES (Boundary values, special chars, etc.)
// ============================================================================

/**
 * Edge case section fixtures - boundary values and special cases
 * Use for: edge case testing, error handling, XSS prevention
 */
export const EDGE_CASE_FIXTURES: Partial<SectionFixtures> = {
${edgeCaseFixtures.map(({ type, fixture }) => 
  `  '${type}': ${JSON.stringify(fixture, null, 4).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')}`
).join(',\n')}
};

// ============================================================================
// FIXTURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a fixture for a specific section type and category
 */
export function getFixture(
  type: SectionType,
  category: FixtureCategory = 'complete'
): CardSection | undefined {
  switch (category) {
    case 'complete':
      return COMPLETE_FIXTURES[type];
    case 'minimal':
      return MINIMAL_FIXTURES[type];
    case 'edgeCases':
      return EDGE_CASE_FIXTURES[type];
    default:
      return COMPLETE_FIXTURES[type];
  }
}

/**
 * Get all fixtures for a category
 */
export function getAllFixtures(category: FixtureCategory = 'complete'): CardSection[] {
  const fixtures = category === 'complete' 
    ? COMPLETE_FIXTURES 
    : category === 'minimal' 
      ? MINIMAL_FIXTURES 
      : EDGE_CASE_FIXTURES;
  
  return Object.values(fixtures).filter((f): f is CardSection => f !== undefined);
}

/**
 * Get fixture with unique ID (for tests that need multiple instances)
 */
export function getFixtureWithUniqueId(
  type: SectionType,
  category: FixtureCategory = 'complete'
): CardSection | undefined {
  const fixture = getFixture(type, category);
  if (!fixture) return undefined;
  
  return {
    ...fixture,
    id: \`\${fixture.id || type}-\${Math.random().toString(36).substring(7)}\`
  };
}

// ============================================================================
// SAMPLE CARDS (Pre-built cards using fixtures)
// ============================================================================

/**
 * Sample company card using registry fixtures
 */
export const SAMPLE_COMPANY_CARD: AICardConfig = {
  id: 'sample-company',
  cardTitle: 'Acme Corporation',
  cardType: 'company',
  description: 'A sample company card built from registry fixtures',
  sections: [
    COMPLETE_FIXTURES['info']!,
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['contact-card']!
  ].filter(Boolean),
  actions: [
    { id: 'view', label: 'View Profile', variant: 'primary' },
    { id: 'contact', label: 'Contact', variant: 'secondary' }
  ]
};

/**
 * Sample analytics card using registry fixtures
 */
export const SAMPLE_ANALYTICS_CARD: AICardConfig = {
  id: 'sample-analytics',
  cardTitle: 'Q4 Performance Dashboard',
  cardType: 'analytics',
  sections: [
    COMPLETE_FIXTURES['analytics']!,
    COMPLETE_FIXTURES['chart']!,
    COMPLETE_FIXTURES['financials']!
  ].filter(Boolean)
};

/**
 * Sample news card using registry fixtures
 */
export const SAMPLE_NEWS_CARD: AICardConfig = {
  id: 'sample-news',
  cardTitle: 'Latest Updates',
  sections: [
    COMPLETE_FIXTURES['news']!,
    COMPLETE_FIXTURES['event']!
  ].filter(Boolean)
};

/**
 * All sections card (complete fixtures)
 */
export const ALL_SECTIONS_CARD: AICardConfig = {
  id: 'all-sections',
  cardTitle: 'All Section Types Demo',
  description: 'Card containing all section types for comprehensive testing',
  sections: getAllFixtures('complete')
};

/**
 * Minimal all sections card
 */
export const MINIMAL_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'minimal-all-sections',
  cardTitle: 'Minimal Sections',
  sections: getAllFixtures('minimal')
};

/**
 * Edge case all sections card
 */
export const EDGE_CASE_ALL_SECTIONS_CARD: AICardConfig = {
  id: 'edge-case-all-sections',
  cardTitle: 'Edge Case Sections',
  sections: getAllFixtures('edgeCases')
};

// ============================================================================
// COLLECTION EXPORTS
// ============================================================================

/**
 * All section fixtures organized by category
 */
export const SECTION_FIXTURES = {
  complete: COMPLETE_FIXTURES,
  minimal: MINIMAL_FIXTURES,
  edgeCases: EDGE_CASE_FIXTURES
} as const;

/**
 * All sample cards
 */
export const SAMPLE_CARDS = {
  company: SAMPLE_COMPANY_CARD,
  analytics: SAMPLE_ANALYTICS_CARD,
  news: SAMPLE_NEWS_CARD,
  allSections: ALL_SECTIONS_CARD,
  minimalAllSections: MINIMAL_ALL_SECTIONS_CARD,
  edgeCaseAllSections: EDGE_CASE_ALL_SECTIONS_CARD
} as const;

/**
 * Get available section types that have fixtures
 */
export function getAvailableSectionTypes(category: FixtureCategory = 'complete'): SectionType[] {
  const fixtures = SECTION_FIXTURES[category];
  return Object.keys(fixtures).filter(
    (key): key is SectionType => fixtures[key as SectionType] !== undefined
  );
}
`;

  fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
  log(`  ✓ Generated ${OUTPUT_PATH}`, colors.green);
  log(`    - ${completeFixtures.length} complete fixtures`, colors.blue);
  log(`    - ${minimalFixtures.length} minimal fixtures`, colors.blue);
  log(`    - ${edgeCaseFixtures.length} edge case fixtures`, colors.blue);
}

/**
 * Main execution
 */
function main() {
  log('\n🔧 Registry Fixtures Generator', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  
  try {
    const registry = loadRegistry();
    log(`\n📄 Loaded registry v${registry.version}`, colors.green);
    
    generateSectionRegistry(registry);
    generateFixtures(registry);
    
    log('\n' + '═'.repeat(60), colors.cyan);
    log('✅ Fixture generation complete!', colors.bright + colors.green);
    log('═'.repeat(60) + '\n', colors.cyan);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();

