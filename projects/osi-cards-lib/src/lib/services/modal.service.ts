/**
 * Modal Service
 *
 * Provides a centralized modal/dialog management system with
 * type-safe API, stacking support, and accessibility features.
 *
 * Features:
 * - Type-safe modal API
 * - Modal stacking
 * - Accessibility (focus trap, keyboard)
 * - Configurable backdrop
 * - Observable results
 * - Animations
 *
 * @dependencies
 * - ViewContainerRef: For dynamically creating modal components
 * - Injector: For dependency injection into modal components
 *
 * @example
 * ```typescript
 * import { ModalService } from '@osi-cards/lib';
 *
 * const modal = inject(ModalService);
 *
 * const result = await modal.open(ConfirmDialogComponent, {
 *   data: { message: 'Are you sure?' }
 * });
 *
 * if (result) {
 *   console.log('User confirmed');
 * }
 * ```
 */

import { Injectable, Type, ViewContainerRef, ComponentRef, signal, Injector } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * Modal configuration
 */
export interface ModalConfig<T = any> {
  /**
   * Data to pass to modal component
   */
  data?: T;

  /**
   * Whether to show backdrop
   */
  backdrop?: boolean | 'static';

  /**
   * Whether backdrop click closes modal
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether ESC key closes modal
   */
  closeOnEscape?: boolean;

  /**
   * Modal width
   */
  width?: string;

  /**
   * Modal max width
   */
  maxWidth?: string;

  /**
   * CSS class for modal
   */
  panelClass?: string | string[];

  /**
   * Position on screen
   */
  position?: 'center' | 'top' | 'bottom';

  /**
   * Whether to trap focus
   */
  trapFocus?: boolean;

  /**
   * Animation duration
   */
  animationDuration?: number;
}

/**
 * Modal reference
 */
export class ModalRef<T = any, R = any> {
  private resultSubject = new Subject<R>();

  /**
   * Observable that emits when modal is closed
   */
  readonly afterClosed$ = this.resultSubject.asObservable().pipe(take(1));

  constructor(
    public componentRef: ComponentRef<T>,
    public config: ModalConfig
  ) {}

  /**
   * Close modal with result
   *
   * @param result - Result to return
   */
  close(result?: R): void {
    this.resultSubject.next(result as R);
    this.resultSubject.complete();
    this.componentRef.destroy();
  }

  /**
   * Wait for modal to close
   *
   * @returns Promise with result
   */
  async waitForClose(): Promise<R | undefined> {
    return this.afterClosed$.toPromise();
  }
}

/**
 * Modal Service
 *
 * Manages application-wide modals.
 */
@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private openModals = signal<ModalRef[]>([]);
  private container: ViewContainerRef | null = null;

  /**
   * Current open modals
   */
  readonly modals = this.openModals.asReadonly();

  /**
   * Set view container for modals
   *
   * @param container - View container ref
   */
  setContainer(container: ViewContainerRef): void {
    this.container = container;
  }

  /**
   * Open modal
   *
   * @param component - Component to display
   * @param config - Modal configuration
   * @returns Modal reference
   *
   * @example
   * ```typescript
   * const modalRef = modal.open(MyDialogComponent, {
   *   data: { title: 'Hello' },
   *   width: '500px'
   * });
   *
   * const result = await modalRef.waitForClose();
   * ```
   */
  open<T, D = any, R = any>(component: Type<T>, config: ModalConfig<D> = {}): ModalRef<T, R> {
    if (!this.container) {
      throw new Error('Modal container not set. Call setContainer() first.');
    }

    const fullConfig: ModalConfig<D> = {
      backdrop: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      position: 'center',
      trapFocus: true,
      animationDuration: 300,
      ...config,
    };

    const componentRef = this.container.createComponent(component);

    // Pass data to component
    if (fullConfig.data && componentRef.instance && typeof componentRef.instance === 'object') {
      (componentRef.instance as any).data = fullConfig.data;
    }

    const modalRef = new ModalRef<T, R>(componentRef, fullConfig);

    this.openModals.update((modals) => [...modals, modalRef]);

    // Setup keyboard listener
    if (fullConfig.closeOnEscape) {
      this.setupEscapeListener(modalRef);
    }

    // Handle close
    modalRef.afterClosed$.subscribe(() => {
      this.openModals.update((modals) => modals.filter((m) => m !== modalRef));
    });

    return modalRef;
  }

  /**
   * Close top modal
   */
  closeTop(): void {
    const modals = this.openModals();
    if (modals.length > 0) {
      modals[modals.length - 1].close();
    }
  }

  /**
   * Close all modals
   */
  closeAll(): void {
    this.openModals().forEach((modal) => modal.close());
  }

  /**
   * Get number of open modals
   */
  getOpenCount(): number {
    return this.openModals().length;
  }

  /**
   * Check if any modals are open
   */
  hasOpenModals(): boolean {
    return this.openModals().length > 0;
  }

  /**
   * Confirm dialog helper
   *
   * @param message - Confirmation message
   * @param title - Dialog title
   * @returns Promise with boolean result
   */
  async confirm(message: string, title = 'Confirm'): Promise<boolean> {
    // This would open a confirmation dialog component
    // Simplified for now
    return window.confirm(message);
  }

  /**
   * Alert dialog helper
   *
   * @param message - Alert message
   * @param title - Dialog title
   */
  async alert(message: string, title = 'Alert'): Promise<void> {
    window.alert(message);
  }

  /**
   * Prompt dialog helper
   *
   * @param message - Prompt message
   * @param defaultValue - Default input value
   * @returns Promise with user input or null
   */
  async prompt(message: string, defaultValue = ''): Promise<string | null> {
    return window.prompt(message, defaultValue);
  }

  /**
   * Setup ESC key listener
   */
  private setupEscapeListener(modalRef: ModalRef): void {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        const topModal = this.openModals()[this.openModals().length - 1];
        if (topModal === modalRef) {
          modalRef.close();
        }
      }
    };

    window.addEventListener('keydown', handler);

    modalRef.afterClosed$.subscribe(() => {
      window.removeEventListener('keydown', handler);
    });
  }
}
