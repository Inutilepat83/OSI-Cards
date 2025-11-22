import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: 'primary' | 'danger' | 'warning';
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
}

/**
 * Confirmation dialog service
 * Manages confirmation dialogs for destructive actions
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private readonly dialogSubject = new Subject<{
    options: ConfirmationDialogOptions;
    result: Subject<ConfirmationDialogResult>;
  }>();

  readonly dialog$: Observable<{
    options: ConfirmationDialogOptions;
    result: Subject<ConfirmationDialogResult>;
  }> = this.dialogSubject.asObservable();

  /**
   * Show a confirmation dialog
   */
  confirm(options: ConfirmationDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const result = new Subject<ConfirmationDialogResult>();
      
      result.subscribe((dialogResult) => {
        resolve(dialogResult.confirmed);
      });

      this.dialogSubject.next({
        options: {
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          confirmButtonClass: options.confirmButtonClass || 'primary',
          ...options
        },
        result
      });
    });
  }
}


