import { Component, Input, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService, ToastType } from '../../services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Toast notification component
 * Displays user-visible toast notifications
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [class]="'toast--' + toast.type"
        [@slideInOut]
        (click)="remove(toast.id)"
        role="alert"
        [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button
          type="button"
          class="toast-close"
          (click)="remove(toast.id); $event.stopPropagation()"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(20, 30, 50, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    }

    .toast:hover {
      transform: translateX(-4px);
    }

    .toast--success {
      border-left: 4px solid #10b981;
    }

    .toast--error {
      border-left: 4px solid #ef4444;
    }

    .toast--warning {
      border-left: 4px solid #f59e0b;
    }

    .toast--info {
      border-left: 4px solid #3b82f6;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1rem;
    }

    .toast--success .toast-icon {
      color: #10b981;
    }

    .toast--error .toast-icon {
      color: #ef4444;
    }

    .toast--warning .toast-icon {
      color: #f59e0b;
    }

    .toast--info .toast-icon {
      color: #3b82f6;
    }

    .toast-message {
      flex: 1;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .toast-close:hover {
      color: var(--card-text-primary, #FFFFFF);
    }

    @media (max-width: 768px) {
      .toast-container {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('0.3s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.3s ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit {
  private readonly toastService = inject(ToastService);

  toasts: Toast[] = [];

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  remove(id: string): void {
    this.toastService.remove(id);
  }
}


