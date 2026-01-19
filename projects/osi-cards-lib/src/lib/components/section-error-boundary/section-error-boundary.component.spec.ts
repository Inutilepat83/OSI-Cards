/**
 * Section Error Boundary Component Tests
 *
 * Unit tests for SectionErrorBoundaryComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SectionErrorBoundaryComponent,
  SectionError,
  ErrorBoundaryConfig,
  DEFAULT_ERROR_BOUNDARY_CONFIG,
} from './section-error-boundary.component';
import { By } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { of, timer } from 'rxjs';

describe('SectionErrorBoundaryComponent', () => {
  let component: SectionErrorBoundaryComponent;
  let fixture: ComponentFixture<SectionErrorBoundaryComponent>;
  let errorHandler: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
      imports: [SectionErrorBoundaryComponent],
      providers: [{ provide: ErrorHandler, useValue: errorHandlerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionErrorBoundaryComponent);
    component = fixture.componentInstance;
    errorHandler = TestBed.inject(ErrorHandler) as jasmine.SpyObj<ErrorHandler>;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render content when no error', () => {
      component.hasError = false;
      fixture.detectChanges();

      const errorBoundary = fixture.debugElement.query(By.css('.section-error-boundary'));
      expect(errorBoundary).toBeFalsy();
    });

    it('should render error UI when error occurs', () => {
      const error = new Error('Test error');
      component.handleError(error);
      fixture.detectChanges();

      const errorBoundary = fixture.debugElement.query(By.css('.section-error-boundary'));
      expect(errorBoundary).toBeTruthy();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should call ngOnDestroy', () => {
      spyOn(component, 'ngOnDestroy');
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle error and set hasError to true', () => {
      const error = new Error('Test error');
      component.handleError(error);

      expect(component.hasError).toBe(true);
    });

    it('should create error info when handling error', () => {
      const error = new Error('Test error');
      component.handleError(error);

      expect(component.errorInfo).toBeDefined();
      expect(component.errorInfo?.message).toBeTruthy();
      expect(component.errorInfo?.originalError).toBe(error);
    });

    it('should emit errorCaught event when error occurs', () => {
      const error = new Error('Test error');
      spyOn(component.errorCaught, 'emit');

      component.handleError(error);

      expect(component.errorCaught.emit).toHaveBeenCalled();
    });

    it('should call error handler when error occurs', () => {
      const error = new Error('Test error');
      component.handleError(error);

      expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    });

    it('should include sectionId in error info when provided', () => {
      const error = new Error('Test error');
      component.sectionId = 'section-123';
      component.handleError(error);

      expect(component.errorInfo?.sectionId).toBe('section-123');
    });

    it('should include sectionType in error info when provided', () => {
      const error = new Error('Test error');
      component.sectionType = 'analytics';
      component.handleError(error);

      expect(component.errorInfo?.sectionType).toBe('analytics');
    });

    it('should include timestamp in error info', () => {
      const error = new Error('Test error');
      const beforeTime = new Date();
      component.handleError(error);
      const afterTime = new Date();

      expect(component.errorInfo?.timestamp).toBeInstanceOf(Date);
      expect(component.errorInfo?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(component.errorInfo?.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Retry Functionality', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should schedule retry when onRetry is called', () => {
      const error = new Error('Test error');
      component.handleError(error);
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true };
      component.retryCount = 0;

      component.onRetry();
      jasmine.clock().tick(1000);

      expect(component.hasError).toBe(false);
      expect(component.isRetrying).toBe(false);
    });

    it('should increment retry count on retry', () => {
      component.retryCount = 0;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true };

      component.onRetry();
      jasmine.clock().tick(1000);

      expect(component.retryCount).toBe(1);
    });

    it('should not retry when max retries reached', () => {
      component.retryCount = 3;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true, maxRetries: 3 };

      component.onRetry();

      expect(component.retryCount).toBe(3);
      expect(component.isRetrying).toBe(false);
    });

    it('should not retry when already retrying', () => {
      component.isRetrying = true;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true };

      component.onRetry();

      expect(component.isRetrying).toBe(true);
    });

    it('should emit retryRequested event on retry', () => {
      const error = new Error('Test error');
      component.handleError(error);
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true };
      component.retryCount = 0;
      spyOn(component.retryRequested, 'emit');

      component.onRetry();
      jasmine.clock().tick(1000);

      expect(component.retryRequested.emit).toHaveBeenCalled();
    });

    it('should set isRetrying during retry delay', () => {
      const error = new Error('Test error');
      component.handleError(error);
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true, retryDelayMs: 1000 };
      component.retryCount = 0;

      component.onRetry();
      expect(component.isRetrying).toBe(true);

      jasmine.clock().tick(1000);
      expect(component.isRetrying).toBe(false);
    });
  });

  describe('Auto-Retry', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should auto-retry when autoRetry is enabled', () => {
      const error = new Error('Test error');
      component.config = {
        ...DEFAULT_ERROR_BOUNDARY_CONFIG,
        autoRetry: true,
        allowRetry: true,
      };
      component.retryCount = 0;

      component.handleError(error);
      jasmine.clock().tick(1000);

      expect(component.hasError).toBe(false);
    });

    it('should not auto-retry when autoRetry is disabled', () => {
      const error = new Error('Test error');
      component.config = {
        ...DEFAULT_ERROR_BOUNDARY_CONFIG,
        autoRetry: false,
      };

      component.handleError(error);
      jasmine.clock().tick(1000);

      expect(component.hasError).toBe(true);
    });

    it('should not auto-retry when max retries reached', () => {
      const error = new Error('Test error');
      component.config = {
        ...DEFAULT_ERROR_BOUNDARY_CONFIG,
        autoRetry: true,
        allowRetry: true,
        maxRetries: 3,
      };
      component.retryCount = 3;

      component.handleError(error);
      jasmine.clock().tick(1000);

      expect(component.hasError).toBe(true);
    });
  });

  describe('Clear Error', () => {
    it('should clear error state', () => {
      const error = new Error('Test error');
      component.handleError(error);
      expect(component.hasError).toBe(true);

      component.clearError();

      expect(component.hasError).toBe(false);
      expect(component.errorInfo).toBeUndefined();
      expect(component.retryCount).toBe(0);
      expect(component.isRetrying).toBe(false);
    });

    it('should emit errorCleared event', () => {
      const error = new Error('Test error');
      component.handleError(error);
      spyOn(component.errorCleared, 'emit');

      component.clearError();

      expect(component.errorCleared.emit).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error boundary', () => {
      const error = new Error('Test error');
      component.handleError(error);
      component.retryCount = 2;

      component.reset();

      expect(component.hasError).toBe(false);
      expect(component.errorInfo).toBeUndefined();
      expect(component.retryCount).toBe(0);
    });
  });

  describe('Input Properties', () => {
    it('should accept sectionId input', () => {
      component.sectionId = 'section-123';
      expect(component.sectionId).toBe('section-123');
    });

    it('should accept sectionType input', () => {
      component.sectionType = 'analytics';
      expect(component.sectionType).toBe('analytics');
    });

    it('should accept config input', () => {
      const customConfig: ErrorBoundaryConfig = {
        showDetails: true,
        allowRetry: true,
        maxRetries: 5,
        retryDelayMs: 2000,
        autoRetry: true,
      };
      component.config = customConfig;

      expect(component.config).toEqual(customConfig);
    });

    it('should use default config when not provided', () => {
      expect(component.config).toEqual(DEFAULT_ERROR_BOUNDARY_CONFIG);
    });
  });

  describe('canRetry Getter', () => {
    it('should return true when retry count is less than max', () => {
      component.retryCount = 1;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, maxRetries: 3 };
      expect(component.canRetry).toBe(true);
    });

    it('should return false when retry count equals max', () => {
      component.retryCount = 3;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, maxRetries: 3 };
      expect(component.canRetry).toBe(false);
    });

    it('should return false when retry count exceeds max', () => {
      component.retryCount = 5;
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, maxRetries: 3 };
      expect(component.canRetry).toBe(false);
    });
  });

  describe('Error Display', () => {
    it('should show error message', () => {
      const error = new Error('Test error message');
      component.handleError(error);
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.section-error-boundary__message'));
      expect(message).toBeTruthy();
    });

    it('should show section type when showDetails is true', () => {
      const error = new Error('Test error');
      component.sectionType = 'analytics';
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, showDetails: true };
      component.handleError(error);
      fixture.detectChanges();

      const type = fixture.debugElement.query(By.css('.section-error-boundary__type'));
      expect(type).toBeTruthy();
    });

    it('should show error details when showDetails is true', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, showDetails: true };
      component.handleError(error);
      fixture.detectChanges();

      const details = fixture.debugElement.query(By.css('.section-error-boundary__details'));
      expect(details).toBeTruthy();
    });

    it('should show retry button when allowRetry is true and can retry', () => {
      const error = new Error('Test error');
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true };
      component.retryCount = 0;
      component.handleError(error);
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('.section-error-boundary__retry-btn'));
      expect(retryButton).toBeTruthy();
    });

    it('should show retry exhausted message when max retries reached', () => {
      const error = new Error('Test error');
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, allowRetry: true, maxRetries: 3 };
      component.retryCount = 3;
      component.handleError(error);
      fixture.detectChanges();

      const exhaustedMessage = fixture.debugElement.query(
        By.css('.section-error-boundary__retry-exhausted')
      );
      expect(exhaustedMessage).toBeTruthy();
    });
  });

  describe('getSafeErrorMessage Method', () => {
    it('should return generic message when showDetails is false', () => {
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, showDetails: false };
      const error = new Error('Detailed error message');

      // Access private method through component
      const message = (component as any).getSafeErrorMessage(error);
      expect(message).toBe('An error occurred while rendering this section.');
    });

    it('should return error message when showDetails is true', () => {
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, showDetails: true };
      const error = new Error('Detailed error message');

      const message = (component as any).getSafeErrorMessage(error);
      expect(message).toBe('Detailed error message');
    });

    it('should return default message when error has no message', () => {
      component.config = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, showDetails: true };
      const error = new Error();

      const message = (component as any).getSafeErrorMessage(error);
      expect(message).toBe('Unknown error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle error without message', () => {
      const error = new Error();
      component.handleError(error);

      expect(component.errorInfo).toBeDefined();
    });

    it('should handle multiple errors sequentially', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      component.handleError(error1);
      expect(component.errorInfo?.message).toContain('Error 1');

      component.clearError();
      component.handleError(error2);
      expect(component.errorInfo?.message).toContain('Error 2');
    });
  });
});
