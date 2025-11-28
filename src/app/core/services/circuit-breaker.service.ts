import { Injectable, inject } from '@angular/core';
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, switchMap, retry } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name of the circuit breaker */
  name: string;
  /** Failure threshold to open circuit */
  failureThreshold?: number;
  /** Timeout before attempting half-open (ms) */
  timeout?: number;
  /** Success threshold to close circuit from half-open */
  successThreshold?: number;
  /** Monitoring window (ms) */
  monitoringWindow?: number;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

/**
 * Circuit Breaker Service
 * 
 * Implements circuit breaker pattern to prevent cascading failures.
 * Protects against repeated failures by temporarily stopping requests
 * to failing services and allowing them to recover.
 * 
 * Features:
 * - Automatic failure detection
 * - Configurable thresholds
 * - Automatic recovery attempts
 * - Statistics tracking
 * - Fallback responses
 * 
 * @example
 * ```typescript
 * const circuitBreaker = inject(CircuitBreakerService);
 * 
 * circuitBreaker.execute('api-service', () => {
 *   return this.http.get('/api/data');
 * }).subscribe({
 *   next: data => console.log(data),
 *   error: error => console.error('Circuit breaker error:', error)
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CircuitBreakerService {
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  private circuits = new Map<string, CircuitBreaker>();

  /**
   * Execute a function with circuit breaker protection
   */
  execute<T>(
    circuitName: string,
    operation: () => Observable<T>,
    fallback?: () => Observable<T> | T
  ): Observable<T> {
    const circuit = this.getOrCreateCircuit(circuitName);

    // Check circuit state
    if (circuit.state === CircuitState.OPEN) {
      if (circuit.shouldAttemptReset()) {
        circuit.state = CircuitState.HALF_OPEN;
        this.logger.info(`Circuit ${circuitName} entering HALF_OPEN state`, 'CircuitBreakerService');
      } else {
        const error = new Error(`Circuit breaker ${circuitName} is OPEN`);
        this.logger.warn(`Circuit ${circuitName} is OPEN, rejecting request`, 'CircuitBreakerService');
        
        if (fallback) {
          const fallbackResult = fallback();
          return fallbackResult instanceof Observable ? fallbackResult : of(fallbackResult);
        }
        
        return throwError(() => error);
      }
    }

    // Execute operation
    return operation().pipe(
      switchMap(result => {
        circuit.recordSuccess();
        return of(result);
      }),
      catchError(error => {
        circuit.recordFailure();
        
        this.logger.error(
          `Circuit ${circuitName} recorded failure`,
          'CircuitBreakerService',
          {
            state: circuit.state,
            failures: circuit.failures,
            threshold: circuit.config.failureThreshold || 5
          }
        );

        // If circuit opened, use fallback
        if (circuit.state === CircuitState.OPEN && fallback) {
          this.logger.info(`Using fallback for circuit ${circuitName}`, 'CircuitBreakerService');
          const fallbackResult = fallback();
          return fallbackResult instanceof Observable ? fallbackResult : of(fallbackResult);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Get or create circuit breaker
   */
  private getOrCreateCircuit(name: string): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        name,
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        successThreshold: 2,
        monitoringWindow: 60000 // 1 minute
      };
      this.circuits.set(name, new CircuitBreaker(defaultConfig, this.logger));
    }
    return this.circuits.get(name)!;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(circuitName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      return null;
    }

    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      lastFailureTime: circuit.lastFailureTime,
      lastSuccessTime: circuit.lastSuccessTime
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.reset();
      this.logger.info(`Circuit ${circuitName} manually reset`, 'CircuitBreakerService');
    }
  }

  /**
   * Get all circuit names
   */
  getCircuitNames(): string[] {
    return Array.from(this.circuits.keys());
  }
}

/**
 * Internal circuit breaker implementation
 */
class CircuitBreaker {
  state: CircuitState = CircuitState.CLOSED;
  failures = 0;
  successes = 0;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  private failureWindow: number[] = [];
  readonly config: CircuitBreakerConfig;

  constructor(
    config: CircuitBreakerConfig,
    private logger: LoggingService
  ) {
    this.config = config;
  }

  recordSuccess(): void {
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= (this.config.successThreshold || 2)) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.logger.info(
          `Circuit ${this.config.name} closed after successful recovery`,
          'CircuitBreaker'
        );
      }
    } else {
      // Reset failure count on success in CLOSED state
      if (this.failures > 0) {
        this.failures = 0;
        this.failureWindow = [];
      }
    }
  }

  recordFailure(): void {
    this.lastFailureTime = Date.now();
    const now = Date.now();
    
    // Clean old failures from window
    this.failureWindow = this.failureWindow.filter(
      time => now - time < (this.config.monitoringWindow || 60000)
    );
    
    // Add current failure
    this.failureWindow.push(now);
    this.failures = this.failureWindow.length;

    // Check if threshold exceeded
    if (this.failures >= (this.config.failureThreshold || 5)) {
      if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
        this.logger.warn(
          `Circuit ${this.config.name} opened due to ${this.failures} failures`,
          'CircuitBreaker',
          {
            threshold: this.config.failureThreshold,
            failures: this.failures
          }
        );
      }
    }
  }

  shouldAttemptReset(): boolean {
    if (this.state !== CircuitState.OPEN) {
      return false;
    }

    if (!this.lastFailureTime) {
      return true;
    }

    const timeout = this.config.timeout || 60000;
    return Date.now() - this.lastFailureTime >= timeout;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.failureWindow = [];
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
  }
}

