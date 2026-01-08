#!/usr/bin/env node

/**
 * Generate TypeScript section type enum from definition files
 *
 * This script reads all section definition files and generates a TypeScript file
 * containing the section type enum and aliases for use in schemas and type checking.
 *
 * Generated file: src/app/models/section-types.generated.ts
 */

const fs = require('fs');
const path = require('path');
const {
  getSectionTypes,
  getAllSectionTypeIdentifiers,
  getSectionAliases
} = require('./utils/definition-reader');

const rootDir = path.join(__dirname, '..');
const outputPath = path.join(rootDir, 'src', 'app', 'models', 'section-types.generated.ts');

function generateSectionTypes() {
  console.log('🔍 Discovering section types from definition files...');

  const sectionTypes = getSectionTypes();
  const allIdentifiers = getAllSectionTypeIdentifiers();
  const aliases = getSectionAliases();

  if (sectionTypes.length === 0) {
    console.error('❌ No section types found. Make sure definition files exist.');
    process.exit(1);
  }

  console.log(`📝 Found ${sectionTypes.length} section types with ${aliases.size} aliases`);

  // Generate TypeScript file content
  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * 
 * This file is generated from section definition files (*.definition.json).
 * Run: npm run generate:section-types
 * 
 * Last generated: ${new Date().toISOString()}
 */

/**
 * All valid section type identifiers (canonical types + aliases)
 * Generated from section definition files
 * 
 * This array is used by Zod schemas for runtime validation.
 */
export const SECTION_TYPE_IDENTIFIERS = [
${allIdentifiers.map(type => `  '${type}'`).join(',\n')}
] as const;

/**
 * Type-safe array for Zod enum (ensures at least one element)
 */
export const SECTION_TYPE_IDENTIFIERS_FOR_ZOD = SECTION_TYPE_IDENTIFIERS as readonly [
  ${allIdentifiers[0] ? `'${allIdentifiers[0]}'` : 'string'},
  ...string[]
];

export type SectionTypeIdentifier = typeof SECTION_TYPE_IDENTIFIERS[number];

/**
 * Canonical section types (from definition file 'type' field)
 */
export const CANONICAL_SECTION_TYPES = [
${sectionTypes.map(type => `  '${type}'`).join(',\n')}
] as const;

export type CanonicalSectionType = typeof CANONICAL_SECTION_TYPES[number];

/**
 * Section type aliases mapped to canonical types
 */
export const SECTION_TYPE_ALIASES: Record<string, CanonicalSectionType> = {
${Array.from(aliases.entries())
  .map(([alias, canonical]) => `  '${alias}': '${canonical}'`)
  .join(',\n')}
};

/**
 * Resolve a section type identifier (type or alias) to its canonical type
 */
export function resolveSectionType(identifier: string): CanonicalSectionType | null {
  // Check if it's already a canonical type
  if (CANONICAL_SECTION_TYPES.includes(identifier as CanonicalSectionType)) {
    return identifier as CanonicalSectionType;
  }
  
  // Check if it's an alias
  return SECTION_TYPE_ALIASES[identifier] || null;
}

/**
 * Check if a string is a valid section type identifier
 */
export function isValidSectionType(identifier: string): identifier is SectionTypeIdentifier {
  return SECTION_TYPE_IDENTIFIERS.includes(identifier as SectionTypeIdentifier);
}
`;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write generated file
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   - ${sectionTypes.length} canonical types`);
  console.log(`   - ${aliases.size} aliases`);
  console.log(`   - ${allIdentifiers.length} total identifiers`);
}

try {
  generateSectionTypes();
} catch (error) {
  console.error('❌ Error generating section types:', error);
  process.exit(1);
}
