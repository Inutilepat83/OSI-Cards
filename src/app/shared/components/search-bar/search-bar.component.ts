import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../../../core/services/app-config.service';

/**
 * Search bar component
 * Provides search functionality with debouncing
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-bar-container">
      <div class="search-input-wrapper">
        <input
          type="text"
          class="search-input"
          [placeholder]="placeholder"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [attr.aria-label]="'Search ' + (searchLabel || '')"
          aria-describedby="search-hint"
        />
        <div class="search-icon" aria-hidden="true">🔍</div>
        <button
          *ngIf="searchQuery"
          type="button"
          class="search-clear"
          (click)="clearSearch()"
          aria-label="Clear search"
        >
          ×
        </button>
      </div>
      <div *ngIf="showHint" id="search-hint" class="search-hint">
        {{ hint }}
      </div>
    </div>
  `,
  styles: [`
    .search-bar-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 2.5rem;
      background: rgba(20, 30, 50, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-brand, #FF7900);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      pointer-events: none;
      color: var(--card-text-secondary, #B8C5D6);
    }

    .search-clear {
      position: absolute;
      right: 0.75rem;
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

    .search-clear:hover {
      color: var(--card-text-primary, #FFFFFF);
    }

    .search-hint {
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
      padding: 0 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  private readonly config = inject(AppConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  @Input() placeholder = 'Search...';
  @Input() searchLabel?: string;
  @Input() hint?: string;
  @Input() showHint = false;
  @Input() debounceMs?: number;

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchFocus = new EventEmitter<void>();
  @Output() searchBlur = new EventEmitter<void>();

  searchQuery = '';

  constructor() {
    const debounceTimeMs = this.debounceMs ?? this.config.UI.DEBOUNCE_SEARCH_MS;
    this.searchSubject.pipe(
      debounceTime(debounceTimeMs),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchChange.emit(query);
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchChange.emit('');
  }

  onFocus(): void {
    this.searchFocus.emit();
  }

  onBlur(): void {
    this.searchBlur.emit();
  }
}

