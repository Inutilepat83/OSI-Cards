/**
 * Global Debug Logging Kill Switch
 *
 * This utility provides a global check that ALL debug logging (including inline fetch calls)
 * should respect to prevent browser resource exhaustion.
 *
 * Usage in inline fetch calls:
 * ```typescript
 * if (!isDebugLoggingEnabled()) return;
 * fetch('http://127.0.0.1:7242/ingest/...', {...});
 * ```
 *
 * To disable all debug logging:
 * - In browser console: localStorage.setItem('__DISABLE_DEBUG_LOGGING', 'true')
 * - Or: window.__DISABLE_DEBUG_LOGGING = true
 *
 * To re-enable:
 * - localStorage.removeItem('__DISABLE_DEBUG_LOGGING')
 * - window.__DISABLE_DEBUG_LOGGING = false
 */

/**
 * Check if debug logging is enabled
 * This should be checked BEFORE any fetch calls to debug endpoints
 */
export function isDebugLoggingEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check localStorage first (persists across page reloads)
  try {
    const disabled = localStorage.getItem('__DISABLE_DEBUG_LOGGING');
    if (disabled === 'true') {
      return false;
    }
  } catch (e) {
    // localStorage might be unavailable
  }

  // Check window flag (runtime override)
  if ((window as any).__DISABLE_DEBUG_LOGGING === true) {
    return false;
  }

  return true;
}

/**
 * Disable all debug logging globally
 */
export function disableDebugLogging(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('__DISABLE_DEBUG_LOGGING', 'true');
  } catch (e) {
    // localStorage might be unavailable
  }

  (window as any).__DISABLE_DEBUG_LOGGING = true;
}

/**
 * Enable debug logging globally
 */
export function enableDebugLogging(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('__DISABLE_DEBUG_LOGGING');
  } catch (e) {
    // localStorage might be unavailable
  }

  (window as any).__DISABLE_DEBUG_LOGGING = false;
}

// Make functions available globally for easy access from browser console
if (typeof window !== 'undefined') {
  (window as any).__debugLogging = {
    disable: disableDebugLogging,
    enable: enableDebugLogging,
    isEnabled: isDebugLoggingEnabled,
  };

  console.log(
    '%c[DebugLog] Global controls available:',
    'color: #ff7900; font-weight: bold;',
    '\n  window.__debugLogging.disable() - Disable all debug logging\n  window.__debugLogging.enable() - Enable debug logging\n  window.__debugLogging.isEnabled() - Check if enabled'
  );
}
