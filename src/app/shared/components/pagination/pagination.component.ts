import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pagination component
 * Displays pagination controls for navigating through pages
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav *ngIf="totalPages > 1" class="pagination" aria-label="Pagination Navigation">
      <button
        type="button"
        class="pagination-button"
        [disabled]="!hasPreviousPage"
        (click)="onPrevious()"
        aria-label="Go to previous page"
      >
        Previous
      </button>
      
      <div class="pagination-info">
        <span class="pagination-text">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <span class="pagination-count">
          ({{ totalItems }} items)
        </span>
      </div>

      <button
        type="button"
        class="pagination-button"
        [disabled]="!hasNextPage"
        (click)="onNext()"
        aria-label="Go to next page"
      >
        Next
      </button>
    </nav>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
    }

    .pagination-button {
      padding: 0.5rem 1rem;
      background: rgba(20, 30, 50, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s, border-color 0.2s;
    }

    .pagination-button:hover:not(:disabled) {
      border-color: var(--color-brand, #FF7900);
      opacity: 0.9;
    }

    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .pagination-text {
      font-size: 0.875rem;
      color: var(--card-text-primary, #FFFFFF);
      font-weight: 500;
    }

    .pagination-count {
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
    }

    @media (max-width: 768px) {
      .pagination {
        flex-direction: column;
        gap: 0.75rem;
      }

      .pagination-info {
        order: -1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() hasNextPage = false;
  @Input() hasPreviousPage = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  onNext(): void {
    if (this.hasNextPage) {
      this.next.emit();
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onPrevious(): void {
    if (this.hasPreviousPage) {
      this.previous.emit();
      this.pageChange.emit(this.currentPage - 1);
    }
  }
}


