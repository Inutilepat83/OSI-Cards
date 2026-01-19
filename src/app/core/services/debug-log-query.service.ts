import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

/**
 * Debug Log Entry structure (matches NDJSON format from debug-log-server)
 */
export interface DebugLogEntry {
  location: string;
  message: string;
  data?: any;
  timestamp: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

/**
 * Filter options for querying logs
 */
export interface DebugLogFilters {
  location?: string;
  message?: string;
  hypothesisId?: string | string[];
  sessionId?: string | string[];
  runId?: string | string[];
  timestampMin?: number;
  timestampMax?: number;
  data?: Record<string, number | { min?: number; max?: number; value?: number; operator?: string }>;
}

/**
 * Aggregation options
 */
export interface AggregationOptions {
  groupBy: 'location' | 'hypothesisId' | 'sessionId' | 'runId' | 'message';
  sum?: boolean;
  avg?: boolean;
  dataField?: string;
}

/**
 * Query options
 */
export interface DebugLogQueryOptions {
  filters?: DebugLogFilters;
  search?: string;
  aggregate?: AggregationOptions;
  limit?: number;
  offset?: number;
}

/**
 * Aggregation result
 */
export interface AggregationResult {
  groups: Record<string, { count: number; sum?: number; avg?: number; min?: number; max?: number }>;
  total: number;
}

/**
 * Query result
 */
export interface DebugLogQueryResult {
  logs: DebugLogEntry[];
  total: number;
  filtered: number;
  aggregation?: AggregationResult;
  queryTime: number;
}

/**
 * Debug Log Query Service
 *
 * Service for querying debug logs from the debug-log-server HTTP API.
 * Provides typed methods for filtering, searching, and aggregating logs.
 *
 * @example
 * ```typescript
 * const queryService = inject(DebugLogQueryService);
 *
 * // Filter by hypothesis ID
 * queryService.filterByHypothesisId('STREAM_START').subscribe(logs => {
 *   console.log('Filtered logs:', logs);
 * });
 *
 * // Complex query
 * queryService.query({
 *   filters: { hypothesisId: 'STREAM_SECTION', location: 'streaming.service.ts' },
 *   search: 'card update',
 *   limit: 50
 * }).subscribe(result => {
 *   console.log('Results:', result.logs);
 *   console.log('Total:', result.total);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class DebugLogQueryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:7242';

  /**
   * Query logs with filters, search, and aggregation
   */
  query(options: DebugLogQueryOptions): Observable<DebugLogQueryResult> {
    let params = new HttpParams();

    // Add filters to query params
    if (options.filters) {
      if (options.filters.hypothesisId) {
        const ids = Array.isArray(options.filters.hypothesisId)
          ? options.filters.hypothesisId.join(',')
          : options.filters.hypothesisId;
        params = params.set('hypothesisId', ids);
      }
      if (options.filters.sessionId) {
        const ids = Array.isArray(options.filters.sessionId)
          ? options.filters.sessionId.join(',')
          : options.filters.sessionId;
        params = params.set('sessionId', ids);
      }
      if (options.filters.runId) {
        const ids = Array.isArray(options.filters.runId)
          ? options.filters.runId.join(',')
          : options.filters.runId;
        params = params.set('runId', ids);
      }
      if (options.filters.location) {
        params = params.set('location', options.filters.location);
      }
      if (options.filters.message) {
        params = params.set('message', options.filters.message);
      }
      if (options.filters.timestampMin !== undefined) {
        params = params.set('timestampMin', options.filters.timestampMin.toString());
      }
      if (options.filters.timestampMax !== undefined) {
        params = params.set('timestampMax', options.filters.timestampMax.toString());
      }
      if (options.filters.data) {
        for (const [fieldPath, fieldFilter] of Object.entries(options.filters.data)) {
          const key = `data.${fieldPath}`;
          if (typeof fieldFilter === 'number') {
            params = params.set(key, fieldFilter.toString());
          } else if (fieldFilter) {
            if (fieldFilter.min !== undefined) {
              params = params.set(`${key}.min`, fieldFilter.min.toString());
            }
            if (fieldFilter.max !== undefined) {
              params = params.set(`${key}.max`, fieldFilter.max.toString());
            }
            if (fieldFilter.value !== undefined) {
              params = params.set(key, fieldFilter.value.toString());
            }
            if (fieldFilter.operator && fieldFilter.value !== undefined) {
              params = params.set(key, `${fieldFilter.operator} ${fieldFilter.value}`);
            }
          }
        }
      }
    }

    // Add search
    if (options.search) {
      params = params.set('search', options.search);
    }

    // Add pagination
    if (options.limit !== undefined) {
      params = params.set('limit', options.limit.toString());
    }
    if (options.offset !== undefined) {
      params = params.set('offset', options.offset.toString());
    }

    // Add aggregation
    if (options.aggregate) {
      params = params.set('aggregate', options.aggregate.groupBy);
      if (options.aggregate.sum) {
        params = params.set('aggregateSum', 'true');
      }
      if (options.aggregate.avg) {
        params = params.set('aggregateAvg', 'true');
      }
      if (options.aggregate.dataField) {
        params = params.set('aggregateDataField', options.aggregate.dataField);
      }
    }

    return this.http.get<DebugLogQueryResult>(`${this.baseUrl}/query`, { params });
  }

  /**
   * Filter logs by hypothesis ID
   */
  filterByHypothesisId(id: string | string[]): Observable<DebugLogEntry[]> {
    return this.query({
      filters: { hypothesisId: id },
    }).pipe(map((result) => result.logs));
  }

  /**
   * Filter logs by location (substring match)
   */
  filterByLocation(location: string): Observable<DebugLogEntry[]> {
    return this.query({
      filters: { location },
    }).pipe(map((result) => result.logs));
  }

  /**
   * Filter logs by session ID
   */
  filterBySessionId(sessionId: string | string[]): Observable<DebugLogEntry[]> {
    return this.query({
      filters: { sessionId },
    }).pipe(map((result) => result.logs));
  }

  /**
   * Filter logs by run ID
   */
  filterByRunId(runId: string | string[]): Observable<DebugLogEntry[]> {
    return this.query({
      filters: { runId },
    }).pipe(map((result) => result.logs));
  }

  /**
   * Filter logs by data field using dot notation
   */
  filterByDataField(
    fieldPath: string,
    value: number | { min?: number; max?: number }
  ): Observable<DebugLogEntry[]> {
    return this.query({
      filters: {
        data: {
          [fieldPath]: typeof value === 'number' ? { value } : value,
        },
      },
    }).pipe(map((result) => result.logs));
  }

  /**
   * Search logs by text (searches in message and data)
   */
  search(text: string): Observable<DebugLogEntry[]> {
    return this.query({
      search: text,
    }).pipe(map((result) => result.logs));
  }

  /**
   * Aggregate logs by field
   */
  aggregate(
    field: 'location' | 'hypothesisId' | 'sessionId' | 'runId' | 'message',
    dataField?: string
  ): Observable<AggregationResult> {
    return this.query({
      aggregate: {
        groupBy: field,
        dataField,
      },
    }).pipe(
      map((result) => {
        if (!result.aggregation) {
          return { groups: {}, total: 0 };
        }
        return result.aggregation;
      })
    );
  }

  /**
   * Get all logs (with optional limit)
   */
  getAll(limit?: number): Observable<DebugLogEntry[]> {
    return this.query({ limit }).pipe(map((result) => result.logs));
  }
}
