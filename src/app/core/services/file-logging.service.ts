import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AppConfigService } from './app-config.service';

/**
 * File Logging Service
 *
 * Collects logs and provides methods to download/save them to files
 * In development, can also send logs to a backend endpoint for file storage
 */
@Injectable({
  providedIn: 'root',
})
export class FileLoggingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(AppConfigService);
  private logs: { timestamp: number; level: string; message: string; data?: any }[] = [];
  private readonly maxLogs = 10000;
  private logServerCheckInterval: number | null = null;
  private logServerHealthCache: { isAvailable: boolean; lastChecked: number } | null = null;
  private readonly HEALTH_CHECK_CACHE_DURATION = 60000; // Cache for 60 seconds
  private readonly HEALTH_CHECK_BACKOFF_DURATION = 300000; // Don't check for 5 minutes after failure

  /**
   * Add a log entry
   */
  log(level: string, message: string, data?: any): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data,
    });

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): { timestamp: number; level: string; message: string; data?: any }[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON and trigger download
   */
  exportLogsAsFile(filename?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const logs = this.logs.map((log) => ({
      time: new Date(log.timestamp).toISOString(),
      level: log.level,
      message: log.message,
      data: log.data,
    }));

    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      filename || `masonry-grid-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export logs as text file
   */
  exportLogsAsText(filename?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const text = this.logs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString();
        const dataStr = log.data ? '\n' + JSON.stringify(log.data, null, 2) : '';
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      filename || `masonry-grid-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if log server is available
   * Completely silent when server is unavailable - log server is optional
   * Uses caching and backoff to minimize console errors
   */
  async checkLogServerHealth(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (!this.config.LOGGING.ENABLE_LOG_SERVER) {
      return false;
    }

    const now = Date.now();

    // Check cache first
    if (this.logServerHealthCache) {
      const timeSinceLastCheck = now - this.logServerHealthCache.lastChecked;

      // If server was unavailable, use backoff period
      if (!this.logServerHealthCache.isAvailable) {
        if (timeSinceLastCheck < this.HEALTH_CHECK_BACKOFF_DURATION) {
          // Still in backoff period, return cached result without making request
          return false;
        }
      } else {
        // Server was available, use shorter cache duration
        if (timeSinceLastCheck < this.HEALTH_CHECK_CACHE_DURATION) {
          return this.logServerHealthCache.isAvailable;
        }
      }
    }

    // Suppress console errors by temporarily overriding console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const logServerUrl = this.config.LOGGING.LOG_SERVER_URL;

    try {
      // Override console methods to filter out fetch errors for this specific request
      console.error = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Suppress fetch/network errors related to log server health check
        if (
          message.includes('Failed to fetch') ||
          message.includes('ERR_CONNECTION_REFUSED') ||
          message.includes('ERR_NETWORK') ||
          (message.includes(logServerUrl) && message.includes('health'))
        ) {
          return; // Suppress this error
        }
        originalError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Suppress fetch/network warnings related to log server health check
        if (
          message.includes('Failed to fetch') ||
          message.includes('ERR_CONNECTION_REFUSED') ||
          message.includes('ERR_NETWORK') ||
          (message.includes(logServerUrl) && message.includes('health'))
        ) {
          return; // Suppress this warning
        }
        originalWarn.apply(console, args);
      };

      // Use AbortController for better browser compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(`${logServerUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          // Prevent CORS errors from appearing in console
          mode: 'cors',
          credentials: 'omit',
        });

        clearTimeout(timeoutId);

        const isAvailable = response.ok;

        // Update cache
        this.logServerHealthCache = {
          isAvailable,
          lastChecked: now,
        };

        return isAvailable;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Re-throw to be caught by outer catch
        throw fetchError;
      }
    } catch (error) {
      // Completely silent - log server is optional and may not be running
      // Network errors in browser console are expected when service is unavailable
      // but we don't want to log them as application errors

      // Update cache with failure
      this.logServerHealthCache = {
        isAvailable: false,
        lastChecked: now,
      };

      return false;
    } finally {
      // Always restore console methods
      console.error = originalError;
      console.warn = originalWarn;
    }
  }

  /**
   * Send logs to backend endpoint (if available)
   * This would save logs to /log folder on the server
   */
  async sendLogsToServer(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.config.LOGGING.ENABLE_LOG_SERVER) {
      return;
    }

    if (this.logs.length === 0) {
      return;
    }

    try {
      const logServerUrl = this.config.LOGGING.LOG_SERVER_URL;
      const response = await fetch(`${logServerUrl}/api/logs/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: this.logs.map((log) => ({
            time: new Date(log.timestamp).toISOString(),
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            data: log.data,
          })),
          timestamp: new Date().toISOString(),
          source: 'FileLoggingService',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Logs sent to server successfully: ${result.count} logs saved`);
        // Clear logs after successful send
        this.clearLogs();
      } else {
        console.warn('Failed to send logs to server:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending logs to server:', error);
      // Don't export as file automatically - let user decide
    }
  }

  /**
   * Start automatic log sending to server at intervals
   */
  startAutoSend(intervalMs = 30000): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.config.LOGGING.ENABLE_LOG_SERVER) {
      return;
    }

    if (this.logServerCheckInterval) {
      return; // Already started
    }

    this.logServerCheckInterval = window.setInterval(async () => {
      if (this.logs.length > 0) {
        // Check if server is available before sending
        const isAvailable = await this.checkLogServerHealth();
        if (isAvailable) {
          this.sendLogsToServer();
        }
      }
    }, intervalMs);
  }

  /**
   * Stop automatic log sending
   */
  stopAutoSend(): void {
    if (this.logServerCheckInterval) {
      clearInterval(this.logServerCheckInterval);
      this.logServerCheckInterval = null;
    }
  }

  /**
   * Get logs summary
   */
  getSummary(): {
    total: number;
    byLevel: Record<string, number>;
    oldest: string;
    newest: string;
  } {
    const byLevel: Record<string, number> = {};
    this.logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    });

    const firstLog = this.logs[0];
    const lastLog = this.logs[this.logs.length - 1];
    return {
      total: this.logs.length,
      byLevel,
      oldest: firstLog ? new Date(firstLog.timestamp).toISOString() : '',
      newest: lastLog ? new Date(lastLog.timestamp).toISOString() : '',
    };
  }
}
