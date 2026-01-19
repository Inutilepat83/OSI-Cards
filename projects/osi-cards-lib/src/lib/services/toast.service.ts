/**
 * Toast Service
 *
 * Toast notification service with positioning and animations.
 *
 * @dependencies
 * - None (uses Angular signals for state management)
 *
 * @example
 * ```typescript
 * const toast = inject(ToastService);
 *
 * toast.success('Saved successfully!');
 * toast.error('Operation failed');
 * toast.info('FYI', { duration: 5000 });
 * ```
 */

import { Injectable, signal } from '@angular/core';

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  dismissible?: boolean;
}

export interface Toast extends ToastConfig {
  id: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  readonly currentToasts = this.toasts.asReadonly();

  success(message: string, options?: Partial<ToastConfig>): string {
    return this.show({ message, type: 'success', ...options });
  }

  error(message: string, options?: Partial<ToastConfig>): string {
    return this.show({ message, type: 'error', duration: 0, ...options });
  }

  warning(message: string, options?: Partial<ToastConfig>): string {
    return this.show({ message, type: 'warning', ...options });
  }

  info(message: string, options?: Partial<ToastConfig>): string {
    return this.show({ message, type: 'info', ...options });
  }

  show(config: ToastConfig): string {
    const toast: Toast = {
      id: this.generateId(),
      message: config.message,
      type: config.type,
      duration: config.duration ?? 3000,
      position: config.position ?? 'top-right',
      dismissible: config.dismissible ?? true,
      timestamp: new Date(),
    };

    this.toasts.update((toasts) => [...toasts, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    }

    return toast.id;
  }

  dismiss(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this.toasts.set([]);
  }

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
