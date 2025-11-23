import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AICardConfig } from '../../models';
import { validateCardJson, sanitizeCardConfig } from '../../shared/utils';
import { LoggingService } from './logging.service';

/**
 * JSON file storage service for client-side card persistence
 * Handles saving, loading, and managing JSON card files in localStorage and IndexedDB
 */
@Injectable({
  providedIn: 'root'
})
export class JsonFileStorageService {
  private readonly logger = inject(LoggingService);
  private readonly STORAGE_PREFIX = 'osi_card_';
  private readonly STORAGE_INDEX_KEY = 'osi_card_index';
  private readonly DB_NAME = 'OSICardsDB';
  private readonly DB_STORE_NAME = 'cards';
  private readonly DB_VERSION = 1;

  private storedCards$ = new BehaviorSubject<Map<string, AICardConfig>>(new Map());
  private storageError$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize storage - load cards from persistent storage
   */
  private initializeStorage(): void {
    try {
      this.loadAllCards();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to initialize storage: ${msg}`, 'JsonFileStorageService');
      this.storageError$.next(`Storage initialization failed: ${msg}`);
    }
  }

  /**
   * Save a single card to localStorage
   * Falls back to IndexedDB for larger files
   */
  saveCard(card: AICardConfig): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      try {
        // Validate and sanitize
        if (!card.id || !card.cardTitle) {
          observer.next({ success: false, error: 'Card must have id and cardTitle' });
          observer.complete();
          return;
        }

        const sanitized = sanitizeCardConfig(card as any) as AICardConfig;
        const cardString = JSON.stringify(sanitized);
        const cardId = sanitized.id || 'unknown';

        // Try localStorage first (up to 5MB limit)
        try {
          const key = `${this.STORAGE_PREFIX}${cardId}`;
          localStorage.setItem(key, cardString);
          
          // Update index
          this.updateCardIndex(cardId, 'add');
          
          // Update in-memory cache
          const cache = this.storedCards$.value;
          cache.set(cardId, sanitized);
          this.storedCards$.next(cache);

          observer.next({ success: true });
        } catch (storageError: unknown) {
          // localStorage might be full, try IndexedDB
          if ((storageError as any)?.name === 'QuotaExceededError') {
            this.saveToIndexedDB(sanitized).subscribe(
              result => observer.next(result),
              error => observer.error(error)
            );
          } else {
            throw storageError;
          }
        }

        observer.complete();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        observer.next({ success: false, error: msg });
        observer.complete();
      }
    });
  }

  /**
   * Load a single card from storage by ID
   */
  loadCard(cardId: string): Observable<AICardConfig | null> {
    return new Observable(observer => {
      try {
        // Check in-memory cache first
        const cached = this.storedCards$.value.get(cardId);
        if (cached) {
          observer.next(cached);
          observer.complete();
          return;
        }

        // Try localStorage
        const key = `${this.STORAGE_PREFIX}${cardId}`;
        const cardString = localStorage.getItem(key);

        if (cardString) {
          const card = validateCardJson(cardString);
          if (card) {
            const cached = this.storedCards$.value;
            cached.set(cardId, card as AICardConfig);
            this.storedCards$.next(cached);
            observer.next(card as AICardConfig);
          } else {
            observer.next(null);
          }
          observer.complete();
          return;
        }

        // Try IndexedDB
        this.loadFromIndexedDB(cardId).subscribe(
          card => {
            observer.next(card);
            observer.complete();
          },
          error => {
            observer.error(error);
          }
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error loading card ${cardId}: ${msg}`, 'JsonFileStorageService');
        observer.next(null);
        observer.complete();
      }
    });
  }

  /**
   * Load all cards from storage
   */
  loadAllCards(): Observable<AICardConfig[]> {
    return new Observable(observer => {
      try {
        const cards: AICardConfig[] = [];
        const cardIds = this.getCardIndex();

        for (const cardId of cardIds) {
          const key = `${this.STORAGE_PREFIX}${cardId}`;
          const cardString = localStorage.getItem(key);
          
          if (cardString) {
            const card = validateCardJson(cardString);
            if (card) {
              cards.push(card as AICardConfig);
            }
          }
        }

        // Update cache
        const cache = new Map<string, AICardConfig>();
        cards.forEach(card => cache.set(card.id!, card));
        this.storedCards$.next(cache);

        observer.next(cards);
        observer.complete();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error loading all cards: ${msg}`, 'JsonFileStorageService');
        observer.next([]);
        observer.complete();
      }
    });
  }

  /**
   * Delete a card from storage
   */
  deleteCard(cardId: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      try {
        // Delete from localStorage
        const key = `${this.STORAGE_PREFIX}${cardId}`;
        localStorage.removeItem(key);

        // Try to delete from IndexedDB
        this.deleteFromIndexedDB(cardId).subscribe({
          next: () => {
            // Update index
            this.updateCardIndex(cardId, 'remove');

            // Update cache
            const cache = this.storedCards$.value;
            cache.delete(cardId);
            this.storedCards$.next(cache);

            observer.next({ success: true });
            observer.complete();
          },
          error: () => {
            // Even if IndexedDB fails, localStorage deletion succeeded
            observer.next({ success: true });
            observer.complete();
          }
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        observer.next({ success: false, error: msg });
        observer.complete();
      }
    });
  }

  /**
   * Export card as JSON file (download)
   */
  exportCard(card: AICardConfig, filename?: string): void {
    try {
      const sanitized = sanitizeCardConfig(card as any) as AICardConfig;
      const jsonString = JSON.stringify(sanitized, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename || `${sanitized.id || 'card'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Export failed: ${msg}`, 'JsonFileStorageService');
      this.storageError$.next(`Export failed: ${msg}`);
    }
  }

  /**
   * Export multiple cards as ZIP (requires JSZip library)
   */
  exportMultipleCards(cards: AICardConfig[], zipFileName: string = 'cards.zip'): void {
    try {
      // Note: This requires JSZip library - check if available
      const jsZip = (window as any).JSZip;
      if (!jsZip) {
        this.logger.warn('JSZip not available. Export as individual files or add JSZip library.', 'JsonFileStorageService');
        return;
      }

      const zip = new jsZip();
      
      cards.forEach(card => {
        const sanitized = sanitizeCardConfig(card as any) as AICardConfig;
        const jsonString = JSON.stringify(sanitized, null, 2);
        zip.file(`${sanitized.id || 'card'}.json`, jsonString);
      });

      zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Batch export failed: ${msg}`, 'JsonFileStorageService');
      this.storageError$.next(`Batch export failed: ${msg}`);
    }
  }

  /**
   * Get stored cards observable
   */
  getStoredCards(): Observable<AICardConfig[]> {
    return new Observable(observer => {
      const cache = this.storedCards$.value;
      observer.next(Array.from(cache.values()));
      observer.complete();
    });
  }

  /**
   * Get storage errors observable
   */
  getStorageErrors(): Observable<string | null> {
    return this.storageError$.asObservable();
  }

  /**
   * Clear all stored cards
   */
  clearAllCards(): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      try {
        const cardIds = this.getCardIndex();
        
        for (const cardId of cardIds) {
          const key = `${this.STORAGE_PREFIX}${cardId}`;
          localStorage.removeItem(key);
        }

        // Clear index
        localStorage.removeItem(this.STORAGE_INDEX_KEY);

        // Clear IndexedDB
        this.clearIndexedDB().subscribe({
          next: () => {
            this.storedCards$.next(new Map());
            observer.next({ success: true });
            observer.complete();
          },
          error: () => {
            // localStorage cleared successfully even if IndexedDB fails
            this.storedCards$.next(new Map());
            observer.next({ success: true });
            observer.complete();
          }
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        observer.next({ success: false, error: msg });
        observer.complete();
      }
    });
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): Observable<{
    estimatedUsage: number;
    estimatedQuota: number;
    percentageUsed: number;
  }> {
    return new Observable(observer => {
      if (navigator.storage?.estimate) {
        navigator.storage.estimate().then(estimate => {
          observer.next({
            estimatedUsage: estimate.usage || 0,
            estimatedQuota: estimate.quota || 0,
            percentageUsed: estimate.quota ? (estimate.usage || 0) / estimate.quota * 100 : 0
          });
          observer.complete();
        }).catch(error => {
          this.logger.warn('Storage estimate not available', 'JsonFileStorageService', error);
          observer.next({
            estimatedUsage: 0,
            estimatedQuota: 0,
            percentageUsed: 0
          });
          observer.complete();
        });
      } else {
        observer.next({
          estimatedUsage: 0,
          estimatedQuota: 0,
          percentageUsed: 0
        });
        observer.complete();
      }
    });
  }

  // ===== Private Helper Methods =====

  /**
   * Save to IndexedDB (for larger files)
   */
  private saveToIndexedDB(card: AICardConfig): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([this.DB_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.DB_STORE_NAME);
          const putRequest = store.put(card);

          putRequest.onsuccess = () => {
            observer.next({ success: true });
            observer.complete();
          };

          putRequest.onerror = () => {
            observer.next({ success: false, error: 'IndexedDB write failed' });
            observer.complete();
          };
        };

        request.onerror = () => {
          observer.next({ success: false, error: 'IndexedDB open failed' });
          observer.complete();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.DB_STORE_NAME)) {
            db.createObjectStore(this.DB_STORE_NAME, { keyPath: 'id' });
          }
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        observer.next({ success: false, error: msg });
        observer.complete();
      }
    });
  }

  /**
   * Load from IndexedDB
   */
  private loadFromIndexedDB(cardId: string): Observable<AICardConfig | null> {
    return new Observable(observer => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([this.DB_STORE_NAME], 'readonly');
          const store = transaction.objectStore(this.DB_STORE_NAME);
          const getRequest = store.get(cardId);

          getRequest.onsuccess = () => {
            const card = getRequest.result;
            if (card) {
              observer.next(card as AICardConfig);
            } else {
              observer.next(null);
            }
            observer.complete();
          };

          getRequest.onerror = () => {
            observer.next(null);
            observer.complete();
          };
        };

        request.onerror = () => {
          observer.next(null);
          observer.complete();
        };
      } catch (error: unknown) {
        observer.next(null);
        observer.complete();
      }
    });
  }

  /**
   * Delete from IndexedDB
   */
  private deleteFromIndexedDB(cardId: string): Observable<void> {
    return new Observable(observer => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([this.DB_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.DB_STORE_NAME);
          const deleteRequest = store.delete(cardId);

          deleteRequest.onsuccess = () => {
            observer.next();
            observer.complete();
          };

          deleteRequest.onerror = () => {
            observer.error('Failed to delete from IndexedDB');
          };
        };

        request.onerror = () => {
          observer.error('Failed to open IndexedDB');
        };
      } catch (error: unknown) {
        observer.error(error);
      }
    });
  }

  /**
   * Clear IndexedDB
   */
  private clearIndexedDB(): Observable<void> {
    return new Observable(observer => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([this.DB_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.DB_STORE_NAME);
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => {
            observer.next();
            observer.complete();
          };

          clearRequest.onerror = () => {
            observer.error('Failed to clear IndexedDB');
          };
        };

        request.onerror = () => {
          observer.error('Failed to open IndexedDB');
        };
      } catch (error: unknown) {
        observer.error(error);
      }
    });
  }

  /**
   * Get card index from localStorage
   */
  private getCardIndex(): string[] {
    const indexString = localStorage.getItem(this.STORAGE_INDEX_KEY);
    return indexString ? JSON.parse(indexString) : [];
  }

  /**
   * Update card index in localStorage
   */
  private updateCardIndex(cardId: string, operation: 'add' | 'remove'): void {
    const index = this.getCardIndex();

    if (operation === 'add' && !index.includes(cardId)) {
      index.push(cardId);
    } else if (operation === 'remove') {
      const idx = index.indexOf(cardId);
      if (idx !== -1) {
        index.splice(idx, 1);
      }
    }

    localStorage.setItem(this.STORAGE_INDEX_KEY, JSON.stringify(index));
  }
}
