import { TestBed } from '@angular/core/testing';
import { WebVitalsService } from './web-vitals.service';
import { LoggingService } from './logging.service';

describe('WebVitalsService', () => {
  let service: WebVitalsService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        WebVitalsService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });
    service = TestBed.inject(WebVitalsService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should initialize without errors', () => {
      expect(() => service.initialize()).not.toThrow();
    });

    it('should warn if PerformanceObserver not available', () => {
      const originalObserver = (window as any).PerformanceObserver;
      (window as any).PerformanceObserver = undefined;
      
      service.initialize();
      
      expect(loggingService.warn).toHaveBeenCalledWith(
        'Web Vitals monitoring not supported in this environment',
        'WebVitalsService'
      );
      
      (window as any).PerformanceObserver = originalObserver;
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics initially', () => {
      const metrics = service.getMetrics();
      
      expect(metrics).toEqual({});
    });

    it('should return copy of metrics', () => {
      const metrics1 = service.getMetrics();
      const metrics2 = service.getMetrics();
      
      expect(metrics1).not.toBe(metrics2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should cleanup without errors', () => {
      service.initialize();
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});

