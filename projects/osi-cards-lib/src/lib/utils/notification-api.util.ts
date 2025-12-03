/**
 * Notification API Utilities
 *
 * Browser notification utilities.
 *
 * @example
 * ```typescript
 * import { requestPermission, showNotification } from '@osi-cards/utils';
 *
 * await requestPermission();
 * showNotification('Hello!', { body: 'New message' });
 * ```
 */

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  return await Notification.requestPermission();
}

export function hasPermission(): boolean {
  return Notification.permission === 'granted';
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!hasPermission()) {
    console.warn('Notification permission not granted');
    return null;
  }

  return new Notification(title, options);
}

export function isSupported(): boolean {
  return 'Notification' in window;
}

export function getPermissionStatus(): NotificationPermission {
  return Notification.permission;
}

export function onNotificationClick(notification: Notification, callback: () => void): void {
  notification.onclick = callback;
}

export function onNotificationClose(notification: Notification, callback: () => void): void {
  notification.onclose = callback;
}

