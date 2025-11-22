import { InjectionToken } from '@angular/core';

/**
 * Dependency injection tokens
 * Replace direct class dependencies with DI tokens for better testability
 */

/**
 * Card data provider token
 */
export const CARD_DATA_PROVIDER_TOKEN = new InjectionToken<any>('CARD_DATA_PROVIDER');

/**
 * JSON processing service token
 */
export const JSON_PROCESSING_SERVICE_TOKEN = new InjectionToken<any>('JSON_PROCESSING_SERVICE');

/**
 * LLM streaming service token
 */
export const LLM_STREAMING_SERVICE_TOKEN = new InjectionToken<any>('LLM_STREAMING_SERVICE');

/**
 * Logging service token
 */
export const LOGGING_SERVICE_TOKEN = new InjectionToken<any>('LOGGING_SERVICE');

/**
 * Configuration service token
 */
export const APP_CONFIG_TOKEN = new InjectionToken<any>('APP_CONFIG');

/**
 * Export service token
 */
export const EXPORT_SERVICE_TOKEN = new InjectionToken<any>('EXPORT_SERVICE');

/**
 * Theme service token
 */
export const THEME_SERVICE_TOKEN = new InjectionToken<any>('THEME_SERVICE');


