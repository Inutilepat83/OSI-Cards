/**
 * Integration Utilities
 *
 * Utilities for third-party integrations and APIs.
 *
 * @example
 * ```typescript
 * import { GoogleMaps, loadScript, createAPIClient } from '@osi-cards/utils';
 *
 * await loadScript('https://maps.googleapis.com/maps/api/js');
 * const client = createAPIClient('https://api.example.com');
 * ```
 */

export interface APIClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class APIClient {
  constructor(private config: APIClientConfig) {}

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.config.headers,
    });

    return response.json();
  }

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.config.headers,
    });

    return response.json();
  }
}

export function createAPIClient(baseURL: string, config?: Partial<APIClientConfig>): APIClient {
  return new APIClient({ baseURL, ...config });
}

export async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

export function injectScript(code: string): void {
  const script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);
}

export function injectStyle(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

export function removeScript(src: string): void {
  const script = document.querySelector(`script[src="${src}"]`);
  if (script) {
    script.remove();
  }
}

export function removeStylesheet(href: string): void {
  const link = document.querySelector(`link[href="${href}"]`);
  if (link) {
    link.remove();
  }
}

