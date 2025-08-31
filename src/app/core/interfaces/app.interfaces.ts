/**
 * Enhanced interface definitions for better type safety
 */
import { Observable } from 'rxjs';
import { BaseEntity, LoadingState, ValidationError } from '../types/common.types';

// Service interfaces
export interface IAsyncService<T> {
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  reload(): Observable<T>;
  clear(): void;
}

export interface ICacheService<T = any> {
  get<K extends T>(key: string): K | null;
  set<K extends T>(key: string, value: K, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  keys(): string[];
  size(): number;
}

export interface ILoggerService {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any, data?: any): void;
  setLevel(level: LogLevel): void;
  createChildLogger(context: string): ILoggerService;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface IValidationService {
  validate<T>(data: T, rules: ValidationRules<T>): ValidationResult;
  validateAsync<T>(data: T, rules: ValidationRules<T>): Observable<ValidationResult>;
  addRule<T>(name: string, rule: ValidationRule<T>): void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export interface ValidationRule<T> {
  name: string;
  message: string;
  validate: (value: T, context?: any) => boolean | Promise<boolean>;
}

// State management interfaces
export interface AppState {
  ui: UiState;
  cards: CardsState;
  user: UserState;
  app: ApplicationState;
}

export interface UiState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  loading: boolean;
  notifications: Notification[];
  modals: Modal[];
}

export interface CardsState {
  items: Card[];
  selectedId: string | null;
  loading: LoadingState;
  error: string | null;
  filters: CardFilters;
  sort: CardSort;
}

export interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  permissions: Permission[];
  isAuthenticated: boolean;
}

export interface ApplicationState {
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  performance: PerformanceMetrics;
}

// Enhanced card interfaces
export interface Card extends BaseEntity {
  type: CardType;
  title: string;
  subtitle?: string;
  description?: string;
  sections: CardSection[];
  metadata: CardMetadata;
  config: CardConfig;
  tags: string[];
  category: string;
  visibility: 'public' | 'private' | 'shared';
  status: 'draft' | 'published' | 'archived';
}

export type CardType =
  | 'company'
  | 'contact'
  | 'opportunity'
  | 'product'
  | 'analytics'
  | 'event'
  | 'custom';

export interface CardSection {
  id: string;
  type: SectionType;
  title?: string;
  order: number;
  visible: boolean;
  config: SectionConfig;
  data: any;
  validation?: ValidationRules<any>;
}

export type SectionType =
  | 'info'
  | 'chart'
  | 'map'
  | 'image'
  | 'text'
  | 'contact'
  | 'social'
  | 'custom';

export interface SectionConfig {
  layout: 'full' | 'half' | 'third' | 'quarter';
  styling: SectionStyling;
  interactions: SectionInteractions;
  responsive: ResponsiveConfig;
}

export interface SectionStyling {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: string;
  margin?: string;
  shadow?: boolean;
  animation?: string;
}

export interface SectionInteractions {
  clickable: boolean;
  hoverable: boolean;
  expandable: boolean;
  exportable: boolean;
  shareable: boolean;
}

export interface ResponsiveConfig {
  mobile: Partial<SectionConfig>;
  tablet: Partial<SectionConfig>;
  desktop: Partial<SectionConfig>;
}

export interface CardMetadata {
  author: string;
  authorId: string;
  template?: string;
  templateVersion?: string;
  customFields: Record<string, any>;
  analytics: CardAnalytics;
}

export interface CardAnalytics {
  views: number;
  interactions: number;
  shares: number;
  lastViewed?: Date;
  averageViewTime?: number;
}

export interface CardConfig {
  theme: CardTheme;
  layout: CardLayout;
  interactions: CardInteractions;
  export: ExportConfig;
  sharing: SharingConfig;
}

export interface CardTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface CardLayout {
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape';
  margins: Spacing;
  padding: Spacing;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CardInteractions {
  tiltEffect: boolean;
  hoverEffects: boolean;
  clickToExpand: boolean;
  draggable: boolean;
  resizable: boolean;
}

export interface ExportConfig {
  formats: ExportFormat[];
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeMetadata: boolean;
  watermark: boolean;
}

export type ExportFormat = 'png' | 'jpg' | 'pdf' | 'svg' | 'json';

export interface SharingConfig {
  enabled: boolean;
  permissions: SharingPermission[];
  expiration?: Date;
  password?: string;
  analytics: boolean;
}

export interface SharingPermission {
  userId: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  grantedAt: Date;
  grantedBy: string;
}

// Filter and sort interfaces
export interface CardFilters {
  type?: CardType[];
  category?: string[];
  tags?: string[];
  status?: Card['status'][];
  visibility?: Card['visibility'][];
  author?: string[];
  dateRange?: DateRange;
  search?: string;
}

export interface CardSort {
  field: keyof Card | 'createdAt' | 'updatedAt' | 'views' | 'interactions';
  direction: 'asc' | 'desc';
}

export interface DateRange {
  start: Date;
  end: Date;
}

// User interfaces
export interface UserProfile extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  types: string[];
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showLocation: boolean;
  allowIndexing: boolean;
  dataRetention: number; // days
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  scope: string;
  actions: string[];
  grantedAt: Date;
}

// UI component interfaces
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible: boolean;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Modal {
  id: string;
  component: any;
  data?: any;
  config: ModalConfig;
}

export interface ModalConfig {
  title?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  closable: boolean;
  backdrop: boolean;
  keyboard: boolean;
  position: 'center' | 'top' | 'bottom';
}

// Performance interfaces
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractions: number;
  lastUpdated: Date;
}

// Feature flags
export interface FeatureFlags {
  tiltEffects: boolean;
  particleSystem: boolean;
  analytics: boolean;
  errorReporting: boolean;
  darkMode: boolean;
  exportFeatures: boolean;
  advancedCharts: boolean;
  realTimeUpdates: boolean;
  cloudSync: boolean;
  aiSuggestions: boolean;
}
