import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AppConfigService } from '../../core/services/app-config.service';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timestamp: number;
}

/**
 * Toast notification service
 *
 * Provides user-visible toast notifications for application feedback. Replaces
 * console logs with accessible, dismissible toast messages that inform users
 * of application state changes, errors, and success messages.
 *
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Observable stream for reactive UI updates
 * - Unique ID tracking for individual toast management
 * - Configurable duration from app config
 *
 * @example
 * ```typescript
 * const toastService = inject(ToastService);
 *
 * // Show success toast
 * toastService.success('Card saved successfully');
 *
 * // Show error toast with custom duration
 * toastService.error('Failed to load card', 5000);
 *
 * // Subscribe to toast stream
 * toastService.toasts$.subscribe(toasts => {
 *   console.log('Active toasts:', toasts);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly config = inject(AppConfigService);
  private readonly toastsSubject = new Subject<Toast[]>();
  private toasts: Toast[] = [];

  readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  /**
   * Show a success toast
   */
  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: ToastType, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration: duration ?? this.config.UI.TOAST_DURATION_MS,
      timestamp: Date.now(),
    };

    this.toasts.push(toast);
    this.emit();

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, toast.duration);
  }

  /**
   * Remove a toast
   */
  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts = [];
    this.emit();
  }

  /**
   * Get current toasts
   */
  getToasts(): Toast[] {
    return [...this.toasts];
  }

  /**
   * Emit current toasts
   */
  private emit(): void {
    this.toastsSubject.next([...this.toasts]);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
