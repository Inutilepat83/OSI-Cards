/**
 * Zoneless Mode Support (Improvement Plan Point #1)
 * 
 * Provides full zoneless mode compatibility for Angular 20+.
 * Enables zone-independent change detection for better performance.
 * 
 * @example
 * ```typescript
 * import { provideOsiCardsZoneless, withZonelessSupport } from 'osi-cards-lib';
 * 
 * // Option 1: Full zoneless configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideExperimentalZonelessChangeDetection(),
 *     provideOsiCardsZoneless()
 *   ]
 * };
 * 
 * // Option 2: Add zoneless support to existing config
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideOsiCards(
 *       withZonelessSupport(),
 *       withTheme({ defaultTheme: 'dark' })
 *     )
 *   ]
 * };
 * ```
 */

import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
  InjectionToken,
  inject,
  NgZone,
  ChangeDetectorRef,
  DestroyRef,
  ApplicationRef,
  PLATFORM_ID,
  Injector,
  runInInjectionContext,
  signal,
  effect,
  Signal,
  WritableSignal,
  computed,
  untracked
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================================
// ZONELESS CONFIGURATION
// ============================================================================

/**
 * Zoneless mode configuration options
 */
export interface ZonelessConfigOptions {
  /** Enable zoneless mode detection and optimizations */
  enabled?: boolean;
  /** Use signal-based state management */
  useSignals?: boolean;
  /** Enable automatic change detection scheduling */
  autoScheduleCD?: boolean;
  /** Coalesce multiple change detection runs */
  coalesceChanges?: boolean;
  /** Debug mode for zoneless operations */
  debug?: boolean;
}

/**
 * Default zoneless configuration
 */
export const DEFAULT_ZONELESS_CONFIG: ZonelessConfigOptions = {
  enabled: true,
  useSignals: true,
  autoScheduleCD: true,
  coalesceChanges: true,
  debug: false
};

/**
 * Injection token for zoneless configuration
 */
export const OSI_ZONELESS_CONFIG = new InjectionToken<ZonelessConfigOptions>(
  'OSI_ZONELESS_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULT_ZONELESS_CONFIG
  }
);

/**
 * Injection token indicating if app is running in zoneless mode
 */
export const OSI_IS_ZONELESS = new InjectionToken<boolean>(
  'OSI_IS_ZONELESS',
  {
    providedIn: 'root',
    factory: () => {
      const ngZone = inject(NgZone, { optional: true });
      // If NgZone is NoopZone, we're in zoneless mode
      return !ngZone || (ngZone as unknown as { isStable?: boolean }).isStable === undefined;
    }
  }
);

// ============================================================================
// ZONELESS UTILITIES
// ============================================================================

/**
 * Check if the application is running in zoneless mode
 */
export function isZonelessMode(): boolean {
  try {
    const ngZone = inject(NgZone, { optional: true });
    if (!ngZone) return true;
    
    // Check for NoopNgZone characteristics
    const zone = ngZone as unknown as { 
      hasPendingMicrotasks?: boolean;
      hasPendingMacrotasks?: boolean;
      isStable?: Observable<boolean>;
    };
    
    return zone.isStable === undefined;
  } catch {
    return false;
  }
}

/**
 * Schedule change detection in a zoneless-compatible way
 */
export function scheduleChangeDetection(cdr: ChangeDetectorRef): void {
  // In zoneless mode, we need to explicitly mark for check
  // Use queueMicrotask for batching in the same event loop
  queueMicrotask(() => {
    cdr.markForCheck();
  });
}

/**
 * Run a callback outside Angular zone (or immediately in zoneless mode)
 */
export function runOutsideAngular<T>(fn: () => T): T {
  const ngZone = inject(NgZone, { optional: true });
  
  if (!ngZone || isZonelessMode()) {
    return fn();
  }
  
  return ngZone.runOutsideAngular(fn);
}

/**
 * Run a callback inside Angular zone (or immediately in zoneless mode)
 */
export function runInsideAngular<T>(fn: () => T): T {
  const ngZone = inject(NgZone, { optional: true });
  
  if (!ngZone || isZonelessMode()) {
    return fn();
  }
  
  return ngZone.run(fn);
}

// ============================================================================
// SIGNAL-BASED STATE UTILITIES FOR ZONELESS
// ============================================================================

/**
 * Create a signal that automatically triggers change detection
 */
export function createAutoSignal<T>(
  initialValue: T,
  options?: { debugLabel?: string }
): WritableSignal<T> {
  const sig = signal(initialValue);
  const config = inject(OSI_ZONELESS_CONFIG, { optional: true });
  
  if (config?.debug && options?.debugLabel) {
    effect(() => {
      console.log(`[OSI Signal] ${options.debugLabel}:`, sig());
    });
  }
  
  return sig;
}

/**
 * Create a computed signal with automatic change detection
 */
export function createAutoComputed<T>(
  computation: () => T,
  options?: { debugLabel?: string }
): Signal<T> {
  const comp = computed(computation);
  const config = inject(OSI_ZONELESS_CONFIG, { optional: true });
  
  if (config?.debug && options?.debugLabel) {
    effect(() => {
      console.log(`[OSI Computed] ${options.debugLabel}:`, comp());
    });
  }
  
  return comp;
}

/**
 * Create an effect that runs in zoneless-compatible mode
 */
export function createZonelessEffect(
  effectFn: () => void | (() => void),
  options?: { allowSignalWrites?: boolean }
): void {
  const config = inject(OSI_ZONELESS_CONFIG, { optional: true });
  
  effect(effectFn, {
    allowSignalWrites: options?.allowSignalWrites ?? config?.useSignals ?? false
  });
}

// ============================================================================
// OBSERVABLE TO SIGNAL BRIDGE
// ============================================================================

/**
 * Convert an Observable to a Signal (zoneless-compatible)
 */
export function toSignalZoneless<T>(
  source$: Observable<T>,
  options: { initialValue: T; destroyRef?: DestroyRef }
): Signal<T> {
  const sig = signal(options.initialValue);
  const destroyRef = options.destroyRef ?? inject(DestroyRef);
  
  source$.pipe(takeUntilDestroyed(destroyRef)).subscribe(value => {
    sig.set(value);
  });
  
  return sig.asReadonly();
}

/**
 * Convert a Signal to an Observable (zoneless-compatible)
 */
export function toObservableZoneless<T>(
  sig: Signal<T>,
  options?: { destroyRef?: DestroyRef }
): Observable<T> {
  const subject = new Subject<T>();
  const destroyRef = options?.destroyRef ?? inject(DestroyRef);
  
  effect(() => {
    subject.next(sig());
  });
  
  destroyRef.onDestroy(() => {
    subject.complete();
  });
  
  return subject.asObservable();
}

// ============================================================================
// CHANGE DETECTION SCHEDULER
// ============================================================================

/**
 * Zoneless-compatible change detection scheduler
 * Coalesces multiple change detection requests into a single run
 */
export class ZonelessChangeDetectionScheduler {
  private pending = false;
  private readonly callbacks = new Set<() => void>();
  private readonly appRef = inject(ApplicationRef);
  private readonly config = inject(OSI_ZONELESS_CONFIG, { optional: true });
  
  /**
   * Schedule a change detection cycle
   */
  schedule(callback?: () => void): void {
    if (callback) {
      this.callbacks.add(callback);
    }
    
    if (this.pending) {
      return;
    }
    
    this.pending = true;
    
    if (this.config?.coalesceChanges !== false) {
      // Use requestAnimationFrame for visual updates
      requestAnimationFrame(() => {
        this.flush();
      });
    } else {
      // Immediate execution
      queueMicrotask(() => {
        this.flush();
      });
    }
  }
  
  /**
   * Flush pending change detection
   */
  private flush(): void {
    this.pending = false;
    
    // Execute all pending callbacks
    this.callbacks.forEach(cb => {
      try {
        cb();
      } catch (error) {
        console.error('[OSI Cards] Change detection callback error:', error);
      }
    });
    this.callbacks.clear();
    
    // Trigger application-wide change detection
    this.appRef.tick();
  }
}

// ============================================================================
// ZONELESS PROVIDERS
// ============================================================================

/**
 * Feature provider for zoneless support
 */
export function withZonelessSupport(options: ZonelessConfigOptions = {}): {
  kind: string;
  providers: Provider[];
} {
  const config = { ...DEFAULT_ZONELESS_CONFIG, ...options };
  
  return {
    kind: 'zoneless',
    providers: [
      { provide: OSI_ZONELESS_CONFIG, useValue: config },
      { provide: ZonelessChangeDetectionScheduler, useClass: ZonelessChangeDetectionScheduler }
    ]
  };
}

/**
 * Provide OSI Cards with full zoneless mode support
 */
export function provideOsiCardsZoneless(
  options: ZonelessConfigOptions = {}
): EnvironmentProviders {
  const config = { ...DEFAULT_ZONELESS_CONFIG, ...options };
  
  return makeEnvironmentProviders([
    { provide: OSI_ZONELESS_CONFIG, useValue: config },
    { provide: ZonelessChangeDetectionScheduler, useClass: ZonelessChangeDetectionScheduler }
  ]);
}

// ============================================================================
// ZONELESS COMPONENT UTILITIES
// ============================================================================

/**
 * Mixin for zoneless-compatible components
 * Use this to add zoneless support to existing components
 * 
 * @example
 * ```typescript
 * export class MyComponent extends ZonelessComponentMixin {
 *   ngOnInit() {
 *     // Use this.scheduleCD() instead of cdr.markForCheck()
 *     this.setupSubscription().subscribe(() => {
 *       this.scheduleCD();
 *     });
 *   }
 * }
 * ```
 */
export abstract class ZonelessComponentMixin {
  protected readonly cdr = inject(ChangeDetectorRef);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly isZoneless = inject(OSI_IS_ZONELESS);
  protected readonly scheduler = inject(ZonelessChangeDetectionScheduler, { optional: true });
  
  /**
   * Schedule change detection in a zoneless-compatible way
   */
  protected scheduleCD(): void {
    if (this.scheduler) {
      this.scheduler.schedule(() => this.cdr.markForCheck());
    } else {
      scheduleChangeDetection(this.cdr);
    }
  }
  
  /**
   * Run callback outside zone (or immediately in zoneless mode)
   */
  protected runOutsideZone<T>(fn: () => T): T {
    return runOutsideAngular(fn);
  }
  
  /**
   * Run callback inside zone (or immediately in zoneless mode)
   */
  protected runInsideZone<T>(fn: () => T): T {
    return runInsideAngular(fn);
  }
}

// ============================================================================
// ZONELESS AUDIT UTILITIES
// ============================================================================

/**
 * Audit a component for zoneless compatibility
 * Use in development to identify potential issues
 */
export interface ZonelessAuditResult {
  componentName: string;
  isZonelessCompatible: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Check if a component class is zoneless-compatible
 */
export function auditComponentForZoneless(
  componentClass: new (...args: unknown[]) => unknown
): ZonelessAuditResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const prototype = componentClass.prototype;
  const className = componentClass.name;
  
  // Check for zone-dependent patterns
  const methodNames = Object.getOwnPropertyNames(prototype);
  
  for (const methodName of methodNames) {
    const method = prototype[methodName];
    if (typeof method !== 'function') continue;
    
    const methodStr = method.toString();
    
    // Check for setTimeout without zone handling
    if (methodStr.includes('setTimeout') && !methodStr.includes('runOutsideAngular')) {
      issues.push(`Method '${methodName}' uses setTimeout without zone handling`);
      recommendations.push(`Use scheduleCD() after setTimeout in '${methodName}'`);
    }
    
    // Check for setInterval without zone handling
    if (methodStr.includes('setInterval') && !methodStr.includes('runOutsideAngular')) {
      issues.push(`Method '${methodName}' uses setInterval without zone handling`);
      recommendations.push(`Consider using RxJS interval() with takeUntilDestroyed() in '${methodName}'`);
    }
    
    // Check for direct DOM event listeners
    if (methodStr.includes('addEventListener') && !methodStr.includes('runOutsideAngular')) {
      issues.push(`Method '${methodName}' adds event listeners without zone handling`);
      recommendations.push(`Use fromEvent() with proper zone handling in '${methodName}'`);
    }
  }
  
  // Check for OnPush change detection
  const metadata = (componentClass as unknown as { __annotations__?: unknown[] }).__annotations__;
  const hasOnPush = metadata?.some((ann: unknown) => 
    (ann as { changeDetection?: number })?.changeDetection === 1 // OnPush
  );
  
  if (!hasOnPush) {
    issues.push('Component does not use OnPush change detection');
    recommendations.push('Add changeDetection: ChangeDetectionStrategy.OnPush to component decorator');
  }
  
  return {
    componentName: className,
    isZonelessCompatible: issues.length === 0,
    issues,
    recommendations
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ZonelessConfigOptions,
  DEFAULT_ZONELESS_CONFIG
};

