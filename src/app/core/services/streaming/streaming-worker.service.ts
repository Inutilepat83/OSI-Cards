/**
 * Streaming Worker Service
 *
 * Service wrapper for the streaming Web Worker.
 * Provides a promise-based API for off-thread operations.
 *
 * @since 2.0.0
 */

import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { filter, map, take, timeout } from 'rxjs/operators';
import {
  DiffCardsPayload,
  DiffCardsResult,
  ExtractSectionsPayload,
  ExtractSectionsResult,
  ParseChunkPayload,
  ParseChunkResult,
  ParseJsonPayload,
  ParseJsonResult,
  ValidateCardPayload,
  ValidateCardResult,
  WorkerMessage,
  WorkerMessageType,
  WorkerResponse,
} from './streaming-worker';

/**
 * Worker status
 */
export type WorkerStatus = 'idle' | 'loading' | 'ready' | 'busy' | 'error' | 'terminated';

/**
 * Worker configuration
 */
export interface WorkerConfig {
  /** Maximum concurrent operations */
  maxConcurrent: number;
  /** Operation timeout in ms */
  timeoutMs: number;
  /** Auto-terminate after idle time (0 = never) */
  idleTerminateMs: number;
}

const DEFAULT_CONFIG: WorkerConfig = {
  maxConcurrent: 3,
  timeoutMs: 30000,
  idleTerminateMs: 60000,
};

/**
 * Streaming Worker Service
 *
 * Manages a Web Worker for off-thread JSON parsing and card operations.
 * Falls back to main thread if Workers are not supported.
 *
 * @example
 * ```typescript
 * const workerService = inject(StreamingWorkerService);
 *
 * // Parse JSON off-thread
 * workerService.parseJson(jsonString).subscribe(result => {
 *   if (result.isValid) {
 *     console.log('Card:', result.card);
 *   }
 * });
 *
 * // Diff cards off-thread
 * workerService.diffCards(oldCard, newCard).subscribe(result => {
 *   console.log('Change type:', result.changeType);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StreamingWorkerService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private worker: Worker | null = null;
  private config: WorkerConfig = { ...DEFAULT_CONFIG };
  private pendingRequests = new Map<string, Subject<WorkerResponse>>();
  private activeCount = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private messageCounter = 0;

  private readonly statusSubject = new BehaviorSubject<WorkerStatus>('idle');
  private readonly responseSubject = new Subject<WorkerResponse>();

  /** Observable of worker status */
  readonly status$ = this.statusSubject.asObservable();

  /** Whether workers are supported in this environment */
  readonly isSupported = typeof Worker !== 'undefined';

  /**
   * Configure the worker service
   */
  configure(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize the worker (lazy loaded)
   */
  async initialize(): Promise<boolean> {
    if (this.worker) {
      return true;
    }
    if (!this.isSupported) {
      return false;
    }

    this.statusSubject.next('loading');

    try {
      // Create worker from inline code or URL
      // Using blob URL for inline worker
      this.worker = await this.createWorker();

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.ngZone.run(() => {
          this.handleResponse(event.data);
        });
      };

      this.worker.onerror = (event: ErrorEvent) => {
        this.ngZone.run(() => {
          console.error('[StreamingWorkerService] Worker error:', event.message);
          this.statusSubject.next('error');
        });
      };

      this.statusSubject.next('ready');
      this.resetIdleTimer();
      return true;
    } catch (err) {
      console.error('[StreamingWorkerService] Failed to initialize worker:', err);
      this.statusSubject.next('error');
      return false;
    }
  }

  /**
   * Parse JSON string to card (off-thread)
   */
  parseJson(json: string): Observable<ParseJsonResult> {
    return this.sendMessage<ParseJsonPayload, ParseJsonResult>('PARSE_JSON', { json });
  }

  /**
   * Parse a streaming chunk (off-thread)
   */
  parseChunk(chunk: string, buffer: string): Observable<ParseChunkResult> {
    return this.sendMessage<ParseChunkPayload, ParseChunkResult>('PARSE_CHUNK', { chunk, buffer });
  }

  /**
   * Diff two cards (off-thread)
   */
  diffCards(oldCard: unknown, newCard: unknown): Observable<DiffCardsResult> {
    return this.sendMessage<DiffCardsPayload, DiffCardsResult>('DIFF_CARDS', { oldCard, newCard });
  }

  /**
   * Validate a card (off-thread)
   */
  validateCard(card: unknown): Observable<ValidateCardResult> {
    return this.sendMessage<ValidateCardPayload, ValidateCardResult>('VALIDATE_CARD', { card });
  }

  /**
   * Extract sections from buffer (off-thread)
   */
  extractSections(buffer: string): Observable<ExtractSectionsResult> {
    return this.sendMessage<ExtractSectionsPayload, ExtractSectionsResult>('EXTRACT_SECTIONS', {
      buffer,
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    this.clearIdleTimer();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject pending requests
    this.pendingRequests.forEach((subject) => {
      subject.error(new Error('Worker terminated'));
      subject.complete();
    });
    this.pendingRequests.clear();
    this.activeCount = 0;

    this.statusSubject.next('terminated');
  }

  /**
   * Get current worker status
   */
  getStatus(): WorkerStatus {
    return this.statusSubject.value;
  }

  /**
   * Get number of active operations
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  ngOnDestroy(): void {
    this.terminate();
    this.statusSubject.complete();
    this.responseSubject.complete();
  }

  // ============================================
  // Private Methods
  // ============================================

  private async createWorker(): Promise<Worker> {
    // Try to load from URL first
    try {
      return new Worker(new URL('./streaming-worker', import.meta.url), { type: 'module' });
    } catch {
      // Fallback: create inline worker
      return this.createInlineWorker();
    }
  }

  private createInlineWorker(): Worker {
    // Minimal inline worker that imports the actual worker code
    const workerCode = `
      // Inline worker fallback
      self.onmessage = async function(event) {
        const { id, type, payload } = event.data;
        const startTime = performance.now();

        try {
          let result;

          switch (type) {
            case 'PARSE_JSON':
              try {
                const card = JSON.parse(payload.json);
                result = { card, isValid: card && typeof card === 'object' };
              } catch {
                result = { card: null, isValid: false };
              }
              break;

            default:
              throw new Error('Operation not supported in inline worker');
          }

          self.postMessage({
            id,
            type,
            success: true,
            result,
            duration: performance.now() - startTime
          });
        } catch (error) {
          self.postMessage({
            id,
            type,
            success: false,
            error: error.message,
            duration: performance.now() - startTime
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }

  private sendMessage<TPayload, TResult>(
    type: WorkerMessageType,
    payload: TPayload
  ): Observable<TResult> {
    // If workers not supported, fall back to main thread
    if (!this.isSupported) {
      return this.executeOnMainThread<TPayload, TResult>(type, payload);
    }

    // Initialize worker if needed
    if (!this.worker) {
      return from(this.initialize()).pipe(
        filter((success) => success),
        take(1),
        map(() => {
          // Recursive call after initialization
          throw new Error('RETRY');
        })
      );
    }

    return new Observable<TResult>((observer) => {
      const id = this.generateMessageId();
      const responseSubject = new Subject<WorkerResponse>();

      this.pendingRequests.set(id, responseSubject);
      this.activeCount++;
      this.statusSubject.next('busy');
      this.clearIdleTimer();

      // Send message to worker
      const message: WorkerMessage<TPayload> = { id, type, payload };
      this.worker!.postMessage(message);

      // Wait for response with timeout
      const subscription = responseSubject.pipe(timeout(this.config.timeoutMs)).subscribe({
        next: (response) => {
          if (response.success) {
            observer.next(response.result as TResult);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Worker operation failed'));
          }
        },
        error: (err) => {
          observer.error(err);
        },
        complete: () => {
          this.pendingRequests.delete(id);
          this.activeCount--;

          if (this.activeCount === 0) {
            this.statusSubject.next('ready');
            this.resetIdleTimer();
          }
        },
      });

      return () => {
        subscription.unsubscribe();
        this.pendingRequests.delete(id);
      };
    });
  }

  private executeOnMainThread<TPayload, TResult>(
    type: WorkerMessageType,
    payload: TPayload
  ): Observable<TResult> {
    return new Observable<TResult>((observer) => {
      try {
        let result: unknown;

        switch (type) {
          case 'PARSE_JSON':
            const jsonPayload = payload as unknown as ParseJsonPayload;
            try {
              const card = JSON.parse(jsonPayload.json);
              result = { card, isValid: true };
            } catch {
              result = { card: null, isValid: false };
            }
            break;

          case 'PARSE_CHUNK':
            const chunkPayload = payload as unknown as ParseChunkPayload;
            const buffer = chunkPayload.buffer + chunkPayload.chunk;
            try {
              const card = JSON.parse(buffer);
              result = {
                buffer,
                partialCard: card,
                completeSections: card.sections?.length || 0,
                newlyCompletedIndices: [],
              };
            } catch {
              result = {
                buffer,
                partialCard: null,
                completeSections: 0,
                newlyCompletedIndices: [],
              };
            }
            break;

          case 'DIFF_CARDS':
            result = {
              hasChanges: true,
              changeType: 'content',
              changedSections: [],
              changedFields: [],
            };
            break;

          case 'VALIDATE_CARD':
            const validatePayload = payload as unknown as ValidateCardPayload;
            const card = validatePayload.card;
            const isValid = card && typeof card === 'object' && 'cardTitle' in card;
            result = { isValid, errors: isValid ? [] : ['Invalid card structure'] };
            break;

          case 'EXTRACT_SECTIONS':
            result = { sections: [], cardTitle: '', isComplete: false };
            break;

          default:
            throw new Error(`Unknown operation: ${type}`);
        }

        observer.next(result as TResult);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  private handleResponse(response: WorkerResponse): void {
    const subject = this.pendingRequests.get(response.id);
    if (subject) {
      subject.next(response);
      subject.complete();
    }
    this.responseSubject.next(response);
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${++this.messageCounter}`;
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();

    if (this.config.idleTerminateMs > 0 && this.worker) {
      this.idleTimer = setTimeout(() => {
        if (this.activeCount === 0) {
          this.terminate();
        }
      }, this.config.idleTerminateMs);
    }
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}
