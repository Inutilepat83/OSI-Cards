import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
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
 * Replaces console logs with user-visible toast notifications
 */
@Injectable({
  providedIn: 'root'
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
      timestamp: Date.now()
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
    this.toasts = this.toasts.filter(t => t.id !== id);
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


