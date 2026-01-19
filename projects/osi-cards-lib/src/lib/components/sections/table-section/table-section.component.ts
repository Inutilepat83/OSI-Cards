import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Table Section Component
 *
 * Displays tabular data with sorting, filtering, and pagination capabilities.
 * Perfect for displaying structured data in rows and columns.
 */
@Component({
  selector: 'lib-table-section',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './table-section.component.html',
  styleUrl: './table-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  // Search/filter state
  searchQuery = signal<string>('');

  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Pagination state
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('table', (section: CardSection, availableColumns: number) => {
      return this.calculateTableLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Get table data from section
   */
  get tableData() {
    return (this.section as any).tableData;
  }

  /**
   * Get columns from table data
   */
  get columns() {
    return this.tableData?.columns || [];
  }

  /**
   * Get all rows from table data
   */
  get allRows() {
    return this.tableData?.rows || [];
  }

  /**
   * Filter rows based on search query
   */
  private filterRows(rows: any[]): any[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return this.columns.some((col: any) => {
        const value = row[col.key];
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }

  /**
   * Sort rows based on current sort column and direction
   */
  private sortRows(rows: any[]): any[] {
    const columnKey = this.sortColumn();
    if (!columnKey) {
      return rows;
    }

    const column = this.columns.find((col: any) => col.key === columnKey);
    if (!column || !column.sortable) {
      return rows;
    }

    const direction = this.sortDirection();
    const sorted = [...rows].sort((a, b) => {
      const aValue = a[columnKey];
      const bValue = b[columnKey];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) {
        return direction === 'asc' ? 1 : -1;
      }
      if (bValue === null || bValue === undefined) {
        return direction === 'asc' ? -1 : 1;
      }

      // Sort based on column type
      if (column.type === 'number') {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      if (column.type === 'date') {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (column.type === 'boolean') {
        const boolA = Boolean(aValue);
        const boolB = Boolean(bValue);
        if (boolA === boolB) return 0;
        return direction === 'asc' ? (boolA ? 1 : -1) : boolA ? -1 : 1;
      }

      // Default: string comparison
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get filtered and sorted rows
   */
  filteredAndSortedRows = computed(() => {
    let rows = this.allRows;
    rows = this.filterRows(rows);
    rows = this.sortRows(rows);
    return rows;
  });

  /**
   * Get paginated rows
   */
  paginatedRows = computed(() => {
    const rows = this.filteredAndSortedRows();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return rows.slice(start, end);
  });

  /**
   * Get total pages
   */
  totalPages = computed(() => {
    const total = this.filteredAndSortedRows().length;
    return Math.ceil(total / this.itemsPerPage());
  });

  /**
   * Get total filtered items
   */
  totalFilteredItems = computed(() => {
    return this.filteredAndSortedRows().length;
  });

  /**
   * Handle column header click for sorting
   */
  onColumnHeaderClick(column: any): void {
    if (!column.sortable) {
      return;
    }

    const currentSortColumn = this.sortColumn();
    if (currentSortColumn === column.key) {
      // Toggle direction
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      this.sortColumn.set(column.key);
      this.sortDirection.set('asc');
    }

    // Reset to first page when sorting changes
    this.currentPage.set(1);
  }

  /**
   * Get sort indicator for column
   */
  getSortIndicator(column: any): string {
    if (this.sortColumn() !== column.key) {
      return '';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  /**
   * Check if column is currently sorted
   */
  isColumnSorted(column: any): boolean {
    return this.sortColumn() === column.key;
  }

  /**
   * Handle search input change
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    // Reset to first page when search changes
    this.currentPage.set(1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  /**
   * Get page numbers for pagination display
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (current > 3) {
        pages.push(-1); // Ellipsis
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push(-1); // Ellipsis
      }

      // Show last page
      pages.push(total);
    }

    return pages;
  }

  /**
   * Format cell value based on column type
   */
  formatCellValue(value: any, column: any): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (column.type === 'number') {
      return Number(value).toLocaleString();
    }

    if (column.type === 'date') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return String(value);
      }
    }

    if (column.type === 'boolean') {
      return Boolean(value) ? 'Yes' : 'No';
    }

    return String(value);
  }

  /**
   * Calculate layout preferences for table section based on content.
   * Tables need more width, so default to 2-3 columns.
   */
  private calculateTableLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const tableData = (section as any).tableData;
    const columnCount = tableData?.columns?.length || 0;
    const rowCount = tableData?.rows?.length || 0;

    // Tables need more width - default to 2-3 columns
    let preferredColumns: 1 | 2 | 3 | 4 = 2;

    // Expand for wide tables (many columns)
    if (columnCount >= 5) {
      preferredColumns = 3;
    }
    if (columnCount >= 7 && availableColumns >= 4) {
      preferredColumns = 4;
    }

    // Expand for many rows (better viewing experience)
    if (rowCount >= 20 && availableColumns >= 3) {
      preferredColumns = Math.max(preferredColumns, 3) as 1 | 2 | 3 | 4;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 20, // Medium priority for shrinking
      expandOnContent: {
        // Expand based on column/row count
      },
    };
  }

  /**
   * Get layout preferences for table section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateTableLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get display range for pagination info
   */
  getDisplayRange(): string {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.totalFilteredItems());
    return `${start}–${end}`;
  }
}
