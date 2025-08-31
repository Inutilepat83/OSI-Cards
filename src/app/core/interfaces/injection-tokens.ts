// Service injection tokens for dependency injection
import { InjectionToken } from '@angular/core';
import {
  LoggingService as ILoggingService,
  NotificationService as INotificationService,
  CacheService as ICacheService,
  ConfigurationService as IConfigurationService,
  ValidationService as IValidationService,
} from './services.interface';

export const LOGGING_SERVICE = new InjectionToken<ILoggingService>('LoggingService');
export const NOTIFICATION_SERVICE = new InjectionToken<INotificationService>('NotificationService');
export const CACHE_SERVICE = new InjectionToken<ICacheService>('CacheService');
export const CONFIGURATION_SERVICE = new InjectionToken<IConfigurationService>(
  'ConfigurationService'
);
export const VALIDATION_SERVICE = new InjectionToken<IValidationService>('ValidationService');

// Re-export interfaces for convenience
export * from './services.interface';
