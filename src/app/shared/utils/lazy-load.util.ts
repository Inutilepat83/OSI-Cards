/**
 * Utility functions for lazy loading components
 * Helps reduce initial bundle size by loading components on demand
 */

/**
 * Lazy load a component with error handling
 * @param importFn Function that returns a promise resolving to the component module
 * @returns Promise resolving to the component class
 */
export async function lazyLoadComponent<T>(
  importFn: () => Promise<Record<string, any>>,
  componentName: string
): Promise<T> {
  try {
    const module = await importFn();
    const component = module[componentName];
    
    if (!component) {
      throw new Error(`Component ${componentName} not found in module`);
    }
    
    return component as T;
  } catch (error) {
    console.error(`Failed to lazy load component ${componentName}:`, error);
    throw error;
  }
}

/**
 * Create a lazy loading function for a component
 * Useful for dynamic component loading
 */
export function createLazyLoader<T>(
  importFn: () => Promise<Record<string, any>>,
  componentName: string
): () => Promise<T> {
  return () => lazyLoadComponent<T>(importFn, componentName);
}

/**
 * Lazy load with retry logic
 * Useful for unreliable network conditions
 */
export async function lazyLoadWithRetry<T>(
  importFn: () => Promise<Record<string, any>>,
  componentName: string,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await lazyLoadComponent<T>(importFn, componentName);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError || new Error(`Failed to load ${componentName} after ${maxRetries} attempts`);
}

