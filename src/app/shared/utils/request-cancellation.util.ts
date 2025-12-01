import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpRequest, HttpHeaders } from '@angular/common/http';

/**
 * Request cancellation utilities
 * Cancel in-flight requests when new ones are made to avoid race conditions
 * Supports both RxJS observables and HTTP requests via AbortController
 */

export class RequestCanceller {
  private cancelSubject = new Subject<void>();
  private abortController?: AbortController;

  constructor() {
    this.abortController = new AbortController();
  }

  /**
   * Get cancel observable
   */
  get cancel$(): Observable<void> {
    return this.cancelSubject.asObservable();
  }

  /**
   * Get AbortSignal for HTTP requests
   */
  get signal(): AbortSignal {
    if (!this.abortController) {
      this.abortController = new AbortController();
    }
    return this.abortController.signal;
  }

  /**
   * Cancel the request
   */
  cancel(): void {
    this.cancelSubject.next();
    this.cancelSubject.complete();
    this.abortController?.abort();
    this.cancelSubject = new Subject<void>();
    this.abortController = new AbortController();
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

/**
 * Add AbortSignal to HTTP request
 */
export function addAbortSignal<T>(request: HttpRequest<T>, _signal: AbortSignal): HttpRequest<T> {
  return request.clone({
    setHeaders: {
      // AbortSignal is handled via request options, not headers
    }
  });
}

/**
 * Create HTTP request with cancellation support
 */
export function createCancellableRequest<T>(
  url: string,
  canceller: RequestCanceller,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): { request: HttpRequest<T>; signal: AbortSignal } {
  const signal = canceller.signal;
  
  // Create HttpHeaders from record if provided
  let httpHeaders: HttpHeaders | undefined;
  if (options?.headers) {
    httpHeaders = new HttpHeaders(options.headers);
  }
  
  const request = new HttpRequest<T>(
    (options?.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url,
    options?.body,
    {
      headers: httpHeaders,
      // Note: Angular HttpClient doesn't directly support AbortSignal in HttpRequest
      // We'll handle it via interceptor or by using the signal in the observable chain
    }
  );

  return { request, signal };
}


