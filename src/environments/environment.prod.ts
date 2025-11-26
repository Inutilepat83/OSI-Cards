/**
 * Production environment configuration
 * This configuration is used for production builds
 */
export const environment = {
  // Environment identification
  production: true,
  environmentName: 'production',
  
  // API Configuration
  apiUrl: 'https://api.osi-cards.com/api',
  apiTimeout: 15000, // 15 seconds

  
  // Debugging and Logging
  enableDebug: false,
  logLevel: 'error' as 'error' | 'warn' | 'info' | 'debug',
  enablePerformanceLogging: false,
  enableStateLogging: false,
  
  // Feature Flags
  features: {
    enableExperimentalFeatures: false,
    enableBetaComponents: false,
    enableAdvancedAnalytics: true,
    enableOfflineMode: true
  },
  
  // Application Configuration
  cardLimits: {
    maxSections: 15,
    maxActions: 8,
    maxFieldsPerSection: 30,
    maxTitleLength: 150,
    maxDescriptionLength: 500
  },
  
  // Performance Configuration
  performance: {
    enableChangeDetectionProfiling: false,
    enableBundleAnalysis: false,
    cacheTimeout: 3600000, // 1 hour (60 * 60 * 1000 ms)
    debounceTime: 500 // milliseconds
  },
  
  // Development Tools
  devTools: {
    enableReduxDevTools: false,
    enableAngularDevTools: false,
    showPerformanceMetrics: false
  }
};
