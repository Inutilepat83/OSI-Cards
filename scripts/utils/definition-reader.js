#!/usr/bin/env node

/**
 * Centralized utility for reading section definition files
 *
 * This module provides functions to discover and read all section definition files
 * (*.definition.json) from the sections directory, ensuring a single source of truth.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const sectionsDir = path.join(
  rootDir,
  'projects',
  'osi-cards-lib',
  'src',
  'lib',
  'components',
  'sections'
);

/**
 * Load a single section definition file
 * @param {string} sectionType - The section type (e.g., 'analytics', 'chart')
 * @returns {object|null} The definition object or null if not found
 */
function loadSectionDefinition(sectionType) {
  const definitionPath = path.join(
    sectionsDir,
    `${sectionType}-section`,
    `${sectionType}.definition.json`
  );

  if (fs.existsSync(definitionPath)) {
    try {
      const content = fs.readFileSync(definitionPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to parse definition file for ${sectionType}:`, error.message);
      return null;
    }
  }

  return null;
}

/**
 * Discover all section types by scanning for definition files
 * @returns {string[]} Array of section type identifiers
 */
function discoverAllSectionTypes() {
  if (!fs.existsSync(sectionsDir)) {
    console.warn(`Sections directory not found: ${sectionsDir}`);
    return [];
  }

  const sectionTypes = [];
  const entries = fs.readdirSync(sectionsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith('-section')) {
      const sectionType = entry.name.replace('-section', '');
      const definitionPath = path.join(sectionsDir, entry.name, `${sectionType}.definition.json`);

      if (fs.existsSync(definitionPath)) {
        sectionTypes.push(sectionType);
      }
    }
  }

  return sectionTypes.sort();
}

/**
 * Read all section definition files
 * @returns {Map<string, object>} Map of section type to definition object
 */
function readAllDefinitions() {
  const definitions = new Map();
  const sectionTypes = discoverAllSectionTypes();

  for (const sectionType of sectionTypes) {
    const definition = loadSectionDefinition(sectionType);
    if (definition) {
      definitions.set(sectionType, definition);
    }
  }

  return definitions;
}

/**
 * Get all section types as an array
 * @returns {string[]} Array of section type identifiers
 */
function getSectionTypes() {
  return discoverAllSectionTypes();
}

/**
 * Get all section aliases mapped to their canonical types
 * @returns {Map<string, string>} Map of alias to canonical type
 */
function getSectionAliases() {
  const aliases = new Map();
  const definitions = readAllDefinitions();

  for (const [type, definition] of definitions.entries()) {
    if (definition.aliases && Array.isArray(definition.aliases)) {
      for (const alias of definition.aliases) {
        aliases.set(alias, type);
      }
    }
  }

  return aliases;
}

/**
 * Get all section types including aliases (for enum generation)
 * @returns {string[]} Array of all valid section type identifiers (types + aliases)
 */
function getAllSectionTypeIdentifiers() {
  const types = getSectionTypes();
  const aliases = Array.from(getSectionAliases().keys());
  return [...new Set([...types, ...aliases])].sort();
}

/**
 * Get section metadata for a specific type
 * @param {string} sectionType - The section type
 * @returns {object|null} Section metadata object with name, description, useCases, bestPractices, etc.
 */
function getSectionMetadata(sectionType) {
  const definition = loadSectionDefinition(sectionType);
  if (!definition) {
    return null;
  }

  return {
    type: definition.type || sectionType,
    name: definition.name || `${sectionType} Section`,
    description: definition.description || '',
    portfolioDescription: definition.portfolioDescription || definition.description || '',
    useCases: definition.useCases || [],
    bestPractices: definition.bestPractices || [],
    rendering: definition.rendering || {},
    aliases: definition.aliases || [],
    examples: definition.examples || {},
    fieldSchema: definition.fieldSchema,
    itemSchema: definition.itemSchema,
    chartDataSchema: definition.chartDataSchema,
    tableDataSchema: definition.tableDataSchema,
    completionRules: definition.completionRules || {},
  };
}

module.exports = {
  loadSectionDefinition,
  discoverAllSectionTypes,
  readAllDefinitions,
  getSectionTypes,
  getSectionAliases,
  getAllSectionTypeIdentifiers,
  getSectionMetadata,
  sectionsDir,
};
