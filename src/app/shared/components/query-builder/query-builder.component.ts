import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

export interface QueryFilters {
  company?: string;
  geography?: string;
  segment?: string;
  date?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="query-builder-card">
      <!-- Brand accent line at top -->
      <div class="accent-line"></div>

      <!-- Main title -->
      <h2 class="query-title">
        Instant profile of <strong>{{ filters.company || '[Company]' }}</strong> in
        <strong>{{ filters.geography || '[Country]' }}</strong>
      </h2>

      <!-- Horizontal filter strip -->
      <div class="filter-strip">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label" [attr.title]="'Company name'">
              <span class="label-text">Company</span>
            </label>
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filters.company"
              (ngModelChange)="onFilterChange()"
              placeholder="Enter company"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label" [attr.title]="'Geographic region'">
              <span class="label-text">Country</span>
            </label>
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filters.geography"
              (ngModelChange)="onFilterChange()"
              placeholder="Enter country"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label" [attr.title]="'Business segment'">
              <span class="label-text">Segment</span>
            </label>
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filters.segment"
              (ngModelChange)="onFilterChange()"
              placeholder="Enter segment"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label" [attr.title]="'Time period'">
              <span class="label-text">Period</span>
            </label>
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filters.date"
              (ngModelChange)="onFilterChange()"
              placeholder="Enter period"
            />
          </div>
        </div>

        <!-- More filters expander -->
        <button
          class="more-filters-btn"
          (click)="showAdvancedFilters = !showAdvancedFilters"
          [attr.aria-expanded]="showAdvancedFilters"
        >
          <lucide-icon
            [name]="showAdvancedFilters ? 'chevron-up' : 'chevron-down'"
            [size]="14"
          ></lucide-icon>
          More filters
        </button>
      </div>

      <!-- Advanced filters (collapsible) -->
      <div class="advanced-filters" *ngIf="showAdvancedFilters">
        <div class="advanced-filters-grid">
          <div class="filter-group" *ngFor="let key of advancedFilterKeys">
            <label class="filter-label">
              <span class="label-text">{{ key }}</span>
            </label>
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filters[key]"
              (ngModelChange)="onFilterChange()"
              [placeholder]="'Enter ' + key"
            />
          </div>
        </div>
      </div>

      <!-- Query preview pill -->
      <div class="query-preview-section">
        <div class="query-preview-pill" (click)="showFullQuery = true">
          <lucide-icon name="code-2" [size]="12"></lucide-icon>
          <span class="preview-text">{{ getQueryPreview() }}</span>
          <lucide-icon name="external-link" [size]="12"></lucide-icon>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-bar">
        <button class="btn-primary" (click)="onRefresh()">
          <lucide-icon name="refresh-cw" [size]="16"></lucide-icon>
          Refresh insights
        </button>
        <div class="secondary-actions">
          <button class="btn-icon" (click)="onExport()" title="Export">
            <lucide-icon name="download" [size]="16"></lucide-icon>
          </button>
          <button class="btn-icon" (click)="onSave()" title="Save">
            <lucide-icon name="save" [size]="16"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Footer info -->
      <div class="query-footer">
        <span class="last-updated">Last updated: {{ lastUpdated }}</span>
        <span class="data-source">Source: {{ dataSource }}</span>
      </div>
    </div>

    <!-- Full query modal -->
    <div class="modal-overlay" *ngIf="showFullQuery" (click)="showFullQuery = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Full Query</h3>
          <button class="modal-close" (click)="showFullQuery = false">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
        <div class="modal-body">
          <pre class="query-code">{{ getFullQuery() }}</pre>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="copyQuery()">
            <lucide-icon name="copy" [size]="16"></lucide-icon>
            Copy
          </button>
          <button class="btn-secondary" (click)="showFullQuery = false">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .query-builder-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        position: relative;
        max-height: calc(100vh - 200px);
        display: flex;
        flex-direction: column;
      }

      .accent-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #ff7900;
        border-radius: 8px 8px 0 0;
      }

      .query-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 1.25rem 0;
        color: #1a1d23;
        line-height: 1.4;
      }

      .query-title strong {
        color: #ff7900;
      }

      .filter-strip {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .filter-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .filter-label {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: help;
      }

      .label-text {
        display: inline-block;
      }

      .filter-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .filter-input:focus {
        outline: none;
        border-color: #ff7900;
        box-shadow: 0 0 0 3px rgba(255, 121, 0, 0.1);
      }

      .more-filters-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem;
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 0.75rem;
        cursor: pointer;
        align-self: flex-start;
      }

      .more-filters-btn:hover {
        color: #1a1d23;
      }

      .advanced-filters {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e2e8f0;
      }

      .advanced-filters-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .query-preview-section {
        margin: 1rem 0;
      }

      .query-preview-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-size: 0.75rem;
        font-family: 'Monaco', 'Menlo', monospace;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
        max-width: 100%;
        overflow: hidden;
      }

      .query-preview-pill:hover {
        background: #f1f5f9;
        border-color: #ff7900;
      }

      .preview-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
      }

      .action-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: #ff7900;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: #e66a00;
      }

      .secondary-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: #f8fafc;
        color: #1a1d23;
        border-color: #cbd5e1;
      }

      .query-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.6875rem;
        color: #94a3b8;
      }

      .last-updated,
      .data-source {
        display: inline-block;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1d23;
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f8fafc;
        color: #1a1d23;
      }

      .modal-body {
        flex: 1;
        overflow: auto;
        padding: 1.5rem;
      }

      .query-code {
        margin: 0;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.8125rem;
        line-height: 1.6;
        color: #1a1d23;
        overflow-x: auto;
        white-space: pre;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .btn-secondary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        color: #1a1d23;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      @media (max-width: 768px) {
        .filter-row {
          grid-template-columns: 1fr;
        }

        .advanced-filters-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class QueryBuilderComponent {
  @Input() filters: QueryFilters = {};
  @Input() lastUpdated = 'Just now';
  @Input() dataSource = 'Internal API';
  @Input() advancedFilterKeys: string[] = [];

  @Output() filtersChange = new EventEmitter<QueryFilters>();
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  showAdvancedFilters = false;
  showFullQuery = false;

  onFilterChange(): void {
    this.filtersChange.emit(this.filters);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onSave(): void {
    this.save.emit();
  }

  getQueryPreview(): string {
    const parts: string[] = [];
    if (this.filters.company) {
      parts.push(`company:${this.filters.company}`);
    }
    if (this.filters.geography) {
      parts.push(`geo:${this.filters.geography}`);
    }
    if (this.filters.segment) {
      parts.push(`seg:${this.filters.segment}`);
    }
    return parts.length > 0 ? parts.join(' | ') : 'No filters applied';
  }

  getFullQuery(): string {
    return JSON.stringify(this.filters, null, 2);
  }

  async copyQuery(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.getFullQuery());
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy query:', err);
    }
  }
}
