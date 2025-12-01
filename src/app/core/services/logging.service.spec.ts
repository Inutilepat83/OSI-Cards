import { TestBed } from '@angular/core/testing';
import { LoggingService, LogLevel } from './logging.service';
import { AppConfigService } from './app-config.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let appConfig: jasmine.SpyObj<AppConfigService>;
  let consoleDebugSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    const appConfigSpy = jasmine.createSpyObj('AppConfigService', [], {
      LOGGING: {
        LOG_LEVEL: 'debug' as LogLevel,
        ENABLE_DEBUG: true,
        ENABLE_SECTION_STATE_LOGGING: true,
      },
    });

    TestBed.configureTestingModule({
      providers: [LoggingService, { provide: AppConfigService, useValue: appConfigSpy }],
    });

    service = TestBed.inject(LoggingService);
    appConfig = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;

    // Spy on console methods
    consoleDebugSpy = spyOn(console, 'debug');
    consoleInfoSpy = spyOn(console, 'info');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Logging methods', () => {
    it('should log debug messages', () => {
      service.debug('Debug message', 'TestContext', { key: 'value' });
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      service.info('Info message', 'TestContext');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      service.warn('Warning message', 'TestContext');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      service.error('Error message', 'TestContext', { error: 'details' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log debug when log level is info', () => {
      Object.defineProperty(appConfig, 'LOGGING', {
        value: {
          LOG_LEVEL: 'info' as LogLevel,
          ENABLE_DEBUG: false,
          ENABLE_SECTION_STATE_LOGGING: false,
        },
        configurable: true,
      });

      service.debug('Debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log with context', () => {
      service.info('Message', 'MyContext');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('[MyContext]'),
        jasmine.any(Object)
      );
    });

    it('should log with data', () => {
      const data = { userId: '123', action: 'test' };
      service.info('Message', 'Context', data);
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('Correlation ID', () => {
    it('should set and get correlation ID', () => {
      const correlationId = 'test-correlation-id';
      service.setCorrelationId(correlationId);
      expect(service.getCorrelationId()).toBe(correlationId);
    });

    it('should generate correlation ID on error', () => {
      service.error('Error message');
      expect(service.getCorrelationId()).toBeTruthy();
    });

    it('should return null when correlation ID is not set', () => {
      expect(service.getCorrelationId()).toBeNull();
    });
  });

  describe('Session ID', () => {
    it('should generate session ID on initialization', () => {
      expect(service.getSessionId()).toBeTruthy();
      expect(service.getSessionId()).toContain('session_');
    });

    it('should return same session ID on multiple calls', () => {
      const sessionId1 = service.getSessionId();
      const sessionId2 = service.getSessionId();
      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Log history', () => {
    it('should store log entries in history', () => {
      service.info('Test message', 'Context');
      const history = service.getHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].message).toBe('Test message');
    });

    it('should filter history by level', () => {
      service.info('Info message');
      service.error('Error message');
      service.warn('Warning message');

      const errorHistory = service.getHistory('error');
      expect(errorHistory.length).toBe(1);
      expect(errorHistory[0].message).toBe('Error message');
    });

    it('should limit history entries', () => {
      for (let i = 0; i < 5; i++) {
        service.info(`Message ${i}`);
      }

      const limitedHistory = service.getHistory(undefined, 3);
      expect(limitedHistory.length).toBe(3);
    });

    it('should clear history', () => {
      service.info('Message 1');
      service.info('Message 2');
      expect(service.getHistory().length).toBeGreaterThan(0);

      service.clearHistory();
      expect(service.getHistory().length).toBe(0);
    });

    it('should limit history size to maxHistorySize', () => {
      // Add more than maxHistorySize entries
      for (let i = 0; i < 1001; i++) {
        service.info(`Message ${i}`);
      }

      const history = service.getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Log level filtering', () => {
    it('should filter logs based on configured level', () => {
      Object.defineProperty(appConfig, 'LOGGING', {
        value: {
          LOG_LEVEL: 'warn' as LogLevel,
          ENABLE_DEBUG: false,
          ENABLE_SECTION_STATE_LOGGING: false,
        },
        configurable: true,
      });

      service.debug('Debug message');
      service.info('Info message');
      service.warn('Warning message');
      service.error('Error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Structured logging', () => {
    it('should include timestamp in log entries', () => {
      service.info('Test message');
      const history = service.getHistory();
      expect(history[history.length - 1].timestamp).toBeInstanceOf(Date);
    });

    it('should include session ID in log entries', () => {
      service.info('Test message');
      const history = service.getHistory();
      expect(history[history.length - 1].sessionId).toBeTruthy();
    });

    it('should include correlation ID in error logs', () => {
      service.error('Error message');
      const history = service.getHistory('error');
      expect(history[0].correlationId).toBeTruthy();
    });
  });
});
