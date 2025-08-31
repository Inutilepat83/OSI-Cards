import { Observable } from 'rxjs';
import { AICardConfig } from '../../models/card.model';

export interface CardService {
  getAllCards(): Observable<AICardConfig[]>;
  getCardById(id: string): Observable<AICardConfig | null>;
  getCardsByType(type: string): Observable<AICardConfig[]>;
  createCard(card: AICardConfig): Observable<AICardConfig>;
  updateCard(card: AICardConfig): Observable<AICardConfig>;
  deleteCard(id: string): Observable<boolean>;
  getTemplate(cardType: string, variant?: number): Observable<AICardConfig>;
  saveCardConfiguration(config: AICardConfig): Observable<boolean>;
  exportCard(cardId: string, format: 'pdf' | 'png' | 'json'): Observable<Blob | string>;
}

export interface StorageService {
  get<T>(key: string): Observable<T | null>;
  set<T>(key: string, value: T): Observable<boolean>;
  remove(key: string): Observable<boolean>;
  clear(): Observable<boolean>;
  exists(key: string): Observable<boolean>;
}

export interface LoggingService {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
  logEvent(event: string, properties?: Record<string, any>): void;
}

export interface NotificationService {
  showSuccess(message: string, title?: string): void;
  showError(message: string, title?: string): void;
  showWarning(message: string, title?: string): void;
  showInfo(message: string, title?: string): void;
  clear(): void;
}

export interface AnalyticsService {
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackPageView(page: string, properties?: Record<string, any>): void;
  trackUser(userId: string, properties?: Record<string, any>): void;
  trackError(error: Error, properties?: Record<string, any>): void;
}

export interface ConfigurationService {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  getEnvironment(): string;
  isProduction(): boolean;
  isDevelopment(): boolean;
  getApiUrl(): string;
  getVersion(): string;
}

export interface CacheService {
  get<T>(key: string): Observable<T | null>;
  set<T>(key: string, value: T, ttl?: number): Observable<boolean>;
  delete(key: string): Observable<boolean>;
  clear(): Observable<boolean>;
  keys(): Observable<string[]>;
  has(key: string): boolean;
  isExpired(key: string): boolean;
}

export interface ValidationService {
  validateCard(card: AICardConfig): ValidationResult;
  validateSection(section: any): ValidationResult;
  validateField(field: any, rules: ValidationRule[]): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}
