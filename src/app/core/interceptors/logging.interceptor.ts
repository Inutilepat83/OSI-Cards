import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LoggingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!environment.enableDebug) {
      return next.handle(request);
    }

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    this.logger.log('LoggingInterceptor', `HTTP Request [${requestId}]`, {
      method: request.method,
      url: request.url,
      headers: request.headers.keys().reduce((acc, key) => {
        acc[key] = request.headers.get(key);
        return acc;
      }, {} as any),
      body: request.body,
    });

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.log('LoggingInterceptor', `HTTP Response [${requestId}] (${duration}ms)`, {
            status: event.status,
            statusText: event.statusText,
            url: event.url,
            body: event.body,
          });
        }
      })
    );
  }
}
