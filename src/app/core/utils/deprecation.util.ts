/**
 * API Deprecation Warnings (Point 30)
 *
 * Provides runtime deprecation warnings with migration guidance.
 * Helps developers transition to new APIs smoothly.
 *
 * @example
 * ```typescript
 * import { deprecated, deprecatedParam, warnOnce } from './deprecation.util';
 *
 * // Deprecate a method
 * @deprecated('Use newMethod() instead')
 * oldMethod() {
 *   deprecated('oldMethod', 'newMethod', '2.0.0');
 *   return this.newMethod();
 * }
 *
 * // Deprecate a parameter
 * myMethod(options: { oldParam?: string; newParam?: string }) {
 *   deprecatedParam('myMethod', 'oldParam', 'newParam', options.oldParam);
 * }
 * ```
 */

import { isDevMode } from '@angular/core';

// =============================================================================
// TYPES
// =============================================================================

export interface DeprecationWarning {
  /** Deprecated API name */
  api: string;
  /** Replacement API name */
  replacement?: string;
  /** Version when API will be removed */
  removeVersion?: string;
  /** Migration guide URL */
  migrationUrl?: string;
  /** Additional message */
  message?: string;
  /** When the warning was first issued */
  firstWarned: number;
  /** Number of times warned */
  warnCount: number;
}

export interface DeprecationConfig {
  /** Whether to show warnings (default: devMode only) */
  enabled?: boolean;
  /** Whether to throw errors instead of warnings */
  throwOnDeprecation?: boolean;
  /** Maximum warnings per API (default: 3) */
  maxWarnings?: number;
  /** Custom warning handler */
  onWarning?: (warning: DeprecationWarning) => void;
}

// =============================================================================
// STATE
// =============================================================================

/** Track which deprecations have been warned about */
const warnedDeprecations = new Map<string, DeprecationWarning>();

/** Configuration */
let config: Required<DeprecationConfig> = {
  enabled: true,
  throwOnDeprecation: false,
  maxWarnings: 3,
  onWarning: () => undefined,
};

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configure deprecation warnings
 */
export function configureDeprecations(options: DeprecationConfig): void {
  config = { ...config, ...options };
}

/**
 * Enable/disable deprecation warnings
 */
export function setDeprecationsEnabled(enabled: boolean): void {
  config.enabled = enabled;
}

// =============================================================================
// WARNING FUNCTIONS
// =============================================================================

/**
 * Issue a deprecation warning
 *
 * @param api - Name of deprecated API
 * @param replacement - Replacement API name
 * @param removeVersion - Version when API will be removed
 * @param options - Additional options
 */
export function deprecated(
  api: string,
  replacement?: string,
  removeVersion?: string,
  options?: { message?: string; migrationUrl?: string }
): void {
  if (!config.enabled || !isDevMode()) {
    return;
  }

  const key = `${api}:${replacement || ''}`;
  let warning = warnedDeprecations.get(key);

  if (warning) {
    warning.warnCount++;

    // Don't warn more than maxWarnings times
    if (warning.warnCount > config.maxWarnings) {
      return;
    }
  } else {
    const newWarning: DeprecationWarning = {
      api,
      firstWarned: Date.now(),
      warnCount: 1,
    };
    if (replacement) {
      newWarning.replacement = replacement;
    }
    if (removeVersion) {
      newWarning.removeVersion = removeVersion;
    }
    if (options?.migrationUrl) {
      newWarning.migrationUrl = options.migrationUrl;
    }
    if (options?.message) {
      newWarning.message = options.message;
    }
    warning = newWarning;
    warnedDeprecations.set(key, warning);
  }

  // Build warning message
  let message = `[DEPRECATED] "${api}" is deprecated`;

  if (replacement) {
    message += `. Use "${replacement}" instead`;
  }

  if (removeVersion) {
    message += `. Will be removed in v${removeVersion}`;
  }

  if (options?.message) {
    message += `. ${options.message}`;
  }

  if (options?.migrationUrl) {
    message += `\n  Migration guide: ${options.migrationUrl}`;
  }

  // Call custom handler
  config.onWarning(warning);

  // Log or throw
  if (config.throwOnDeprecation) {
    throw new Error(message);
  } else {
    console.warn(
      `%c DEPRECATED %c ${message}`,
      'background: #f59e0b; color: black; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
      'color: #f59e0b;'
    );

    // Show stack trace on first warning
    if (warning.warnCount === 1) {
      console.trace('Deprecation stack trace');
    }
  }
}

/**
 * Warn about a deprecated parameter
 *
 * @param method - Method name
 * @param oldParam - Deprecated parameter name
 * @param newParam - New parameter name
 * @param value - Value of deprecated parameter (only warn if defined)
 */
export function deprecatedParam(
  method: string,
  oldParam: string,
  newParam: string,
  value: unknown
): void {
  if (value === undefined) {
    return;
  }

  deprecated(`${method}({ ${oldParam} })`, `${method}({ ${newParam} })`, undefined, {
    message: `Parameter "${oldParam}" is deprecated, use "${newParam}"`,
  });
}

/**
 * Warn about a deprecated option value
 */
export function deprecatedValue(
  context: string,
  oldValue: unknown,
  newValue: unknown,
  actualValue: unknown
): void {
  if (actualValue !== oldValue) {
    return;
  }

  deprecated(`${context}: "${oldValue}"`, `${context}: "${newValue}"`, undefined, {
    message: `Value "${oldValue}" is deprecated, use "${newValue}"`,
  });
}

/**
 * Issue a warning only once per key
 */
export function warnOnce(key: string, message: string): void {
  if (!config.enabled || !isDevMode()) {
    return;
  }

  if (warnedDeprecations.has(key)) {
    return;
  }

  warnedDeprecations.set(key, {
    api: key,
    firstWarned: Date.now(),
    warnCount: 1,
  });

  console.warn(
    `%c WARNING %c ${message}`,
    'background: #f59e0b; color: black; padding: 2px 4px; border-radius: 2px;',
    'color: inherit;'
  );
}

// =============================================================================
// DECORATORS
// =============================================================================

/**
 * Method decorator for deprecation warnings
 *
 * @example
 * ```typescript
 * class MyService {
 *   @Deprecated('Use newMethod() instead', '2.0.0')
 *   oldMethod() {
 *     return this.newMethod();
 *   }
 * }
 * ```
 */
export function Deprecated(replacement?: string, removeVersion?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = function (...args: unknown[]) {
      deprecated(methodName, replacement, removeVersion);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Class decorator for deprecation warnings
 */

export function DeprecatedClass(replacement?: string, removeVersion?: string): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends new (...args: any[]) => object>(constructor: T): T {
    const className = constructor.name;

    return class extends constructor {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        deprecated(className, replacement, removeVersion);
        super(...args);
      }
    } as T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * Property decorator for deprecation warnings
 */
export function DeprecatedProperty(replacement?: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    const className = target.constructor.name;
    const fullName = `${className}.${String(propertyKey)}`;
    let value: unknown;

    Object.defineProperty(target, propertyKey, {
      get() {
        deprecated(fullName, replacement);
        return value;
      },
      set(newValue: unknown) {
        deprecated(fullName, replacement);
        value = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all deprecation warnings issued
 */
export function getDeprecationWarnings(): DeprecationWarning[] {
  return Array.from(warnedDeprecations.values());
}

/**
 * Clear deprecation warning history
 */
export function clearDeprecationWarnings(): void {
  warnedDeprecations.clear();
}

/**
 * Get deprecation statistics
 */
export function getDeprecationStats(): {
  totalWarnings: number;
  uniqueApis: number;
  mostWarned: DeprecationWarning[];
} {
  const warnings = Array.from(warnedDeprecations.values());
  const sorted = [...warnings].sort((a, b) => b.warnCount - a.warnCount);

  return {
    totalWarnings: warnings.reduce((sum, w) => sum + w.warnCount, 0),
    uniqueApis: warnings.length,
    mostWarned: sorted.slice(0, 10),
  };
}

/**
 * Create a migration helper for deprecated APIs
 */
export function createMigrationHelper<TOld, TNew>(
  oldApi: string,
  newApi: string,
  migrate: (old: TOld) => TNew,
  removeVersion?: string
): (old: TOld) => TNew {
  return (old: TOld): TNew => {
    deprecated(oldApi, newApi, removeVersion);
    return migrate(old);
  };
}

// =============================================================================
// SPECIFIC DEPRECATIONS FOR OSI-CARDS
// =============================================================================

/**
 * Deprecation warnings for OSI-Cards specific APIs
 */
export const OsiDeprecations = {
  /**
   * Warn about old card config format
   */
  oldCardConfig(config: Record<string, unknown>): void {
    if ('title' in config && !('cardTitle' in config)) {
      deprecatedParam('AICardConfig', 'title', 'cardTitle', config.title);
    }
  },

  /**
   * Warn about old theme format
   */
  oldThemeFormat(theme: unknown): void {
    if (typeof theme === 'string') {
      deprecated('theme as string', 'theme as ThemeConfig object', '2.0.0', {
        migrationUrl: 'https://osi-cards.dev/docs/migration/theming',
      });
    }
  },

  /**
   * Warn about old section type names
   */
  oldSectionType(type: string): string {
    const mappings: Record<string, string> = {
      'key-value': 'info',
      metrics: 'analytics',
      timeline: 'event',
    };

    const newType = mappings[type];
    if (newType) {
      deprecatedValue('section.type', type, newType, type);
      return newType;
    }

    return type;
  },

  /**
   * Warn about deprecated event names
   */
  oldEventName(eventName: string): void {
    const mappings: Record<string, string> = {
      'card-click': 'cardClick',
      'section-click': 'sectionClick',
      'action-click': 'actionClick',
    };

    const newName = mappings[eventName];
    if (newName) {
      deprecatedValue('event name', eventName, newName, eventName);
    }
  },
};
