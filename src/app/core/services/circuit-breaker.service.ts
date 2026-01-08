import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitOpenError,
} from '../../../../projects/osi-cards-lib/src/lib/utils/retry.util';

export interface CircuitBreakerExecuteOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  successThreshold?: number;
  timeout?: number;
  operationTimeout?: number;
}

/**
 * Circuit Breaker Service
 *
 * Provides circuit breaker pattern implementation for protecting services
 * from repeated failures. Wraps the library's CircuitBreaker class and
 * provides RxJS-compatible observables.
 */
@Injectable({
  providedIn: 'root',
})
export class CircuitBreakerService {
  private readonly breakers = new Map<string, CircuitBreaker>();

  /**
   * Execute an operation through a circuit breaker
   *
   * @param name Circuit breaker name (creates or reuses a breaker)
   * @param operation Operation to execute
   * @param options Circuit breaker configuration
   * @returns Observable that emits the result or errors
   */
  execute<T>(
    name: string,
    operation: () => Observable<T> | Promise<T>,
    options: CircuitBreakerExecuteOptions = {}
  ): Observable<T> {
    const breaker = this.getOrCreateBreaker(name, options);

    const executeOperation = async (): Promise<T> => {
      const op = operation();
      if (op instanceof Promise) {
        return op;
      }
      // Convert Observable to Promise
      return op.toPromise() as Promise<T>;
    };

    return from(breaker.execute(executeOperation)).pipe(
      catchError((error) => {
        if (error instanceof CircuitOpenError) {
          return throwError(() => new Error(`Circuit breaker "${name}" is open`));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get or create a circuit breaker instance
   */
  private getOrCreateBreaker(name: string, options: CircuitBreakerExecuteOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const config: CircuitBreakerConfig = {
        failureThreshold: options.failureThreshold ?? 5,
        resetTimeoutMs: options.resetTimeoutMs ?? 60000,
        successThreshold: options.successThreshold ?? 2,
      };
      this.breakers.set(name, new CircuitBreaker(config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Reset a circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Get circuit breaker state
   */
  getState(name: string): 'closed' | 'open' | 'half-open' | undefined {
    const breaker = this.breakers.get(name);
    return breaker?.getState();
  }
}
