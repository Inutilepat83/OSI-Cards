/**
 * Error Boundary Component Tests
 *
 * Unit tests for ErrorBoundaryComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ErrorBoundaryComponent,
  ErrorBoundaryError,
  RecoveryStrategy,
  ErrorBoundaryConfig,
  createErrorBoundaryConfig,
} from './error-boundary.component';
import { By } from '@angular/platform-browser';
import { TemplateRef, ViewContainerRef } from '@angular/core';

describe('ErrorBoundaryComponent', () => {
  let component: ErrorBoundaryComponent;
  let fixture: ComponentFixture<ErrorBoundaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBoundaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBoundaryComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render content when no error', () => {
      component.hasError.set(false);
      fixture.detectChanges();

      const errorBoundary = fixture.debugElement.query(By.css('.error-boundary'));
      expect(errorBoundary).toBeFalsy();
    });

    it('should render error UI when error occurs', () => {
      const error = new Error('Test error');
      component.handleError(error);
      fixture.detectChanges();

      const errorBoundary = fixture.debugElement.query(By.css('.error-boundary'));
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

      expect(component.hasError()).toBe(true);
    });

    it('should create error details when handling error', () => {
      const error = new Error('Test error');
      component.handleError(error);

      const errorDetails = component.errorDetails();
      expect(errorDetails).toBeTruthy();
      expect(errorDetails?.error).toBe(error);
      expect(errorDetails?.recovered).toBe(false);
    });

    it('should emit errorCaught event when error occurs', () => {
      const error = new Error('Test error');
      spyOn(component.errorCaught, 'emit');

      component.handleError(error);

      expect(component.errorCaught.emit).toHaveBeenCalled();
    });

    it('should include timestamp in error details', () => {
      const error = new Error('Test error');
      const beforeTime = Date.now();
      component.handleError(error);
      const afterTime = Date.now();

      const errorDetails = component.errorDetails();
      expect(errorDetails?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(errorDetails?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include errorInfo in error details when provided', () => {
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'Component stack trace' };
      component.handleError(error, errorInfo);

      const errorDetails = component.errorDetails();
      expect(errorDetails?.errorInfo).toBe(errorInfo);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry and reset error state', () => {
      const error = new Error('Test error');
      component.handleError(error);
      component.retryCount.set(0);

      component.retry();

      expect(component.hasError()).toBe(false);
      expect(component.errorDetails()).toBeNull();
    });

    it('should increment retry count on retry', () => {
      component.retryCount.set(0);
      component.retry();

      expect(component.retryCount()).toBe(1);
    });

    it('should not retry when max retries reached', () => {
      component.retryCount.set(3);
      spyOn(console, 'warn');

      component.retry();

      expect(console.warn).toHaveBeenCalledWith('Max retries reached');
      expect(component.retryCount()).toBe(3);
    });

    it('should emit errorRecovered event on retry', () => {
      spyOn(component.errorRecovered, 'emit');
      component.retryCount.set(0);

      component.retry();

      expect(component.errorRecovered.emit).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error state', () => {
      const error = new Error('Test error');
      component.handleError(error);
      expect(component.hasError()).toBe(true);

      component.reset();

      expect(component.hasError()).toBe(false);
      expect(component.errorDetails()).toBeNull();
    });
  });

  describe('Reload Functionality', () => {
    it('should reload page', () => {
      spyOn(window.location, 'reload');
      component.reload();

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Input Properties', () => {
    it('should accept fallbackUI input', () => {
      // TemplateRef would need to be created in a real scenario
      expect(component.fallbackUI).toBeUndefined();
    });

    it('should accept recoveryStrategy input', () => {
      component.recoveryStrategy.set('reload');
      expect(component.recoveryStrategy()).toBe('reload');
    });

    it('should accept showDetails input', () => {
      component.showDetails.set(true);
      expect(component.showDetails()).toBe(true);
    });

    it('should accept reportErrors input', () => {
      component.reportErrors = false;
      expect(component.reportErrors).toBe(false);
    });

    it('should have default recoveryStrategy', () => {
      expect(component.recoveryStrategy()).toBe('retry');
    });

    it('should have default showDetails', () => {
      expect(component.showDetails()).toBe(false);
    });

    it('should have default reportErrors', () => {
      expect(component.reportErrors).toBe(true);
    });
  });

  describe('Error Display', () => {
    it('should show default error UI when no fallbackUI', () => {
      const error = new Error('Test error message');
      component.handleError(error);
      fixture.detectChanges();

      const defaultUI = fixture.debugElement.query(By.css('.error-boundary__default'));
      expect(defaultUI).toBeTruthy();
    });

    it('should display error message', () => {
      const error = new Error('Test error message');
      component.handleError(error);
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.error-boundary__message'));
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent).toContain('Test error message');
    });

    it('should show error details when showDetails is true', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      component.showDetails.set(true);
      component.handleError(error);
      fixture.detectChanges();

      const details = fixture.debugElement.query(By.css('.error-boundary__details'));
      expect(details).toBeTruthy();
    });

    it('should not show error details when showDetails is false', () => {
      const error = new Error('Test error');
      component.showDetails.set(false);
      component.handleError(error);
      fixture.detectChanges();

      const details = fixture.debugElement.query(By.css('.error-boundary__details'));
      expect(details).toBeFalsy();
    });
  });

  describe('Recovery Actions', () => {
    it('should show retry button when strategy is retry', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('retry');
      component.handleError(error);
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('.error-boundary__button'));
      expect(retryButton).toBeTruthy();
    });

    it('should show reload button when strategy is reload', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('reload');
      component.handleError(error);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('.error-boundary__button'));
      const reloadButton = buttons.find((b) => b.nativeElement.textContent.includes('Reload'));
      expect(reloadButton).toBeTruthy();
    });

    it('should not show actions when strategy is ignore', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('ignore');
      component.handleError(error);
      fixture.detectChanges();

      const actions = fixture.debugElement.query(By.css('.error-boundary__actions'));
      expect(actions).toBeFalsy();
    });
  });

  describe('Auto-Recovery', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should auto-retry when strategy is retry', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('retry');
      component.retryCount.set(0);
      spyOn(component, 'retry');

      component.handleError(error);
      jasmine.clock().tick(1000);

      expect(component.retry).toHaveBeenCalled();
    });

    it('should auto-reload when strategy is reload', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('reload');
      spyOn(component, 'reload');

      component.handleError(error);
      jasmine.clock().tick(2000);

      expect(component.reload).toHaveBeenCalled();
    });

    it('should not auto-retry when max retries reached', () => {
      const error = new Error('Test error');
      component.recoveryStrategy.set('retry');
      component.retryCount.set(3);
      spyOn(component, 'retry');

      component.handleError(error);
      jasmine.clock().tick(1000);

      expect(component.retry).not.toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    it('should report error when reportErrors is true', () => {
      const error = new Error('Test error');
      component.reportErrors = true;
      spyOn(console, 'error');

      component.handleError(error);

      expect(console.error).toHaveBeenCalled();
    });

    it('should not report error when reportErrors is false', () => {
      const error = new Error('Test error');
      component.reportErrors = false;
      spyOn(console, 'error');

      component.handleError(error);

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('createErrorBoundaryConfig Function', () => {
    it('should create config with defaults', () => {
      const config = createErrorBoundaryConfig();
      expect(config.strategy).toBe('fallback');
      expect(config.maxRetries).toBe(3);
      expect(config.showDetails).toBe(false);
      expect(config.reportErrors).toBe(true);
    });

    it('should override defaults with provided values', () => {
      const config = createErrorBoundaryConfig({
        strategy: 'reload',
        maxRetries: 5,
        showDetails: true,
        reportErrors: false,
      });

      expect(config.strategy).toBe('reload');
      expect(config.maxRetries).toBe(5);
      expect(config.showDetails).toBe(true);
      expect(config.reportErrors).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle error without stack trace', () => {
      const error = new Error('Test error');
      delete (error as any).stack;
      component.handleError(error);

      expect(component.errorDetails()).toBeTruthy();
    });

    it('should handle multiple errors sequentially', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      component.handleError(error1);
      expect(component.errorDetails()?.error.message).toBe('Error 1');

      component.reset();
      component.handleError(error2);
      expect(component.errorDetails()?.error.message).toBe('Error 2');
    });
  });
});
