/**
 * Feature Flags Service
 *
 * Manage feature flags for gradual rollouts and A/B testing.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private featureFlags = inject(FeatureFlagsService);
 *
 *   ngOnInit() {
 *     if (this.featureFlags.isEnabled('new-layout')) {
 *       // Show new layout
 *     }
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number; // 0-100
  enabledFor?: string[]; // User IDs or groups
  enabledEnvironments?: ('development' | 'staging' | 'production')[];
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagsService {
  private flags = new BehaviorSubject<Map<string, FeatureFlag>>(new Map());

  constructor() {
    this.initializeFlags();
  }

  /**
   * Initialize default flags
   */
  private initializeFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'new-layout',
        enabled: false,
        description: 'New masonry layout engine',
        rolloutPercentage: 0,
      },
      {
        key: 'dark-mode',
        enabled: true,
        description: 'Dark mode support',
      },
      {
        key: 'streaming',
        enabled: true,
        description: 'LLM streaming support',
      },
      {
        key: 'analytics',
        enabled: false,
        description: 'Analytics tracking',
        enabledEnvironments: ['production'],
      },
      {
        key: 'experimental-animations',
        enabled: false,
        description: 'Experimental animation effects',
        enabledEnvironments: ['development'],
      },
      {
        key: 'error-boundaries',
        enabled: true,
        description: 'Error boundary components',
      },
      {
        key: 'health-checks',
        enabled: true,
        description: 'Application health monitoring',
      },
      {
        key: 'performance-monitoring',
        enabled: true,
        description: 'Performance metrics collection',
      },
      {
        key: 'lazy-loading',
        enabled: true,
        description: 'Lazy loading for routes',
      },
      {
        key: 'service-worker',
        enabled: false,
        description: 'Service worker for PWA',
        enabledEnvironments: ['production'],
      },
    ];

    const flagMap = new Map<string, FeatureFlag>();
    defaultFlags.forEach((flag) => flagMap.set(flag.key, flag));
    this.flags.next(flagMap);

    // Load from localStorage
    this.loadFromStorage();
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(key: string, userId?: string): boolean {
    const flags = this.flags.value;
    const flag = flags.get(key);

    if (!flag) {
      console.warn(`[FeatureFlags] Unknown flag: ${key}`);
      return false;
    }

    // Check if disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment
    if (flag.enabledEnvironments) {
      const env = this.getCurrentEnvironment();
      if (!flag.enabledEnvironments.includes(env)) {
        return false;
      }
    }

    // Check user-specific access
    if (flag.enabledFor && userId) {
      return flag.enabledFor.includes(userId);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      return this.isInRollout(key, userId || 'anonymous', flag.rolloutPercentage);
    }

    return true;
  }

  /**
   * Check if feature is enabled (observable)
   */
  isEnabled$(key: string, userId?: string): Observable<boolean> {
    return this.flags.pipe(map(() => this.isEnabled(key, userId)));
  }

  /**
   * Enable feature flag
   */
  enable(key: string): void {
    const flags = this.flags.value;
    const flag = flags.get(key);

    if (flag) {
      flag.enabled = true;
      this.flags.next(flags);
      this.saveToStorage();
    }
  }

  /**
   * Disable feature flag
   */
  disable(key: string): void {
    const flags = this.flags.value;
    const flag = flags.get(key);

    if (flag) {
      flag.enabled = false;
      this.flags.next(flags);
      this.saveToStorage();
    }
  }

  /**
   * Toggle feature flag
   */
  toggle(key: string): void {
    const flags = this.flags.value;
    const flag = flags.get(key);

    if (flag) {
      flag.enabled = !flag.enabled;
      this.flags.next(flags);
      this.saveToStorage();
    }
  }

  /**
   * Set rollout percentage
   */
  setRolloutPercentage(key: string, percentage: number): void {
    const flags = this.flags.value;
    const flag = flags.get(key);

    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags.next(flags);
      this.saveToStorage();
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.value.values());
  }

  /**
   * Get flag details
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.value.get(key);
  }

  /**
   * Observe all flags
   */
  flags$(): Observable<FeatureFlag[]> {
    return this.flags.pipe(map((flags) => Array.from(flags.values())));
  }

  /**
   * Determine if user/session is in rollout
   */
  private isInRollout(flagKey: string, identifier: string, percentage: number): boolean {
    // Simple hash-based deterministic rollout
    const hash = this.simpleHash(`${flagKey}:${identifier}`);
    const rolloutValue = hash % 100;
    return rolloutValue < percentage;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get current environment
   */
  private getCurrentEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window === 'undefined') {
      return 'production';
    }

    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }

    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }

    return 'production';
  }

  /**
   * Save flags to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const flags = this.getAllFlags();
    const overrides = flags
      .filter((f) => f.enabled !== this.getDefaultEnabled(f.key))
      .map((f) => ({ key: f.key, enabled: f.enabled }));

    localStorage.setItem('feature-flags', JSON.stringify(overrides));
  }

  /**
   * Load flags from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem('feature-flags');
    if (!stored) {
      return;
    }

    try {
      const overrides = JSON.parse(stored);
      const flags = this.flags.value;

      overrides.forEach((override: { key: string; enabled: boolean }) => {
        const flag = flags.get(override.key);
        if (flag) {
          flag.enabled = override.enabled;
        }
      });

      this.flags.next(flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to load from storage:', error);
    }
  }

  /**
   * Get default enabled state
   */
  private getDefaultEnabled(key: string): boolean {
    // This would ideally come from a config file
    const defaults: Record<string, boolean> = {
      'new-layout': false,
      'dark-mode': true,
      streaming: true,
      analytics: false,
      'experimental-animations': false,
      'error-boundaries': true,
      'health-checks': true,
      'performance-monitoring': true,
      'lazy-loading': true,
      'service-worker': false,
    };

    return defaults[key] ?? false;
  }

  /**
   * Reset all flags to defaults
   */
  resetToDefaults(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('feature-flags');
    }
    this.initializeFlags();
  }
}
