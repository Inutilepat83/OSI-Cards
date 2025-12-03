/**
 * Pagination Utilities
 *
 * Utilities for pagination logic and calculations.
 *
 * @example
 * ```typescript
 * import { paginate, getPaginationInfo } from '@osi-cards/utils';
 *
 * const page = paginate(items, 1, 10);
 * const info = getPaginationInfo(100, 1, 10);
 * ```
 */

export interface PaginationInfo {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  info: PaginationInfo;
}

/**
 * Paginate array
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

/**
 * Get pagination info
 */
export function getPaginationInfo(
  totalItems: number,
  currentPage: number,
  pageSize: number
): PaginationInfo {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

/**
 * Paginate with info
 */
export function paginateWithInfo<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    data: paginate(items, page, pageSize),
    info: getPaginationInfo(items.length, page, pageSize),
  };
}

/**
 * Get page numbers
 */
export function getPageNumbers(totalPages: number, currentPage: number, maxButtons = 5): number[] {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxButtons / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = maxButtons;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxButtons + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Get offset and limit
 */
export function getOffsetLimit(page: number, pageSize: number): { offset: number; limit: number } {
  return {
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

/**
 * Calculate page from offset
 */
export function getPageFromOffset(offset: number, pageSize: number): number {
  return Math.floor(offset / pageSize) + 1;
}

