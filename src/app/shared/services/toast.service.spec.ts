import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ToastService } from 'osi-cards-lib';
import { AppConfigService } from '../../core/services/app-config.service';

describe('ToastService', () => {
  let service: ToastService;
  let appConfig: jasmine.SpyObj<AppConfigService>;
  let toasts: any[];

  beforeEach(() => {
    const appConfigSpy = jasmine.createSpyObj('AppConfigService', [], {
      UI: {
        TOAST_DURATION_MS: 3000,
      },
    });

    TestBed.configureTestingModule({
      providers: [ToastService, { provide: AppConfigService, useValue: appConfigSpy }],
    });

    service = TestBed.inject(ToastService);
    appConfig = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;

    // Track toasts via signal
    toasts = service.currentToasts();
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
      service.success('Message', { duration: 5000 });
      toasts = service.currentToasts();
      expect(toasts[0].duration).toBe(5000);
    });

    it('should generate unique IDs for toasts', () => {
      service.success('Message 1');
      service.success('Message 2');
      toasts = service.currentToasts();

      expect(toasts.length).toBe(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('should include timestamp in toast', () => {
      const beforeTime = Date.now();
      service.success('Message');
      toasts = service.currentToasts();
      const afterTime = Date.now();

      expect(toasts[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(toasts[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Toast removal', () => {
    it('should remove toast by ID', () => {
      service.success('Message 1');
      service.success('Message 2');

      const toastId = toasts[0].id;
      service.dismiss(toastId);
      toasts = service.currentToasts();

      expect(toasts.length).toBe(1);
      expect(toasts[0].id).not.toBe(toastId);
    });

    it('should clear all toasts', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');

      expect(toasts.length).toBe(3);

      service.dismissAll();
      toasts = service.currentToasts();
      expect(toasts.length).toBe(0);
    });

    it('should auto-remove toast after duration', fakeAsync(() => {
      service.success('Message', { duration: 1000 });
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);

      tick(1000);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(0);
    }));

    it('should not remove toast before duration expires', fakeAsync(() => {
      service.success('Message', { duration: 2000 });
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);

      tick(1000);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);

      tick(1000);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(0);
    }));
  });

  describe('Signal updates', () => {
    it('should update signal when toast is added', () => {
      const initialLength = service.currentToasts().length;
      service.success('Message');
      const newLength = service.currentToasts().length;
      expect(newLength).toBe(initialLength + 1);
    });

    it('should update signal when toast is dismissed', () => {
      const id = service.success('Message');
      const initialLength = service.currentToasts().length;
      service.dismiss(id);
      const newLength = service.currentToasts().length;
      expect(newLength).toBe(initialLength - 1);
    });
  });

  describe('Multiple toasts', () => {
    it('should handle multiple toasts simultaneously', () => {
      service.success('Success');
      service.error('Error');
      service.warning('Warning');
      service.info('Info');
      toasts = service.currentToasts();

      expect(toasts.length).toBe(4);
      expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'warning', 'info']);
    });

    it('should remove toasts independently', fakeAsync(() => {
      service.success('Message 1', { duration: 1000 });
      service.error('Message 2', { duration: 2000 });
      toasts = service.currentToasts();
      expect(toasts.length).toBe(2);

      tick(1000);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('error');

      tick(1000);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(0);
    }));
  });

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      service.success('');
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);
      toasts = service.currentToasts();
      expect(toasts[0].message).toBe(longMessage);
    });

    it('should handle zero duration', fakeAsync(() => {
      service.success('Message', { duration: 0 });
      toasts = service.currentToasts();
      expect(toasts.length).toBe(1);

      tick(0);
      toasts = service.currentToasts();
      expect(toasts.length).toBe(0);
    }));

    it('should handle removing non-existent toast ID', () => {
      service.success('Message');
      toasts = service.currentToasts();
      const initialLength = toasts.length;

      service.dismiss('non-existent-id');
      toasts = service.currentToasts();
      expect(toasts.length).toBe(initialLength);
    });
  });
});

