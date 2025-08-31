import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheService } from '../interfaces/services.interface';

interface CacheItem<T> {
  value: T;
  expires: number;
}

@Injectable({
  providedIn: 'root',
})
export class MemoryCacheService implements CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): Observable<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      return of(null);
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return of(null);
    }

    return of(item.value);
  }

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Observable<boolean> {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
    return of(true);
  }

  delete(key: string): Observable<boolean> {
    const deleted = this.cache.delete(key);
    return of(deleted);
  }

  clear(): Observable<boolean> {
    this.cache.clear();
    return of(true);
  }

  keys(): Observable<string[]> {
    // Clean expired entries first
    this.cleanExpired();
    return of(Array.from(this.cache.keys()));
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return true;
    }
    return Date.now() > item.expires;
  }
}
