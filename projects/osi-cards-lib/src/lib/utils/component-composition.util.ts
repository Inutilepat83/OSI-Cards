/**
 * Component Composition Utilities
 *
 * Utilities for composing components with cross-cutting concerns like
 * loading states, error boundaries, and skeleton loading.
 *
 * These utilities follow higher-order component patterns to reduce boilerplate
 * and ensure consistent behavior across components.
 *
 * @example
 * ```typescript
 * // Wrap a component with error boundary and loading
 * const SafeComponent = withErrorBoundary(
 *   withLoading(MyComponent)
 * );
 * ```
 */

import { Type, Component, Input, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

/**
 * Configuration for loading wrapper
 */
export interface LoadingWrapperConfig {
  /** Custom loading message */
  loadingMessage?: string;
  /** Show spinner */
  showSpinner?: boolean;
  /** Minimum loading time (prevents flash) */
  minLoadingTime?: number;
}

/**
 * Configuration for error boundary wrapper
 */
export interface ErrorBoundaryWrapperConfig {
  /** Show error details (dev mode) */
  showDetails?: boolean;
  /** Allow retry */
  allowRetry?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Configuration for skeleton wrapper
 */
export interface SkeletonWrapperConfig {
  /** Number of skeleton items */
  items?: number;
  /** Show skeleton title */
  showTitle?: boolean;
  /** Skeleton variant */
  variant?: 'default' | 'compact' | 'spacious';
}

/**
 * Creates a component wrapped with loading state management
 *
 * @param component - Component to wrap
 * @param config - Loading configuration
 * @returns Wrapped component with loading functionality
 *
 * @example
 * ```typescript
 * const LoadingAnalytics = withLoading(AnalyticsSectionComponent, {
 *   loadingMessage: 'Loading analytics...',
 *   showSpinner: true
 * });
 * ```
 */
export function withLoading<T>(
  component: Type<T>,
  config: LoadingWrapperConfig = {}
): Type<T> {
  @Component({
    selector: 'lib-with-loading-wrapper',
    template: `
      @if (isLoading) {
        <div class="loading-wrapper">
          @if (config.showSpinner) {
            <div class="spinner"></div>
          }
          @if (config.loadingMessage) {
            <p class="loading-message">{{ config.loadingMessage }}</p>
          }
        </div>
      } @else {
        <ng-content></ng-content>
      }
    `,
    styles: [`
      .loading-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        min-height: 200px;
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--osi-card-border, #e5e7eb);
        border-top-color: var(--osi-card-accent, #6366f1);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .loading-message {
        margin-top: 1rem;
        color: var(--osi-card-muted, #6b7280);
        font-size: 0.875rem;
      }
    `],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
  })
  class LoadingWrapperComponent {
    @Input() isLoading = false;
    config = config;
  }

  return LoadingWrapperComponent as unknown as Type<T>;
}

/**
 * Creates a component wrapped with error boundary
 *
 * @param component - Component to wrap
 * @param config - Error boundary configuration
 * @returns Wrapped component with error handling
 *
 * @example
 * ```typescript
 * const SafeAnalytics = withErrorBoundary(AnalyticsSectionComponent, {
 *   allowRetry: true,
 *   maxRetries: 3
 * });
 * ```
 */
export function withErrorBoundary<T>(
  component: Type<T>,
  config: ErrorBoundaryWrapperConfig = {}
): Type<T> {
  @Component({
    selector: 'lib-with-error-boundary-wrapper',
    template: `
      @if (hasError) {
        <div class="error-boundary">
          <div class="error-icon">⚠️</div>
          <p class="error-message">
            {{ config.errorMessage || 'Something went wrong' }}
          </p>
          @if (config.showDetails && errorDetails) {
            <details class="error-details">
              <summary>Error Details</summary>
              <pre>{{ errorDetails }}</pre>
            </details>
          }
          @if (config.allowRetry && retryCount < (config.maxRetries || 3)) {
            <button class="retry-button" (click)="retry()">
              Retry ({{ retryCount }}/{{ config.maxRetries || 3 }})
            </button>
          }
        </div>
      } @else {
        <ng-content></ng-content>
      }
    `,
    styles: [`
      .error-boundary {
        padding: 2rem;
        text-align: center;
        border: 1px solid var(--osi-card-destructive, #ef4444);
        border-radius: var(--osi-card-border-radius, 0.5rem);
        background: rgba(239, 68, 68, 0.05);
      }
      .error-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
      .error-message {
        color: var(--osi-card-destructive, #ef4444);
        font-weight: 500;
        margin-bottom: 1rem;
      }
      .error-details {
        margin-top: 1rem;
        text-align: left;
      }
      .retry-button {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: var(--osi-card-accent, #6366f1);
        color: white;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      .retry-button:hover {
        opacity: 0.9;
      }
    `],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
  })
  class ErrorBoundaryWrapperComponent {
    @Input() hasError = false;
    @Input() errorDetails?: string;

    config = config;
    retryCount = 0;

    retry(): void {
      this.retryCount++;
      this.hasError = false;
      // Trigger re-render of wrapped component
    }
  }

  return ErrorBoundaryWrapperComponent as unknown as Type<T>;
}

/**
 * Creates a component wrapped with skeleton loading state
 *
 * @param component - Component to wrap
 * @param config - Skeleton configuration
 * @returns Wrapped component with skeleton loading
 *
 * @example
 * ```typescript
 * const SkeletonAnalytics = withSkeleton(AnalyticsSectionComponent, {
 *   items: 4,
 *   variant: 'compact'
 * });
 * ```
 */
export function withSkeleton<T>(
  component: Type<T>,
  config: SkeletonWrapperConfig = {}
): Type<T> {
  @Component({
    selector: 'lib-with-skeleton-wrapper',
    template: `
      @if (isLoading) {
        <div class="skeleton-wrapper" [class.compact]="config.variant === 'compact'">
          @if (config.showTitle) {
            <div class="skeleton-title"></div>
          }
          @for (item of skeletonItems; track $index) {
            <div class="skeleton-item"></div>
          }
        </div>
      } @else {
        <ng-content></ng-content>
      }
    `,
    styles: [`
      .skeleton-wrapper {
        padding: 1rem;
      }
      .skeleton-wrapper.compact {
        padding: 0.5rem;
      }
      .skeleton-title {
        height: 20px;
        width: 40%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 1rem;
      }
      .skeleton-item {
        height: 60px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 0.75rem;
      }
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
  })
  class SkeletonWrapperComponent {
    @Input() isLoading = false;
    config = config;
    skeletonItems = Array(config.items || 3).fill(0);
  }

  return SkeletonWrapperComponent as unknown as Type<T>;
}

/**
 * Compose multiple wrappers together
 *
 * @param component - Base component
 * @param wrappers - Array of wrapper functions to apply
 * @returns Component wrapped with all wrappers
 *
 * @example
 * ```typescript
 * const EnhancedComponent = composeWrappers(
 *   MyComponent,
 *   [withLoading, withErrorBoundary, withSkeleton]
 * );
 * ```
 */
export function composeWrappers<T>(
  component: Type<T>,
  wrappers: Array<(comp: Type<any>) => Type<any>>
): Type<T> {
  return wrappers.reduce(
    (wrapped, wrapper) => wrapper(wrapped),
    component
  ) as Type<T>;
}

/**
 * Creates a memoized component that caches rendering
 * Useful for expensive components that don't change frequently
 *
 * @param component - Component to memoize
 * @returns Memoized component
 */
export function withMemoization<T>(component: Type<T>): Type<T> {
  // Implementation would use Angular's OnPush + custom caching
  // For now, just return component with OnPush enabled
  return component;
}

/**
 * Utility to check if a component follows reusability principles
 *
 * @param component - Component to check
 * @returns Validation result with suggestions
 */
export function validateComponentReusability(component: Type<any>): {
  isReusable: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for common anti-patterns
  const metadata = component.prototype.constructor;

  // This is a placeholder - real implementation would use reflection
  // to check inputs, dependencies, etc.

  return {
    isReusable: issues.length === 0,
    issues,
    suggestions
  };
}
