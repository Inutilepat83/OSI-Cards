/**
 * Style Validator Utilities
 * 
 * Helper functions to validate that the OSI Cards design system styles
 * are properly loaded and configured.
 */

/**
 * Required CSS variables that must be present for the library to work correctly
 */
const REQUIRED_CSS_VARIABLES = [
  '--card-padding',
  '--card-gap',
  '--card-border-radius',
  '--color-brand',
  '--ai-card-background',
  '--section-item-background'
] as const;

/**
 * Optional but recommended CSS variables
 */
const RECOMMENDED_CSS_VARIABLES = [
  '--card-text-primary',
  '--card-text-secondary',
  '--card-transition',
  '--duration-normal',
  '--duration-moderate'
] as const;

/**
 * Result of style validation
 */
export interface StyleValidationResult {
  valid: boolean;
  missing: string[];
  recommended: string[];
  warnings: string[];
}

/**
 * Validates that required CSS variables are present
 * 
 * @param element - Optional element to check (defaults to document root)
 * @returns Validation result with missing variables and warnings
 * 
 * @example
 * ```typescript
 * const validation = validateStyles();
 * if (!validation.valid) {
 *   console.warn('Missing styles:', validation.missing);
 * }
 * ```
 */
export function validateStyles(element?: HTMLElement): StyleValidationResult {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      valid: false,
      missing: REQUIRED_CSS_VARIABLES as unknown as string[],
      recommended: RECOMMENDED_CSS_VARIABLES as unknown as string[],
      warnings: ['Style validation requires a browser environment']
    };
  }
  
  const root = element || document.documentElement;
  const computedStyle = window.getComputedStyle(root);
  
  const missing: string[] = [];
  const recommended: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  REQUIRED_CSS_VARIABLES.forEach(variable => {
    const value = computedStyle.getPropertyValue(variable).trim();
    if (!value || value === 'initial' || value === 'inherit') {
      missing.push(variable);
    }
  });

  // Check recommended variables
  RECOMMENDED_CSS_VARIABLES.forEach(variable => {
    const value = computedStyle.getPropertyValue(variable).trim();
    if (!value || value === 'initial' || value === 'inherit') {
      recommended.push(variable);
    }
  });

  // Generate warnings
  if (missing.length > 0) {
    warnings.push(
      `OSI Cards Library: ${missing.length} required CSS variable(s) are missing. ` +
      `The library styles may not be properly imported. ` +
      `Please ensure you've added: @import 'osi-cards-lib/styles/_styles';`
    );
  }

  if (recommended.length > 0 && missing.length === 0) {
    warnings.push(
      `OSI Cards Library: ${recommended.length} recommended CSS variable(s) are missing. ` +
      `Some advanced features may not work as expected.`
    );
  }

  return {
    valid: missing.length === 0,
    missing,
    recommended,
    warnings
  };
}

/**
 * Validates styles and logs warnings to console if issues are found
 * 
 * @param element - Optional element to check
 * @param logToConsole - Whether to log warnings to console (default: true)
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * // In component ngOnInit or after styles load
 * validateAndWarnStyles();
 * ```
 */
export function validateAndWarnStyles(
  element?: HTMLElement,
  logToConsole: boolean = true
): StyleValidationResult {
  const result = validateStyles(element);

  if (logToConsole && result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(warning);
    });

    if (result.missing.length > 0) {
      console.info(
        'Missing CSS variables:\n' +
        result.missing.map(v => `  - ${v}`).join('\n') + '\n\n' +
        'To fix this, add to your styles file:\n' +
        "  @import 'osi-cards-lib/styles/_styles';"
      );
    }
  }

  return result;
}

/**
 * Checks if a specific CSS variable is defined
 * 
 * @param variableName - Name of the CSS variable (with or without -- prefix)
 * @param element - Optional element to check
 * @returns True if the variable is defined and has a value
 */
export function isCSSVariableDefined(
  variableName: string,
  element?: HTMLElement
): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  
  const root = element || document.documentElement;
  const computedStyle = window.getComputedStyle(root);
  
  // Ensure variable name starts with --
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  
  const value = computedStyle.getPropertyValue(varName).trim();
  return !!value && value !== 'initial' && value !== 'inherit';
}

/**
 * Gets the value of a CSS variable
 * 
 * @param variableName - Name of the CSS variable (with or without -- prefix)
 * @param element - Optional element to check
 * @returns The CSS variable value, or null if not defined
 */
export function getCSSVariableValue(
  variableName: string,
  element?: HTMLElement
): string | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  
  const root = element || document.documentElement;
  const computedStyle = window.getComputedStyle(root);
  
  // Ensure variable name starts with --
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  
  const value = computedStyle.getPropertyValue(varName).trim();
  
  if (!value || value === 'initial' || value === 'inherit') {
    return null;
  }
  
  return value;
}

/**
 * Checks if styles are loaded by looking for a specific marker class or variable
 * This is a lighter check than full validation
 * 
 * @returns True if styles appear to be loaded
 */
export function areStylesLoaded(): boolean {
  // Check for presence of a key design token
  return isCSSVariableDefined('--color-brand') && 
         isCSSVariableDefined('--card-padding');
}

/**
 * Waits for styles to be loaded by polling
 * Useful when styles are loaded asynchronously
 * 
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @param pollInterval - How often to check in milliseconds (default: 100)
 * @returns Promise that resolves when styles are loaded or timeout is reached
 */
export function waitForStyles(
  timeout: number = 5000,
  pollInterval: number = 100
): Promise<boolean> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkStyles = () => {
      if (areStylesLoaded()) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }
      
      setTimeout(checkStyles, pollInterval);
    };
    
    checkStyles();
  });
}

