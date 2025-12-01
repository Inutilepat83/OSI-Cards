/**
 * Deprecation Warnings Utility (Point 87)
 * 
 * Creates deprecation warnings with migration hints and timeline.
 * 
 * @example
 * ```typescript
 * import { deprecated, warnDeprecated, DEPRECATIONS } from 'osi-cards-lib';
 * 
 * // As decorator
 * class MyService {
 *   @deprecated('1.6.0', 'Use newMethod() instead')
 *   oldMethod() { ... }
 * }
 * 
 * // As function
 * function legacyFunction() {
 *   warnDeprecated('legacyFunction', '1.6.0', 'Use newFunction() instead');
 *   // ...
 * }
 * 
 * // Check all deprecations
 * console.log(DEPRECATIONS.getAll());
 * ```
 */

import { getLogger, LogLevel } from './structured-logging.util';

const deprecationLogger = getLogger('osi-cards:deprecation');

/**
 * Deprecation info
 */
export interface DeprecationInfo {
  /** Name of deprecated feature */
  name: string;
  /** Version when deprecated */
  deprecatedIn: string;
  /** Version when will be removed */
  removeIn?: string;
  /** Migration instructions */
  migration: string;
  /** Documentation URL */
  docUrl?: string;
  /** First occurrence timestamp */
  firstSeen?: Date;
  /** Number of times warning shown */
  count: number;
}

/**
 * Deprecation registry
 */
class DeprecationRegistry {
  private static instance: DeprecationRegistry;
  private readonly deprecations = new Map<string, DeprecationInfo>();
  private showWarnings = true;
  private onlyOnce = true;

  public static getInstance(): DeprecationRegistry {
    if (!DeprecationRegistry.instance) {
      DeprecationRegistry.instance = new DeprecationRegistry();
    }
    return DeprecationRegistry.instance;
  }

  /**
   * Register a deprecation
   */
  public register(
    name: string,
    deprecatedIn: string,
    migration: string,
    options: {
      removeIn?: string;
      docUrl?: string;
    } = {}
  ): void {
    if (!this.deprecations.has(name)) {
      this.deprecations.set(name, {
        name,
        deprecatedIn,
        migration,
        removeIn: options.removeIn,
        docUrl: options.docUrl,
        firstSeen: new Date(),
        count: 0,
      });
    }
  }

  /**
   * Warn about deprecation
   */
  public warn(name: string): void {
    const info = this.deprecations.get(name);
    
    if (!info) {
      // Unregistered deprecation
      deprecationLogger.warn(`Unknown deprecation: ${name}`);
      return;
    }

    info.count++;

    if (!this.showWarnings) return;
    if (this.onlyOnce && info.count > 1) return;

    const message = this.formatWarning(info);
    deprecationLogger.warn(message, {
      deprecation: name,
      version: info.deprecatedIn,
      migration: info.migration,
    });
  }

  /**
   * Format deprecation warning message
   */
  private formatWarning(info: DeprecationInfo): string {
    let message = `DEPRECATED: "${info.name}" was deprecated in v${info.deprecatedIn}`;
    
    if (info.removeIn) {
      message += ` and will be removed in v${info.removeIn}`;
    }
    
    message += `. ${info.migration}`;
    
    if (info.docUrl) {
      message += ` See: ${info.docUrl}`;
    }
    
    return message;
  }

  /**
   * Get all registered deprecations
   */
  public getAll(): DeprecationInfo[] {
    return Array.from(this.deprecations.values());
  }

  /**
   * Get usage statistics
   */
  public getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.deprecations.forEach((info, name) => {
      stats[name] = info.count;
    });
    return stats;
  }

  /**
   * Enable/disable warnings
   */
  public setShowWarnings(show: boolean): void {
    this.showWarnings = show;
  }

  /**
   * Show warnings only once per deprecation
   */
  public setOnlyOnce(once: boolean): void {
    this.onlyOnce = once;
  }

  /**
   * Reset all counts
   */
  public resetCounts(): void {
    this.deprecations.forEach(info => {
      info.count = 0;
    });
  }

  /**
   * Clear all deprecations
   */
  public clear(): void {
    this.deprecations.clear();
  }
}

/**
 * Get the deprecation registry
 */
export const DEPRECATIONS = DeprecationRegistry.getInstance();

/**
 * Warn about deprecation (function)
 */
export function warnDeprecated(
  name: string,
  deprecatedIn: string,
  migration: string,
  options?: { removeIn?: string; docUrl?: string }
): void {
  DEPRECATIONS.register(name, deprecatedIn, migration, options);
  DEPRECATIONS.warn(name);
}

/**
 * Deprecated method decorator
 */
export function deprecated(
  deprecatedIn: string,
  migration: string,
  options?: { removeIn?: string; docUrl?: string }
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const name = `${target.constructor.name}.${propertyKey}`;

    DEPRECATIONS.register(name, deprecatedIn, migration, options);

    descriptor.value = function (...args: unknown[]) {
      DEPRECATIONS.warn(name);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Deprecated class decorator
 */
export function deprecatedClass(
  deprecatedIn: string,
  migration: string,
  options?: { removeIn?: string; docUrl?: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends new (...args: any[]) => object>(constructor: T) {
    const name = constructor.name;
    DEPRECATIONS.register(name, deprecatedIn, migration, options);

    return class extends constructor {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        DEPRECATIONS.warn(name);
        super(...args);
      }
    };
  };
}

/**
 * Check if a version is deprecated
 */
export function isDeprecatedVersion(
  current: string,
  deprecatedIn: string
): boolean {
  const currentParts = current.split('.').map(Number);
  const deprecatedParts = deprecatedIn.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if ((currentParts[i] ?? 0) > (deprecatedParts[i] ?? 0)) return true;
    if ((currentParts[i] ?? 0) < (deprecatedParts[i] ?? 0)) return false;
  }

  return true; // Same version
}

// ============================================================================
// Pre-registered OSI Cards Deprecations
// ============================================================================

// Register known deprecations
DEPRECATIONS.register(
  'SAMPLE_INFO_SECTION',
  '1.6.0',
  'Use getFixture("info", "complete") from registry instead',
  { removeIn: '2.0.0' }
);

DEPRECATIONS.register(
  'SAMPLE_SECTIONS',
  '1.6.0',
  'Use SECTION_FIXTURES.complete from registry instead',
  { removeIn: '2.0.0' }
);

DEPRECATIONS.register(
  'SAMPLE_CARDS',
  '1.6.0',
  'Use SAMPLE_CARDS from registry/fixtures.generated instead',
  { removeIn: '2.0.0' }
);

