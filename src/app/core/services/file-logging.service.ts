import { Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

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
  private logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = [];
  private readonly maxLogs = 10000;

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
  getLogs(): Array<{ timestamp: number; level: string; message: string; data?: any }> {
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

    const logs = this.logs.map(log => ({
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
    link.download = filename || `masonry-grid-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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

    const text = this.logs.map(log => {
      const time = new Date(log.timestamp).toISOString();
      const dataStr = log.data ? '\n' + JSON.stringify(log.data, null, 2) : '';
      return `[${time}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `masonry-grid-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Send logs to backend endpoint (if available)
   * This would save logs to /log folder on the server
   */
  async sendLogsToServer(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: this.logs,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('Logs sent to server successfully');
      } else {
        console.warn('Failed to send logs to server:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending logs to server:', error);
      // Fallback: export as file
      this.exportLogsAsFile();
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
    this.logs.forEach(log => {
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

