/**
 * Performance Utilities
 *
 * Utilities for performance measurement and optimization.
 *
 * @example
 * ```typescript
 * import { measure, fps, idle } from './';
 *
 * const time = await measure(() => doWork());
 * const currentFps = await fps();
 * await idle(() => doLowPriorityWork());
 * ```
 */

export async function measure<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

export function measureSync<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

export async function fps(): Promise<number> {
  return new Promise((resolve) => {
    let lastTime = performance.now();
    let frames = 0;

    function measureFrame(time: number): void {
      frames++;
      const delta = time - lastTime;

      if (delta >= 1000) {
        resolve(frames);
      } else {
        requestAnimationFrame(measureFrame);
      }
    }

    requestAnimationFrame(measureFrame);
  });
}

export function idle(callback: () => void, options?: IdleRequestOptions): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }
  return setTimeout(callback, 1) as any;
}

export function cancelIdle(handle: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(handle);
  } else {
    clearTimeout(handle as any);
  }
}

export function raf(callback: FrameRequestCallback): number {
  return requestAnimationFrame(callback);
}

export function cancelRaf(handle: number): void {
  cancelAnimationFrame(handle);
}

export async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function nextIdle(): Promise<IdleDeadline> {
  return new Promise((resolve) => idle(() => resolve({} as IdleDeadline)));
}

export function now(): number {
  return performance.now();
}

export function mark(name: string): void {
  performance.mark(name);
}

export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): PerformanceMeasure {
  return performance.measure(name, startMark, endMark);
}

export function clearMarks(name?: string): void {
  performance.clearMarks(name);
}

export function clearMeasures(name?: string): void {
  performance.clearMeasures(name);
}

export function getEntries(): PerformanceEntryList {
  return performance.getEntries();
}

export function getEntriesByType(type: string): PerformanceEntryList {
  return performance.getEntriesByType(type);
}

export function getEntriesByName(name: string): PerformanceEntryList {
  return performance.getEntriesByName(name);
}

export function getNavigationTiming(): PerformanceNavigationTiming | undefined {
  const entries = performance.getEntriesByType('navigation');
  return entries[0] as PerformanceNavigationTiming;
}

export function getResourceTimings(): PerformanceResourceTiming[] {
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

export function observePerformance(
  callback: PerformanceObserverCallback,
  options: PerformanceObserverInit
): PerformanceObserver {
  const observer = new PerformanceObserver(callback);
  observer.observe(options);
  return observer;
}

export function memoryUsage(): any {
  return (performance as any).memory;
}
