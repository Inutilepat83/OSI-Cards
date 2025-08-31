import { Injectable, Optional } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';

@Injectable()
export class PerformanceMonitoringInterceptor implements HttpInterceptor {
  constructor(@Optional() private performanceService: PerformanceMonitoringService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && this.performanceService) {
          const responseTime = Date.now() - startTime;
          this.performanceService.trackApiResponse(request.url, responseTime);
        }
      })
    );
  }
}
