import { TestBed } from '@angular/core/testing';
import { ToastService, ToastType } from './toast.service';
import { AppConfigService } from '../../core/services/app-config.service';
import { fakeAsync, tick } from '@angular/core/testing';

describe('ToastService', () => {
  let service: ToastService;
  let appConfig: jasmine.SpyObj<AppConfigService>;
  let toasts: any[];

  beforeEach(() => {
    const appConfigSpy = jasmine.createSpyObj('AppConfigService', [], {
      UI: {
        TOAST_DURATION_MS: 3000
      }
    });

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: AppConfigService, useValue: appConfigSpy }
      ]
    });

    service = TestBed.inject(ToastService);
    appConfig = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;

    // Subscribe to toasts to track changes
    service.toasts$.subscribe(t => {
      toasts = t;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Toast creation', () => {
    it('should create success toast', () => {
      service.success('Success message');
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Success message');
      expect(toasts[0].type).toBe('success');
    });

    it('should create error toast', () => {
      service.error('Error message');
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('error');
    });

    it('should create warning toast', () => {
      service.warning('Warning message');
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('warning');
    });

    it('should create info toast', () => {
      service.info('Info message');
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('info');
    });

    it('should use default duration from config', () => {
      service.success('Message');
      expect(toasts[0].duration).toBe(3000);
    });

    it('should use custom duration when provided', () => {
      service.success('Message', 5000);
      expect(toasts[0].duration).toBe(5000);
    });

    it('should generate unique IDs for toasts', () => {
      service.success('Message 1');
      service.success('Message 2');
      
      expect(toasts.length).toBe(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('should include timestamp in toast', () => {
      const beforeTime = Date.now();
      service.success('Message');
      const afterTime = Date.now();

      expect(toasts[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(toasts[0].timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Toast removal', () => {
    it('should remove toast by ID', () => {
      service.success('Message 1');
      service.success('Message 2');
      
      const toastId = toasts[0].id;
      service.remove(toastId);
      
      expect(toasts.length).toBe(1);
      expect(toasts[0].id).not.toBe(toastId);
    });

    it('should clear all toasts', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');
      
      expect(toasts.length).toBe(3);
      
      service.clear();
      expect(toasts.length).toBe(0);
    });

    it('should auto-remove toast after duration', fakeAsync(() => {
      service.success('Message', 1000);
      expect(toasts.length).toBe(1);
      
      tick(1000);
      expect(toasts.length).toBe(0);
    }));

    it('should not remove toast before duration expires', fakeAsync(() => {
      service.success('Message', 2000);
      expect(toasts.length).toBe(1);
      
      tick(1000);
      expect(toasts.length).toBe(1);
      
      tick(1000);
      expect(toasts.length).toBe(0);
    }));
  });

  describe('Observable stream', () => {
    it('should emit toasts array on changes', (done) => {
      let emissionCount = 0;
      service.toasts$.subscribe(toastArray => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(toastArray.length).toBe(0);
        } else if (emissionCount === 2) {
          expect(toastArray.length).toBe(1);
          done();
        }
      });

      service.success('Message');
    });

    it('should emit updated array when toast is removed', (done) => {
      service.success('Message');
      
      let emissionCount = 0;
      service.toasts$.subscribe(toastArray => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(toastArray.length).toBe(1);
        } else if (emissionCount === 3) {
          expect(toastArray.length).toBe(0);
          done();
        }
      });

      service.remove(toasts[0].id);
    });
  });

  describe('getToasts', () => {
    it('should return current toasts array', () => {
      service.success('Message 1');
      service.error('Message 2');
      
      const currentToasts = service.getToasts();
      expect(currentToasts.length).toBe(2);
      expect(currentToasts).toEqual(toasts);
    });

    it('should return a copy of toasts array', () => {
      service.success('Message');
      const toasts1 = service.getToasts();
      const toasts2 = service.getToasts();
      
      expect(toasts1).not.toBe(toasts2); // Different array references
      expect(toasts1).toEqual(toasts2); // Same content
    });
  });

  describe('Multiple toasts', () => {
    it('should handle multiple toasts simultaneously', () => {
      service.success('Success');
      service.error('Error');
      service.warning('Warning');
      service.info('Info');
      
      expect(toasts.length).toBe(4);
      expect(toasts.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info']);
    });

    it('should remove toasts independently', fakeAsync(() => {
      service.success('Message 1', 1000);
      service.error('Message 2', 2000);
      
      expect(toasts.length).toBe(2);
      
      tick(1000);
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('error');
      
      tick(1000);
      expect(toasts.length).toBe(0);
    }));
  });

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      service.success('');
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);
      expect(toasts[0].message).toBe(longMessage);
    });

    it('should handle zero duration', fakeAsync(() => {
      service.success('Message', 0);
      expect(toasts.length).toBe(1);
      
      tick(0);
      expect(toasts.length).toBe(0);
    }));

    it('should handle removing non-existent toast ID', () => {
      service.success('Message');
      const initialLength = toasts.length;
      
      service.remove('non-existent-id');
      expect(toasts.length).toBe(initialLength);
    });
  });
});








