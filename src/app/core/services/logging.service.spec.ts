/**
 * Unit Tests for LoggingService
 */

import { TestBed } from '@angular/core/testing';
import { LogEntry, LoggingService, LogLevel } from './logging.service';
import { AppConfigService } from './app-config.service';
import { FileLoggingService } from './file-logging.service';
import { PLATFORM_ID } from '@angular/core';

describe('LoggingService', () => {
  let service: LoggingService;
  let appConfigService: AppConfigService;
  let fileLoggingService: FileLoggingService;
  const STORAGE_KEY = 'osi-cards-app-logs';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        LoggingService,
        {
          provide: AppConfigService,
          useValue: {
            LOGGING: {
              LOG_LEVEL: 'debug' as LogLevel,
              ENABLE_SECTION_STATE_LOGGING: true,
              ENABLE_DEBUG: true,
            },
            isProduction: false,
          },
        },
        FileLoggingService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(LoggingService);
    appConfigService = TestBed.inject(AppConfigService);
    fileLoggingService = TestBed.inject(FileLoggingService);
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
    it('should persist logs to localStorage', () => {
      service.info('Test message', 'TestContext', { test: 'data' });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0]!.message).toBe('Test message');
      expect(parsed[0]!.context).toBe('TestContext');
    });

    it('getLogsFromLocalStorage should return empty array when no logs', () => {
      const logs = LoggingService.getLogsFromLocalStorage();
      expect(logs).toEqual([]);
    });

    it('getLogsFromLocalStorage should return logs from localStorage', () => {
      service.info('Test message 1', 'Context1', { test: 'data1' });
      service.warn('Test message 2', 'Context2', { test: 'data2' });

      const logs = LoggingService.getLogsFromLocalStorage();
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[logs.length - 2]!.message).toBe('Test message 1');
      expect(logs[logs.length - 1]!.message).toBe('Test message 2');
      expect(logs[logs.length - 2]!.timestamp).toBeInstanceOf(Date);
      expect(logs[logs.length - 2]!.context).toBe('Context1');
    });

    it('clearLocalStorageLogs should clear logs from localStorage', () => {
      service.info('Test message', 'Context');
      service.clearLocalStorageLogs();
      const logs = LoggingService.getLogsFromLocalStorage();
      expect(logs).toEqual([]);
    });

    it('clearHistory should also clear localStorage', () => {
      service.info('Test message', 'Context');
      service.clearHistory();
      const logs = LoggingService.getLogsFromLocalStorage();
      expect(logs).toEqual([]);
    });

    it('exportLocalStorageLogs should return JSON string', () => {
      service.info('Test message', 'Context', { test: 'data' });
      const exported = service.exportLocalStorageLogs();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]!.message).toBe('Test message');
    });

    it('should serialize Date objects to ISO strings in localStorage', () => {
      service.info('Test message', 'Context');
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(typeof parsed[0]!.timestamp).toBe('string');
      expect(parsed[0]!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should deserialize ISO strings to Date objects when reading', () => {
      service.info('Test message', 'Context');
      const logs = LoggingService.getLogsFromLocalStorage();
      expect(logs[0]!.timestamp).toBeInstanceOf(Date);
    });

    it('should persist sessionId and correlationId', () => {
      service.setCorrelationId('test-correlation-id');
      service.error('Test error', 'Context', { error: 'test' });

      const logs = LoggingService.getLogsFromLocalStorage();
      const errorLog = logs.find((log) => log.level === 'error');
      expect(errorLog?.correlationId).toBe('test-correlation-id');
      expect(errorLog?.sessionId).toBeDefined();
    });
  });

  // ============================================================================
  // Logging Methods Tests
  // ============================================================================
  describe('logging methods', () => {
    it('should log debug messages', () => {
      service.debug('Debug message', 'Context', { debug: true });
      const logs = service.getHistory();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]!.level).toBe('debug');
      expect(logs[logs.length - 1]!.message).toBe('Debug message');
    });

    it('should log info messages', () => {
      service.info('Info message', 'Context', { info: true });
      const logs = service.getHistory();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]!.level).toBe('info');
      expect(logs[logs.length - 1]!.message).toBe('Info message');
    });

    it('should log warning messages', () => {
      service.warn('Warning message', 'Context', { warn: true });
      const logs = service.getHistory();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]!.level).toBe('warn');
      expect(logs[logs.length - 1]!.message).toBe('Warning message');
    });

    it('should log error messages', () => {
      service.error('Error message', 'Context', { error: true });
      const logs = service.getHistory();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]!.level).toBe('error');
      expect(logs[logs.length - 1]!.message).toBe('Error message');
    });
  });

  // ============================================================================
  // Session and Correlation ID Tests
  // ============================================================================
  describe('session and correlation ID', () => {
    it('should generate session ID on initialization', () => {
      const sessionId = service.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^session_/);
    });

    it('should set and get correlation ID', () => {
      service.setCorrelationId('test-correlation-id');
      expect(service.getCorrelationId()).toBe('test-correlation-id');
    });

    it('should generate correlation ID on error if not set', () => {
      service.error('Test error', 'Context');
      const correlationId = service.getCorrelationId();
      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(/^corr_/);
    });
  });
});
