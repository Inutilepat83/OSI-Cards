// Core module exports
export * from './core.module';

// Enhanced services exports
export * from './services/enhanced-logging.service';
export * from './services/enhanced-cache.service';
export * from './services/notification.service';

// Enhanced validation service with explicit exports to avoid conflicts
export { ValidationService } from './services/validation.service';

// Types and interfaces - selective exports to avoid conflicts
export {
  BaseEntity,
  ApiResponse,
  ResponseMeta,
  LoadingState,
  Result,
  Nullable,
  Optional,
  DeepPartial,
  DeepReadonly,
} from './types/common.types';

export {
  IAsyncService,
  ICacheService,
  ILoggerService,
  IValidationService,
  Card,
  CardType,
  CardSection,
  SectionType,
  UserProfile,
  UserPreferences,
  Permission,
  Notification as CoreNotification,
  Modal,
  PerformanceMetrics,
} from './interfaces/app.interfaces';

// Error handling
export * from './error/global-error-handler';
export * from './error/enhanced-global-error-handler';

// Interceptors
export * from './interceptors/http-error.interceptor';
export * from './interceptors/logging.interceptor';

// State management
export * from './state/state.service';

// Performance monitoring
export * from './performance/performance.service';

// Accessibility
export * from './accessibility/accessibility.service';

// Configuration
export * from './config/config.service';

// Card services
export * from './services/local-card-configuration.service';
export * from './services/local-initialization.service';
export * from './services/magnetic-tilt.service';
export * from './services/mouse-tracking.service';

// Additional services
export * from './services/theme.service';
export * from './services/i18n.service';
export * from './services/security.service';
