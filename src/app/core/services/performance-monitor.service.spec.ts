import { TestBed } from '@angular/core/testing';
import { PerformanceMonitorService } from './performance-monitor.service';

describe('PerformanceMonitorService', () => {
  let service: PerformanceMonitorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerformanceMonitorService],
    });

    service = TestBed.inject(PerformanceMonitorService);
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Performance Measurement', () => {
    it('should measure operation duration', () => {
      const mark = service.startMeasure('test-operation');

      // Simulate work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      const duration = mark.end();
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });

    it('should store mark with metadata', () => {
      const metadata = { userId: '123', action: 'load' };
      const mark = service.startMeasure('test', metadata);
      mark.end();

      const marks = service.getMarks('test');
      expect(marks.length).toBe(1);
      expect(marks[0].metadata).toEqual(metadata);
    });

    it('should cancel measurement', () => {
      const mark = service.startMeasure('test');
      mark.cancel();

      const marks = service.getMarks('test');
      expect(marks.length).toBe(0);
    });
  });

  describe('Async Measurement', () => {
    it('should measure async function', async () => {
      const result = await service.measureAsync('async-test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'success';
      });

      expect(result).toBe('success');
      const marks = service.getMarks('async-test');
      expect(marks.length).toBe(1);
      expect(marks[0].duration).toBeGreaterThan(0);
    });

    it('should handle async errors', async () => {
      try {
        await service.measureAsync('error-test', async () => {
          throw new Error('Test error');
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeTruthy();
        // Mark should not be stored
        const marks = service.getMarks('error-test');
        expect(marks.length).toBe(0);
      }
    });
  });

  describe('Sync Measurement', () => {
    it('should measure sync function', () => {
      const result = service.measureSync('sync-test', () => {
        return 42;
      });

      expect(result).toBe(42);
      const marks = service.getMarks('sync-test');
      expect(marks.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Add test marks
      for (let i = 0; i < 10; i++) {
        const mark = service.startMeasure('test-op');
        setTimeout(() => {}, i * 10); // Simulate varying durations
        mark.end();
      }
    });

    it('should calculate average duration', () => {
      const avg = service.getAverage('test-op');
      expect(avg).toBeGreaterThan(0);
    });

    it('should calculate percentiles', () => {
      const p95 = service.getPercentile('test-op', 95);
      const p99 = service.getPercentile('test-op', 99);

      expect(p95).toBeGreaterThan(0);
      expect(p99).toBeGreaterThanOrEqual(p95);
    });

    it('should get performance metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics.marks.length).toBeGreaterThan(0);
      expect(metrics.averages['test-op']).toBeDefined();
      expect(metrics.p95['test-op']).toBeDefined();
      expect(metrics.p99['test-op']).toBeDefined();
    });
  });

  describe('Slow Operations', () => {
    it('should identify slow operations', () => {
      // Add slow operation
      const mark = service.startMeasure('slow-op');
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }
      mark.end();

      const slowOps = service.getSlowOperations(40);
      expect(slowOps.length).toBeGreaterThan(0);
    });
  });

  describe('Export', () => {
    it('should export metrics as JSON', () => {
      const mark = service.startMeasure('test');
      mark.end();

      const json = service.exportMetrics();
      expect(json).toBeTruthy();

      const parsed = JSON.parse(json);
      expect(parsed.marks).toBeDefined();
      expect(parsed.averages).toBeDefined();
    });
  });

  describe('Clear', () => {
    it('should clear all marks', () => {
      service.startMeasure('test').end();
      expect(service.getMarks().length).toBe(1);

      service.clear();
      expect(service.getMarks().length).toBe(0);
    });
  });
});
