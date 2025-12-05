/**
 * Style Extractor
 * 
 * Extracts computed CSS styles from page elements for comparison.
 * Handles both regular DOM and Shadow DOM elements.
 */

import { Page, ElementHandle } from '@playwright/test';
import { ElementConfig, CSS_VARIABLES_TO_CHECK, ELEMENTS_TO_CHECK } from '../fixtures/critical-styles';

/**
 * Extracted styles for a single element
 */
export interface ExtractedElementStyles {
  selector: string;
  name: string;
  found: boolean;
  styles: Record<string, string>;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

/**
 * Full extraction result for a page
 */
export interface StyleExtractionResult {
  timestamp: string;
  url: string;
  elements: ExtractedElementStyles[];
  cssVariables: Record<string, string>;
  viewportSize: { width: number; height: number };
}

/**
 * Extract computed styles from an element
 */
async function extractElementStyles(
  page: Page,
  element: ElementConfig,
  shadowHost: string = 'app-ai-card-renderer'
): Promise<ExtractedElementStyles> {
  const propertyNames = element.properties.map(p => p.name);
  
  const result = await page.evaluate(
    ({ selector, propertyNames, inShadowDom, shadowHost }) => {
      let targetElement: Element | null = null;
      
      if (inShadowDom) {
        // Find the shadow host first
        const host = document.querySelector(shadowHost);
        if (host?.shadowRoot) {
          targetElement = host.shadowRoot.querySelector(selector);
        }
        
        // If not found in shadow root, try nested shadow roots
        if (!targetElement) {
          const hosts = document.querySelectorAll(shadowHost);
          for (const h of hosts) {
            if (h.shadowRoot) {
              targetElement = h.shadowRoot.querySelector(selector);
              if (targetElement) break;
            }
          }
        }
      } else {
        targetElement = document.querySelector(selector);
      }
      
      if (!targetElement) {
        return { found: false, styles: {}, boundingBox: null };
      }
      
      const computedStyles = window.getComputedStyle(targetElement);
      const styles: Record<string, string> = {};
      
      for (const prop of propertyNames) {
        styles[prop] = computedStyles.getPropertyValue(prop);
      }
      
      const rect = targetElement.getBoundingClientRect();
      
      return {
        found: true,
        styles,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      };
    },
    { selector: element.selector, propertyNames, inShadowDom: element.inShadowDom, shadowHost }
  );
  
  return {
    selector: element.selector,
    name: element.name,
    found: result.found,
    styles: result.styles,
    boundingBox: result.boundingBox || undefined
  };
}

/**
 * Extract CSS custom properties (variables) from the card
 */
async function extractCSSVariables(
  page: Page,
  shadowHost: string = 'app-ai-card-renderer'
): Promise<Record<string, string>> {
  const variableNames = CSS_VARIABLES_TO_CHECK.map(v => v.name);
  
  return page.evaluate(
    ({ variableNames, shadowHost }) => {
      const variables: Record<string, string> = {};
      
      // Try to get from shadow host first
      const host = document.querySelector(shadowHost);
      if (host?.shadowRoot) {
        const cardSurface = host.shadowRoot.querySelector('.ai-card-surface') as HTMLElement;
        if (cardSurface) {
          const styles = window.getComputedStyle(cardSurface);
          for (const name of variableNames) {
            variables[name] = styles.getPropertyValue(name).trim();
          }
          return variables;
        }
      }
      
      // Fallback to document root
      const rootStyles = window.getComputedStyle(document.documentElement);
      for (const name of variableNames) {
        variables[name] = rootStyles.getPropertyValue(name).trim();
      }
      
      return variables;
    },
    { variableNames, shadowHost }
  );
}

/**
 * Extract all styles from a page
 */
export async function extractAllStyles(
  page: Page,
  shadowHost: string = 'app-ai-card-renderer'
): Promise<StyleExtractionResult> {
  const elements: ExtractedElementStyles[] = [];
  
  // Extract styles for each element
  for (const element of ELEMENTS_TO_CHECK) {
    const extracted = await extractElementStyles(page, element, shadowHost);
    elements.push(extracted);
  }
  
  // Extract CSS variables
  const cssVariables = await extractCSSVariables(page, shadowHost);
  
  // Get viewport size
  const viewportSize = page.viewportSize() || { width: 1280, height: 720 };
  
  return {
    timestamp: new Date().toISOString(),
    url: page.url(),
    elements,
    cssVariables,
    viewportSize
  };
}

/**
 * Extract styles for specific elements only
 */
export async function extractSpecificStyles(
  page: Page,
  selectors: string[],
  shadowHost: string = 'app-ai-card-renderer'
): Promise<ExtractedElementStyles[]> {
  const elements: ExtractedElementStyles[] = [];
  
  for (const selector of selectors) {
    const config = ELEMENTS_TO_CHECK.find(el => el.selector === selector);
    if (config) {
      const extracted = await extractElementStyles(page, config, shadowHost);
      elements.push(extracted);
    }
  }
  
  return elements;
}

/**
 * Wait for card to be fully rendered before extraction
 */
export async function waitForCardReady(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for card renderer to be visible
  await page.waitForSelector('app-ai-card-renderer', { state: 'visible', timeout });
  
  // Wait for card surface within shadow DOM
  await page.evaluate((timeout) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      
      const checkShadow = () => {
        const host = document.querySelector('app-ai-card-renderer');
        if (host?.shadowRoot?.querySelector('.ai-card-surface')) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for card surface'));
          return;
        }
        
        requestAnimationFrame(checkShadow);
      };
      
      checkShadow();
    });
  }, timeout);
  
  // Additional wait for any animations to settle
  await page.waitForTimeout(500);
}

/**
 * Check if a specific element exists in the card
 */
export async function elementExists(
  page: Page,
  selector: string,
  shadowHost: string = 'app-ai-card-renderer'
): Promise<boolean> {
  return page.evaluate(
    ({ selector, shadowHost }) => {
      const host = document.querySelector(shadowHost);
      if (host?.shadowRoot) {
        return host.shadowRoot.querySelector(selector) !== null;
      }
      return false;
    },
    { selector, shadowHost }
  );
}










