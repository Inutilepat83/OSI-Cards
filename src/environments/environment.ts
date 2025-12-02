/**
 * Development environment configuration
 * This configuration is used during development and testing
 */
export const environment = {
  // Environment identification
  production: false,
  environmentName: 'development',

  // API Configuration
  apiUrl: 'http://localhost:3000/api',
  apiTimeout: 30000, // 30 seconds

  // Debugging and Logging
  enableDebug: true,
  logLevel: 'debug' as 'error' | 'warn' | 'info' | 'debug',
  enablePerformanceLogging: true,
  enableStateLogging: true,

  // Feature Flags
  features: {
    enableExperimentalFeatures: true,
    enableBetaComponents: true,
    enableAdvancedAnalytics: false,
    enableOfflineMode: false,
  },

  // Application Configuration
  cardLimits: {
    maxSections: 20,
    maxActions: 10,
    maxFieldsPerSection: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 1000,
  },

  // Performance Configuration
  performance: {
    enableChangeDetectionProfiling: true,
    enableBundleAnalysis: false,
    cacheTimeout: 0, // Cache disabled in dev for fresh data on every request
    debounceTime: 300, // milliseconds
  },

  // Development Tools
  devTools: {
    enableReduxDevTools: true,
    enableAngularDevTools: true,
    showPerformanceMetrics: true,
  },
};
