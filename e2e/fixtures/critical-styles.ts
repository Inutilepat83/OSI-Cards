/**
 * Critical Styles Configuration
 * 
 * Defines all CSS properties that must be consistent across environments.
 * This is the single source of truth for visual consistency testing.
 * 
 * To add a new element: Add entry to ELEMENTS_TO_CHECK
 * To add a new property: Add to element's properties array
 */

/**
 * Severity levels for style mismatches
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Configuration for a CSS property to check
 */
export interface PropertyConfig {
  /** CSS property name */
  name: string;
  /** How important this property is for visual consistency */
  severity: Severity;
  /** Numeric tolerance for computed values (e.g., 0.5 for ±0.5px) */
  tolerance?: number;
  /** Whether to normalize the value before comparison (e.g., remove quotes from fonts) */
  normalize?: boolean;
  /** Description of what this property controls */
  description?: string;
}

/**
 * Configuration for an element to check
 */
export interface ElementConfig {
  /** Human-readable name for reports */
  name: string;
  /** CSS selector to find the element */
  selector: string;
  /** CSS properties to verify on this element */
  properties: PropertyConfig[];
  /** Whether this element is inside Shadow DOM */
  inShadowDom?: boolean;
  /** Description of what this element represents */
  description?: string;
}

/**
 * Typography properties - fonts, sizes, colors
 */
const TYPOGRAPHY_PROPERTIES: PropertyConfig[] = [
  { name: 'font-family', severity: 'critical', normalize: true, description: 'Font face' },
  { name: 'font-size', severity: 'critical', tolerance: 0.5, description: 'Text size' },
  { name: 'font-weight', severity: 'high', description: 'Text boldness' },
  { name: 'line-height', severity: 'medium', tolerance: 1, description: 'Line spacing' },
  { name: 'letter-spacing', severity: 'low', tolerance: 0.1, description: 'Character spacing' },
  { name: 'color', severity: 'critical', description: 'Text color' },
  { name: 'text-transform', severity: 'medium', description: 'Text case transformation' },
];

/**
 * Layout properties - spacing, sizing
 */
const LAYOUT_PROPERTIES: PropertyConfig[] = [
  { name: 'display', severity: 'critical', description: 'Display type' },
  { name: 'flex-direction', severity: 'high', description: 'Flex layout direction' },
  { name: 'gap', severity: 'medium', tolerance: 2, description: 'Gap between items' },
  { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
  { name: 'padding-right', severity: 'medium', tolerance: 2, description: 'Right padding' },
  { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
  { name: 'padding-left', severity: 'medium', tolerance: 2, description: 'Left padding' },
  { name: 'margin-top', severity: 'medium', tolerance: 2, description: 'Top margin' },
  { name: 'margin-bottom', severity: 'medium', tolerance: 2, description: 'Bottom margin' },
  { name: 'border-radius', severity: 'high', tolerance: 1, description: 'Corner rounding' },
];

/**
 * Visual properties - colors, effects
 */
const VISUAL_PROPERTIES: PropertyConfig[] = [
  { name: 'background-color', severity: 'high', description: 'Background color' },
  { name: 'border-color', severity: 'high', description: 'Border color' },
  { name: 'border-width', severity: 'medium', tolerance: 0.5, description: 'Border thickness' },
  { name: 'border-style', severity: 'medium', description: 'Border style' },
  { name: 'box-shadow', severity: 'medium', normalize: true, description: 'Shadow effect' },
  { name: 'opacity', severity: 'high', tolerance: 0.05, description: 'Transparency' },
];

/**
 * All elements to check with their CSS properties
 */
export const ELEMENTS_TO_CHECK: ElementConfig[] = [
  // Main card container
  {
    name: 'Card Surface',
    selector: '.ai-card-surface',
    inShadowDom: true,
    description: 'Main card container with border and background',
    properties: [
      ...VISUAL_PROPERTIES,
      ...LAYOUT_PROPERTIES.filter(p => ['display', 'flex-direction', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius', 'gap'].includes(p.name)),
      { name: 'overflow', severity: 'medium', description: 'Content overflow handling' },
    ]
  },

  // Card header
  {
    name: 'Card Header',
    selector: '.ai-card-header',
    inShadowDom: true,
    description: 'Header container with title and subtitle',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
      { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
      { name: 'background-color', severity: 'high', description: 'Background color' },
      { name: 'border-width', severity: 'medium', tolerance: 0.5, description: 'Border thickness' },
    ]
  },

  // Card title
  {
    name: 'Card Title',
    selector: '.ai-card-title',
    inShadowDom: true,
    description: 'Main card title text',
    properties: [
      ...TYPOGRAPHY_PROPERTIES,
      { name: 'margin-top', severity: 'low', tolerance: 2, description: 'Top margin' },
      { name: 'margin-bottom', severity: 'low', tolerance: 2, description: 'Bottom margin' },
    ]
  },

  // Card subtitle
  {
    name: 'Card Subtitle',
    selector: '.ai-card-subtitle',
    inShadowDom: true,
    description: 'Secondary card title text',
    properties: [
      ...TYPOGRAPHY_PROPERTIES,
    ]
  },

  // Masonry grid container
  {
    name: 'Masonry Grid',
    selector: '.masonry-grid-container',
    inShadowDom: true,
    description: 'Container for section grid layout',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'position', severity: 'high', description: 'Position type' },
      { name: 'width', severity: 'medium', tolerance: 5, description: 'Container width' },
    ]
  },

  // Masonry item (section container)
  {
    name: 'Masonry Item',
    selector: '.masonry-item',
    inShadowDom: true,
    description: 'Individual section container',
    properties: [
      ...VISUAL_PROPERTIES,
      ...LAYOUT_PROPERTIES.filter(p => ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius', 'gap'].includes(p.name)),
    ]
  },

  // Section header
  {
    name: 'Section Header',
    selector: '.ai-section__header',
    inShadowDom: true,
    description: 'Section title area',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'gap', severity: 'medium', tolerance: 2, description: 'Gap between items' },
      { name: 'margin-bottom', severity: 'medium', tolerance: 2, description: 'Bottom margin' },
    ]
  },

  // Section title
  {
    name: 'Section Title',
    selector: '.ai-section__title',
    inShadowDom: true,
    description: 'Section title text',
    properties: [
      ...TYPOGRAPHY_PROPERTIES.filter(p => ['font-family', 'font-size', 'font-weight', 'color'].includes(p.name)),
    ]
  },

  // Info row (key-value pairs)
  {
    name: 'Info Row',
    selector: '.info-row',
    inShadowDom: true,
    description: 'Key-value pair container',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'gap', severity: 'medium', tolerance: 2, description: 'Gap between items' },
      { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
      { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
      { name: 'border-bottom-width', severity: 'low', tolerance: 0.5, description: 'Bottom border' },
    ]
  },

  // Field label
  {
    name: 'Field Label',
    selector: '.field-label',
    inShadowDom: true,
    description: 'Label text in key-value pairs',
    properties: [
      ...TYPOGRAPHY_PROPERTIES.filter(p => ['font-family', 'font-size', 'font-weight', 'color'].includes(p.name)),
    ]
  },

  // Field value
  {
    name: 'Field Value',
    selector: '.field-value',
    inShadowDom: true,
    description: 'Value text in key-value pairs',
    properties: [
      ...TYPOGRAPHY_PROPERTIES.filter(p => ['font-family', 'font-size', 'font-weight', 'color'].includes(p.name)),
    ]
  },

  // Action button
  {
    name: 'Action Button',
    selector: '.ai-card-action',
    inShadowDom: true,
    description: 'Card action button',
    properties: [
      ...TYPOGRAPHY_PROPERTIES.filter(p => ['font-family', 'font-size', 'font-weight', 'color'].includes(p.name)),
      { name: 'background-color', severity: 'high', description: 'Button background' },
      { name: 'border-radius', severity: 'medium', tolerance: 1, description: 'Button corners' },
      { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
      { name: 'padding-right', severity: 'medium', tolerance: 2, description: 'Right padding' },
      { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
      { name: 'padding-left', severity: 'medium', tolerance: 2, description: 'Left padding' },
    ]
  },

  // Card signature/footer
  {
    name: 'Card Signature',
    selector: '.card-signature',
    inShadowDom: true,
    description: 'Footer text at bottom of card',
    properties: [
      ...TYPOGRAPHY_PROPERTIES.filter(p => ['font-family', 'font-size', 'color'].includes(p.name)),
      { name: 'text-align', severity: 'medium', description: 'Text alignment' },
    ]
  },

  // Analytics metric
  {
    name: 'Analytics Metric',
    selector: '.analytics-metric',
    inShadowDom: true,
    description: 'Analytics section metric display',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'background-color', severity: 'medium', description: 'Background color' },
      { name: 'border-radius', severity: 'medium', tolerance: 1, description: 'Corner rounding' },
      { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
      { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
    ]
  },

  // Contact card
  {
    name: 'Contact Card',
    selector: '.contact-card',
    inShadowDom: true,
    description: 'Contact information card',
    properties: [
      { name: 'display', severity: 'high', description: 'Display type' },
      { name: 'background-color', severity: 'medium', description: 'Background color' },
      { name: 'border-radius', severity: 'medium', tolerance: 1, description: 'Corner rounding' },
      { name: 'padding-top', severity: 'medium', tolerance: 2, description: 'Top padding' },
      { name: 'padding-bottom', severity: 'medium', tolerance: 2, description: 'Bottom padding' },
    ]
  },
];

/**
 * CSS custom properties (CSS variables) to verify
 */
export const CSS_VARIABLES_TO_CHECK: PropertyConfig[] = [
  { name: '--color-brand', severity: 'critical', description: 'Brand color (Orange)' },
  { name: '--foreground', severity: 'critical', description: 'Text color' },
  { name: '--background', severity: 'critical', description: 'Background color' },
  { name: '--card-border-radius', severity: 'high', description: 'Card corner radius' },
  { name: '--card-main-padding', severity: 'medium', description: 'Main card padding' },
  { name: '--section-card-gap', severity: 'medium', description: 'Gap between sections' },
  { name: '--section-container-padding', severity: 'medium', description: 'Section padding' },
];

/**
 * Client environments to test
 */
export interface ClientEnvironment {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  conflictingStyles: string[];
}

export const CLIENT_ENVIRONMENTS: ClientEnvironment[] = [
  {
    id: 'corporate',
    name: 'Corporate Portal',
    description: 'Bootstrap/Boosted-like enterprise environment',
    cssClass: 'env-corporate',
    conflictingStyles: ['Bootstrap resets', 'System fonts', 'Blue accent colors']
  },
  {
    id: 'developer',
    name: 'Developer Console',
    description: 'Dark terminal aesthetic with monospace fonts',
    cssClass: 'env-developer',
    conflictingStyles: ['Monospace fonts', 'Green terminal colors', 'High contrast']
  },
  {
    id: 'marketing',
    name: 'Marketing Site',
    description: 'Light, modern with conflicting styles',
    cssClass: 'env-marketing',
    conflictingStyles: ['Sans-serif fonts', 'Light backgrounds', 'Purple accents']
  },
  {
    id: 'legacy',
    name: 'Legacy System',
    description: 'Aggressive CSS resets and overrides',
    cssClass: 'env-legacy',
    conflictingStyles: ['CSS resets', 'Table layouts', 'Font size resets']
  }
];

/**
 * Get all unique CSS properties to extract
 */
export function getAllProperties(): string[] {
  const props = new Set<string>();
  
  ELEMENTS_TO_CHECK.forEach(element => {
    element.properties.forEach(prop => {
      props.add(prop.name);
    });
  });
  
  CSS_VARIABLES_TO_CHECK.forEach(prop => {
    props.add(prop.name);
  });
  
  return Array.from(props);
}

/**
 * Get element config by selector
 */
export function getElementConfig(selector: string): ElementConfig | undefined {
  return ELEMENTS_TO_CHECK.find(el => el.selector === selector);
}

/**
 * Get property config for an element
 */
export function getPropertyConfig(element: ElementConfig, propertyName: string): PropertyConfig | undefined {
  return element.properties.find(p => p.name === propertyName);
}

/**
 * Count total number of property checks
 */
export function getTotalPropertyChecks(): number {
  return ELEMENTS_TO_CHECK.reduce((sum, el) => sum + el.properties.length, 0);
}

