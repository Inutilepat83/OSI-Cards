import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, finalize, retry, timeout } from 'rxjs/operators';
import { ILoggerService, LogLevel } from '../interfaces/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LoggerService implements ILoggerService {
  private logLevel: LogLevel = 'info';
  private logs$ = new Subject<LogEntry>();
  private readonly context: string;

  constructor() {
    this.context = 'App';
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, data);
    }
  }

  error(message: string, error?: any, data?: any): void {
    if (this.shouldLog('error')) {
      this.log('error', message, { error, data });
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  createChildLogger(context: string): ILoggerService {
    const childLogger = new LoggerService();
    (childLogger as any).context = `${this.context}:${context}`;
    (childLogger as any).logLevel = this.logLevel;
    return childLogger;
  }

  getLogs(): Observable<LogEntry> {
    return this.logs$.asObservable();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      timestamp: new Date(),
      data,
    };

    this.logs$.next(entry);

    // Console logging
    const consoleMethod = this.getConsoleMethod(level);
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${this.context}]`;

    if (data) {
      consoleMethod(prefix, message, data);
    } else {
      consoleMethod(prefix, message);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: string;
  timestamp: Date;
  data?: any;
}

// Enhanced HTTP error handling
@Injectable({
  providedIn: 'root',
})
export class EnhancedErrorHandlerService {
  private readonly logger: ILoggerService;

  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.createChildLogger('ErrorHandler');
  }

  handleHttpError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      this.logger.error(`${operation} failed`, error);

      // Enhanced error reporting
      if (error.status === 0) {
        this.logger.error('Network error - check internet connection');
      } else if (error.status >= 400 && error.status < 500) {
        this.logger.warn(`Client error: ${error.status} - ${error.message}`);
      } else if (error.status >= 500) {
        this.logger.error(`Server error: ${error.status} - ${error.message}`);
      }

      return throwError(() => this.createUserFriendlyError(error));
    };
  }

  private createUserFriendlyError(error: any): UserFriendlyError {
    let userMessage = 'An unexpected error occurred';
    let actionable = false;

    if (error.status === 0) {
      userMessage = 'Please check your internet connection';
      actionable = true;
    } else if (error.status === 401) {
      userMessage = 'Please log in again';
      actionable = true;
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action';
    } else if (error.status === 404) {
      userMessage = 'The requested resource was not found';
    } else if (error.status >= 500) {
      userMessage = 'Server error - please try again later';
      actionable = true;
    }

    return {
      message: userMessage,
      originalError: error,
      actionable,
      timestamp: new Date(),
    };
  }
}

export interface UserFriendlyError {
  message: string;
  originalError: any;
  actionable: boolean;
  timestamp: Date;
}

// Enhanced async operation wrapper
@Injectable({
  providedIn: 'root',
})
export class AsyncOperationService {
  private readonly logger: ILoggerService;

  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.createChildLogger('AsyncOp');
  }

  execute<T>(
    operation: Observable<T>,
    options: AsyncOperationOptions = {}
  ): AsyncOperationResult<T> {
    const loading$ = new BehaviorSubject<boolean>(false);
    const error$ = new BehaviorSubject<string | null>(null);

    const result$ = operation.pipe(
      tap(() => {
        loading$.next(true);
        error$.next(null);
        this.logger.debug('Async operation started');
      }),
      timeout(options.timeout || 30000),
      retry(options.retries || 0),
      catchError(error => {
        this.logger.error('Async operation failed', error);
        error$.next(error.message || 'Operation failed');
        return throwError(() => error);
      }),
      finalize(() => {
        loading$.next(false);
        this.logger.debug('Async operation completed');
      })
    );

    return {
      result$,
      loading$: loading$.asObservable(),
      error$: error$.asObservable(),
    };
  }
}

export interface AsyncOperationOptions {
  timeout?: number;
  retries?: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface AsyncOperationResult<T> {
  result$: Observable<T>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
}
