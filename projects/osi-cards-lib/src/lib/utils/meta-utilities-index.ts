/**
 * Meta Utilities Index
 *
 * Comprehensive index and helper functions for all utilities.
 * This serves as a single entry point for all utility functions.
 *
 * @example
 * ```typescript
 * import { UtilityRegistry } from '@osi-cards/meta-utils';
 *
 * const registry = UtilityRegistry.getInstance();
 * registry.register('myUtil', myUtilFunction);
 * ```
 */

export class UtilityRegistry {
  private static instance: UtilityRegistry;
  private utilities = new Map<string, any>();
  private categories = new Map<string, Set<string>>();

  private constructor() {}

  static getInstance(): UtilityRegistry {
    if (!UtilityRegistry.instance) {
      UtilityRegistry.instance = new UtilityRegistry();
    }
    return UtilityRegistry.instance;
  }

  register(name: string, utility: any, category = 'general'): void {
    this.utilities.set(name, utility);

    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(name);
  }

  get(name: string): any {
    return this.utilities.get(name);
  }

  has(name: string): boolean {
    return this.utilities.has(name);
  }

  getCategory(category: string): any[] {
    const names = this.categories.get(category);
    if (!names) return [];
    return Array.from(names).map(name => this.utilities.get(name));
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  getAll(): Map<string, any> {
    return new Map(this.utilities);
  }

  clear(): void {
    this.utilities.clear();
    this.categories.clear();
  }
}

/**
 * Function composition utility
 */
export function compose(...fns: Array<(arg: any) => any>): (arg: any) => any {
  return (arg: any) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

/**
 * Pipe utility
 */
export function pipe<T>(...fns: Array<(arg: any) => any>): (arg: T) => any {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg as any);
}

/**
 * Curry utility
 */
export function curry(fn: Function): any {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  };
}

/**
 * Partial application
 */
export function partial(
  fn: Function,
  ...partialArgs: any[]
): (...args: any[]) => any {
  return (...args: any[]) => fn(...partialArgs, ...args);
}

/**
 * Negate predicate
 */
export function negate<T>(predicate: (arg: T) => boolean): (arg: T) => boolean {
  return (arg: T) => !predicate(arg);
}

/**
 * Identity function
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * Constant function
 */
export function constant<T>(value: T): () => T {
  return () => value;
}

/**
 * No-op function
 */
export function noop(): void {
  // Do nothing
}

/**
 * Safe function call
 */
export function tryCatch<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * Async safe call
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

