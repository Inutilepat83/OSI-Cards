import { TestBed } from '@angular/core/testing';
import { ErrorBoundaryUtil } from './error-boundary.util';
import { ErrorHandlingService } from '../../core/services/error-handling.service';
import { LoggingService } from '../../core/services/logging.service';
import { throwError, of } from 'rxjs';

describe('ErrorBoundaryUtil', () => {
  let util: ErrorBoundaryUtil;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const errorHandlingSpy = jasmine.createSpyObj('ErrorHandlingService', ['handleError']);
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        ErrorBoundaryUtil,
        { provide: ErrorHandlingService, useValue: errorHandlingSpy },
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });
    util = TestBed.inject(ErrorBoundaryUtil);
    errorHandlingService = TestBed.inject(ErrorHandlingService) as jasmine.SpyObj<ErrorHandlingService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(util).toBeTruthy();
  });

  describe('wrap', () => {
    it('should return result if function succeeds', () => {
      const result = util.wrap(() => 'success', 'test');
      
      expect(result).toBe('success');
    });

    it('should return null if function throws', () => {
      errorHandlingService.handleError.and.returnValue({
        message: 'Test error',
        code: 'TEST-001',
        category: 'runtime',
        severity: 'error'
      } as any);
      
      const result = util.wrap(() => {
        throw new Error('Test error');
      }, 'test');
      
      expect(result).toBeNull();
      expect(errorHandlingService.handleError).toHaveBeenCalled();
    });

    it('should log error', () => {
      const error = new Error('Test error');
      errorHandlingService.handleError.and.returnValue({
        message: 'Test error',
        code: 'TEST-001',
        category: 'runtime',
        severity: 'error'
      } as any);
      
      util.wrap(() => {
        throw error;
      }, 'test');
      
      expect(loggingService.error).toHaveBeenCalled();
    });
  });

  describe('catchErrorOperator', () => {
    it('should catch errors in observable', (done) => {
      const error = new Error('Test error');
      errorHandlingService.handleError.and.returnValue({
        message: 'Test error',
        code: 'TEST-001',
        category: 'runtime',
        severity: 'error'
      } as any);
      
      const operator = util.catchErrorOperator('test');
      const source = throwError(() => error);
      
      source.pipe(operator).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          expect(errorHandlingService.handleError).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should pass through successful values', (done) => {
      const operator = util.catchErrorOperator('test');
      const source = of('success');
      
      source.pipe(operator).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          done();
        }
      });
    });
  });
});











