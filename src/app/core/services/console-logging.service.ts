import { Injectable } from '@angular/core';
import { LoggingService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class ConsoleLoggingService implements LoggingService {
  private readonly isDevelopment = !this.isProduction();

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);

    // In production, you might want to send this to a logging service
    if (this.isProduction() && error) {
      this.sendToLoggingService(message, error, ...args);
    }
  }

  logEvent(event: string, properties?: Record<string, any>): void {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      properties: properties || {},
    };

    if (this.isDevelopment) {
      console.log(`[EVENT] ${event}`, logData);
    }

    // Send to analytics service if in production
    if (this.isProduction()) {
      this.sendEventToAnalytics(logData);
    }
  }

  private isProduction(): boolean {
    return false; // Replace with actual environment check
  }

  private sendToLoggingService(message: string, error: Error, ...args: any[]): void {
    // Implement external logging service integration
    // e.g., Sentry, LogRocket, etc.
    console.log('Would send to external logging service:', { message, error, args });
  }

  private sendEventToAnalytics(logData: any): void {
    // Implement analytics service integration
    // e.g., Google Analytics, Mixpanel, etc.
    console.log('Would send to analytics service:', logData);
  }
}
