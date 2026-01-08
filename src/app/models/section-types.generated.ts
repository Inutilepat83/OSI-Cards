/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * This file is generated from section definition files (*.definition.json).
 * Run: npm run generate:section-types
 *
 * Last generated: 2026-01-08T15:34:59.224Z
 */

/**
 * All valid section type identifiers (canonical types + aliases)
 * Generated from section definition files
 *
 * This array is used by Zod schemas for runtime validation.
 */
export const SECTION_TYPE_IDENTIFIERS = [
  'analytics',
  'articles',
  'brand-colors',
  'brands',
  'calendar',
  'chart',
  'checklist',
  'colors',
  'contact-card',
  'data-table',
  'documentation',
  'event',
  'executive',
  'faq',
  'financials',
  'gallery',
  'graph',
  'grid',
  'help',
  'history',
  'images',
  'kpi',
  'list',
  'locations',
  'map',
  'media',
  'metrics',
  'milestones',
  'network-card',
  'news',
  'offerings',
  'overview',
  'palette',
  'photos',
  'press',
  'product',
  'questions',
  'quotation',
  'quote',
  'reference',
  'schedule',
  'services',
  'social',
  'social-media',
  'socials',
  'solutions',
  'stats',
  'summary',
  'table',
  'testimonial',
  'text-ref',
  'text-reference',
  'timeline',
  'video',
  'videos',
  'visualization'
] as const;

/**
 * Type-safe array for Zod enum (ensures at least one element)
 */
export const SECTION_TYPE_IDENTIFIERS_FOR_ZOD = SECTION_TYPE_IDENTIFIERS as readonly [
  'analytics',
  ...string[]
];

export type SectionTypeIdentifier = typeof SECTION_TYPE_IDENTIFIERS[number];

/**
 * Canonical section types (from definition file 'type' field)
 */
export const CANONICAL_SECTION_TYPES = [
  'analytics',
  'brand-colors',
  'chart',
  'contact-card',
  'event',
  'faq',
  'financials',
  'gallery',
  'list',
  'map',
  'network-card',
  'news',
  'overview',
  'product',
  'quotation',
  'social-media',
  'solutions',
  'table',
  'text-reference',
  'timeline',
  'video'
] as const;

export type CanonicalSectionType = typeof CANONICAL_SECTION_TYPES[number];

/**
 * Section type aliases mapped to canonical types
 */
export const SECTION_TYPE_ALIASES: Record<string, CanonicalSectionType> = {
  'metrics': 'analytics',
  'stats': 'analytics',
  'kpi': 'analytics',
  'brands': 'brand-colors',
  'colors': 'brand-colors',
  'palette': 'brand-colors',
  'graph': 'chart',
  'visualization': 'chart',
  'calendar': 'event',
  'schedule': 'event',
  'questions': 'faq',
  'help': 'faq',
  'photos': 'gallery',
  'images': 'gallery',
  'table': 'list',
  'checklist': 'list',
  'locations': 'map',
  'press': 'news',
  'articles': 'news',
  'summary': 'overview',
  'executive': 'overview',
  'quote': 'quotation',
  'testimonial': 'quotation',
  'social': 'social-media',
  'socials': 'social-media',
  'services': 'solutions',
  'offerings': 'solutions',
  'data-table': 'table',
  'grid': 'table',
  'reference': 'text-reference',
  'text-ref': 'text-reference',
  'documentation': 'text-reference',
  'history': 'timeline',
  'milestones': 'timeline',
  'videos': 'video',
  'media': 'video'
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
