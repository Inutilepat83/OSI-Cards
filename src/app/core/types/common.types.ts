/**
 * Common type definitions used throughout the application
 */

// Base entity interface for all domain objects
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

// API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

// Pagination metadata
export interface ResponseMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Application configuration
export interface AppConfig {
  api: ApiConfig;
  features: FeatureFlags;
  ui: UiConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface FeatureFlags {
  tiltEffects: boolean;
  particleSystem: boolean;
  analytics: boolean;
  errorReporting: boolean;
  darkMode: boolean;
  exportFeatures: boolean;
}

export interface UiConfig {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  transitions: boolean;
  language: string;
}

export interface PerformanceConfig {
  enablePerformanceMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  lazyLoadThreshold: number;
  cacheSize: number;
}

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  rateLimiting: boolean;
  sanitizeInputs: boolean;
  logSecurityEvents: boolean;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Generic result type
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
  message?: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  id: string;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

// Language types
export interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

// Sort and filter types
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

// Event types
export interface ApplicationEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
  userId?: string;
}

// Cache types
export interface CacheItem<T = any> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
  accessCount: number;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
