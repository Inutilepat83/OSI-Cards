/**
 * IndexedDB Cache Service
 * Stub for backward compatibility
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBCacheService {
  delete(key: string): Observable<void> {
    console.warn('IndexedDBCacheService: Implement in your app');
    return of(undefined);
  }

  set(key: string, value: any, timestamp: number): Observable<void> {
    console.warn('IndexedDBCacheService: Implement in your app');
    return of(undefined);
  }

  get(key: string): Observable<any> {
    console.warn('IndexedDBCacheService: Implement in your app');
    return of(null);
  }
}
