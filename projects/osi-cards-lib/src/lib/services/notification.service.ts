/**
 * Notification Service
 *
 * Provides a centralized notification system for displaying
 * toasts, alerts, and notifications to users.
 *
 * Features:
 * - Multiple notification types
 * - Auto-dismiss with timeout
 * - Action buttons
 * - Stacking/queuing
 * - Position control
 * - Observable notifications
 *
 * @example
 * ```typescript
 * import { NotificationService } from '@osi-cards/lib';
 *
 * const notify = inject(NotificationService);
 *
 * notify.success('Data saved successfully!');
 * notify.error('Failed to load data');
 * notify.info('Check your email for confirmation');
 *
 * // With actions
 * notify.show({
 *   message: 'File uploaded',
 *   type: 'success',
 *   actions: [{ label: 'View', callback: () => openFile() }]
 * });
 * ```
 */

import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification position
 */
export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  callback: () => void;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /**
   * Notification message
   */
  message: string;

  /**
   * Notification type
   */
  type: NotificationType;

  /**
   * Auto-dismiss timeout in milliseconds (0 = no auto-dismiss)
   */
  timeout?: number;

  /**
   * Position on screen
   */
  position?: NotificationPosition;

  /**
   * Actions/buttons
   */
  actions?: NotificationAction[];

  /**
   * Icon (class name or emoji)
   */
  icon?: string;

  /**
   * Whether notification can be dismissed
   */
  dismissible?: boolean;
}

/**
 * Notification instance
 */
export interface Notification extends NotificationConfig {
  id: string;
  createdAt: number;
  dismissed: boolean;
}

/**
 * Notification Service
 *
 * Manages application-wide notifications.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private idCounter = 0;
  private notifications = signal<Notification[]>([]);
  private notificationSubject = new Subject<Notification>();

  /**
   * Observable of notifications
   */
  readonly notifications$ = this.notificationSubject.asObservable();

  /**
   * Current notifications signal
   */
  readonly current = this.notifications.asReadonly();

  /**
   * Default timeout
   */
  private defaultTimeout = 5000;

  /**
   * Default position
   */
  private defaultPosition: NotificationPosition = 'top-right';

  /**
   * Show notification
   *
   * @param config - Notification configuration
   * @returns Notification instance
   */
  show(config: NotificationConfig): Notification {
    const notification: Notification = {
      ...config,
      id: this.generateId(),
      createdAt: Date.now(),
      dismissed: false,
      timeout: config.timeout ?? this.defaultTimeout,
      position: config.position || this.defaultPosition,
      dismissible: config.dismissible ?? true,
    };

    this.notifications.update(notifications => [...notifications, notification]);
    this.notificationSubject.next(notification);

    // Auto-dismiss
    if (notification.timeout && notification.timeout > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.timeout);
    }

    return notification;
  }

  /**
   * Show success notification
   *
   * @param message - Message to display
   * @param options - Additional options
   * @returns Notification instance
   */
  success(message: string, options: Partial<NotificationConfig> = {}): Notification {
    return this.show({
      ...options,
      message,
      type: 'success',
      icon: options.icon || '✓',
    });
  }

  /**
   * Show error notification
   *
   * @param message - Error message
   * @param options - Additional options
   * @returns Notification instance
   */
  error(message: string, options: Partial<NotificationConfig> = {}): Notification {
    return this.show({
      ...options,
      message,
      type: 'error',
      icon: options.icon || '✗',
      timeout: options.timeout ?? 0, // Errors don't auto-dismiss by default
    });
  }

  /**
   * Show warning notification
   *
   * @param message - Warning message
   * @param options - Additional options
   * @returns Notification instance
   */
  warning(message: string, options: Partial<NotificationConfig> = {}): Notification {
    return this.show({
      ...options,
      message,
      type: 'warning',
      icon: options.icon || '⚠',
    });
  }

  /**
   * Show info notification
   *
   * @param message - Info message
   * @param options - Additional options
   * @returns Notification instance
   */
  info(message: string, options: Partial<NotificationConfig> = {}): Notification {
    return this.show({
      ...options,
      message,
      type: 'info',
      icon: options.icon || 'ℹ',
    });
  }

  /**
   * Dismiss notification
   *
   * @param id - Notification ID
   * @returns True if notification was found and dismissed
   */
  dismiss(id: string): boolean {
    const notifications = this.notifications();
    const index = notifications.findIndex(n => n.id === id);

    if (index === -1) {
      return false;
    }

    notifications[index].dismissed = true;

    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );

    return true;
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notifications.set([]);
  }

  /**
   * Update notification
   *
   * @param id - Notification ID
   * @param updates - Properties to update
   */
  update(id: string, updates: Partial<NotificationConfig>): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === id ? { ...n, ...updates } : n
      )
    );
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}

