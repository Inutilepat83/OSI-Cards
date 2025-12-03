/**
 * Browser Utilities
 *
 * Utilities for browser detection and feature support.
 *
 * @example
 * ```typescript
 * import { getBrowser, isFeatureSupported, getDeviceInfo } from '@osi-cards/utils';
 *
 * const browser = getBrowser();
 * const hasGeolocation = isFeatureSupported('geolocation');
 * const device = getDeviceInfo();
 * ```
 */

export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
}

export function getBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.indexOf('Chrome') > -1) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.indexOf('Safari') > -1) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || '';
  }

  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'MacOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  return { name, version, os };
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTablet(): boolean {
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
}

export function isDesktop(): boolean {
  return !isMobile() && !isTablet();
}

export function hasTouch(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    hasTouch: hasTouch(),
    devicePixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

export function isFeatureSupported(feature: string): boolean {
  switch (feature) {
    case 'geolocation':
      return 'geolocation' in navigator;
    case 'localStorage':
      try {
        return 'localStorage' in window && window.localStorage !== null;
      } catch {
        return false;
      }
    case 'sessionStorage':
      try {
        return 'sessionStorage' in window && window.sessionStorage !== null;
      } catch {
        return false;
      }
    case 'webWorker':
      return typeof Worker !== 'undefined';
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'webSocket':
      return 'WebSocket' in window;
    case 'webRTC':
      return 'RTCPeerConnection' in window;
    case 'webGL':
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    case 'notifications':
      return 'Notification' in window;
    case 'vibration':
      return 'vibrate' in navigator;
    case 'battery':
      return 'getBattery' in navigator;
    case 'clipboard':
      return 'clipboard' in navigator;
    case 'share':
      return 'share' in navigator;
    default:
      return false;
  }
}

export function getScreenOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function getLanguage(): string {
  return navigator.language;
}

export function getLanguages(): readonly string[] {
  return navigator.languages;
}

export function getCookiesEnabled(): boolean {
  return navigator.cookieEnabled;
}

export function getDoNotTrack(): string | null {
  return navigator.doNotTrack || (navigator as any).msDoNotTrack || (window as any).doNotTrack;
}

export function getConnectionInfo(): any {
  return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
}

export function getBatteryInfo(): Promise<any> {
  return (navigator as any).getBattery?.() || Promise.reject('Battery API not supported');
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

export function getDocumentSize(): { width: number; height: number } {
  return {
    width: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.body.clientWidth,
      document.documentElement.clientWidth
    ),
    height: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    ),
  };
}

