import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Confirmation dialog component
 * Displays confirmation dialogs for destructive actions
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showDialog" class="dialog-overlay" (click)="onOverlayClick()">
      <div class="dialog-container" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dialog-title'" [attr.aria-describedby]="'dialog-message'">
        <div class="dialog-header">
          <h2 id="dialog-title" class="dialog-title">{{ dialogOptions?.title }}</h2>
        </div>
        <div class="dialog-body">
          <p id="dialog-message" class="dialog-message">{{ dialogOptions?.message }}</p>
        </div>
        <div class="dialog-footer">
          <button
            type="button"
            class="dialog-button dialog-button--cancel"
            (click)="onCancel()"
            aria-label="Cancel"
          >
            {{ dialogOptions?.cancelText || 'Cancel' }}
          </button>
          <button
            type="button"
            class="dialog-button"
            [class]="'dialog-button--' + (dialogOptions?.confirmButtonClass || 'primary')"
            (click)="onConfirm()"
            aria-label="Confirm"
          >
            {{ dialogOptions?.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .dialog-container {
      background: rgba(20, 30, 50, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .dialog-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
    }

    .dialog-body {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
    }

    .dialog-message {
      margin: 0;
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .dialog-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .dialog-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }

    .dialog-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .dialog-button:active {
      transform: translateY(0);
    }

    .dialog-button--cancel {
      background: rgba(255, 255, 255, 0.1);
      color: var(--card-text-primary, #FFFFFF);
    }

    .dialog-button--primary {
      background: var(--color-brand, #FF7900);
      color: white;
    }

    .dialog-button--danger {
      background: #ef4444;
      color: white;
    }

    .dialog-button--warning {
      background: #f59e0b;
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly destroy$ = new Subject<void>();

  showDialog = false;
  dialogOptions?: any;
  private resultSubject?: Subject<any>;

  ngOnInit(): void {
    this.confirmationService.dialog$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ options, result }) => {
        this.dialogOptions = options;
        this.resultSubject = result;
        this.showDialog = true;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm(): void {
    if (this.resultSubject) {
      this.resultSubject.next({ confirmed: true });
      this.resultSubject.complete();
    }
    this.showDialog = false;
    this.dialogOptions = undefined;
    this.resultSubject = undefined;
  }

  onCancel(): void {
    if (this.resultSubject) {
      this.resultSubject.next({ confirmed: false });
      this.resultSubject.complete();
    }
    this.showDialog = false;
    this.dialogOptions = undefined;
    this.resultSubject = undefined;
  }

  onOverlayClick(): void {
    // Close on overlay click (optional - you might want to disable this)
    // this.onCancel();
  }
}


