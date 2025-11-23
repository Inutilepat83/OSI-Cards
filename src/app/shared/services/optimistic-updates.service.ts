import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggingService } from '../../core/services/logging.service';

export interface OptimisticUpdate<T> {
  id: string;
  optimisticValue: T;
  originalValue: T;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'reverted' | 'conflict';
  error?: unknown;
  retryCount?: number;
  maxRetries?: number;
}

export interface ConflictResolution<T> {
  resolve: (serverValue: T, optimisticValue: T) => T;
  description?: string;
}

/**
 * Optimistic updates service
 * Shows UI changes immediately while background operations complete
 */
@Injectable({
  providedIn: 'root'
})
export class OptimisticUpdatesService {
  private readonly logger = inject(LoggingService);
  private readonly updatesSubject = new BehaviorSubject<Map<string, OptimisticUpdate<any>>>(new Map());
  private readonly conflictResolvers = new Map<string, ConflictResolution<any>>();
  readonly updates$: Observable<Map<string, OptimisticUpdate<any>>> = this.updatesSubject.asObservable();

  /**
   * Apply optimistic update
   */
  applyUpdate<T>(
    id: string,
    optimisticValue: T,
    originalValue: T,
    options?: {
      maxRetries?: number;
      conflictResolver?: ConflictResolution<T>;
    }
  ): void {
    const updates = new Map(this.updatesSubject.value);
    const existingUpdate = updates.get(id);
    
    // If there's a conflict resolver, store it
    if (options?.conflictResolver) {
      this.conflictResolvers.set(id, options.conflictResolver);
    }

    updates.set(id, {
      id,
      optimisticValue,
      originalValue: existingUpdate?.originalValue ?? originalValue,
      timestamp: Date.now(),
      status: 'pending',
      maxRetries: options?.maxRetries ?? 3,
      retryCount: 0
    });
    
    this.updatesSubject.next(updates);
    this.logger.debug(`Optimistic update applied: ${id}`, 'OptimisticUpdatesService');
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
   * Revert optimistic update (rollback on failure)
   */
  revertUpdate(id: string, error?: unknown): void {
    const updates = new Map(this.updatesSubject.value);
    const update = updates.get(id);
    if (update) {
      updates.set(id, {
        ...update,
        status: 'reverted',
        error
      });
      this.updatesSubject.next(updates);
      
      this.logger.warn(`Optimistic update reverted: ${id}`, 'OptimisticUpdatesService', error);
      
      // Remove after a delay
      setTimeout(() => {
        const currentUpdates = new Map(this.updatesSubject.value);
        currentUpdates.delete(id);
        this.updatesSubject.next(currentUpdates);
        this.conflictResolvers.delete(id);
      }, 2000);
    }
  }

  /**
   * Handle conflict between server value and optimistic value
   */
  resolveConflict<T>(id: string, serverValue: T): T {
    const updates = new Map(this.updatesSubject.value);
    const update = updates.get(id);
    const resolver = this.conflictResolvers.get(id);

    if (!update || update.status !== 'pending') {
      return serverValue;
    }

    if (resolver) {
      // Use custom conflict resolver
      const resolvedValue = resolver.resolve(serverValue, update.optimisticValue as T);
      updates.set(id, {
        ...update,
        optimisticValue: resolvedValue,
        status: 'pending' // Keep as pending, will be confirmed when server accepts
      });
      this.updatesSubject.next(updates);
      this.logger.info(
        `Conflict resolved for ${id}: ${resolver.description || 'custom resolution'}`,
        'OptimisticUpdatesService'
      );
      return resolvedValue;
    } else {
      // Default: mark as conflict and use server value
      updates.set(id, {
        ...update,
        status: 'conflict'
      });
      this.updatesSubject.next(updates);
      this.logger.warn(`Conflict detected for ${id}, using server value`, 'OptimisticUpdatesService');
      
      // Auto-revert after delay
      setTimeout(() => {
        this.revertUpdate(id, new Error('Conflict: server value differs from optimistic value'));
      }, 3000);
      
      return serverValue;
    }
  }

  /**
   * Retry failed update
   */
  retryUpdate<T>(id: string, newOptimisticValue: T): boolean {
    const updates = new Map(this.updatesSubject.value);
    const update = updates.get(id);
    
    if (!update || update.status !== 'reverted') {
      return false;
    }

    const retryCount = (update.retryCount ?? 0) + 1;
    const maxRetries = update.maxRetries ?? 3;

    if (retryCount > maxRetries) {
      this.logger.error(`Max retries exceeded for ${id}`, 'OptimisticUpdatesService');
      return false;
    }

    updates.set(id, {
      ...update,
      optimisticValue: newOptimisticValue,
      originalValue: update.originalValue,
      timestamp: Date.now(),
      status: 'pending',
      retryCount,
      error: undefined
    });

    this.updatesSubject.next(updates);
    this.logger.info(`Retrying optimistic update: ${id} (attempt ${retryCount}/${maxRetries})`, 'OptimisticUpdatesService');
    return true;
  }

  /**
   * Get optimistic value or fallback to original
   */
  getValue<T>(id: string, originalValue: T): T {
    const update = this.updatesSubject.value.get(id);
    if (update) {
      if (update.status === 'pending' || update.status === 'conflict') {
        return update.optimisticValue as T;
      }
      if (update.status === 'reverted') {
        // Return original value when reverted
        return update.originalValue as T;
      }
    }
    return originalValue;
  }

  /**
   * Get update status
   */
  getUpdateStatus(id: string): OptimisticUpdate<any>['status'] | null {
    const update = this.updatesSubject.value.get(id);
    return update?.status ?? null;
  }

  /**
   * Check if update is in conflict
   */
  hasConflict(id: string): boolean {
    return this.getUpdateStatus(id) === 'conflict';
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


