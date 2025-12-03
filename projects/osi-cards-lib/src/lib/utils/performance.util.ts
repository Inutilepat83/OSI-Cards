/**
 * Consolidated Performance Utilities
 *
 * Re-exports timing utilities (debounce, throttle, RAF)
 * For full performance utilities, see timing.util.ts
 */

// Re-export timing utilities
export * from './timing.util';

// Performance utilities namespace
export const PerformanceUtil = {
  // Legacy namespace - import directly from timing.util instead
};
