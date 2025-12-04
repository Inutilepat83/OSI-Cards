/**
 * History Utilities
 *
 * Browser history manipulation utilities.
 *
 * @example
 * ```typescript
 * import { pushState, replaceState, goBack } from '@osi-cards/utils';
 *
 * pushState({ page: 2 }, '/users?page=2');
 * replaceState({ page: 3 }, '/users?page=3');
 * ```
 */

export function pushState(state: any, url: string, title = ''): void {
  history.pushState(state, title, url);
}

export function replaceState(state: any, url: string, title = ''): void {
  history.replaceState(state, title, url);
}

export function goBack(): void {
  history.back();
}

export function goForward(): void {
  history.forward();
}

export function go(delta: number): void {
  history.go(delta);
}

export function getState(): any {
  return history.state;
}

export function getLength(): number {
  return history.length;
}

export function onPopState(callback: (event: PopStateEvent) => void): () => void {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

export function getCurrentPath(): string {
  return window.location.pathname;
}

export function getCurrentURL(): string {
  return window.location.href;
}

export function getQueryParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
