/**
 * Lazy Section Placeholder Component
 *
 * Displays a loading skeleton while lazy-loaded sections are being fetched.
 * Shows error state with retry option if loading fails.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazySectionType } from './lazy-section-loader.service';

@Component({
  selector: 'app-lazy-section-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lazy-section-placeholder" [attr.data-section-type]="sectionType">
      <!-- Loading State -->
      @if (isLoading && !error) {
        <div class="placeholder-loading">
          <div class="placeholder-skeleton">
            <div class="skeleton-header"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
          <div class="placeholder-message">
            <span class="loading-spinner"></span>
            <span>Loading {{ sectionLabel }}...</span>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error) {
        <div class="placeholder-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">
            <strong>Failed to load {{ sectionLabel }}</strong>
            <p>{{ error.message || 'An unexpected error occurred' }}</p>
          </div>
          <button
            type="button"
            class="retry-button"
            (click)="onRetry()"
            (keydown.enter)="onRetry()"
            (keydown.space)="onRetry()">
            Retry
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .lazy-section-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      padding: 1rem;
      border-radius: var(--osi-border-radius-md, 8px);
      background: var(--osi-color-surface, #f8f9fa);
      border: 1px dashed var(--osi-color-border, #dee2e6);
    }

    .placeholder-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .placeholder-skeleton {
      width: 100%;
      max-width: 300px;
    }

    .skeleton-header {
      height: 24px;
      width: 60%;
      background: linear-gradient(
        90deg,
        var(--osi-color-skeleton, #e9ecef) 25%,
        var(--osi-color-skeleton-highlight, #f8f9fa) 50%,
        var(--osi-color-skeleton, #e9ecef) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-line {
      height: 16px;
      width: 100%;
      background: linear-gradient(
        90deg,
        var(--osi-color-skeleton, #e9ecef) 25%,
        var(--osi-color-skeleton-highlight, #f8f9fa) 50%,
        var(--osi-color-skeleton, #e9ecef) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-line.short {
      width: 70%;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .placeholder-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--osi-color-text-muted, #6c757d);
      font-size: 0.875rem;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--osi-color-border, #dee2e6);
      border-top-color: var(--osi-color-brand, #ff7900);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .placeholder-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }

    .error-icon {
      font-size: 2rem;
    }

    .error-message {
      color: var(--osi-color-text, #212529);
    }

    .error-message strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .error-message p {
      margin: 0;
      color: var(--osi-color-text-muted, #6c757d);
      font-size: 0.875rem;
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background: var(--osi-color-brand, #ff7900);
      color: white;
      border: none;
      border-radius: var(--osi-border-radius-sm, 4px);
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .retry-button:hover {
      background: var(--osi-color-brand-dark, #e66a00);
    }

    .retry-button:focus-visible {
      outline: 2px solid var(--osi-color-brand, #ff7900);
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .skeleton-header,
      .skeleton-line,
      .loading-spinner {
        animation: none;
      }

      .skeleton-header,
      .skeleton-line {
        background: var(--osi-color-skeleton, #e9ecef);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LazySectionPlaceholderComponent {
  @Input() sectionType: LazySectionType = 'chart';
  @Input() isLoading = true;
  @Input() error: Error | null = null;

  @Output() retry = new EventEmitter<void>();

  /** Get a user-friendly label for the section type */
  get sectionLabel(): string {
    const labels: Record<LazySectionType, string> = {
      'chart': 'Chart Section',
      'map': 'Map Section'
    };
    return labels[this.sectionType] ?? 'Section';
  }

  onRetry(): void {
    this.retry.emit();
  }
}


