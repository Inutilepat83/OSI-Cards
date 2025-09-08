import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading spinner component for indicating async operations
 * Provides consistent loading UI across the application
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="flex flex-col items-center justify-center space-y-4 text-center"
      [class.py-20]="size === 'large'"
      [class.py-10]="size === 'medium'"
      [class.py-4]="size === 'small'"
      role="status"
      [attr.aria-label]="ariaLabel">
      
      <!-- Spinner -->
      <div 
        class="animate-spin rounded-full border-2 border-primary border-t-transparent"
        [class.w-8]="size === 'large'"
        [class.h-8]="size === 'large'"
        [class.w-6]="size === 'medium'"
        [class.h-6]="size === 'medium'"
        [class.w-4]="size === 'small'"
        [class.h-4]="size === 'small'">
      </div>
      
      <!-- Message -->
      <div *ngIf="message" class="space-y-2">
        <p 
          class="font-medium text-foreground"
          [class.text-lg]="size === 'large'"
          [class.text-base]="size === 'medium'"
          [class.text-sm]="size === 'small'">
          {{ message }}
        </p>
        <p 
          *ngIf="description" 
          class="text-muted-foreground"
          [class.text-sm]="size === 'large'"
          [class.text-xs]="size === 'medium' || size === 'small'">
          {{ description }}
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent implements OnInit {
  /** Size variant of the loading spinner */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  /** Loading message to display */
  @Input() message?: string;
  
  /** Additional description text */
  @Input() description?: string;
  
  /** ARIA label for accessibility */
  @Input() ariaLabel = 'Loading, please wait';

  ngOnInit(): void {
    // Set default message based on size if not provided
    if (!this.message) {
      this.message = this.size === 'large' ? 'Loading...' : undefined;
    }
  }
}
