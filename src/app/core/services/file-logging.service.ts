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
   */
  async checkLogServerHealth(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (!this.config.LOGGING.ENABLE_LOG_SERVER) {
      return false;
    }

    try {
      const logServerUrl = this.config.LOGGING.LOG_SERVER_URL;
      const response = await fetch(`${logServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
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
