/**
 * Optional Import Utility
 *
 * Provides safe dynamic imports for optional dependencies that may not be installed.
 * This is particularly useful for libraries like frappe-charts and leaflet that are
 * declared as optional dependencies but may not be present in consuming applications.
 *
 * @example
 * ```typescript
 * const result = await safeImport('frappe-charts');
 * if (result.success) {
 *   const Chart = result.module;
 *   // Use Chart...
 * } else {
 *   console.error('frappe-charts not installed:', result.error);
 * }
 * ```
 */

/**
 * Result type for optional imports
 */
export type OptionalImportResult<T> =
  | { success: true; module: T }
  | { success: false; error: Error; message: string };

/**
 * Safely import an optional module
 *
 * This function wraps dynamic imports in a try-catch to gracefully handle
 * cases where the module is not installed. It provides helpful error messages
 * to guide users on how to install missing dependencies.
 *
 * @param moduleName - The name of the module to import (e.g., 'frappe-charts')
 * @param installCommand - Optional npm install command to suggest (e.g., 'npm install frappe-charts')
 * @returns Promise resolving to either success with module or failure with error
 *
 * @example
 * ```typescript
 * const result = await safeImport('frappe-charts', 'npm install frappe-charts');
 * if (result.success) {
 *   // Use result.module
 * } else {
 *   // Handle error: result.error and result.message
 * }
 * ```
 */
export async function safeImport<T = unknown>(
  moduleName: string,
  installCommand?: string
): Promise<OptionalImportResult<T>> {
  try {
    // Use dynamic import - Vite will try to resolve this at build time
    // The @vite-ignore comment tells Vite to skip analyzing this import
    // If the module doesn't exist, it will fail at runtime and we catch it here
    // Note: For this to work properly, the consuming app should install the dependency
    // or configure Vite to externalize it
    const module = await import(
      /* @vite-ignore */
      moduleName
    );

    return {
      success: true,
      module: module as T,
    };
  } catch (error) {
    // Handle different types of import errors
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

    // Check if it's a module resolution error
    const isModuleNotFound =
      errorMessage.includes('Cannot find module') ||
      errorMessage.includes('Failed to resolve') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('MODULE_NOT_FOUND');

    const installSuggestion = installCommand || `npm install ${moduleName}`;
    const userMessage = isModuleNotFound
      ? `${moduleName} is not installed. Please install it using: ${installSuggestion}`
      : `Failed to import ${moduleName}: ${errorMessage}`;

    const importError = new Error(userMessage);
    if (error instanceof Error) {
      importError.stack = error.stack;
      importError.cause = error;
    }

    return {
      success: false,
      error: importError,
      message: userMessage,
    };
  }
}
