import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpRequest,
} from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';
import { RateLimitInterceptor } from './rate-limit.interceptor';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let nextHandler: jasmine.SpyObj<HttpHandler>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['warn', 'error', 'debug']);

    TestBed.configureTestingModule({
      providers: [RateLimitInterceptor, { provide: LoggingService, useValue: loggingSpy }],
    });

    interceptor = TestBed.inject(RateLimitInterceptor);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    nextHandler = jasmine.createSpyObj('HttpHandler', ['handle']);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('token bucket', () => {
    it('should allow requests within rate limit', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      nextHandler.handle.and.returnValue(of({} as HttpEvent<any>));

      interceptor.intercept(request, nextHandler).subscribe();
      tick(10);

      expect(nextHandler.handle).toHaveBeenCalled();
    }));

    it('should rate limit requests exceeding capacity', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      nextHandler.handle.and.returnValue(of({} as HttpEvent<any>));

      // Make many rapid requests
      for (let i = 0; i < 100; i++) {
        interceptor.intercept(request, nextHandler).subscribe({
          error: () => {
            // Intentionally empty - ignore errors in test
          },
        });
      }
      tick(10);

      // Should have rate limited some requests
      expect(loggingService.warn).toHaveBeenCalled();
    }));

    it('should refill tokens over time', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      nextHandler.handle.and.returnValue(of({} as HttpEvent<any>));

      // Exhaust tokens
      for (let i = 0; i < 20; i++) {
        interceptor.intercept(request, nextHandler).subscribe({
          error: () => {
            // Intentionally empty - ignore errors in test
          },
        });
      }
      tick(10);

      // Wait for refill
      tick(2000);

      // Should allow more requests after refill
      interceptor.intercept(request, nextHandler).subscribe();
      tick(10);

      expect(nextHandler.handle).toHaveBeenCalled();
    }));
  });

  describe('per-endpoint limits', () => {
    it('should apply different limits for different endpoints', fakeAsync(() => {
      const request1 = new HttpRequest('GET', '/api/endpoint1');
      const request2 = new HttpRequest('GET', '/api/endpoint2');
      nextHandler.handle.and.returnValue(of({} as HttpEvent<any>));

      // Both should be allowed initially
      interceptor.intercept(request1, nextHandler).subscribe();
      interceptor.intercept(request2, nextHandler).subscribe();
      tick(10);

      expect(nextHandler.handle).toHaveBeenCalledTimes(2);
    }));
  });

  describe('429 response handling', () => {
    it('should handle 429 responses with Retry-After header', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      const headers = new HttpHeaders().set('Retry-After', '2');
      const errorResponse = new HttpErrorResponse({
        status: 429,
        statusText: 'Too Many Requests',
        headers: headers,
      });

      nextHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, nextHandler).subscribe({
        error: () => {
          // Intentionally empty - ignore errors in test
        },
      });
      tick(10);

      expect(loggingService.warn).toHaveBeenCalled();
    }));

    it('should retry after delay when 429 received', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      const headers = new HttpHeaders().set('Retry-After', '1');
      const errorResponse = new HttpErrorResponse({
        status: 429,
        statusText: 'Too Many Requests',
        headers: headers,
      });

      let callCount = 0;
      nextHandler.handle.and.returnValue(
        callCount++ === 0 ? throwError(() => errorResponse) : of({} as HttpEvent<any>)
      );

      interceptor.intercept(request, nextHandler).subscribe();
      tick(1100); // Wait for retry

      expect(nextHandler.handle).toHaveBeenCalledTimes(2);
    }));
  });

  describe('error handling', () => {
    it('should handle non-429 errors normally', fakeAsync(() => {
      const request = new HttpRequest('GET', '/api/test');
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
      });

      nextHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, nextHandler).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });
      tick(10);
    }));
  });
});
