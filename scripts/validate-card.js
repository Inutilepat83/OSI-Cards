#!/usr/bin/env node
/**
 * Card Configuration Validation CLI Tool
 * 
 * Validates card JSON configurations before runtime.
 * Checks required fields, validates section types, and suggests improvements.
 * 
 * Usage:
 *   node scripts/validate-card.js <path-to-card.json>
 *   node scripts/validate-card.js src/assets/configs/companies/company-1.json
 * 
 * Exit codes:
 *   0 - Validation passed
 *   1 - Validation failed
 */

const fs = require('fs');
const path = require('path');

// Valid section types
const VALID_SECTION_TYPES = [
  'info', 'analytics', 'overview', 'list', 'event', 'product', 'solutions',
  'contact-card', 'network-card', 'map', 'chart', 'financials', 'news',
  'social-media', 'quotation', 'text-reference', 'brand-colors', 'fallback',
  'timeline', 'metrics', 'stats', 'table', 'locations', 'reference', 'text-ref',
  'quote', 'brands', 'colors', 'project'
];

// Valid action types
const VALID_ACTION_TYPES = ['primary', 'secondary', 'mail', 'website', 'agent', 'question'];

// Card limits
const LIMITS = {
  MAX_SECTIONS: 20,
  MAX_ACTIONS: 10,
  MAX_FIELDS_PER_SECTION: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_SUBTITLE_LENGTH: 500
};

/**
 * Validate card configuration
 */
function validateCard(card) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // Check required fields
  if (!card.cardTitle) {
    errors.push('Missing required field: cardTitle');
  }

  if (!card.sections || !Array.isArray(card.sections) || card.sections.length === 0) {
    errors.push('Card must have at least one section');
  }

  // Validate card title length
  if (card.cardTitle && card.cardTitle.length > LIMITS.MAX_TITLE_LENGTH) {
    warnings.push(
      `Card title exceeds recommended length (${card.cardTitle.length} > ${LIMITS.MAX_TITLE_LENGTH})`
    );
  }

  // Validate subtitle length
  if (card.cardSubtitle && card.cardSubtitle.length > LIMITS.MAX_SUBTITLE_LENGTH) {
    warnings.push(
      `Card subtitle exceeds recommended length (${card.cardSubtitle.length} > ${LIMITS.MAX_SUBTITLE_LENGTH})`
    );
  }

  // Check section count
  if (card.sections && card.sections.length > LIMITS.MAX_SECTIONS) {
    warnings.push(
      `Card has ${card.sections.length} sections, exceeding recommended limit of ${LIMITS.MAX_SECTIONS}`
    );
  }

  // Check actions count
  if (card.actions && card.actions.length > LIMITS.MAX_ACTIONS) {
    warnings.push(
      `Card has ${card.actions.length} actions, exceeding recommended limit of ${LIMITS.MAX_ACTIONS}`
    );
  }

  // Validate sections
  if (card.sections) {
    card.sections.forEach((section, index) => {
      const sectionErrors = validateSection(section, index);
      const sectionWarnings = validateSectionWarnings(section, index);
      const sectionSuggestions = validateSectionSuggestions(section, index);
      
      errors.push(...sectionErrors);
      warnings.push(...sectionWarnings);
      suggestions.push(...sectionSuggestions);
    });
  }

  // Validate actions
  if (card.actions) {
    card.actions.forEach((action, index) => {
      const actionErrors = validateAction(action, index);
      const actionWarnings = validateActionWarnings(action, index);
      
      errors.push(...actionErrors);
      warnings.push(...actionWarnings);
    });
  }

  return { errors, warnings, suggestions };
}

/**
 * Validate section
 */
function validateSection(section, index) {
  const errors = [];
  const sectionKey = `Section ${index + 1}`;

  if (!section.title) {
    errors.push(`${sectionKey}: Missing required field 'title'`);
  }

  if (!section.type) {
    errors.push(`${sectionKey}: Missing required field 'type'`);
  } else if (!VALID_SECTION_TYPES.includes(section.type)) {
    errors.push(
      `${sectionKey}: Invalid section type '${section.type}'. ` +
      `Valid types: ${VALID_SECTION_TYPES.join(', ')}`
    );
  }

  // Check fields vs items
  if (section.fields && section.items) {
    errors.push(
      `${sectionKey}: Section has both 'fields' and 'items'. ` +
      `Use 'fields' for key-value pairs or 'items' for lists, not both.`
    );
  }

  // Check field count
  if (section.fields && section.fields.length > LIMITS.MAX_FIELDS_PER_SECTION) {
    errors.push(
      `${sectionKey}: Section has ${section.fields.length} fields, ` +
      `exceeding limit of ${LIMITS.MAX_FIELDS_PER_SECTION}`
    );
  }

  return errors;
}

/**
 * Validate section warnings
 */
function validateSectionWarnings(section, index) {
  const warnings = [];
  const sectionKey = `Section ${index + 1}`;

  if (!section.description && section.fields && section.fields.length > 5) {
    warnings.push(
      `${sectionKey}: Consider adding a description for sections with many fields`
    );
  }

  return warnings;
}

/**
 * Validate section suggestions
 */
function validateSectionSuggestions(section, index) {
  const suggestions = [];
  const sectionKey = `Section ${index + 1}`;

  // Suggest using analytics for numeric data
  if (section.fields && section.fields.some(f => typeof f.value === 'number' || f.percentage)) {
    if (section.type !== 'analytics' && section.type !== 'overview') {
      suggestions.push(
        `${sectionKey}: Consider using 'analytics' type for numeric/metric data`
      );
    }
  }

  return suggestions;
}

/**
 * Validate action
 */
function validateAction(action, index) {
  const errors = [];
  const actionKey = `Action ${index + 1}`;

  if (!action.label) {
    errors.push(`${actionKey}: Missing required field 'label'`);
  }

  // Validate mail action
  if (action.type === 'mail') {
    if (!action.email) {
      errors.push(`${actionKey}: Mail action requires 'email' configuration`);
    } else {
      if (!action.email.subject) {
        errors.push(`${actionKey}: Mail action requires 'email.subject'`);
      }
      if (!action.email.body) {
        errors.push(`${actionKey}: Mail action requires 'email.body'`);
      }
      if (!action.email.contact?.email && !action.email.to) {
        errors.push(`${actionKey}: Mail action requires 'email.to' or 'email.contact.email'`);
      }
    }
  }

  // Validate website action
  if (action.type === 'website') {
    const url = action.url || action.action;
    if (!url || url === '#') {
      errors.push(`${actionKey}: Website action requires valid 'url' or 'action' property`);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      errors.push(`${actionKey}: Website URL should start with 'http://' or 'https://'`);
    }
  }

  return errors;
}

/**
 * Validate action warnings
 */
function validateActionWarnings(action, index) {
  const warnings = [];
  const actionKey = `Action ${index + 1}`;

  if (action.type && !VALID_ACTION_TYPES.includes(action.type)) {
    warnings.push(
      `${actionKey}: Unknown action type '${action.type}'. ` +
      `Valid types: ${VALID_ACTION_TYPES.join(', ')}`
    );
  }

  return warnings;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/validate-card.js <path-to-card.json>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  let card;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    card = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error: Failed to parse JSON file: ${error.message}`);
    process.exit(1);
  }

  const { errors, warnings, suggestions } = validateCard(card);

  // Print results
  console.log(`\n📋 Validating: ${path.basename(filePath)}\n`);

  if (errors.length === 0 && warnings.length === 0 && suggestions.length === 0) {
    console.log('✅ Validation passed! No issues found.\n');
    process.exit(0);
  }

  // Print errors
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(error => console.log(`   • ${error}`));
    console.log('');
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('');
  }

  // Print suggestions
  if (suggestions.length > 0) {
    console.log('💡 Suggestions:');
    suggestions.forEach(suggestion => console.log(`   • ${suggestion}`));
    console.log('');
  }

  // Exit with error code if there are errors
  if (errors.length > 0) {
    console.log(`\n❌ Validation failed with ${errors.length} error(s).\n`);
    process.exit(1);
  }

  console.log(`\n⚠️  Validation completed with ${warnings.length} warning(s).\n`);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateCard, VALID_SECTION_TYPES, VALID_ACTION_TYPES, LIMITS };












