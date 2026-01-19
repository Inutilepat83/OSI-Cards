/**
 * Unit Tests for LoggerService
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService, LogEntry, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  const STORAGE_KEY = 'osi-cards-logs';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // localStorage Integration Tests
  // ============================================================================
  describe('localStorage integration', () => {
    beforeEach(() => {
      service.configure({ enableStorage: true });
    });

    it('should persist logs to localStorage when enableStorage is true', (done) => {
      service.info('Test message', { test: 'data' });

      // Wait for debounce
      setTimeout(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]!.message).toBe('Test message');
        done();
      }, 200);
    });

    it('should not persist logs to localStorage when enableStorage is false', () => {
      service.configure({ enableStorage: false });
      service.info('Test message');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('getLogsFromLocalStorage should return empty array when no logs', () => {
      const logs = LoggerService.getLogsFromLocalStorage();
      expect(logs).toEqual([]);
    });

    it('getLogsFromLocalStorage should return logs from localStorage', (done) => {
      service.info('Test message 1', { test: 'data1' });
      service.warn('Test message 2', { test: 'data2' });

      setTimeout(() => {
        const logs = LoggerService.getLogsFromLocalStorage();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]!.message).toBe('Test message 1');
        expect(logs[1]!.message).toBe('Test message 2');
        expect(logs[0]!.timestamp).toBeInstanceOf(Date);
        done();
      }, 200);
    });

    it('clearLocalStorageLogs should clear logs from localStorage', (done) => {
      service.info('Test message');
      setTimeout(() => {
        service.clearLocalStorageLogs();
        const logs = LoggerService.getLogsFromLocalStorage();
        expect(logs).toEqual([]);
        done();
      }, 200);
    });

    it('exportLocalStorageLogs should return JSON string', (done) => {
      service.info('Test message', { test: 'data' });
      setTimeout(() => {
        const exported = service.exportLocalStorageLogs();
        expect(typeof exported).toBe('string');
        const parsed = JSON.parse(exported);
        expect(parsed).toBeInstanceOf(Array);
        expect(parsed.length).toBeGreaterThan(0);
        done();
      }, 200);
    });

    it('should limit logs to maxStoredLogs', (done) => {
      service.configure({ enableStorage: true, maxStoredLogs: 5 });
      for (let i = 0; i < 10; i++) {
        service.info(`Message ${i}`);
      }
      setTimeout(() => {
        const logs = LoggerService.getLogsFromLocalStorage();
        expect(logs.length).toBeLessThanOrEqual(5);
        done();
      }, 300);
    });

    it('should serialize Date objects to ISO strings in localStorage', (done) => {
      service.info('Test message');
      setTimeout(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(stored!);
        expect(typeof parsed[0]!.timestamp).toBe('string');
        expect(parsed[0]!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
        done();
      }, 200);
    });

    it('should deserialize ISO strings to Date objects when reading', (done) => {
      service.info('Test message');
      setTimeout(() => {
        const logs = LoggerService.getLogsFromLocalStorage();
        expect(logs[0]!.timestamp).toBeInstanceOf(Date);
        done();
      }, 200);
    });
  });

  // ============================================================================
  // Logging Methods Tests
  // ============================================================================
  describe('logging methods', () => {
    beforeEach(() => {
      service.configure({ enableStorage: true });
    });

    it('should log debug messages', (done) => {
      service.debug('Debug message', { debug: true });
      setTimeout(() => {
        const logs = service.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]!.level).toBe('debug');
        expect(logs[0]!.message).toBe('Debug message');
        done();
      }, 200);
    });

    it('should log info messages', (done) => {
      service.info('Info message', { info: true });
      setTimeout(() => {
        const logs = service.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]!.level).toBe('info');
        expect(logs[0]!.message).toBe('Info message');
        done();
      }, 200);
    });

    it('should log warning messages', (done) => {
      service.warn('Warning message', { warn: true });
      setTimeout(() => {
        const logs = service.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]!.level).toBe('warn');
        expect(logs[0]!.message).toBe('Warning message');
        done();
      }, 200);
    });

    it('should log error messages with stack trace', (done) => {
      const error = new Error('Test error');
      service.error('Error message', { error: true }, error);
      setTimeout(() => {
        const logs = service.getLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]!.level).toBe('error');
        expect(logs[0]!.message).toBe('Error message');
        expect(logs[0]!.stack).toBeDefined();
        done();
      }, 200);
    });
  });
});
