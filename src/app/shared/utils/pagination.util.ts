/**
 * Pagination utilities
 * Implements pagination for card lists instead of loading all cards at once
 */

export interface PaginationOptions {
  pageSize: number;
  currentPage?: number;
}

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginate an array
 */
export function paginate<T>(items: T[], options: PaginationOptions): PaginationResult<T> {
  const { pageSize, currentPage = 1 } = options;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Pagination helper class
 */
export class Paginator<T> {
  private items: T[] = [];
  private currentPage = 1;
  private pageSize: number;

  constructor(pageSize = 10) {
    this.pageSize = pageSize;
  }

  /**
   * Set items to paginate
   */
  setItems(items: T[]): void {
    this.items = items;
    this.currentPage = 1;
  }

  /**
   * Get current page
   */
  getCurrentPage(): PaginationResult<T> {
    return paginate(this.items, {
      pageSize: this.pageSize,
      currentPage: this.currentPage,
    });
  }

  /**
   * Go to next page
   */
  nextPage(): PaginationResult<T> | null {
    const result = this.getCurrentPage();
    if (result.hasNextPage) {
      this.currentPage++;
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Go to previous page
   */
  previousPage(): PaginationResult<T> | null {
    const result = this.getCurrentPage();
    if (result.hasPreviousPage) {
      this.currentPage--;
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): PaginationResult<T> | null {
    const totalPages = Math.ceil(this.items.length / this.pageSize);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Set page size
   */
  setPageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
}
