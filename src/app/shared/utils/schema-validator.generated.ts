/**
 * AUTO-GENERATED FILE
 * Card Schema Validator generated from section-registry.json
 * Run: npm run generate:tests
 */

import { AICardConfig, CardSection } from '../../../../projects/osi-cards-lib/src/lib/models';

/**
 * Valid section types from registry
 */
export const VALID_SECTION_TYPES = ["info","analytics","contact-card","network-card","map","financials","event","list","chart","product","solutions","overview","quotation","text-reference","brand-colors","news","social-media","fallback"];

/**
 * Type aliases map
 */
export const TYPE_ALIASES: Record<string, string> = {"metrics":"analytics","stats":"analytics","timeline":"event","table":"list","locations":"map","quote":"quotation","reference":"text-reference","text-ref":"text-reference","brands":"brand-colors","colors":"brand-colors"};

/**
 * Section metadata for validation
 */
export const SECTION_VALIDATION_RULES: Record<string, {
  usesFields: boolean;
  usesItems: boolean;
  usesChartData?: boolean;
  requiredFields?: string[];
}> = {
  "info": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "analytics": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "contact-card": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "network-card": {
    "usesFields": false,
    "usesItems": true,
    "usesChartData": false
  },
  "map": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "financials": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "event": {
    "usesFields": true,
    "usesItems": true,
    "usesChartData": false
  },
  "list": {
    "usesFields": false,
    "usesItems": true,
    "usesChartData": false
  },
  "chart": {
    "usesFields": false,
    "usesItems": false,
    "usesChartData": true
  },
  "product": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "solutions": {
    "usesFields": true,
    "usesItems": true,
    "usesChartData": false
  },
  "overview": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "quotation": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "text-reference": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "brand-colors": {
    "usesFields": true,
    "usesItems": false,
    "usesChartData": false
  },
  "news": {
    "usesFields": false,
    "usesItems": true,
    "usesChartData": false
  },
  "social-media": {
    "usesFields": true,
    "usesItems": true,
    "usesChartData": false
  },
  "fallback": {
    "usesFields": true,
    "usesItems": true,
    "usesChartData": false
  }
};

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate a card configuration
 */
export function validateCardConfig(config: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({ path: '', message: 'Config must be an object', severity: 'error' });
    return errors;
  }

  const card = config as Record<string, unknown>;

  // Validate required fields
  if (!card['cardTitle'] || typeof card['cardTitle'] !== 'string') {
    errors.push({ path: 'cardTitle', message: 'cardTitle is required and must be a string', severity: 'error' });
  }

  if (!Array.isArray(card['sections'])) {
    errors.push({ path: 'sections', message: 'sections must be an array', severity: 'error' });
    return errors;
  }

  // Validate each section
  (card['sections'] as unknown[]).forEach((section, index) => {
    const sectionErrors = validateSection(section, index);
    errors.push(...sectionErrors);
  });

  return errors;
}

/**
 * Validate a single section
 */
export function validateSection(section: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `sections[${index}]`;

  if (!section || typeof section !== 'object') {
    errors.push({ path, message: 'Section must be an object', severity: 'error' });
    return errors;
  }

  const sec = section as Record<string, unknown>;

  // Validate title
  if (!sec['title'] || typeof sec['title'] !== 'string') {
    errors.push({ path: `${path}.title`, message: 'title is required and must be a string', severity: 'error' });
  }

  // Validate type
  if (!sec['type'] || typeof sec['type'] !== 'string') {
    errors.push({ path: `${path}.type`, message: 'type is required and must be a string', severity: 'error' });
    return errors;
  }

  const type = sec['type'] as string;
  const resolvedType = TYPE_ALIASES[type] || type;

  if (!VALID_SECTION_TYPES.includes(resolvedType)) {
    errors.push({ 
      path: `${path}.type`, 
      message: `Unknown section type '${type}'. Valid types: ${VALID_SECTION_TYPES.join(', ')}`,
      severity: 'warning'
    });
    return errors;
  }

  // Validate data structure
  const rules = SECTION_VALIDATION_RULES[resolvedType];
  if (rules) {
    if (rules.usesFields && !Array.isArray(sec['fields']) && !rules.usesItems) {
      errors.push({ 
        path: `${path}.fields`, 
        message: `Section type '${type}' expects fields array`,
        severity: 'warning'
      });
    }

    if (rules.usesItems && !Array.isArray(sec['items']) && !rules.usesFields) {
      errors.push({ 
        path: `${path}.items`, 
        message: `Section type '${type}' expects items array`,
        severity: 'warning'
      });
    }

    if (rules.usesChartData && !sec['chartData']) {
      errors.push({ 
        path: `${path}.chartData`, 
        message: `Section type '${type}' expects chartData`,
        severity: 'warning'
      });
    }
  }

  return errors;
}

/**
 * Check if a card config is valid
 */
export function isValidCardConfig(config: unknown): config is AICardConfig {
  const errors = validateCardConfig(config);
  return errors.filter(e => e.severity === 'error').length === 0;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'No errors found';
  
  return errors.map(e => `[${e.severity.toUpperCase()}] ${e.path}: ${e.message}`).join('\n');
}
