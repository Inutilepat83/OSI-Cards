/**
 * Code splitting utilities
 * Helpers for splitting code by routes and features to reduce initial bundle size
 */

/**
 * Lazy load a module dynamically
 */
export async function lazyLoadModule<T>(moduleLoader: () => Promise<T>): Promise<T> {
  try {
    return await moduleLoader();
  } catch (error) {
    console.error('Failed to lazy load module:', error);
    throw error;
  }
}

/**
 * Preload a module in the background
 */
export function preloadModule<T>(moduleLoader: () => Promise<T>): Promise<T> {
  // Load module in background
  return moduleLoader().catch(error => {
    console.warn('Module preload failed:', error);
    throw error;
  });
}

/**
 * Check if module is already loaded
 */
export function isModuleLoaded(moduleName: string): boolean {
  // Check if module exists in window or global scope
  return (window as any)[moduleName] !== undefined;
}

/**
 * Module loading cache
 */
const moduleCache = new Map<string, Promise<any>>();

/**
 * Load module with caching
 */
export function loadModuleWithCache<T>(
  moduleName: string,
  moduleLoader: () => Promise<T>
): Promise<T> {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName)!;
  }

  const loadPromise = moduleLoader();
  moduleCache.set(moduleName, loadPromise);

  loadPromise.catch(() => {
    // Remove from cache on error
    moduleCache.delete(moduleName);
  });

  return loadPromise;
}


