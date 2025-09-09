import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

interface PooledObject {
  id: string;
  object: unknown;
  lastUsed: number;
  usageCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryManagementService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private subscribers = new WeakMap<any, Subject<void>>();
  private objectPools = new Map<string, PooledObject[]>();
  private memoryCache = new Map<string, any>();
  private maxPoolSize = 10;
  private maxCacheSize = 100;
  private cleanupInterval = 300000; // 5 minutes

  constructor() {
    this.startPeriodicCleanup();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearAllPools();
    this.clearCache();
  }

  // Object pooling for expensive objects
  getPooledObject<T>(type: string, factory: () => T): T {
    if (!this.objectPools.has(type)) {
      this.objectPools.set(type, []);
    }
    
    const pool = this.objectPools.get(type)!;
    
    // Find an available object in the pool
    if (pool.length > 0) {
      const pooledObj = pool.pop()!;
      pooledObj.lastUsed = Date.now();
      pooledObj.usageCount++;
      return pooledObj.object as T;
    }
    
    // Create new object if pool is empty
    return factory();
  }

  returnToPool<T>(type: string, object: T, id = ''): void {
    if (!this.objectPools.has(type)) {
      this.objectPools.set(type, []);
    }
    
    const pool = this.objectPools.get(type)!;
    if (pool.length < this.maxPoolSize) {
      pool.push({
        id: id || `${type}-${Date.now()}`,
        object,
        lastUsed: Date.now(),
        usageCount: 0
      });
    }
  }

  // Subscription management
  manageSubscription(component: any): Subject<void> {
    if (!this.subscribers.has(component)) {
      this.subscribers.set(component, new Subject<void>());
    }
    return this.subscribers.get(component)!;
  }

  cleanupComponent(component: any): void {
    const destroyer = this.subscribers.get(component);
    if (destroyer) {
      destroyer.next();
      destroyer.complete();
      this.subscribers.delete(component);
    }
  }

  // Memory caching with size limits
  setCachedValue(key: string, value: any): void {
    if (this.memoryCache.size >= this.maxCacheSize) {
      // Remove oldest entries
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, value);
  }

  getCachedValue<T>(key: string): T | null {
    return this.memoryCache.get(key) || null;
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    const memoryInfo = {
      objectPools: this.objectPools.size,
      totalPooledObjects: Array.from(this.objectPools.values()).reduce((sum, pool) => sum + pool.length, 0),
      cacheSize: this.memoryCache.size,
      subscribersCount: this.getActiveSubscribersCount()
    };

    if ('memory' in performance) {
      const perfMemory = (performance as any).memory;
      return {
        ...memoryInfo,
        usedJSHeapSize: perfMemory.usedJSHeapSize,
        totalJSHeapSize: perfMemory.totalJSHeapSize,
        jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
        heapUsagePercent: (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100
      };
    }
    
    return memoryInfo;
  }

  // Weak reference implementation for circular reference prevention
  createWeakRef<T extends object>(object: T): WeakRef<T> {
    return new WeakRef(object);
  }

  // Garbage collection optimization
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Resource cleanup
  private clearAllPools(): void {
    this.objectPools.clear();
  }

  private clearCache(): void {
    this.memoryCache.clear();
  }

  private getActiveSubscribersCount(): number {
    // This is an approximation since WeakMap doesn't have a size property
    let count = 0;
    try {
      // This will throw in most environments, but gives us an estimate
      (this.subscribers as any).forEach(() => count++);
    } catch (e) {
      // WeakMap iteration not supported
    }
    return count;
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupStaleObjects();
      this.cleanupOldCacheEntries();
    }, this.cleanupInterval);
  }

  private cleanupStaleObjects(): void {
    const now = Date.now();
    const staleThreshold = 600000; // 10 minutes

    this.objectPools.forEach((pool, type) => {
      const validObjects = pool.filter(obj => 
        (now - obj.lastUsed) < staleThreshold
      );
      this.objectPools.set(type, validObjects);
    });
  }

  private cleanupOldCacheEntries(): void {
    if (this.memoryCache.size > this.maxCacheSize * 0.8) {
      // Remove 20% of the oldest entries
      const entriesToRemove = Math.floor(this.memoryCache.size * 0.2);
      const keys = Array.from(this.memoryCache.keys());
      
      for (let i = 0; i < entriesToRemove; i++) {
        this.memoryCache.delete(keys[i]);
      }
    }
  }

  // Performance monitoring
  trackMemoryLeaks(): void {
    const initialUsage = this.getMemoryUsage();
    
    setTimeout(() => {
      const currentUsage = this.getMemoryUsage();
      const leakDetected = this.detectMemoryLeak(initialUsage, currentUsage);
      
      if (leakDetected) {
        console.warn('Potential memory leak detected:', {
          initial: initialUsage,
          current: currentUsage
        });
      }
    }, 60000); // Check after 1 minute
  }

  private detectMemoryLeak(initial: any, current: any): boolean {
    if (!initial.usedJSHeapSize || !current.usedJSHeapSize) {
      return false;
    }
    
    const heapGrowth = current.usedJSHeapSize - initial.usedJSHeapSize;
    const growthThreshold = 10 * 1024 * 1024; // 10MB
    
    return heapGrowth > growthThreshold;
  }
}
