/**
 * Unified API Service
 *
 * Single service for all HTTP operations.
 * Provides consistent error handling and request management.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private api = inject(ApiService);
 *
 *   loadCards() {
 *     this.api.get<Card[]>('/api/cards').subscribe(cards => {
 *       this.cards = cards;
 *     });
 *   }
 * }
 * ```
 */

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ErrorTrackingService } from 'osi-cards-lib';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

export interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private errorTracking = inject(ErrorTrackingService);

  private config: ApiConfig = {
    baseUrl: '',
    timeout: 30000, // 30 seconds
    retries: 3,
  };

  /**
   * Configure API service
   */
  configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * GET request
   */
  get<T>(
    url: string,
    options?: {
      params?: HttpParams | Record<string, string | string[]>;
      headers?: HttpHeaders | Record<string, string | string[]>;
    }
  ): Observable<T> {
    const fullUrl = this.buildUrl(url);

    return this.http.get<T>(fullUrl, options).pipe(
      timeout(this.config.timeout!),
      retry(this.config.retries!),
      catchError((error) => this.handleError(error, 'GET', url))
    );
  }

  /**
   * POST request
   */
  post<T>(
    url: string,
    body: any,
    options?: {
      params?: HttpParams | Record<string, string | string[]>;
      headers?: HttpHeaders | Record<string, string | string[]>;
    }
  ): Observable<T> {
    const fullUrl = this.buildUrl(url);

    return this.http.post<T>(fullUrl, body, options).pipe(
      timeout(this.config.timeout!),
      retry(this.config.retries!),
      catchError((error) => this.handleError(error, 'POST', url))
    );
  }

  /**
   * PUT request
   */
  put<T>(
    url: string,
    body: any,
    options?: {
      params?: HttpParams | Record<string, string | string[]>;
      headers?: HttpHeaders | Record<string, string | string[]>;
    }
  ): Observable<T> {
    const fullUrl = this.buildUrl(url);

    return this.http.put<T>(fullUrl, body, options).pipe(
      timeout(this.config.timeout!),
      retry(this.config.retries!),
      catchError((error) => this.handleError(error, 'PUT', url))
    );
  }

  /**
   * DELETE request
   */
  delete<T>(
    url: string,
    options?: {
      params?: HttpParams | Record<string, string | string[]>;
      headers?: HttpHeaders | Record<string, string | string[]>;
    }
  ): Observable<T> {
    const fullUrl = this.buildUrl(url);

    return this.http.delete<T>(fullUrl, options).pipe(
      timeout(this.config.timeout!),
      retry(this.config.retries!),
      catchError((error) => this.handleError(error, 'DELETE', url))
    );
  }

  /**
   * Build full URL
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.config.baseUrl}${url}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse, method: string, url: string): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error ${error.status}: ${error.message}`;
    }

    // Track error
    const errorToTrack = error instanceof Error ? error : new Error(errorMessage);
    this.errorTracking.track(errorToTrack, {
      component: 'ApiService',
      severity: 'high',
      context: { action: method, url, status: error.status },
    });

    console.error(`[ApiService] ${method} ${url}:`, errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Check if request is in progress
   */
  isLoading(): boolean {
    // Can be enhanced with loading state tracking
    return false;
  }
}
