import { Injectable } from '@angular/core';

type LogLevel = 'LOG' | 'WARN' | 'ERROR';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  /**
   * Format the log prefix with timestamp, level, and context
   */
  private format(level: LogLevel, context: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}][${level}][${context}]`;
  }

  /**
   * Log informational messages
   */
  log(context: string, message?: any, ...optionalParams: any[]): void {
    console.log(this.format('LOG', context), message, ...optionalParams);
  }

  /**
   * Log warnings
   */
  warn(context: string, message?: any, ...optionalParams: any[]): void {
    console.warn(this.format('WARN', context), message, ...optionalParams);
  }

  /**
   * Log errors
   */
  error(context: string, message?: any, ...optionalParams: any[]): void {
    console.error(this.format('ERROR', context), message, ...optionalParams);
  }
}
