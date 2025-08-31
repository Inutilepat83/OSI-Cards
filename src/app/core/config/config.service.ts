import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggingService } from '../services/logging.service';

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    tiltEffects: boolean;
    particleSystem: boolean;
    analytics: boolean;
    errorReporting: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
    transitions: boolean;
  };
  performance: {
    enablePerformanceMonitoring: boolean;
    enableMemoryMonitoring: boolean;
    lazyLoadThreshold: number;
  };
}

const defaultConfig: AppConfig = {
  api: {
    baseUrl: environment.apiUrl,
    timeout: 30000,
    retries: 3,
  },
  features: {
    tiltEffects: true,
    particleSystem: true,
    analytics: !environment.production,
    errorReporting: environment.production,
  },
  ui: {
    theme: 'auto',
    animations: true,
    transitions: true,
  },
  performance: {
    enablePerformanceMonitoring: !environment.production,
    enableMemoryMonitoring: !environment.production,
    lazyLoadThreshold: 50,
  },
};

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig = { ...defaultConfig };

  constructor(private logger: LoggingService) {
    this.loadConfig();
  }

  // Get configuration value
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  // Get nested configuration value
  getNested<T>(path: string): T | undefined {
    return path.split('.').reduce((obj: any, key) => obj?.[key], this.config);
  }

  // Update configuration
  update(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  // Update nested configuration
  updateNested(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj: any, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);

    target[lastKey] = value;
    this.saveConfig();
  }

  // Reset to defaults
  reset(): void {
    this.config = { ...defaultConfig };
    this.clearSavedConfig();
  }

  // Load configuration from storage
  private loadConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('app-config');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        this.config = { ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      this.logger.warn('ConfigService', 'Failed to load configuration from storage', error);
    }
  }

  // Save configuration to storage
  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('app-config', JSON.stringify(this.config));
    } catch (error) {
      this.logger.warn('ConfigService', 'Failed to save configuration to storage', error);
    }
  }

  // Clear saved configuration
  private clearSavedConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('app-config');
    } catch (error) {
      this.logger.warn('ConfigService', 'Failed to clear configuration from storage', error);
    }
  }

  // Get current environment
  get environment() {
    return environment;
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Check if in production
  get isProduction(): boolean {
    return environment.production;
  }

  // Check if in development
  get isDevelopment(): boolean {
    return !environment.production;
  }
}
