/**
 * Network Utilities
 *
 * Network detection and monitoring utilities.
 *
 * @example
 * ```typescript
 * import { isOnline, getConnectionType, onConnectionChange } from '@osi-cards/utils';
 *
 * const online = isOnline();
 * const type = getConnectionType();
 * onConnectionChange(online => console.log('Online:', online));
 * ```
 */

export interface ConnectionInfo {
  online: boolean;
  type: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

export function getConnectionType(): string {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return conn?.type || 'unknown';
}

export function getEffectiveConnectionType(): string {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return conn?.effectiveType || 'unknown';
}

export function getConnectionInfo(): ConnectionInfo {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    online: navigator.onLine,
    type: conn?.type || 'unknown',
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
  };
}

export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const onOnline = (): void => callback(true);
  const onOffline = (): void => callback(false);

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

export function onConnectionTypeChange(callback: (info: ConnectionInfo) => void): () => void {
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!conn) return () => {};

  const handler = (): void => callback(getConnectionInfo());
  conn.addEventListener('change', handler);

  return () => conn.removeEventListener('change', handler);
}

export function isFastConnection(): boolean {
  const type = getEffectiveConnectionType();
  return type === '4g' || type === 'wifi';
}

export function isSlowConnection(): boolean {
  const type = getEffectiveConnectionType();
  return type === 'slow-2g' || type === '2g' || type === '3g';
}

export function shouldUseLowQuality(): boolean {
  const conn = (navigator as any).connection;
  return conn?.saveData === true || isSlowConnection();
}

export async function ping(url: string): Promise<number> {
  const start = performance.now();

  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return performance.now() - start;
  } catch {
    return -1;
  }
}

