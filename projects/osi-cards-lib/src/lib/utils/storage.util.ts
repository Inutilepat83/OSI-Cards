/**
 * Storage Utilities
 *
 * Type-safe wrappers for localStorage, sessionStorage, and cookies
 * with automatic serialization, expiration, and error handling.
 *
 * Features:
 * - Type-safe storage
 * - Automatic JSON serialization
 * - Expiration support
 * - Storage quotas
 * - Storage events
 * - Namespacing
 *
 * @example
 * ```typescript
 * import { LocalStorage, SessionStorage } from '@osi-cards/utils';
 *
 * // Local storage
 * LocalStorage.set('user', { id: '123', name: 'Alice' });
 * const user = LocalStorage.get<User>('user');
 *
 * // With expiration
 * LocalStorage.set('token', 'abc123', { ttl: 3600000 }); // 1 hour
 *
 * // Session storage
 * SessionStorage.set('temp', data);
 * ```
 */

/**
 * Storage options
 */
export interface StorageOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;

  /**
   * Namespace for keys
   */
  namespace?: string;

  /**
   * Encrypt data (provide encryption function)
   */
  encrypt?: (data: string) => string;

  /**
   * Decrypt data (provide decryption function)
   */
  decrypt?: (data: string) => string;
}

/**
 * Storage entry with metadata
 */
interface StorageEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Storage wrapper base class
 */
class StorageWrapper {
  constructor(
    private storage: Storage,
    private defaultNamespace = ''
  ) {}

  /**
   * Set item in storage
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    try {
      const entry: StorageEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: options.ttl,
      };

      let data = JSON.stringify(entry);

      if (options.encrypt) {
        data = options.encrypt(data);
      }

      const fullKey = this.getFullKey(key, options.namespace);
      this.storage.setItem(fullKey, data);
    } catch (error) {
      console.error(`Failed to set storage item: ${key}`, error);
    }
  }

  /**
   * Get item from storage
   *
   * @param key - Storage key
   * @param options - Storage options
   * @returns Value or null if not found/expired
   */
  get<T>(key: string, options: StorageOptions = {}): T | null {
    try {
      const fullKey = this.getFullKey(key, options.namespace);
      let data = this.storage.getItem(fullKey);

      if (!data) return null;

      if (options.decrypt) {
        data = options.decrypt(data);
      }

      const entry: StorageEntry<T> = JSON.parse(data);

      // Check expiration
      if (entry.ttl) {
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
          this.remove(key, options);
          return null;
        }
      }

      return entry.value;
    } catch (error) {
      console.error(`Failed to get storage item: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove item from storage
   *
   * @param key - Storage key
   * @param options - Storage options
   */
  remove(key: string, options: StorageOptions = {}): void {
    try {
      const fullKey = this.getFullKey(key, options.namespace);
      this.storage.removeItem(fullKey);
    } catch (error) {
      console.error(`Failed to remove storage item: ${key}`, error);
    }
  }

  /**
   * Check if key exists
   *
   * @param key - Storage key
   * @param options - Storage options
   * @returns True if key exists and not expired
   */
  has(key: string, options: StorageOptions = {}): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Clear all items
   *
   * @param namespace - Optional namespace to clear
   */
  clear(namespace?: string): void {
    if (!namespace && !this.defaultNamespace) {
      this.storage.clear();
      return;
    }

    const ns = namespace || this.defaultNamespace;
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(`${ns}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  /**
   * Get all keys
   *
   * @param namespace - Optional namespace filter
   * @returns Array of keys
   */
  keys(namespace?: string): string[] {
    const keys: string[] = [];
    const ns = namespace || this.defaultNamespace;
    const prefix = ns ? `${ns}:` : '';

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        if (!prefix || key.startsWith(prefix)) {
          keys.push(prefix ? key.substring(prefix.length) : key);
        }
      }
    }

    return keys;
  }

  /**
   * Get storage size (approximate)
   *
   * @returns Size in bytes
   */
  size(): number {
    let size = 0;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        const value = this.storage.getItem(key);
        size += key.length + (value?.length || 0);
      }
    }

    return size;
  }

  /**
   * Get full key with namespace
   */
  private getFullKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultNamespace;
    return ns ? `${ns}:${key}` : key;
  }
}

/**
 * Local storage wrapper
 */
export const LocalStorage = new StorageWrapper(localStorage, 'osi-cards');

/**
 * Session storage wrapper
 */
export const SessionStorage = new StorageWrapper(sessionStorage, 'osi-cards');

/**
 * Create namespaced storage
 *
 * @param namespace - Storage namespace
 * @param type - Storage type ('local' or 'session')
 * @returns Storage wrapper
 *
 * @example
 * ```typescript
 * const userStorage = createNamespacedStorage('user-data', 'local');
 * userStorage.set('preferences', { theme: 'dark' });
 * ```
 */
export function createNamespacedStorage(
  namespace: string,
  type: 'local' | 'session' = 'local'
): StorageWrapper {
  const storage = type === 'local' ? localStorage : sessionStorage;
  return new StorageWrapper(storage, namespace);
}

/**
 * Cookie utilities
 */
export class CookieManager {
  /**
   * Set cookie
   *
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   */
  set(
    name: string,
    value: string,
    options: {
      expires?: Date | number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    } = {}
  ): void {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      const expires = options.expires instanceof Date
        ? options.expires
        : new Date(Date.now() + options.expires);
      cookie += `; expires=${expires.toUTCString()}`;
    }

    if (options.path) {
      cookie += `; path=${options.path}`;
    }

    if (options.domain) {
      cookie += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookie += '; secure';
    }

    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookie;
  }

  /**
   * Get cookie
   *
   * @param name - Cookie name
   * @returns Cookie value or null
   */
  get(name: string): string | null {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (decodeURIComponent(cookieName) === name) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  /**
   * Remove cookie
   *
   * @param name - Cookie name
   * @param options - Cookie options (path, domain)
   */
  remove(
    name: string,
    options: { path?: string; domain?: string } = {}
  ): void {
    this.set(name, '', {
      ...options,
      expires: new Date(0),
    });
  }

  /**
   * Check if cookie exists
   *
   * @param name - Cookie name
   * @returns True if cookie exists
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies
   *
   * @returns Object with all cookies
   */
  getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};

    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value || '');
      }
    });

    return cookies;
  }
}

/**
 * Global cookie manager instance
 */
export const Cookies = new CookieManager();

/**
 * Check if storage is available
 *
 * @param type - Storage type
 * @returns True if storage is available
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage quota info
 *
 * @returns Storage quota information
 */
export async function getStorageQuota(): Promise<{
  quota: number;
  usage: number;
  available: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;

    return {
      quota,
      usage,
      available: quota - usage,
      percentage: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }

  return {
    quota: 0,
    usage: 0,
    available: 0,
    percentage: 0,
  };
}

/**
 * Watch storage changes
 *
 * @param key - Key to watch
 * @param callback - Callback when key changes
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = watchStorage('theme', (newValue, oldValue) => {
 *   console.log('Theme changed:', newValue);
 * });
 * ```
 */
export function watchStorage(
  key: string,
  callback: (newValue: string | null, oldValue: string | null) => void
): () => void {
  const handler = (event: StorageEvent): void => {
    if (event.key === key) {
      callback(event.newValue, event.oldValue);
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}

