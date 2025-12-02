/**
 * Core Module Barrel Exports
 *
 * Contains app-specific singleton services, interceptors, guards, and providers.
 *
 * Note: Some services have been consolidated:
 * - MagneticTiltService: Import from '@osi-cards/services'
 * - FocusManagementService: Import from '@app/shared/services/focus-management.service'
 * - ExportService: Import from '@app/shared/services/export.service'
 *
 * See docs/ARCHITECTURE_GUIDELINES.md for placement guidelines.
 */

// Card Data Services
export * from './services/card-data';

// App-specific Services
export * from './services/analytics.service';
export * from './services/app-config.service';
export * from './services/card-generation.service';
export * from './services/card-search.service';
export * from './services/circuit-breaker.service';
export * from './services/development-warnings.service';
export * from './services/error-handling.service';
export * from './services/error-reporting.service';
export * from './services/feature-flag.service';
export * from './services/health-check.service';
export * from './services/i18n.service';
export * from './services/indexeddb-cache.service';
export * from './services/json-processing.service';
export * from './services/json-validation.service';
export * from './services/llm-streaming.service';
export * from './services/logging.service';
export * from './services/performance.service';
export * from './services/request-queue.service';
export * from './services/retry-queue.service';
export * from './services/rum.service';
export * from './services/validation.service';

// Interceptors
export * from './interceptors/error.interceptor';
export * from './interceptors/http-cache.interceptor';
export * from './interceptors/security-headers.interceptor';

// Guards and Resolvers
export * from './guards/card-exists.guard';
export * from './resolvers/card.resolver';

// Providers
export * from './providers/osi-cards.providers';
