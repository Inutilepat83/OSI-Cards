/**
 * Circuit Breaker Pattern (Point 5)
 * 
 * Prevents cascading failures by monitoring operation health and
 * temporarily blocking requests when failure thresholds are exceeded.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests are rejected
 * - HALF_OPEN: Testing recovery, limited requests allowed
 * 
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   name: 'streaming-service'
 * });
 * 
 * // Wrap async operation
 * const result = await breaker.execute(async () => {
 *   return await fetchData();
 * });
 * 
 * // With fallback
 * const result = await breaker.executeWithFallback(
 *   async () => await fetchData(),
 *   async () => await getCachedData()
 * );
 * ```
 */

import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name for logging and identification */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes in half-open to close */
  successThreshold: number;
  /** Time in ms before attempting recovery */
  resetTimeout: number;
  /** Time window in ms for counting failures */
  failureWindow: number;
  /** Callback when circuit opens */
  onOpen?: (name: string, failures: number) => void;
  /** Callback when circuit closes */
  onClose?: (name: string) => void;
  /** Callback when circuit half-opens */
  onHalfOpen?: (name: string) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  name: 'circuit-breaker',
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000,
  failureWindow: 60000,
};

/**
 * Circuit breaker metrics
 */
export interface CircuitMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  openedAt?: Date;
}

/**
 * Circuit breaker error
 */
export class CircuitBreakerOpenError extends Error {
  public readonly circuitName: string;
  public readonly state: CircuitState;
  
  constructor(circuitName: string, state: CircuitState) {
    super(`Circuit breaker '${circuitName}' is ${state}. Request rejected.`);
    this.name = 'CircuitBreakerOpenError';
    this.circuitName = circuitName;
    this.state = state;
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private readonly config: CircuitBreakerConfig;
  private readonly state$ = new BehaviorSubject<CircuitState>('CLOSED');
  private failures: Array<{ timestamp: number }> = [];
  private halfOpenSuccesses = 0;
  private resetTimer?: ReturnType<typeof setTimeout>;
  private metrics: CircuitMetrics = {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
    totalCalls: 0,
    totalFailures: 0,
    totalSuccesses: 0,
  };

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current state as observable
   */
  public getState$(): Observable<CircuitState> {
    return this.state$.asObservable();
  }

  /**
   * Get current state
   */
  public getState(): CircuitState {
    return this.state$.value;
  }

  /**
   * Get circuit metrics
   */
  public getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  /**
   * Execute operation through circuit breaker
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalCalls++;
    
    const state = this.state$.value;
    
    // Check if circuit allows request
    if (state === 'OPEN') {
      throw new CircuitBreakerOpenError(this.config.name, state);
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback on circuit open or failure
   */
  public async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(operation);
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        return await fallback();
      }
      // Try fallback on any error
      return await fallback();
    }
  }

  /**
   * Execute with timeout
   */
  public async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return this.execute(() => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        
        operation()
          .then(result => {
            clearTimeout(timer);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timer);
            reject(error);
          });
      });
    });
  }

  /**
   * Force circuit to open
   */
  public forceOpen(): void {
    this.transitionTo('OPEN');
  }

  /**
   * Force circuit to close
   */
  public forceClose(): void {
    this.transitionTo('CLOSED');
  }

  /**
   * Reset circuit to initial state
   */
  public reset(): void {
    this.clearResetTimer();
    this.failures = [];
    this.halfOpenSuccesses = 0;
    this.metrics = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    };
    this.state$.next('CLOSED');
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.metrics.totalSuccesses++;
    this.metrics.successes++;
    this.metrics.lastSuccess = new Date();
    
    const state = this.state$.value;
    
    if (state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.metrics.totalFailures++;
    this.metrics.failures++;
    this.metrics.lastFailure = new Date();
    
    const now = Date.now();
    this.failures.push({ timestamp: now });
    
    // Remove old failures outside the window
    const windowStart = now - this.config.failureWindow;
    this.failures = this.failures.filter(f => f.timestamp > windowStart);
    
    const state = this.state$.value;
    
    if (state === 'HALF_OPEN') {
      // Any failure in half-open reopens the circuit
      this.transitionTo('OPEN');
    } else if (state === 'CLOSED') {
      // Check if threshold exceeded
      if (this.failures.length >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const currentState = this.state$.value;
    
    if (currentState === newState) return;
    
    this.state$.next(newState);
    this.metrics.state = newState;
    
    switch (newState) {
      case 'OPEN':
        this.metrics.openedAt = new Date();
        this.scheduleRecovery();
        this.config.onOpen?.(this.config.name, this.failures.length);
        break;
        
      case 'CLOSED':
        this.metrics.openedAt = undefined;
        this.failures = [];
        this.halfOpenSuccesses = 0;
        this.metrics.failures = 0;
        this.metrics.successes = 0;
        this.config.onClose?.(this.config.name);
        break;
        
      case 'HALF_OPEN':
        this.halfOpenSuccesses = 0;
        this.config.onHalfOpen?.(this.config.name);
        break;
    }
  }

  /**
   * Schedule recovery attempt
   */
  private scheduleRecovery(): void {
    this.clearResetTimer();
    
    this.resetTimer = setTimeout(() => {
      if (this.state$.value === 'OPEN') {
        this.transitionTo('HALF_OPEN');
      }
    }, this.config.resetTimeout);
  }

  /**
   * Clear reset timer
   */
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}

/**
 * Create a circuit breaker with preset configurations
 */
export function createCircuitBreaker(
  name: string,
  preset: 'strict' | 'lenient' | 'default' = 'default'
): CircuitBreaker {
  const presets: Record<string, Partial<CircuitBreakerConfig>> = {
    strict: {
      failureThreshold: 3,
      successThreshold: 3,
      resetTimeout: 60000,
      failureWindow: 30000,
    },
    lenient: {
      failureThreshold: 10,
      successThreshold: 1,
      resetTimeout: 10000,
      failureWindow: 120000,
    },
    default: {},
  };
  
  return new CircuitBreaker({
    name,
    ...presets[preset],
  });
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private readonly breakers = new Map<string, CircuitBreaker>();

  public static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  public getBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ name, ...config }));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all breaker metrics
   */
  public getAllMetrics(): Record<string, CircuitMetrics> {
    const metrics: Record<string, CircuitMetrics> = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }

  /**
   * Reset all breakers
   */
  public resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

