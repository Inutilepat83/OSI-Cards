import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface QueuedRequest<T> {
  id: string;
  priority: number; // Higher number = higher priority
  request: () => Observable<T>;
  subject: Subject<T>;
}

/**
 * Request Queue Service
 *
 * Manages concurrent HTTP requests with priority-based queuing to prevent network
 * overload and ensure optimal request ordering. Limits concurrent requests to a
 * configurable maximum and processes them in priority order.
 *
 * Features:
 * - Priority-based request queuing
 * - Configurable concurrency limits
 * - Automatic queue processing
 * - Request lifecycle management
 * - Performance tracking
 *
 * @example
 * ```typescript
 * const queue = inject(RequestQueueService);
 *
 * // Enqueue a high-priority request
 * queue.enqueue(() => this.http.get('/api/data'), 10).subscribe(data => {
 *   console.log('Data received:', data);
 * });
 *
 * // Enqueue a low-priority request
 * queue.enqueue(() => this.http.get('/api/stats'), 0).subscribe(stats => {
 *   console.log('Stats received:', stats);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RequestQueueService {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private readonly maxConcurrency = 4; // Default to 4 concurrent requests, can be configured
  private requestIdCounter = 0;

  /**
   * Enqueue a request with optional priority
   * @param request - Function that returns an Observable
   * @param priority - Request priority (higher = more important, default: 0)
   * @returns Observable that emits when the request completes
   */
  enqueue<T>(request: () => Observable<T>, priority = 0): Observable<T> {
    const id = `req_${++this.requestIdCounter}`;
    const subject = new Subject<T>();

    const queuedRequest: QueuedRequest<T> = {
      id,
      priority,
      request,
      subject,
    };

    // Insert into queue sorted by priority (higher priority first)
    const insertIndex = this.queue.findIndex((q) => q.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(queuedRequest);
    } else {
      this.queue.splice(insertIndex, 0, queuedRequest);
    }

    // Try to process queue
    this.processQueue();

    return subject.asObservable();
  }

  /**
   * Process the queue, starting requests up to maxConcurrency
   */
  private processQueue(): void {
    while (this.activeRequests < this.maxConcurrency && this.queue.length > 0) {
      const queuedRequest = this.queue.shift();
      if (!queuedRequest) {
        break;
      }

      this.activeRequests++;
      const startTime = performance.now();

      queuedRequest
        .request()
        .pipe(
          finalize(() => {
            this.activeRequests--;
            const duration = performance.now() - startTime;
            // Process next item in queue
            setTimeout(() => this.processQueue(), 0);
          })
        )
        .subscribe({
          next: (value) => {
            queuedRequest.subject.next(value);
            queuedRequest.subject.complete();
          },
          error: (error) => {
            queuedRequest.subject.error(error);
          },
        });
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get number of active requests
   */
  getActiveRequests(): number {
    return this.activeRequests;
  }

  /**
   * Clear all pending requests
   */
  clearQueue(): void {
    this.queue.forEach((req) => {
      req.subject.error(new Error('Request queue cleared'));
    });
    this.queue = [];
  }
}
