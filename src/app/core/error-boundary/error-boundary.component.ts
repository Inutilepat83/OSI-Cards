/**
 * Error Boundary Component - Core Re-export
 *
 * This file re-exports the ErrorBoundaryComponent from the library
 * via the shared module. Use this for catching and handling errors
 * in Angular components.
 *
 * @example
 * ```html
 * <app-error-boundary
 *   [fallbackMessage]="'Something went wrong'"
 *   [showRecovery]="true"
 *   (errorCaught)="onError($event)">
 *   <app-potentially-unsafe-component></app-potentially-unsafe-component>
 * </app-error-boundary>
 * ```
 */

// Re-export from library
export { ErrorBoundaryComponent } from '@osi-cards/components';

// Type alias for backwards compatibility
export { ErrorBoundaryComponent as AppErrorBoundaryComponent } from '@osi-cards/components';
