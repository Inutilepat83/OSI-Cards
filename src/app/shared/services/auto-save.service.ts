import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AppConfigService } from '../../core/services/app-config.service';

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

/**
 * Auto-save service
 * Automatically saves card edits periodically to prevent data loss
 */
@Injectable({
  providedIn: 'root'
})
export class AutoSaveService {
  private readonly config = inject(AppConfigService);
  private readonly saveSubject = new Subject<any>();
  private readonly stateSubject = new Subject<AutoSaveState>();

  private currentState: AutoSaveState = {
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false
  };

  readonly save$: Observable<any> = this.saveSubject.asObservable();
  readonly state$: Observable<AutoSaveState> = this.stateSubject.asObservable();

  private saveSubscription: any;

  constructor() {
    // Setup debounced save subscription
    this.saveSubject.pipe(
      debounceTime(this.config.UI.DEBOUNCE_SEARCH_MS)
    ).subscribe((data) => {
      this.performSave(data);
    });
  }

  /**
   * Trigger auto-save
   */
  triggerSave(data: any): void {
    this.currentState.hasUnsavedChanges = true;
    this.updateState();
    this.saveSubject.next(data);
  }

  /**
   * Perform the actual save
   */
  private performSave(data: any): void {
    this.currentState.isSaving = true;
    this.updateState();

    try {
      // Save to localStorage
      const key = 'auto-save-card';
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      this.currentState.isSaving = false;
      this.currentState.lastSaved = new Date();
      this.currentState.hasUnsavedChanges = false;
      this.updateState();
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.currentState.isSaving = false;
      this.updateState();
    }
  }

  /**
   * Get auto-saved data
   */
  getAutoSavedData(): any | null {
    try {
      const key = 'auto-save-card';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to get auto-saved data:', error);
    }
    return null;
  }

  /**
   * Clear auto-saved data
   */
  clearAutoSavedData(): void {
    try {
      const key = 'auto-save-card';
      localStorage.removeItem(key);
      this.currentState.hasUnsavedChanges = false;
      this.currentState.lastSaved = null;
      this.updateState();
    } catch (error) {
      console.error('Failed to clear auto-saved data:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): AutoSaveState {
    return { ...this.currentState };
  }

  /**
   * Update state and emit
   */
  private updateState(): void {
    this.stateSubject.next({ ...this.currentState });
  }
}

