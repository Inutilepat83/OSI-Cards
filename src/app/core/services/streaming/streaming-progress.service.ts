/**
 * Streaming Progress Service
 *
 * Provides detailed progress tracking for streaming operations.
 * Calculates ETA, rates, and section-level progress.
 *
 * @since 2.0.0
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Detailed streaming progress
 */
export interface StreamingProgress {
  /** Overall progress 0-1 */
  progress: number;
  /** Bytes received */
  bytesReceived: number;
  /** Estimated total bytes (if known) */
  bytesTotal: number | null;
  /** Chunks received */
  chunksReceived: number;
  /** Sections completed */
  sectionsComplete: number;
  /** Total sections expected (if known) */
  sectionsTotal: number | null;
  /** Current streaming rate (bytes/second) */
  bytesPerSecond: number;
  /** Estimated time remaining in ms */
  estimatedTimeRemainingMs: number | null;
  /** Time since start in ms */
  elapsedMs: number;
  /** Time to first chunk in ms */
  timeToFirstChunkMs: number | null;
  /** Is streaming active */
  isActive: boolean;
  /** Current stage */
  stage: StreamingProgressStage;
  /** Per-section progress */
  sectionProgress: SectionProgress[];
}

/**
 * Section-level progress
 */
export interface SectionProgress {
  index: number;
  title: string;
  isComplete: boolean;
  progress: number;
  fieldsComplete: number;
  fieldsTotal: number;
  itemsComplete: number;
  itemsTotal: number;
}

/**
 * Progress stages
 */
export type StreamingProgressStage =
  | 'idle'
  | 'connecting'
  | 'thinking'
  | 'streaming'
  | 'finalizing'
  | 'complete'
  | 'error';

/**
 * Progress update
 */
export interface ProgressUpdate {
  bytesReceived?: number;
  bytesTotal?: number;
  chunksReceived?: number;
  sectionsComplete?: number;
  sectionsTotal?: number;
  sectionProgress?: SectionProgress[];
  stage?: StreamingProgressStage;
}

/**
 * Streaming Progress Service
 *
 * Tracks and calculates detailed progress metrics for streaming operations.
 *
 * @example
 * ```typescript
 * const progress = inject(StreamingProgressService);
 *
 * progress.start();
 *
 * progress.progress$.subscribe(p => {
 *   console.log(`${p.progress * 100}% complete`);
 *   console.log(`ETA: ${p.estimatedTimeRemainingMs}ms`);
 * });
 *
 * // Update as chunks arrive
 * progress.update({ bytesReceived: 1024, chunksReceived: 10 });
 *
 * progress.complete();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StreamingProgressService implements OnDestroy {
  private startTime: number | null = null;
  private firstChunkTime: number | null = null;
  private bytesHistory: { timestamp: number; bytes: number }[] = [];
  private readonly HISTORY_WINDOW_MS = 5000; // 5 seconds for rate calculation

  private readonly progressSubject = new BehaviorSubject<StreamingProgress>(
    this.createInitialProgress()
  );
  private readonly destroy$ = new Subject<void>();

  /** Observable of progress updates */
  readonly progress$ = this.progressSubject.asObservable();

  /** Observable of overall progress (0-1) */
  readonly progressValue$ = this.progress$.pipe(
    map((p) => p.progress),
    distinctUntilChanged()
  );

  /** Observable of stage changes */
  readonly stage$ = this.progress$.pipe(
    map((p) => p.stage),
    distinctUntilChanged()
  );

  /** Observable of ETA */
  readonly eta$ = this.progress$.pipe(
    map((p) => p.estimatedTimeRemainingMs),
    distinctUntilChanged()
  );

  /**
   * Start tracking progress
   */
  start(initialEstimates?: { bytesTotal?: number; sectionsTotal?: number }): void {
    this.startTime = Date.now();
    this.firstChunkTime = null;
    this.bytesHistory = [];

    const progress = this.createInitialProgress();
    progress.isActive = true;
    progress.stage = 'connecting';

    if (initialEstimates?.bytesTotal) {
      progress.bytesTotal = initialEstimates.bytesTotal;
    }
    if (initialEstimates?.sectionsTotal) {
      progress.sectionsTotal = initialEstimates.sectionsTotal;
    }

    this.progressSubject.next(progress);
  }

  /**
   * Update progress with new data
   */
  update(update: ProgressUpdate): void {
    const current = this.progressSubject.value;
    const now = Date.now();

    // Track first chunk
    if (!this.firstChunkTime && (update.bytesReceived || update.chunksReceived)) {
      this.firstChunkTime = now;
    }

    // Update bytes history for rate calculation
    if (update.bytesReceived !== undefined) {
      this.bytesHistory.push({ timestamp: now, bytes: update.bytesReceived });
      // Prune old entries
      const cutoff = now - this.HISTORY_WINDOW_MS;
      this.bytesHistory = this.bytesHistory.filter((h) => h.timestamp > cutoff);
    }

    // Calculate new progress
    const bytesReceived = update.bytesReceived ?? current.bytesReceived;
    const bytesTotal = update.bytesTotal ?? current.bytesTotal;
    const sectionsComplete = update.sectionsComplete ?? current.sectionsComplete;
    const sectionsTotal = update.sectionsTotal ?? current.sectionsTotal;

    // Calculate overall progress
    let progress = 0;
    if (bytesTotal && bytesTotal > 0) {
      progress = Math.min(1, bytesReceived / bytesTotal);
    } else if (sectionsTotal && sectionsTotal > 0) {
      progress = Math.min(1, sectionsComplete / sectionsTotal);
    } else {
      // Estimate based on typical card size
      progress = Math.min(0.95, bytesReceived / 10000);
    }

    // Calculate rate
    const bytesPerSecond = this.calculateRate();

    // Calculate ETA
    let estimatedTimeRemainingMs: number | null = null;
    if (bytesTotal && bytesPerSecond > 0) {
      const remainingBytes = bytesTotal - bytesReceived;
      estimatedTimeRemainingMs = Math.round((remainingBytes / bytesPerSecond) * 1000);
    }

    // Determine stage
    let stage = update.stage ?? current.stage;
    if (progress > 0 && stage === 'connecting') {
      stage = 'thinking';
    }
    if (progress > 0.05 && (stage === 'connecting' || stage === 'thinking')) {
      stage = 'streaming';
    }
    if (progress > 0.95 && stage === 'streaming') {
      stage = 'finalizing';
    }

    const newProgress: StreamingProgress = {
      progress,
      bytesReceived,
      bytesTotal,
      chunksReceived: update.chunksReceived ?? current.chunksReceived,
      sectionsComplete,
      sectionsTotal,
      bytesPerSecond,
      estimatedTimeRemainingMs,
      elapsedMs: this.startTime ? now - this.startTime : 0,
      timeToFirstChunkMs:
        this.firstChunkTime && this.startTime ? this.firstChunkTime - this.startTime : null,
      isActive: true,
      stage,
      sectionProgress: update.sectionProgress ?? current.sectionProgress,
    };

    this.progressSubject.next(newProgress);
  }

  /**
   * Update section progress
   */
  updateSection(index: number, sectionUpdate: Partial<SectionProgress>): void {
    const current = this.progressSubject.value;
    const sections = [...current.sectionProgress];

    const existing = sections.find((s) => s.index === index);
    if (existing) {
      Object.assign(existing, sectionUpdate);
    } else {
      sections.push({
        index,
        title: sectionUpdate.title || `Section ${index + 1}`,
        isComplete: sectionUpdate.isComplete ?? false,
        progress: sectionUpdate.progress ?? 0,
        fieldsComplete: sectionUpdate.fieldsComplete ?? 0,
        fieldsTotal: sectionUpdate.fieldsTotal ?? 0,
        itemsComplete: sectionUpdate.itemsComplete ?? 0,
        itemsTotal: sectionUpdate.itemsTotal ?? 0,
      });
    }

    // Sort by index
    sections.sort((a, b) => a.index - b.index);

    this.update({
      sectionProgress: sections,
      sectionsComplete: sections.filter((s) => s.isComplete).length,
    });
  }

  /**
   * Mark streaming as complete
   */
  complete(): void {
    const current = this.progressSubject.value;

    this.progressSubject.next({
      ...current,
      progress: 1,
      isActive: false,
      stage: 'complete',
      estimatedTimeRemainingMs: 0,
    });
  }

  /**
   * Mark streaming as errored
   */
  error(): void {
    const current = this.progressSubject.value;

    this.progressSubject.next({
      ...current,
      isActive: false,
      stage: 'error',
    });
  }

  /**
   * Reset progress
   */
  reset(): void {
    this.startTime = null;
    this.firstChunkTime = null;
    this.bytesHistory = [];
    this.progressSubject.next(this.createInitialProgress());
  }

  /**
   * Get current progress
   */
  getProgress(): StreamingProgress {
    return this.progressSubject.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.progressSubject.complete();
  }

  // ============================================
  // Private Methods
  // ============================================

  private calculateRate(): number {
    if (this.bytesHistory.length < 2) {
      return 0;
    }

    const oldest = this.bytesHistory[0];
    const newest = this.bytesHistory[this.bytesHistory.length - 1];

    if (!oldest || !newest) {
      return 0;
    }

    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000;
    if (timeDiff <= 0) {
      return 0;
    }

    const bytesDiff = newest.bytes - oldest.bytes;
    return Math.round(bytesDiff / timeDiff);
  }

  private createInitialProgress(): StreamingProgress {
    return {
      progress: 0,
      bytesReceived: 0,
      bytesTotal: null,
      chunksReceived: 0,
      sectionsComplete: 0,
      sectionsTotal: null,
      bytesPerSecond: 0,
      estimatedTimeRemainingMs: null,
      elapsedMs: 0,
      timeToFirstChunkMs: null,
      isActive: false,
      stage: 'idle',
      sectionProgress: [],
    };
  }
}

/**
 * Format progress for display
 */
export function formatProgress(progress: StreamingProgress): {
  percentage: string;
  eta: string;
  rate: string;
  status: string;
} {
  const percentage = `${Math.round(progress.progress * 100)}%`;

  let eta = '--';
  if (progress.estimatedTimeRemainingMs !== null) {
    const seconds = Math.round(progress.estimatedTimeRemainingMs / 1000);
    if (seconds < 60) {
      eta = `${seconds}s`;
    } else {
      eta = `${Math.round(seconds / 60)}m`;
    }
  }

  let rate = '--';
  if (progress.bytesPerSecond > 0) {
    if (progress.bytesPerSecond < 1024) {
      rate = `${progress.bytesPerSecond} B/s`;
    } else if (progress.bytesPerSecond < 1024 * 1024) {
      rate = `${Math.round(progress.bytesPerSecond / 1024)} KB/s`;
    } else {
      rate = `${(progress.bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  }

  const statusMap: Record<StreamingProgressStage, string> = {
    idle: 'Ready',
    connecting: 'Connecting...',
    thinking: 'Thinking...',
    streaming: 'Generating...',
    finalizing: 'Finalizing...',
    complete: 'Complete',
    error: 'Error',
  };

  return {
    percentage,
    eta,
    rate,
    status: statusMap[progress.stage],
  };
}
