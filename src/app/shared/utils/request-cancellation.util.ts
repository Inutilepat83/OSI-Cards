import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Request cancellation utilities
 * Cancel in-flight requests when new ones are made to avoid race conditions
 */

export class RequestCanceller {
  private cancelSubject = new Subject<void>();

  /**
   * Get cancel observable
   */
  get cancel$(): Observable<void> {
    return this.cancelSubject.asObservable();
  }

  /**
   * Cancel the request
   */
  cancel(): void {
    this.cancelSubject.next();
    this.cancelSubject.complete();
    this.cancelSubject = new Subject<void>();
  }

  /**
   * Create a new canceller (resets the subject)
   */
  reset(): void {
    this.cancel();
  }
}

/**
 * Create a cancellable observable
 */
export function makeCancellable<T>(
  source: Observable<T>,
  canceller: RequestCanceller
): Observable<T> {
  return source.pipe(takeUntil(canceller.cancel$));
}

/**
 * Request manager for handling multiple cancellable requests
 */
export class RequestManager {
  private cancellers = new Map<string, RequestCanceller>();

  /**
   * Get or create a canceller for a request ID
   */
  getCanceller(requestId: string): RequestCanceller {
    // Cancel previous request with same ID
    const existing = this.cancellers.get(requestId);
    if (existing) {
      existing.cancel();
    }

    const canceller = new RequestCanceller();
    this.cancellers.set(requestId, canceller);
    return canceller;
  }

  /**
   * Cancel a specific request
   */
  cancel(requestId: string): void {
    const canceller = this.cancellers.get(requestId);
    if (canceller) {
      canceller.cancel();
      this.cancellers.delete(requestId);
    }
  }

  /**
   * Cancel all requests
   */
  cancelAll(): void {
    this.cancellers.forEach(canceller => canceller.cancel());
    this.cancellers.clear();
  }

  /**
   * Remove a canceller (after request completes)
   */
  remove(requestId: string): void {
    this.cancellers.delete(requestId);
  }
}


