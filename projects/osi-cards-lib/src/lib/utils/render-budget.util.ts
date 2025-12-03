/**
 * Render Budget Monitoring Utilities
 * Provides frame budget monitoring and detection of frame drops
 */

/**
 * Frame budget configuration
 */
export interface FrameBudgetConfig {
  /** Target FPS (default: 60) */
  targetFPS?: number;
  /** Warning threshold for slow frames (default: 0.8) */
  warningThreshold?: number;
  /** Critical threshold for very slow frames (default: 0.5) */
  criticalThreshold?: number;
  /** Enable console warnings */
  enableWarnings?: boolean;
  /** Max frames to track */
  maxFrames?: number;
}

/**
 * Frame data
 */
export interface FrameData {
  /** Frame number */
  frameNumber: number;
  /** Frame timestamp */
  timestamp: number;
  /** Frame duration in ms */
  duration: number;
  /** Budget remaining in ms */
  budgetRemaining: number;
  /** Whether frame was dropped */
  dropped: boolean;
  /** FPS at this frame */
  fps: number;
  /** Tasks executed in this frame */
  tasks?: FrameTask[];
}

/**
 * Task executed in a frame
 */
export interface FrameTask {
  /** Task name */
  name: string;
  /** Task duration */
  duration: number;
  /** Task start time */
  startTime: number;
}

/**
 * Frame budget statistics
 */
export interface FrameBudgetStats {
  /** Total frames tracked */
  totalFrames: number;
  /** Frames that met budget */
  goodFrames: number;
  /** Frames that exceeded warning threshold */
  warningFrames: number;
  /** Frames that exceeded critical threshold */
  criticalFrames: number;
  /** Dropped frames */
  droppedFrames: number;
  /** Average FPS */
  averageFPS: number;
  /** Min FPS */
  minFPS: number;
  /** Max FPS */
  maxFPS: number;
  /** Average frame duration */
  averageDuration: number;
  /** Percentage of budget used on average */
  averageBudgetUsage: number;
}

/**
 * Render Budget Monitor
 */
export class RenderBudgetMonitor {
  private config: Required<FrameBudgetConfig>;
  private frames: FrameData[] = [];
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameNumber = 0;
  private currentFrameTasks: FrameTask[] = [];
  private observers: Set<(frame: FrameData) => void> = new Set();
  private isRunning = false;

  constructor(config: FrameBudgetConfig = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      warningThreshold: config.warningThreshold ?? 0.8,
      criticalThreshold: config.criticalThreshold ?? 0.5,
      enableWarnings: config.enableWarnings ?? true,
      maxFrames: config.maxFrames ?? 300, // Keep last 5 seconds at 60fps
    };
  }

  /**
   * Start monitoring
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameNumber = 0;
    this.frames = [];

    this.rafId = requestAnimationFrame(this.measureFrame.bind(this));

    if (this.config.enableWarnings) {
      console.log('[RenderBudget] Monitoring started');
    }
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isRunning) return;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.isRunning = false;

    if (this.config.enableWarnings) {
      console.log('[RenderBudget] Monitoring stopped');
      this.printSummary();
    }
  }

  /**
   * Measure frame
   */
  private measureFrame(timestamp: number): void {
    const duration = timestamp - this.lastFrameTime;
    const frameBudget = 1000 / this.config.targetFPS;
    const budgetRemaining = frameBudget - duration;
    const fps = 1000 / duration;
    const dropped = duration > frameBudget * 1.5;

    const frameData: FrameData = {
      frameNumber: this.frameNumber++,
      timestamp,
      duration,
      budgetRemaining,
      dropped,
      fps,
      tasks: [...this.currentFrameTasks],
    };

    this.frames.push(frameData);

    // Keep only recent frames
    if (this.frames.length > this.config.maxFrames) {
      this.frames.shift();
    }

    // Check thresholds
    const budgetUsage = duration / frameBudget;
    if (budgetUsage > 1 / this.config.criticalThreshold) {
      if (this.config.enableWarnings) {
        console.error(
          `[RenderBudget] 🔴 CRITICAL: Frame ${this.frameNumber} took ${duration.toFixed(2)}ms (${fps.toFixed(1)} FPS)`
        );
      }
    } else if (budgetUsage > 1 / this.config.warningThreshold) {
      if (this.config.enableWarnings) {
        console.warn(
          `[RenderBudget] 🟡 WARNING: Frame ${this.frameNumber} took ${duration.toFixed(2)}ms (${fps.toFixed(1)} FPS)`
        );
      }
    }

    // Notify observers
    this.observers.forEach((observer) => observer(frameData));

    // Reset for next frame
    this.currentFrameTasks = [];
    this.lastFrameTime = timestamp;

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.measureFrame.bind(this));
    }
  }

  /**
   * Track a task in the current frame
   */
  public trackTask(name: string, duration: number, startTime: number): void {
    this.currentFrameTasks.push({
      name,
      duration,
      startTime,
    });
  }

  /**
   * Subscribe to frame data
   */
  public subscribe(observer: (frame: FrameData) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Get statistics
   */
  public getStats(): FrameBudgetStats {
    if (this.frames.length === 0) {
      return {
        totalFrames: 0,
        goodFrames: 0,
        warningFrames: 0,
        criticalFrames: 0,
        droppedFrames: 0,
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        averageDuration: 0,
        averageBudgetUsage: 0,
      };
    }

    const frameBudget = 1000 / this.config.targetFPS;
    const warningThreshold = frameBudget / this.config.warningThreshold;
    const criticalThreshold = frameBudget / this.config.criticalThreshold;

    const goodFrames = this.frames.filter((f) => f.duration <= frameBudget).length;
    const warningFrames = this.frames.filter(
      (f) => f.duration > frameBudget && f.duration <= warningThreshold
    ).length;
    const criticalFrames = this.frames.filter((f) => f.duration > warningThreshold).length;
    const droppedFrames = this.frames.filter((f) => f.dropped).length;

    const fpsValues = this.frames.map((f) => f.fps);
    const durations = this.frames.map((f) => f.duration);

    return {
      totalFrames: this.frames.length,
      goodFrames,
      warningFrames,
      criticalFrames,
      droppedFrames,
      averageFPS: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
      minFPS: Math.min(...fpsValues),
      maxFPS: Math.max(...fpsValues),
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      averageBudgetUsage: (durations.reduce((a, b) => a + b, 0) / durations.length / frameBudget) * 100,
    };
  }

  /**
   * Print summary
   */
  public printSummary(): void {
    const stats = this.getStats();

    console.log('\n📊 Render Budget Summary:');
    console.log(`  Total Frames: ${stats.totalFrames}`);
    console.log(`  Good Frames: ${stats.goodFrames} (${((stats.goodFrames / stats.totalFrames) * 100).toFixed(1)}%)`);
    console.log(`  Warning Frames: ${stats.warningFrames}`);
    console.log(`  Critical Frames: ${stats.criticalFrames}`);
    console.log(`  Dropped Frames: ${stats.droppedFrames}`);
    console.log(`  Average FPS: ${stats.averageFPS.toFixed(1)}`);
    console.log(`  Min FPS: ${stats.minFPS.toFixed(1)}`);
    console.log(`  Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`  Average Budget Usage: ${stats.averageBudgetUsage.toFixed(1)}%`);
  }

  /**
   * Get frame data
   */
  public getFrames(): FrameData[] {
    return [...this.frames];
  }

  /**
   * Clear frame data
   */
  public clear(): void {
    this.frames = [];
    this.frameNumber = 0;
  }
}

/**
 * Global render budget monitor instance
 */
export const globalRenderBudget = new RenderBudgetMonitor();

/**
 * Decorator to track function execution within frame budget
 */
export function TrackFrameBudget(taskName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const name = taskName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const result = originalMethod.apply(this, args);

      const duration = performance.now() - startTime;
      globalRenderBudget.trackTask(name, duration, startTime);

      return result;
    };

    return descriptor;
  };
}

/**
 * Check if running within frame budget
 */
export function isWithinFrameBudget(durationMs: number, targetFPS: number = 60): boolean {
  const frameBudget = 1000 / targetFPS;
  return durationMs <= frameBudget;
}

/**
 * Get remaining frame budget
 */
export function getRemainingFrameBudget(targetFPS: number = 60): number {
  const frameBudget = 1000 / targetFPS;
  const now = performance.now();
  const lastFrameMark = (performance as any).timing?.navigationStart || 0;
  const elapsed = now - lastFrameMark;
  const frameDuration = elapsed % frameBudget;
  return frameBudget - frameDuration;
}

