import { Injectable, InjectionToken, inject } from '@angular/core';
import { MigrationFlags, DEFAULT_MIGRATION_FLAGS } from '../config/migration-flags.config';

/**
 * Injection token for providing migration flag overrides
 */
export const MIGRATION_FLAGS = new InjectionToken<Partial<MigrationFlags>>('MIGRATION_FLAGS');

/**
 * Service for managing migration feature flags.
 * Allows gradual rollout of consolidated code.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * providers: [
 *   {
 *     provide: MIGRATION_FLAGS,
 *     useValue: {
 *       USE_LAZY_SECTIONS: true,
 *       USE_LIB_MASONRY_GRID: false, // Keep using src version temporarily
 *     }
 *   }
 * ]
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MigrationFlagsService {
  private readonly overrides = inject(MIGRATION_FLAGS, { optional: true });

  private readonly flags: MigrationFlags = {
    ...DEFAULT_MIGRATION_FLAGS,
    ...this.overrides,
  };

  /**
   * Check if a migration flag is enabled
   */
  isEnabled(flag: keyof MigrationFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Get all migration flags
   */
  getAll(): MigrationFlags {
    return { ...this.flags };
  }

  /**
   * Get enabled flags only
   */
  getEnabled(): (keyof MigrationFlags)[] {
    return (Object.keys(this.flags) as (keyof MigrationFlags)[])
      .filter(key => this.flags[key]);
  }

  /**
   * Get disabled flags only
   */
  getDisabled(): (keyof MigrationFlags)[] {
    return (Object.keys(this.flags) as (keyof MigrationFlags)[])
      .filter(key => !this.flags[key]);
  }

  /**
   * Log current flag status (for debugging)
   */
  logStatus(): void {
    console.group('Migration Flags Status');
    for (const [key, value] of Object.entries(this.flags)) {
      console.log(`${key}: ${value ? '✅' : '❌'}`);
    }
    console.groupEnd();
  }
}



