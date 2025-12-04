/**
 * Search Utilities
 *
 * Advanced search utilities including fuzzy search, highlighting, and ranking.
 *
 * @example
 * ```typescript
 * import { fuzzySearch, highlight, searchRank } from '@osi-cards/utils';
 *
 * const results = fuzzySearch(items, 'query', item => item.name);
 * const highlighted = highlight(text, 'search');
 * ```
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: number[];
}

/**
 * Fuzzy search
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): SearchResult<T>[] {
  const results: SearchResult<T>[] = [];
  const lowerQuery = query.toLowerCase();

  items.forEach((item) => {
    const text = getText(item).toLowerCase();
    const score = fuzzyMatch(text, lowerQuery);

    if (score > 0) {
      results.push({
        item,
        score,
        matches: [],
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Fuzzy match score
 */
function fuzzyMatch(text: string, query: string): number {
  let score = 0;
  let queryIndex = 0;
  let lastMatchIndex = -1;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 1;

      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        score += 5;
      }

      // Bonus for start of word
      if (i === 0 || text[i - 1] === ' ') {
        score += 10;
      }

      lastMatchIndex = i;
      queryIndex++;
    }
  }

  // If not all query characters matched, return 0
  if (queryIndex < query.length) {
    return 0;
  }

  return score;
}

/**
 * Simple search (contains)
 */
export function simpleSearch<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  const lowerQuery = query.toLowerCase();
  return items.filter((item) => {
    const text = getText(item).toLowerCase();
    return text.includes(lowerQuery);
  });
}

/**
 * Multi-field search
 */
export function multiFieldSearch<T>(
  items: T[],
  query: string,
  fields: Array<(item: T) => string>
): T[] {
  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    return fields.some((getField) => {
      const text = getField(item).toLowerCase();
      return text.includes(lowerQuery);
    });
  });
}

/**
 * Highlight matches in text
 */
export function highlight(text: string, query: string, className = 'highlight'): string {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search rank (for sorting)
 */
export function searchRank<T>(item: T, query: string, getText: (item: T) => string): number {
  const text = getText(item).toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (text === lowerQuery) return 1000;

  // Starts with
  if (text.startsWith(lowerQuery)) return 500;

  // Word starts with
  if (text.includes(' ' + lowerQuery)) return 250;

  // Contains
  if (text.includes(lowerQuery)) return 100;

  // Fuzzy match
  return fuzzyMatch(text, lowerQuery);
}

/**
 * Search and rank
 */
export function searchAndRank<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  return items
    .map((item) => ({
      item,
      rank: searchRank(item, query, getText),
    }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .map(({ item }) => item);
}

/**
 * Filter by multiple criteria
 */
export function filterByCriteria<T>(items: T[], criteria: Array<(item: T) => boolean>): T[] {
  return items.filter((item) => criteria.every((criterion) => criterion(item)));
}

/**
 * Search with debounce
 */
export function createDebouncedSearch<T>(
  searchFn: (query: string) => T[],
  delay = 300
): (query: string, callback: (results: T[]) => void) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (query: string, callback: (results: T[]) => void) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      const results = searchFn(query);
      callback(results);
    }, delay);
  };
}
