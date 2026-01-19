/**
 * Layout Worker Service
 *
 * Angular service for interacting with the layout Web Worker.
 * Provides promise-based API for off-thread layout calculations.
 *
 * @dependencies
 * - None (manages Web Worker lifecycle directly)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private layoutWorker = inject(LayoutWorkerService);
 *
 *   async calculateLayout(sections: CardSection[]) {
 *     const result = await this.layoutWorker.packSections(sections, 4, 12);
 *     console.log('Layout:', result.placements);
 *   }
 * }
 * ```
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, ReplaySubject, from, of } from 'rxjs';
import { takeUntil, map, catchError, timeout } from 'rxjs/operators';
import { CardSection } from '@osi-cards/models';
import type {
  LayoutWorkerMessage,
  LayoutWorkerResponse,
  LayoutWorkerMessageType,
} from '@osi-cards/lib/workers/layout-worker';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Worker section format (simplified for transfer)
 */
interface WorkerSection {
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  colSpan?: number;
  preferredColumns?: number;
  fields?: Array<{ label?: string; value?: string | number | boolean | null }>;
  items?: Array<{ title?: string; description?: string }>;
}

/**
 * Positioned section result from worker
 */
export interface WorkerPositionedSection {
  key: string;
  colSpan: number;
  column: number;
  top: number;
  left: string;
  width: string;
  height: number;
}

/**
 * Pack result from worker
 */
export interface WorkerPackResult {
  placements: WorkerPositionedSection[];
  containerHeight: number;
  utilization: number;
  gapCount: number;
}

/**
 * Gap analysis result
 */
export interface WorkerGapAnalysis {
  gaps: Array<{
    column: number;
    top: number;
    height: number;
    width: number;
  }>;
  totalGapArea: number;
  gapCount: number;
  utilizationPercent: number;
}

/**
 * Worker status
 */
export interface WorkerStatus {
  isReady: boolean;
  isSupported: boolean;
  error: string | null;
  pendingRequests: number;
  totalProcessed: number;
  avgProcessingTime: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class LayoutWorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private readonly _status = new ReplaySubject<WorkerStatus>(1);
  readonly status$ = this._status.asObservable();

  private readonly destroy$ = new Subject<void>();
  private messageIdCounter = 0;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      startTime: number;
    }
  >();

  private processingTimes: number[] = [];
  private totalProcessed = 0;
  private isSupported = false;

  constructor() {
    this.initializeWorker();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.terminateWorker();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Packs sections using FFDH algorithm in worker
   */
  packSections(
    sections: CardSection[],
    columns: number,
    gap: number = 12
  ): Promise<WorkerPackResult> {
    return this.sendMessage('PACK_SECTIONS', {
      sections: this.convertSections(sections),
      columns,
      gap,
    });
  }

  /**
   * Packs sections using Skyline algorithm in worker
   */
  skylinePack(
    sections: CardSection[],
    columns: number,
    gap: number = 12
  ): Promise<WorkerPackResult> {
    return this.sendMessage('SKYLINE_PACK', {
      sections: this.convertSections(sections),
      columns,
      gap,
    });
  }

  /**
   * Calculates positions for sections
   */
  calculatePositions(
    sections: CardSection[],
    columns: number,
    gap: number = 12
  ): Promise<WorkerPositionedSection[]> {
    return this.sendMessage('CALCULATE_POSITIONS', {
      sections: this.convertSections(sections),
      columns,
      gap,
    });
  }

  /**
   * Analyzes gaps in current layout
   */
  analyzeGaps(
    placements: WorkerPositionedSection[],
    columns: number,
    containerHeight: number
  ): Promise<WorkerGapAnalysis> {
    return this.sendMessage('ANALYZE_GAPS', {
      placements,
      columns,
      containerHeight,
    });
  }

  /**
   * Computes estimated heights for sections
   */
  computeHeights(sections: CardSection[]): Promise<Array<{ key: string; height: number }>> {
    return this.sendMessage('COMPUTE_HEIGHTS', {
      sections: this.convertSections(sections),
    });
  }

  /**
   * Optimizes layout using specified algorithm
   */
  optimizeLayout(
    sections: CardSection[],
    columns: number,
    gap: number = 12,
    algorithm: 'ffdh' | 'skyline' = 'skyline'
  ): Promise<WorkerPackResult> {
    return this.sendMessage('OPTIMIZE_LAYOUT', {
      sections: this.convertSections(sections),
      columns,
      gap,
      algorithm,
    });
  }

  /**
   * Checks if worker is available and ready
   */
  isReady(): boolean {
    return this.worker !== null && this.isSupported;
  }

  /**
   * Gets current worker status
   */
  getStatus(): WorkerStatus {
    return {
      isReady: this.isReady(),
      isSupported: this.isSupported,
      error: null,
      pendingRequests: this.pendingRequests.size,
      totalProcessed: this.totalProcessed,
      avgProcessingTime: this.getAverageProcessingTime(),
    };
  }

  /**
   * Packs sections with fallback to main thread if worker unavailable
   */
  async packSectionsWithFallback(
    sections: CardSection[],
    columns: number,
    gap: number = 12,
    fallbackFn: () => WorkerPackResult
  ): Promise<WorkerPackResult> {
    if (!this.isReady()) {
      return fallbackFn();
    }

    try {
      return await this.packSections(sections, columns, gap);
    } catch (error) {
      console.warn('Worker packing failed, using fallback:', error);
      return fallbackFn();
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private initializeWorker(): void {
    // Check for Worker support
    if (typeof Worker === 'undefined') {
      this.isSupported = false;
      this._status.next(this.getStatus());
      return;
    }

    try {
      // Create worker using module worker syntax
      this.worker = new Worker(new URL('../workers/layout-worker', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);

      this.isSupported = true;
      this._status.next(this.getStatus());
    } catch (error: unknown) {
      console.error('Failed to initialize layout worker:', error);
      this.isSupported = false;
      const errorMessage = error instanceof Error ? error.message : 'Worker initialization failed';
      this._status.next({
        ...this.getStatus(),
        error: errorMessage,
      });
    }
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Worker terminated'));
    }
    this.pendingRequests.clear();

    this._status.next(this.getStatus());
  }

  private handleMessage(event: MessageEvent<LayoutWorkerResponse>): void {
    const { type, id, success, result, error, duration } = event.data;

    const pending = this.pendingRequests.get(id);
    if (!pending) return;

    this.pendingRequests.delete(id);

    // Track processing time
    const totalTime = performance.now() - pending.startTime;
    this.processingTimes.push(totalTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    this.totalProcessed++;

    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(new Error(error ?? 'Worker error'));
    }

    this._status.next(this.getStatus());
  }

  private handleError(error: ErrorEvent): void {
    console.error('Layout worker error:', error);

    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error(error.message ?? 'Worker error'));
    }
    this.pendingRequests.clear();

    // Try to reinitialize
    this.terminateWorker();
    setTimeout(() => this.initializeWorker(), 1000);
  }

  private sendMessage<T>(
    type: LayoutWorkerMessageType,
    payload: Record<string, unknown>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = `layout-${this.messageIdCounter++}`;

      this.pendingRequests.set(id, {
        resolve,
        reject,
        startTime: performance.now(),
      });

      this.worker.postMessage({
        type,
        id,
        payload,
      } as unknown as LayoutWorkerMessage);

      this._status.next(this.getStatus());

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker request timeout'));
          this._status.next(this.getStatus());
        }
      }, 5000);
    });
  }

  private convertSections(sections: CardSection[]): WorkerSection[] {
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      type: section.type,
      description: section.description,
      colSpan: section.colSpan,
      preferredColumns: section.preferredColumns,
      fields: section.fields?.map((f) => ({
        label: f.label,
        value: f.value,
      })),
      items: section.items?.map((i) => ({
        title: i.title,
        description: i.description,
      })),
    }));
  }

  private getAverageProcessingTime(): number {
    if (this.processingTimes.length === 0) return 0;
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.processingTimes.length) * 100) / 100;
  }
}

// ============================================================================
// STANDALONE UTILITIES
// ============================================================================

/**
 * Creates a standalone layout worker (non-Angular usage)
 */
export function createLayoutWorker(): {
  pack: (sections: WorkerSection[], columns: number, gap?: number) => Promise<WorkerPackResult>;
  terminate: () => void;
} | null {
  if (typeof Worker === 'undefined') {
    return null;
  }

  let worker: Worker;
  let messageId = 0;
  const pending = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason: Error) => void }
  >();

  try {
    worker = new Worker(new URL('../workers/layout-worker', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<LayoutWorkerResponse>) => {
      const { id, success, result, error } = event.data;
      const p = pending.get(id);
      if (p) {
        pending.delete(id);
        success ? p.resolve(result) : p.reject(new Error(error));
      }
    };
  } catch {
    return null;
  }

  return {
    pack(sections, columns, gap = 12) {
      return new Promise((resolve, reject) => {
        const id = `pack-${messageId++}`;
        pending.set(id, { resolve, reject });
        worker.postMessage({
          type: 'PACK_SECTIONS',
          id,
          payload: { sections, columns, gap },
        });
      });
    },
    terminate() {
      worker.terminate();
      pending.clear();
    },
  };
}
