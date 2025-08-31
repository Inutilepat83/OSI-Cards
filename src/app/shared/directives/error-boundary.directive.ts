import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ComponentRef,
  ViewContainerRef,
  ComponentFactoryResolver,
  OnInit,
  OnDestroy,
  ErrorHandler,
} from '@angular/core';
import { ErrorBoundaryComponent } from '../../shared/components/error-boundary/error-boundary.component';
import { LoggingService } from '../../core/services/logging.service';

@Directive({
  selector: '[appErrorBoundary]',
})
export class ErrorBoundaryDirective implements OnInit, OnDestroy {
  @Input() errorTitle = 'Something went wrong';
  @Input() errorMessage = 'We encountered an unexpected error. Please try again.';
  @Input() showRetry = true;
  @Input() showDetails = true;

  @Output() errorOccurred = new EventEmitter<Error>();
  @Output() retryClicked = new EventEmitter<void>();

  private errorBoundaryRef: ComponentRef<ErrorBoundaryComponent> | null = null;
  private originalErrorHandler: ErrorHandler | null = null;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private errorHandler: ErrorHandler,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // Wrap the error handler to catch errors in this component tree
    this.originalErrorHandler = this.errorHandler;
    this.errorHandler = {
      handleError: (error: any) => {
        this.handleError(error);
      },
    } as ErrorHandler;
  }

  ngOnDestroy(): void {
    // Restore original error handler
    if (this.originalErrorHandler) {
      // Note: In a real implementation, you'd need to restore the global error handler
      // This is a simplified version
    }

    if (this.errorBoundaryRef) {
      this.errorBoundaryRef.destroy();
    }
  }

  private handleError(error: any): void {
    this.logger.error('ErrorBoundaryDirective', 'Error caught by error boundary', error);

    // Extract the actual error
    const actualError = error?.rejection || error?.error || error;

    // Emit error event
    this.errorOccurred.emit(actualError);

    // Show error boundary component
    this.showErrorBoundary(actualError);

    // Call original error handler for global handling
    if (this.originalErrorHandler) {
      this.originalErrorHandler.handleError(error);
    }
  }

  private showErrorBoundary(error: Error): void {
    // Clear existing content
    this.viewContainerRef.clear();

    // Create error boundary component
    const factory = this.componentFactoryResolver.resolveComponentFactory(ErrorBoundaryComponent);
    this.errorBoundaryRef = this.viewContainerRef.createComponent(factory);

    // Configure the error boundary
    const instance = this.errorBoundaryRef.instance;
    instance.errorTitle = this.errorTitle;
    instance.errorMessage = this.errorMessage;
    instance.showRetry = this.showRetry;
    instance.showDetails = this.showDetails;
    instance.setError(error);

    // Handle retry
    instance.retryClicked.subscribe(() => {
      this.retryClicked.emit();
      this.hideErrorBoundary();
    });
  }

  private hideErrorBoundary(): void {
    if (this.errorBoundaryRef) {
      this.errorBoundaryRef.destroy();
      this.errorBoundaryRef = null;
    }

    // Clear the view container to allow original content to be re-rendered
    this.viewContainerRef.clear();
  }
}
