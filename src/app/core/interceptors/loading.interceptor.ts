import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private loadingState = false;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Increment active requests
    this.activeRequests++;
    this.updateLoadingState();

    return next.handle(request).pipe(
      finalize(() => {
        // Decrement active requests when the request completes
        this.activeRequests--;
        this.updateLoadingState();
      })
    );
  }

  private updateLoadingState(): void {
    const previousState = this.loadingState;
    this.loadingState = this.activeRequests > 0;

    if (previousState !== this.loadingState) {
      // Emit loading state change
      this.emitLoadingStateChange(this.loadingState);
    }
  }

  private emitLoadingStateChange(isLoading: boolean): void {
    // Dispatch custom event for loading state changes
    window.dispatchEvent(
      new CustomEvent('loadingStateChange', {
        detail: { isLoading, activeRequests: this.activeRequests },
      })
    );
  }

  public getActiveRequestsCount(): number {
    return this.activeRequests;
  }

  public isLoading(): boolean {
    return this.loadingState;
  }
}
