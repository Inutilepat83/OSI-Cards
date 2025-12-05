/**
 * Style Comparator
 * 
 * Compares extracted styles between baseline and test environments.
 * Handles tolerances, normalization, and generates detailed diff reports.
 */

import {
  ElementConfig,
  PropertyConfig,
  Severity,
  ELEMENTS_TO_CHECK,
  CSS_VARIABLES_TO_CHECK,
  getPropertyConfig
} from '../fixtures/critical-styles';
import { StyleExtractionResult, ExtractedElementStyles } from './style-extractor';

/**
 * Result of comparing a single property
 */
export interface PropertyComparisonResult {
  property: string;
  expected: string;
  actual: string;
  match: boolean;
  severity: Severity;
  tolerance?: number;
  description?: string;
}

/**
 * Result of comparing a single element
 */
export interface ElementComparisonResult {
  name: string;
  selector: string;
  found: boolean;
  totalProperties: number;
  matchedProperties: number;
  failedProperties: number;
  properties: PropertyComparisonResult[];
}

/**
 * Full comparison result between baseline and test
 */
export interface StyleComparisonResult {
  timestamp: string;
  baseline: {
    url: string;
    timestamp: string;
  };
  test: {
    url: string;
    timestamp: string;
    environment?: string;
  };
  summary: {
    totalElements: number;
    elementsFound: number;
    totalProperties: number;
    passedProperties: number;
    failedProperties: number;
    passRate: number;
  };
  elements: ElementComparisonResult[];
  cssVariables: PropertyComparisonResult[];
  status: 'PASS' | 'FAIL';
}

/**
 * Parse a numeric value from a CSS string (e.g., "16px" -> 16)
 */
function parseNumericValue(value: string): number | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Normalize a CSS value for comparison
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ');
}

/**
 * Compare two CSS values with optional tolerance
 */
function valuesMatch(
  expected: string,
  actual: string,
  tolerance?: number,
  normalize?: boolean
): boolean {
  // Handle empty values
  if (!expected && !actual) return true;
  if (!expected || !actual) return false;
  
  // Normalize if requested
  let exp = normalize ? normalizeValue(expected) : expected.trim();
  let act = normalize ? normalizeValue(actual) : actual.trim();
  
  // Exact match
  if (exp === act) return true;
  
  // Numeric comparison with tolerance
  if (tolerance !== undefined && tolerance > 0) {
    const expNum = parseNumericValue(exp);
    const actNum = parseNumericValue(act);
    
    if (expNum !== null && actNum !== null) {
      return Math.abs(expNum - actNum) <= tolerance;
    }
  }
  
  // Color comparison (handle different formats)
  if (exp.startsWith('rgb') || act.startsWith('rgb')) {
    return normalizeColor(exp) === normalizeColor(act);
  }
  
  return false;
}

/**
 * Normalize color values to a consistent format
 */
function normalizeColor(color: string): string {
  // Convert rgba to rgb if alpha is 1
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*1(?:\.0*)?)?\)/);
  if (rgbaMatch) {
    return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
  }
  return color.toLowerCase().replace(/\s+/g, '');
}

/**
 * Compare properties of a single element
 */
function compareElementProperties(
  elementConfig: ElementConfig,
  baselineStyles: Record<string, string>,
  testStyles: Record<string, string>
): PropertyComparisonResult[] {
  const results: PropertyComparisonResult[] = [];
  
  for (const propConfig of elementConfig.properties) {
    const expected = baselineStyles[propConfig.name] || '';
    const actual = testStyles[propConfig.name] || '';
    
    const match = valuesMatch(
      expected,
      actual,
      propConfig.tolerance,
      propConfig.normalize
    );
    
    results.push({
      property: propConfig.name,
      expected,
      actual,
      match,
      severity: propConfig.severity,
      tolerance: propConfig.tolerance,
      description: propConfig.description
    });
  }
  
  return results;
}

/**
 * Compare two style extraction results
 */
export function compareStyles(
  baseline: StyleExtractionResult,
  test: StyleExtractionResult,
  environmentName?: string
): StyleComparisonResult {
  const elementResults: ElementComparisonResult[] = [];
  let totalProperties = 0;
  let passedProperties = 0;
  let failedProperties = 0;
  let elementsFound = 0;
  
  // Compare each element
  for (const elementConfig of ELEMENTS_TO_CHECK) {
    const baselineElement = baseline.elements.find(e => e.selector === elementConfig.selector);
    const testElement = test.elements.find(e => e.selector === elementConfig.selector);
    
    if (!baselineElement?.found || !testElement?.found) {
      // Element not found in one or both
      elementResults.push({
        name: elementConfig.name,
        selector: elementConfig.selector,
        found: testElement?.found || false,
        totalProperties: elementConfig.properties.length,
        matchedProperties: 0,
        failedProperties: testElement?.found ? 0 : elementConfig.properties.length,
        properties: []
      });
      
      if (!testElement?.found) {
        failedProperties += elementConfig.properties.length;
      }
      totalProperties += elementConfig.properties.length;
      continue;
    }
    
    elementsFound++;
    
    const propertyResults = compareElementProperties(
      elementConfig,
      baselineElement.styles,
      testElement.styles
    );
    
    const matched = propertyResults.filter(p => p.match).length;
    const failed = propertyResults.filter(p => !p.match).length;
    
    elementResults.push({
      name: elementConfig.name,
      selector: elementConfig.selector,
      found: true,
      totalProperties: propertyResults.length,
      matchedProperties: matched,
      failedProperties: failed,
      properties: propertyResults
    });
    
    totalProperties += propertyResults.length;
    passedProperties += matched;
    failedProperties += failed;
  }
  
  // Compare CSS variables
  const cssVariableResults: PropertyComparisonResult[] = [];
  for (const varConfig of CSS_VARIABLES_TO_CHECK) {
    const expected = baseline.cssVariables[varConfig.name] || '';
    const actual = test.cssVariables[varConfig.name] || '';
    
    const match = valuesMatch(expected, actual, varConfig.tolerance, varConfig.normalize);
    
    cssVariableResults.push({
      property: varConfig.name,
      expected,
      actual,
      match,
      severity: varConfig.severity,
      description: varConfig.description
    });
    
    totalProperties++;
    if (match) {
      passedProperties++;
    } else {
      failedProperties++;
    }
  }
  
  const passRate = totalProperties > 0 
    ? Math.round((passedProperties / totalProperties) * 100 * 100) / 100
    : 100;
  
  return {
    timestamp: new Date().toISOString(),
    baseline: {
      url: baseline.url,
      timestamp: baseline.timestamp
    },
    test: {
      url: test.url,
      timestamp: test.timestamp,
      environment: environmentName
    },
    summary: {
      totalElements: ELEMENTS_TO_CHECK.length,
      elementsFound,
      totalProperties,
      passedProperties,
      failedProperties,
      passRate
    },
    elements: elementResults,
    cssVariables: cssVariableResults,
    status: failedProperties === 0 ? 'PASS' : 'FAIL'
  };
}

/**
 * Get failures only from comparison result
 */
export function getFailures(result: StyleComparisonResult): {
  elements: ElementComparisonResult[];
  cssVariables: PropertyComparisonResult[];
} {
  return {
    elements: result.elements.filter(el => el.failedProperties > 0),
    cssVariables: result.cssVariables.filter(v => !v.match)
  };
}

/**
 * Get critical failures (severity: critical or high)
 */
export function getCriticalFailures(result: StyleComparisonResult): {
  elements: { element: string; properties: PropertyComparisonResult[] }[];
  cssVariables: PropertyComparisonResult[];
} {
  const criticalElements: { element: string; properties: PropertyComparisonResult[] }[] = [];
  
  for (const element of result.elements) {
    const criticalProps = element.properties.filter(
      p => !p.match && (p.severity === 'critical' || p.severity === 'high')
    );
    
    if (criticalProps.length > 0) {
      criticalElements.push({
        element: element.name,
        properties: criticalProps
      });
    }
  }
  
  return {
    elements: criticalElements,
    cssVariables: result.cssVariables.filter(
      v => !v.match && (v.severity === 'critical' || v.severity === 'high')
    )
  };
}










