import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Notification, NotificationAction } from '../interfaces/app.interfaces';
import { LoggerService } from './enhanced-logging.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private nextId = 1;
  private readonly logger = this.loggerService.createChildLogger('Notifications');
  private readonly maxNotifications = 10;
  private readonly defaultDuration = 5000; // 5 seconds

  constructor(private loggerService: LoggerService) {}

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  success(title: string, message?: string, options?: NotificationOptions): string {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration: options?.duration || this.defaultDuration,
      dismissible: options?.dismissible ?? true,
      actions: options?.actions || [],
    });
  }

  error(title: string, message?: string, options?: NotificationOptions): string {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: options?.duration || 0, // Errors persist until dismissed
      dismissible: options?.dismissible ?? true,
      actions: options?.actions || [],
    });
  }

  warning(title: string, message?: string, options?: NotificationOptions): string {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration: options?.duration || this.defaultDuration * 2, // Warnings last longer
      dismissible: options?.dismissible ?? true,
      actions: options?.actions || [],
    });
  }

  info(title: string, message?: string, options?: NotificationOptions): string {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration: options?.duration || this.defaultDuration,
      dismissible: options?.dismissible ?? true,
      actions: options?.actions || [],
    });
  }

  dismiss(id: string): boolean {
    const current = this.notifications$.value;
    const filtered = current.filter(n => n.id !== id);

    if (filtered.length !== current.length) {
      this.notifications$.next(filtered);
      this.logger.debug(`Notification dismissed: ${id}`);
      return true;
    }

    return false;
  }

  dismissAll(): void {
    this.notifications$.next([]);
    this.logger.debug('All notifications dismissed');
  }

  update(id: string, updates: Partial<Notification>): boolean {
    const current = this.notifications$.value;
    const index = current.findIndex(n => n.id === id);

    if (index === -1) return false;

    const updated = [...current];
    updated[index] = { ...updated[index], ...updates };

    this.notifications$.next(updated);
    this.logger.debug(`Notification updated: ${id}`);
    return true;
  }

  clear(): void {
    this.notifications$.next([]);
    this.logger.info('All notifications cleared');
  }

  getNotificationById(id: string): Notification | undefined {
    return this.notifications$.value.find(n => n.id === id);
  }

  // Convenience methods for common scenarios
  saveSuccess(entity: string = 'Item'): string {
    return this.success('Saved Successfully', `${entity} has been saved successfully.`);
  }

  saveError(entity: string = 'Item', error?: any): string {
    this.logger.error(`Failed to save ${entity}`, error);
    return this.error('Save Failed', `Failed to save ${entity}. Please try again.`);
  }

  deleteSuccess(entity: string = 'Item'): string {
    return this.success('Deleted Successfully', `${entity} has been deleted successfully.`);
  }

  deleteError(entity: string = 'Item', error?: any): string {
    this.logger.error(`Failed to delete ${entity}`, error);
    return this.error('Delete Failed', `Failed to delete ${entity}. Please try again.`);
  }

  networkError(): string {
    return this.error('Network Error', 'Please check your internet connection and try again.', {
      actions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary',
        },
      ],
    });
  }

  unauthorized(): string {
    return this.warning('Session Expired', 'Your session has expired. Please log in again.', {
      actions: [
        {
          label: 'Log In',
          action: () => {
            // Navigate to login - this would be handled by the consuming component
            this.logger.info('User prompted to log in');
          },
          style: 'primary',
        },
      ],
    });
  }

  permissionDenied(resource: string = 'resource'): string {
    return this.warning(
      'Permission Denied',
      `You don't have permission to access this ${resource}.`
    );
  }

  private addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };

    const current = this.notifications$.value;

    // Enforce maximum notifications limit
    let updated = [fullNotification, ...current];
    if (updated.length > this.maxNotifications) {
      updated = updated.slice(0, this.maxNotifications);
      this.logger.debug(`Notification limit reached, oldest notifications removed`);
    }

    this.notifications$.next(updated);
    this.logger.debug(`Notification added: ${id} - ${notification.title}`);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      timer(notification.duration)
        .pipe(takeUntil(this.notifications$.pipe()))
        .subscribe(() => {
          this.dismiss(id);
        });
    }

    return id;
  }

  private generateId(): string {
    return `notification_${this.nextId++}_${Date.now()}`;
  }
}

export interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
  actions?: NotificationAction[];
}

// Toast notification service for simple notifications
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private notificationService: NotificationService) {}

  showSuccess(message: string): void {
    this.notificationService.success('Success', message, { duration: 3000 });
  }

  showError(message: string): void {
    this.notificationService.error('Error', message);
  }

  showWarning(message: string): void {
    this.notificationService.warning('Warning', message, { duration: 4000 });
  }

  showInfo(message: string): void {
    this.notificationService.info('Info', message, { duration: 3000 });
  }
}

// Progress notification service for long-running operations
@Injectable({
  providedIn: 'root',
})
export class ProgressNotificationService {
  private progressNotifications = new Map<string, string>();

  constructor(private notificationService: NotificationService) {}

  startProgress(title: string, message?: string): string {
    const id = this.notificationService.info(title, message, {
      duration: 0, // Don't auto-dismiss
      dismissible: false,
    });

    this.progressNotifications.set(title, id);
    return id;
  }

  updateProgress(title: string, progress: number, message?: string): void {
    const id = this.progressNotifications.get(title);
    if (!id) return;

    const progressMessage = message || `${Math.round(progress)}% complete`;
    this.notificationService.update(id, {
      message: progressMessage,
    });
  }

  completeProgress(title: string, successMessage?: string): void {
    const id = this.progressNotifications.get(title);
    if (!id) return;

    this.notificationService.dismiss(id);
    this.progressNotifications.delete(title);

    if (successMessage) {
      this.notificationService.success('Complete', successMessage, { duration: 3000 });
    }
  }

  failProgress(title: string, errorMessage?: string): void {
    const id = this.progressNotifications.get(title);
    if (!id) return;

    this.notificationService.dismiss(id);
    this.progressNotifications.delete(title);

    this.notificationService.error('Failed', errorMessage || `${title} failed`);
  }
}
