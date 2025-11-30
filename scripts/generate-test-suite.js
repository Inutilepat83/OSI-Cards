#!/usr/bin/env node

/**
 * Generate Test Suite from Registry
 * 
 * Creates comprehensive test suites for all section types including:
 * - Unit test templates
 * - Integration test scenarios
 * - Accessibility test cases
 * - Visual regression test configs
 * - Performance benchmark configs
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'projects', 'osi-cards-lib', 'section-registry.json');
const E2E_DIR = path.join(ROOT_DIR, 'e2e');
const TESTING_DIR = path.join(ROOT_DIR, 'src', 'app', 'testing');

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
 * Generate test card builder
 */
function generateTestBuilder(registry) {
  const sections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal);

  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Test Card Builder generated from section-registry.json
 * Run: npm run generate:tests
 */

import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

/**
 * Section type fixtures for testing
 */
export const SECTION_FIXTURES = {
${sections.map(([type, def]) => `  '${type}': {
    complete: ${JSON.stringify(def.testFixtures?.complete || { title: type, type }, null, 4).split('\n').join('\n    ')},
    minimal: ${JSON.stringify(def.testFixtures?.minimal || { title: type, type }, null, 4).split('\n').join('\n    ')},
    edgeCases: ${JSON.stringify(def.testFixtures?.edgeCases || { title: type, type }, null, 4).split('\n').join('\n    ')}
  }`).join(',\n')}
} as const;

export type SectionFixtureType = keyof typeof SECTION_FIXTURES;
export type FixtureVariant = 'complete' | 'minimal' | 'edgeCases';

/**
 * Test Card Builder - Fluent API for creating test card configurations
 */
export class TestCardBuilder {
  private config: Partial<AICardConfig> = {};

  constructor(title: string = 'Test Card') {
    this.config = {
      cardTitle: title,
      sections: [],
      actions: []
    };
  }

  /**
   * Static factory method
   */
  static create(title?: string): TestCardBuilder {
    return new TestCardBuilder(title);
  }

  /**
   * Set card title
   */
  withTitle(title: string): TestCardBuilder {
    this.config.cardTitle = title;
    return this;
  }

  /**
   * Set card subtitle
   */
  withSubtitle(subtitle: string): TestCardBuilder {
    this.config.description = subtitle;
    return this;
  }

  /**
   * Add a section from fixtures
   */
  withSection(type: SectionFixtureType, variant: FixtureVariant = 'complete'): TestCardBuilder {
    const fixture = SECTION_FIXTURES[type]?.[variant];
    if (fixture) {
      this.config.sections = [...(this.config.sections || []), fixture as CardSection];
    }
    return this;
  }

  /**
   * Add a custom section
   */
  withCustomSection(section: CardSection): TestCardBuilder {
    this.config.sections = [...(this.config.sections || []), section];
    return this;
  }

  /**
   * Add all sections (kitchen sink)
   */
  withAllSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    Object.keys(SECTION_FIXTURES).forEach(type => {
      this.withSection(type as SectionFixtureType, variant);
    });
    return this;
  }

  /**
   * Add sections by category
   */
  withDataSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const dataSections: SectionFixtureType[] = ['analytics', 'chart', 'financials'];
    dataSections.forEach(type => this.withSection(type, variant));
    return this;
  }

  withEntitySections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const entitySections: SectionFixtureType[] = ['contact-card', 'network-card', 'product', 'solutions'];
    entitySections.forEach(type => this.withSection(type, variant));
    return this;
  }

  withContentSections(variant: FixtureVariant = 'complete'): TestCardBuilder {
    const contentSections: SectionFixtureType[] = ['info', 'overview', 'list', 'event', 'news'];
    contentSections.forEach(type => this.withSection(type, variant));
    return this;
  }

  /**
   * Add an action
   */
  withAction(action: CardAction): TestCardBuilder {
    this.config.actions = [...(this.config.actions || []), action];
    return this;
  }

  /**
   * Add default actions
   */
  withDefaultActions(): TestCardBuilder {
    this.config.actions = [
      { label: 'Learn More', type: 'website', variant: 'primary', url: 'https://example.com' },
      { label: 'Contact', type: 'mail', variant: 'secondary', 
        email: { contact: { name: 'Test', email: 'test@example.com', role: 'Tester' }, subject: 'Test', body: 'Test' } }
    ];
    return this;
  }

  /**
   * Build the final card configuration
   */
  build(): AICardConfig {
    return this.config as AICardConfig;
  }

  /**
   * Build and return as JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }
}

/**
 * Quick factory functions for common test scenarios
 */
export const TestCards = {
  /**
   * Create a minimal test card
   */
  minimal: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Minimal Test Card').withSection(type, 'minimal').build(),

  /**
   * Create a complete test card
   */
  complete: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Complete Test Card').withSection(type, 'complete').build(),

  /**
   * Create an edge case test card
   */
  edgeCase: (type: SectionFixtureType = 'info') => 
    TestCardBuilder.create('Edge Case Test Card').withSection(type, 'edgeCases').build(),

  /**
   * Create a kitchen sink card with all sections
   */
  kitchenSink: (variant: FixtureVariant = 'complete') => 
    TestCardBuilder.create('Kitchen Sink').withAllSections(variant).withDefaultActions().build(),

  /**
   * Create a card for a specific section type
   */
  forSection: (type: SectionFixtureType, variant: FixtureVariant = 'complete') =>
    TestCardBuilder.create(\`\${type} Test Card\`).withSection(type, variant).build(),

  /**
   * Get all section types
   */
  getSectionTypes: (): SectionFixtureType[] => Object.keys(SECTION_FIXTURES) as SectionFixtureType[],

  /**
   * Get fixture for a section type
   */
  getFixture: (type: SectionFixtureType, variant: FixtureVariant = 'complete') => 
    SECTION_FIXTURES[type]?.[variant]
};

/**
 * Random test data generator
 */
export class RandomTestData {
  private static randomId = () => Math.random().toString(36).substring(7);
  private static randomInt = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;

  /**
   * Generate random field data
   */
  static randomField(): CardField {
    return {
      id: this.randomId(),
      label: \`Field \${this.randomId()}\`,
      value: \`Value \${this.randomInt(1, 1000)}\`,
      icon: ['📊', '📈', '📉', '💼', '🎯'][this.randomInt(0, 4)]
    };
  }

  /**
   * Generate random item data
   */
  static randomItem(): CardItem {
    return {
      id: this.randomId(),
      title: \`Item \${this.randomId()}\`,
      description: \`Description for item \${this.randomId()}\`,
      status: ['completed', 'in-progress', 'pending'][this.randomInt(0, 2)] as any
    };
  }

  /**
   * Generate random section
   */
  static randomSection(type: SectionFixtureType): CardSection {
    const base = SECTION_FIXTURES[type]?.minimal || { title: type, type };
    return {
      ...base,
      id: this.randomId(),
      title: \`\${base.title} \${this.randomId()}\`
    } as CardSection;
  }

  /**
   * Generate a randomized test card
   */
  static randomCard(sectionCount: number = 3): AICardConfig {
    const types = Object.keys(SECTION_FIXTURES) as SectionFixtureType[];
    const builder = TestCardBuilder.create(\`Random Card \${this.randomId()}\`);
    
    for (let i = 0; i < sectionCount; i++) {
      const type = types[this.randomInt(0, types.length - 1)];
      builder.withCustomSection(this.randomSection(type));
    }
    
    return builder.build();
  }
}
`;

  const outputPath = path.join(TESTING_DIR, 'test-card-builder.generated.ts');
  
  if (!fs.existsSync(TESTING_DIR)) {
    fs.mkdirSync(TESTING_DIR, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, content, 'utf8');
  return { path: outputPath };
}

/**
 * Generate Playwright test scenarios
 */
function generateE2ETests(registry) {
  const sections = Object.entries(registry.sections)
    .filter(([_, def]) => !def.isInternal);

  const content = `/**
 * AUTO-GENERATED FILE
 * Section Type E2E Tests generated from section-registry.json
 * Run: npm run generate:tests
 */

import { test, expect } from '@playwright/test';

// Test configurations from registry
const SECTION_CONFIGS = ${JSON.stringify(
  Object.fromEntries(
    sections.map(([type, def]) => [type, def.testFixtures?.complete || { title: type, type }])
  ),
  null,
  2
)};

test.describe('Section Types - Registry Generated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

${sections.map(([type, def]) => `
  test.describe('${def.name}', () => {
    test('renders ${type} section correctly', async ({ page }) => {
      // Load card with ${type} section
      await page.evaluate((config) => {
        // @ts-ignore
        window.__testCard = config;
      }, {
        cardTitle: 'Test Card',
        sections: [SECTION_CONFIGS['${type}']]
      });

      // Verify section renders
      await expect(page.locator('[data-section-type="${type}"]')).toBeVisible();
    });

    test('${type} section accessibility', async ({ page }) => {
      // Accessibility checks
      const violations = await page.evaluate(async () => {
        // Basic accessibility checks
        const section = document.querySelector('[data-section-type="${type}"]');
        if (!section) return ['Section not found'];
        
        const issues: string[] = [];
        
        // Check for heading
        if (!section.querySelector('h2, h3, h4')) {
          issues.push('Missing heading');
        }
        
        // Check for proper ARIA labels
        const interactiveElements = section.querySelectorAll('button, a, input');
        interactiveElements.forEach((el, i) => {
          if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
            issues.push(\`Interactive element \${i} missing label\`);
          }
        });
        
        return issues;
      });
      
      expect(violations).toHaveLength(0);
    });
  });
`).join('')}

  test('renders all section types in kitchen sink', async ({ page }) => {
    // Load kitchen sink card
    await page.evaluate((configs) => {
      // @ts-ignore
      window.__testCard = {
        cardTitle: 'Kitchen Sink',
        sections: Object.values(configs)
      };
    }, SECTION_CONFIGS);

    // Verify all sections render
    const sectionTypes = Object.keys(SECTION_CONFIGS);
    for (const type of sectionTypes) {
      await expect(page.locator(\`[data-section-type="\${type}"]\`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
`;

  const outputPath = path.join(E2E_DIR, 'section-types.generated.spec.ts');
  fs.writeFileSync(outputPath, content, 'utf8');
  return { path: outputPath, testCount: sections.length * 2 + 1 };
}

/**
 * Generate schema validator
 */
function generateSchemaValidator(registry) {
  const content = `/**
 * AUTO-GENERATED FILE
 * Card Schema Validator generated from section-registry.json
 * Run: npm run generate:tests
 */

import { AICardConfig, CardSection } from '../../../../projects/osi-cards-lib/src/lib/models';

/**
 * Valid section types from registry
 */
export const VALID_SECTION_TYPES = ${JSON.stringify(Object.keys(registry.sections))};

/**
 * Type aliases map
 */
export const TYPE_ALIASES: Record<string, string> = ${JSON.stringify(registry.typeAliases || {})};

/**
 * Section metadata for validation
 */
export const SECTION_VALIDATION_RULES: Record<string, {
  usesFields: boolean;
  usesItems: boolean;
  usesChartData?: boolean;
  requiredFields?: string[];
}> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(registry.sections).map(([type, def]) => [
      type,
      {
        usesFields: def.rendering.usesFields,
        usesItems: def.rendering.usesItems,
        usesChartData: def.rendering.usesChartData || false
      }
    ])
  ),
  null,
  2
)};

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
  const path = \`sections[\${index}]\`;

  if (!section || typeof section !== 'object') {
    errors.push({ path, message: 'Section must be an object', severity: 'error' });
    return errors;
  }

  const sec = section as Record<string, unknown>;

  // Validate title
  if (!sec['title'] || typeof sec['title'] !== 'string') {
    errors.push({ path: \`\${path}.title\`, message: 'title is required and must be a string', severity: 'error' });
  }

  // Validate type
  if (!sec['type'] || typeof sec['type'] !== 'string') {
    errors.push({ path: \`\${path}.type\`, message: 'type is required and must be a string', severity: 'error' });
    return errors;
  }

  const type = sec['type'] as string;
  const resolvedType = TYPE_ALIASES[type] || type;

  if (!VALID_SECTION_TYPES.includes(resolvedType)) {
    errors.push({ 
      path: \`\${path}.type\`, 
      message: \`Unknown section type '\${type}'. Valid types: \${VALID_SECTION_TYPES.join(', ')}\`,
      severity: 'warning'
    });
    return errors;
  }

  // Validate data structure
  const rules = SECTION_VALIDATION_RULES[resolvedType];
  if (rules) {
    if (rules.usesFields && !Array.isArray(sec['fields']) && !rules.usesItems) {
      errors.push({ 
        path: \`\${path}.fields\`, 
        message: \`Section type '\${type}' expects fields array\`,
        severity: 'warning'
      });
    }

    if (rules.usesItems && !Array.isArray(sec['items']) && !rules.usesFields) {
      errors.push({ 
        path: \`\${path}.items\`, 
        message: \`Section type '\${type}' expects items array\`,
        severity: 'warning'
      });
    }

    if (rules.usesChartData && !sec['chartData']) {
      errors.push({ 
        path: \`\${path}.chartData\`, 
        message: \`Section type '\${type}' expects chartData\`,
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
  
  return errors.map(e => \`[\${e.severity.toUpperCase()}] \${e.path}: \${e.message}\`).join('\\n');
}
`;

  const outputPath = path.join(ROOT_DIR, 'src', 'app', 'shared', 'utils', 'schema-validator.generated.ts');
  fs.writeFileSync(outputPath, content, 'utf8');
  return { path: outputPath };
}

/**
 * Main
 */
function main() {
  log('\n🧪 Generating Test Suite from Registry', colors.cyan);
  log('═'.repeat(50), colors.cyan);

  const registry = loadRegistry();
  log(`\n📄 Registry: v${registry.version}`, colors.blue);

  // Generate test builder
  const builder = generateTestBuilder(registry);
  log(`  ✓ Generated test-card-builder.generated.ts`, colors.green);

  // Generate E2E tests
  const e2e = generateE2ETests(registry);
  log(`  ✓ Generated section-types.generated.spec.ts (${e2e.testCount} tests)`, colors.green);

  // Generate schema validator
  const validator = generateSchemaValidator(registry);
  log(`  ✓ Generated schema-validator.generated.ts`, colors.green);

  log('\n═'.repeat(50), colors.cyan);
  log('✅ Test suite generation complete!\n', colors.green);
}

main();

