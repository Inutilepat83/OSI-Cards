/**
 * Web APIs Utilities
 *
 * Collection of modern Web API utilities (Battery, Vibration, Share, etc.).
 *
 * @example
 * ```typescript
 * import { getBattery, vibrate, shareContent } from '@osi-cards/utils';
 *
 * const battery = await getBattery();
 * vibrate([200, 100, 200]);
 * await shareContent('Check this out!', 'https://example.com');
 * ```
 */

/**
 * Battery API
 */
export async function getBattery(): Promise<any> {
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery();
  }
  throw new Error('Battery API not supported');
}

export async function getBatteryLevel(): Promise<number> {
  const battery = await getBattery();
  return battery.level;
}

export async function isCharging(): Promise<boolean> {
  const battery = await getBattery();
  return battery.charging;
}

export async function getBatteryTime(): Promise<{ charging: number; discharging: number }> {
  const battery = await getBattery();
  return {
    charging: battery.chargingTime,
    discharging: battery.dischargingTime,
  };
}

/**
 * Vibration API
 */
export function vibrate(pattern: number | number[]): boolean {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
}

export function cancelVibration(): boolean {
  return vibrate(0);
}

export function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Share API
 */
export async function shareContent(title: string, url: string, text?: string): Promise<void> {
  if (!('share' in navigator)) {
    throw new Error('Share API not supported');
  }

  await navigator.share({ title, url, text });
}

export async function shareFile(file: File, title: string): Promise<void> {
  if (!('share' in navigator)) {
    throw new Error('Share API not supported');
  }

  await navigator.share({
    title,
    files: [file],
  });
}

export function isShareSupported(): boolean {
  return 'share' in navigator;
}

/**
 * Wake Lock API
 */
export async function requestWakeLock(): Promise<any> {
  if ('wakeLock' in navigator) {
    return await (navigator as any).wakeLock.request('screen');
  }
  throw new Error('Wake Lock API not supported');
}

export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

/**
 * Screen Orientation API
 */
export async function lockOrientation(orientation: string): Promise<void> {
  if (screen.orientation && 'lock' in screen.orientation) {
    await (screen.orientation as any).lock(orientation);
  }
}

export async function unlockOrientation(): Promise<void> {
  if (screen.orientation && 'unlock' in screen.orientation) {
    (screen.orientation as any).unlock();
  }
}

export function getOrientation(): string | undefined {
  return screen.orientation?.type;
}

export function getOrientationAngle(): number {
  return screen.orientation?.angle || 0;
}

/**
 * Page Visibility API
 */
export function isPageVisible(): boolean {
  return !document.hidden;
}

export function onVisibilityChange(callback: (visible: boolean) => void): () => void {
  const handler = (): void => callback(!document.hidden);
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

/**
 * Ambient Light Sensor (experimental)
 */
export async function getAmbientLight(): Promise<number> {
  if ('AmbientLightSensor' in window) {
    const sensor = new (window as any).AmbientLightSensor();
    sensor.start();

    return new Promise((resolve) => {
      sensor.onreading = () => {
        resolve(sensor.illuminance);
        sensor.stop();
      };
    });
  }
  throw new Error('Ambient Light Sensor not supported');
}

/**
 * Device Memory
 */
export function getDeviceMemory(): number | undefined {
  return (navigator as any).deviceMemory;
}

/**
 * Hardware Concurrency
 */
export function getHardwareConcurrency(): number {
  return navigator.hardwareConcurrency || 1;
}

/**
 * Max Touch Points
 */
export function getMaxTouchPoints(): number {
  return navigator.maxTouchPoints || 0;
}

