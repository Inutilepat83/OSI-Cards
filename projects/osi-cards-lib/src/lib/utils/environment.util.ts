/**
 * Environment Utilities
 *
 * Utilities for environment detection and configuration.
 *
 * @example
 * ```typescript
 * import { isDevelopment, isProduction, getPlatform } from '@osi-cards/utils';
 *
 * if (isDevelopment()) {
 *   console.log('Development mode');
 * }
 * ```
 */

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return (
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1') &&
    !window.location.hostname.includes('dev')
  );
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return typeof jest !== 'undefined' || typeof jasmine !== 'undefined';
}

/**
 * Get environment
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  if (isTest()) return 'test';
  if (isProduction()) return 'production';
  return 'development';
}

/**
 * Get platform
 */
export function getPlatform(): 'browser' | 'node' | 'unknown' {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  return 'unknown';
}

/**
 * Is browser
 */
export function isBrowser(): boolean {
  return getPlatform() === 'browser';
}

/**
 * Is Node.js
 */
export function isNode(): boolean {
  return getPlatform() === 'node';
}

/**
 * Is localhost
 */
export function isLocalhost(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Is HTTPS
 */
export function isHTTPS(): boolean {
  return window.location.protocol === 'https:';
}

/**
 * Get base URL
 */
export function getBaseURL(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Get current URL
 */
export function getCurrentURL(): string {
  return window.location.href;
}

/**
 * Get hostname
 */
export function getHostname(): string {
  return window.location.hostname;
}

/**
 * Get port
 */
export function getPort(): string {
  return window.location.port;
}

/**
 * Get protocol
 */
export function getProtocol(): string {
  return window.location.protocol;
}

/**
 * Get pathname
 */
export function getPathname(): string {
  return window.location.pathname;
}

/**
 * Get hash
 */
export function getHash(): string {
  return window.location.hash;
}

/**
 * Get search params
 */
export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * Check if embedded in iframe
 */
export function isEmbedded(): boolean {
  return window.self !== window.top;
}
