/**
 * Repository Pattern (Point 6)
 * 
 * Abstracts card persistence with pluggable storage backends.
 * Supports IndexedDB, localStorage, and custom implementations.
 * 
 * @example
 * ```typescript
 * // Use IndexedDB repository
 * const repo = createRepository<AICardConfig>('indexeddb', { dbName: 'osi-cards' });
 * 
 * await repo.save('card-1', cardConfig);
 * const card = await repo.findById('card-1');
 * const allCards = await repo.findAll();
 * 
 * // Use localStorage repository
 * const localRepo = createRepository<AICardConfig>('localstorage', { prefix: 'cards' });
 * 
 * // Use memory repository (for testing)
 * const memRepo = createRepository<AICardConfig>('memory');
 * ```
 */

import { Observable, BehaviorSubject } from 'rxjs';

/**
 * Repository interface
 */
export interface Repository<T> {
  /** Find item by ID */
  findById(id: string): Promise<T | undefined>;
  
  /** Find all items */
  findAll(): Promise<T[]>;
  
  /** Find items matching criteria */
  findBy(criteria: Partial<T>): Promise<T[]>;
  
  /** Save item */
  save(id: string, item: T): Promise<void>;
  
  /** Delete item */
  delete(id: string): Promise<boolean>;
  
  /** Check if item exists */
  exists(id: string): Promise<boolean>;
  
  /** Count items */
  count(): Promise<number>;
  
  /** Clear all items */
  clear(): Promise<void>;
  
  /** Observable of all changes */
  changes$: Observable<RepositoryChange<T>>;
}

/**
 * Repository change event
 */
export interface RepositoryChange<T> {
  type: 'create' | 'update' | 'delete' | 'clear';
  id?: string;
  item?: T;
  previousItem?: T;
  timestamp: Date;
}

/**
 * Storage backend type
 */
export type StorageBackend = 'memory' | 'localstorage' | 'indexeddb';

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  /** Storage key prefix */
  prefix?: string;
  /** IndexedDB database name */
  dbName?: string;
  /** IndexedDB store name */
  storeName?: string;
  /** IndexedDB version */
  dbVersion?: number;
}

/**
 * Memory-based repository (for testing)
 */
export class MemoryRepository<T> implements Repository<T> {
  private readonly store = new Map<string, T>();
  private readonly changesSubject = new BehaviorSubject<RepositoryChange<T>>({
    type: 'clear',
    timestamp: new Date()
  });

  public changes$ = this.changesSubject.asObservable();

  async findById(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.store.values());
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        return (item as Record<string, unknown>)[key] === value;
      });
    });
  }

  async save(id: string, item: T): Promise<void> {
    const previousItem = this.store.get(id);
    const type = previousItem ? 'update' : 'create';
    this.store.set(id, item);
    this.changesSubject.next({
      type,
      id,
      item,
      previousItem,
      timestamp: new Date()
    });
  }

  async delete(id: string): Promise<boolean> {
    const item = this.store.get(id);
    const deleted = this.store.delete(id);
    if (deleted) {
      this.changesSubject.next({
        type: 'delete',
        id,
        previousItem: item,
        timestamp: new Date()
      });
    }
    return deleted;
  }

  async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.changesSubject.next({
      type: 'clear',
      timestamp: new Date()
    });
  }
}

/**
 * LocalStorage-based repository
 */
export class LocalStorageRepository<T> implements Repository<T> {
  private readonly prefix: string;
  private readonly changesSubject = new BehaviorSubject<RepositoryChange<T>>({
    type: 'clear',
    timestamp: new Date()
  });

  public changes$ = this.changesSubject.asObservable();

  constructor(config: RepositoryConfig = {}) {
    this.prefix = config.prefix ?? 'osi-cards';
  }

  private getKey(id: string): string {
    return `${this.prefix}:${id}`;
  }

  private getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.prefix}:`)) {
        keys.push(key);
      }
    }
    return keys;
  }

  async findById(id: string): Promise<T | undefined> {
    const data = localStorage.getItem(this.getKey(id));
    return data ? JSON.parse(data) : undefined;
  }

  async findAll(): Promise<T[]> {
    return this.getAllKeys().map(key => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }).filter(Boolean);
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        return (item as Record<string, unknown>)[key] === value;
      });
    });
  }

  async save(id: string, item: T): Promise<void> {
    const previousItem = await this.findById(id);
    const type = previousItem ? 'update' : 'create';
    localStorage.setItem(this.getKey(id), JSON.stringify(item));
    this.changesSubject.next({
      type,
      id,
      item,
      previousItem,
      timestamp: new Date()
    });
  }

  async delete(id: string): Promise<boolean> {
    const item = await this.findById(id);
    if (item) {
      localStorage.removeItem(this.getKey(id));
      this.changesSubject.next({
        type: 'delete',
        id,
        previousItem: item,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  async exists(id: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(id)) !== null;
  }

  async count(): Promise<number> {
    return this.getAllKeys().length;
  }

  async clear(): Promise<void> {
    this.getAllKeys().forEach(key => localStorage.removeItem(key));
    this.changesSubject.next({
      type: 'clear',
      timestamp: new Date()
    });
  }
}

/**
 * IndexedDB-based repository
 */
export class IndexedDBRepository<T> implements Repository<T> {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly dbVersion: number;
  private readonly changesSubject = new BehaviorSubject<RepositoryChange<T>>({
    type: 'clear',
    timestamp: new Date()
  });

  public changes$ = this.changesSubject.asObservable();

  constructor(config: RepositoryConfig = {}) {
    this.dbName = config.dbName ?? 'osi-cards-db';
    this.storeName = config.storeName ?? 'cards';
    this.dbVersion = config.dbVersion ?? 1;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async findById(id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data);
    });
  }

  async findAll(): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.map(r => r.data));
    });
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        return (item as Record<string, unknown>)[key] === value;
      });
    });
  }

  async save(id: string, item: T): Promise<void> {
    const db = await this.getDB();
    const previousItem = await this.findById(id);
    const type = previousItem ? 'update' : 'create';
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put({ id, data: item });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.changesSubject.next({
          type,
          id,
          item,
          previousItem,
          timestamp: new Date()
        });
        resolve();
      };
    });
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.getDB();
    const item = await this.findById(id);
    
    if (!item) return false;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.changesSubject.next({
          type: 'delete',
          id,
          previousItem: item,
          timestamp: new Date()
        });
        resolve(true);
      };
    });
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.findById(id);
    return item !== undefined;
  }

  async count(): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.changesSubject.next({
          type: 'clear',
          timestamp: new Date()
        });
        resolve();
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Create a repository with specified backend
 */
export function createRepository<T>(
  backend: StorageBackend = 'memory',
  config: RepositoryConfig = {}
): Repository<T> {
  switch (backend) {
    case 'memory':
      return new MemoryRepository<T>();
    case 'localstorage':
      return new LocalStorageRepository<T>(config);
    case 'indexeddb':
      return new IndexedDBRepository<T>(config);
    default:
      return new MemoryRepository<T>();
  }
}

/**
 * Repository factory with default configuration
 */
export class RepositoryFactory {
  private static defaultBackend: StorageBackend = 'memory';
  private static defaultConfig: RepositoryConfig = {};

  public static setDefaults(
    backend: StorageBackend,
    config: RepositoryConfig = {}
  ): void {
    RepositoryFactory.defaultBackend = backend;
    RepositoryFactory.defaultConfig = config;
  }

  public static create<T>(
    backend?: StorageBackend,
    config?: RepositoryConfig
  ): Repository<T> {
    return createRepository<T>(
      backend ?? RepositoryFactory.defaultBackend,
      { ...RepositoryFactory.defaultConfig, ...config }
    );
  }
}

