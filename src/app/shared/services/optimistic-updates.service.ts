import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OptimisticUpdate<T> {
  id: string;
  optimisticValue: T;
  originalValue: T;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'reverted';
}

/**
 * Optimistic updates service
 * Shows UI changes immediately while background operations complete
 */
@Injectable({
  providedIn: 'root'
})
export class OptimisticUpdatesService {
  private readonly updatesSubject = new BehaviorSubject<Map<string, OptimisticUpdate<any>>>(new Map());
  readonly updates$: Observable<Map<string, OptimisticUpdate<any>>> = this.updatesSubject.asObservable();

  /**
   * Apply optimistic update
   */
  applyUpdate<T>(id: string, optimisticValue: T, originalValue: T): void {
    const updates = new Map(this.updatesSubject.value);
    updates.set(id, {
      id,
      optimisticValue,
      originalValue,
      timestamp: Date.now(),
      status: 'pending'
    });
    this.updatesSubject.next(updates);
  }

  /**
   * Confirm optimistic update
   */
  confirmUpdate(id: string): void {
    const updates = new Map(this.updatesSubject.value);
    const update = updates.get(id);
    if (update) {
      updates.set(id, { ...update, status: 'confirmed' });
      this.updatesSubject.next(updates);
      // Remove after a delay
      setTimeout(() => {
        const currentUpdates = new Map(this.updatesSubject.value);
        currentUpdates.delete(id);
        this.updatesSubject.next(currentUpdates);
      }, 1000);
    }
  }

  /**
   * Revert optimistic update
   */
  revertUpdate(id: string): void {
    const updates = new Map(this.updatesSubject.value);
    const update = updates.get(id);
    if (update) {
      updates.set(id, { ...update, status: 'reverted' });
      this.updatesSubject.next(updates);
      // Remove after a delay
      setTimeout(() => {
        const currentUpdates = new Map(this.updatesSubject.value);
        currentUpdates.delete(id);
        this.updatesSubject.next(currentUpdates);
      }, 1000);
    }
  }

  /**
   * Get optimistic value or fallback to original
   */
  getValue<T>(id: string, originalValue: T): T {
    const update = this.updatesSubject.value.get(id);
    if (update && update.status === 'pending') {
      return update.optimisticValue as T;
    }
    return originalValue;
  }

  /**
   * Check if there's a pending update
   */
  hasPendingUpdate(id: string): boolean {
    const update = this.updatesSubject.value.get(id);
    return update?.status === 'pending';
  }

  /**
   * Clear all updates
   */
  clearAll(): void {
    this.updatesSubject.next(new Map());
  }
}


