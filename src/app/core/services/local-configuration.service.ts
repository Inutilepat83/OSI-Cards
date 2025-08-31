import { Injectable } from '@angular/core';
import { ConfigurationService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class LocalConfigurationService implements ConfigurationService {
  private config = new Map<string, any>();

  constructor() {
    // Initialize with default configuration
    this.initializeDefaults();
  }

  get<T>(key: string): T | undefined {
    return this.config.get(key);
  }

  set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  getEnvironment(): string {
    return this.get<string>('environment') || 'development';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  getApiUrl(): string {
    return this.get<string>('apiUrl') || 'http://localhost:3000/api';
  }

  getVersion(): string {
    return this.get<string>('version') || '1.0.0';
  }

  private initializeDefaults(): void {
    this.config.set('environment', 'development');
    this.config.set('apiUrl', 'http://localhost:3000/api');
    this.config.set('version', '1.0.0');
    this.config.set('debug', true);
    this.config.set('cacheEnabled', true);
    this.config.set('maxCacheSize', 100);
    this.config.set('logLevel', 'info');
  }
}
