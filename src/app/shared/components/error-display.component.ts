import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorInfo {
  message: string;
  details?: string;
  code?: string;
  timestamp?: Date;
  retryable?: boolean;
}

/**
 * Error display component for consistent error handling UI
 * Provides user-friendly error messages with optional retry functionality
 */
@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="rounded-lg border border-destructive/20 bg-destructive/10 p-4"
      role="alert"
      aria-live="polite">
      
      <!-- Error Icon and Title -->
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg 
            class="h-5 w-5 text-destructive" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true">
            <path 
              fill-rule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
              clip-rule="evenodd" />
          </svg>
        </div>
        
        <div class="flex-1 min-w-0">
          <!-- Error Title -->
          <h3 class="text-sm font-medium text-destructive mb-2">
            {{ title || 'An Error Occurred' }}
          </h3>
          
          <!-- Error Message -->
          <p class="text-sm text-destructive/80 mb-2">
            {{ error.message }}
          </p>
          
          <!-- Error Details -->
          <div *ngIf="showDetails && error.details" class="mt-2">
            <details class="cursor-pointer">
              <summary class="text-xs text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre class="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">{{ error.details }}</pre>
            </details>
          </div>
          
          <!-- Error Code and Timestamp -->
          <div *ngIf="error.code || error.timestamp" class="mt-2 text-xs text-muted-foreground">
            <span *ngIf="error.code">Error Code: {{ error.code }}</span>
            <span *ngIf="error.code && error.timestamp"> • </span>
            <span *ngIf="error.timestamp">{{ error.timestamp | date:'short' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div *ngIf="error.retryable || dismissible" class="mt-4 flex space-x-2">
        <button 
          *ngIf="error.retryable"
          (click)="onRetry()"
          class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
          type="button">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Try Again
        </button>
        
        <button 
          *ngIf="dismissible"
          (click)="onDismiss()"
          class="inline-flex items-center px-3 py-1.5 border border-muted text-xs font-medium rounded text-muted-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muted transition-colors"
          type="button">
          Dismiss
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorDisplayComponent {
  /** Error information to display */
  @Input() error!: ErrorInfo;
  
  /** Custom title for the error display */
  @Input() title?: string;
  
  /** Whether to show technical details */
  @Input() showDetails = true;
  
  /** Whether the error can be dismissed */
  @Input() dismissible = true;
  
  /** Event emitted when retry button is clicked */
  @Output() retry = new EventEmitter<void>();
  
  /** Event emitted when dismiss button is clicked */
  @Output() dismiss = new EventEmitter<void>();

  /**
   * Handles retry button click
   */
  onRetry(): void {
    this.retry.emit();
  }

  /**
   * Handles dismiss button click
   */
  onDismiss(): void {
    this.dismiss.emit();
  }
}
