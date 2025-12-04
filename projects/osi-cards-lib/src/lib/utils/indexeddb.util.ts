/**
 * IndexedDB Utilities
 *
 * Simplified wrapper for IndexedDB operations with promises.
 *
 * @example
 * ```typescript
 * import { IndexedDBStore } from '@osi-cards/utils';
 *
 * const store = new IndexedDBStore('myApp', 'users');
 * await store.set('user-1', { name: 'John', age: 30 });
 * const user = await store.get('user-1');
 * await store.delete('user-1');
 * ```
 */

export class IndexedDBStore<T = any> {
  private dbPromise: Promise<IDBDatabase>;

  constructor(
    private dbName: string,
    private storeName: string,
    private version = 1
  ) {
    this.dbPromise = this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: IDBValidKey): Promise<T | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: IDBValidKey, value: T): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: IDBValidKey): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<IDBValidKey[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async values(): Promise<T[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async entries(): Promise<Array<[IDBValidKey, T]>> {
    const [keys, values] = await Promise.all([this.keys(), this.values()]);
    return keys.map((key, i) => [key, values[i]]);
  }

  async count(): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async has(key: IDBValidKey): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  close(): void {
    this.dbPromise.then((db) => db.close());
  }
}

/**
 * Delete entire database
 */
export function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}
