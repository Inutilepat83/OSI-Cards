/**
 * Alerting Service
 *
 * Manages alerts for critical application events.
 * Integrates with external alerting systems (PagerDuty, Slack, etc.)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private alerting = inject(AlertingService);
 *
 *   handleCriticalError(error: Error) {
 *     this.alerting.sendAlert('critical', 'System Error', {
 *       error: error.message
 *     });
 *   }
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  source?: string;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
  resolvedAt?: number;
}

export interface AlertingConfig {
  enableSlackWebhook?: boolean;
  slackWebhookUrl?: string;
  enableEmail?: boolean;
  emailRecipients?: string[];
  enablePagerDuty?: boolean;
  pagerDutyKey?: string;
  minSeverity?: AlertSeverity;
}

@Injectable({
  providedIn: 'root',
})
export class AlertingService {
  private alerts = new BehaviorSubject<Alert[]>([]);
  private config: AlertingConfig = {
    minSeverity: 'warning',
  };

  alerts$: Observable<Alert[]> = this.alerts.asObservable();

  /**
   * Configure alerting service
   */
  configure(config: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send alert
   */
  async sendAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    // Check if severity meets threshold
    if (!this.shouldAlert(severity)) {
      return '';
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      severity,
      title,
      message,
      timestamp: Date.now(),
      metadata,
    };

    // Store alert
    const currentAlerts = this.alerts.value;
    currentAlerts.unshift(alert);

    // Keep last 100 alerts
    if (currentAlerts.length > 100) {
      currentAlerts.pop();
    }

    this.alerts.next(currentAlerts);

    // Send to external systems
    await this.sendToExternalSystems(alert);

    return alert.id;
  }

  /**
   * Send alerts for different severities
   */
  info(title: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.sendAlert('info', title, message, metadata);
  }

  warning(title: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.sendAlert('warning', title, message, metadata);
  }

  error(title: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.sendAlert('error', title, message, metadata);
  }

  critical(title: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.sendAlert('critical', title, message, metadata);
  }

  /**
   * Acknowledge alert
   */
  acknowledge(id: string): void {
    const currentAlerts = this.alerts.value;
    const alert = currentAlerts.find((a) => a.id === id);

    if (alert) {
      alert.acknowledged = true;
      this.alerts.next(currentAlerts);
    }
  }

  /**
   * Resolve alert
   */
  resolve(id: string): void {
    const currentAlerts = this.alerts.value;
    const alert = currentAlerts.find((a) => a.id === id);

    if (alert) {
      alert.resolvedAt = Date.now();
      this.alerts.next(currentAlerts);
    }
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(severity?: AlertSeverity): Alert[] {
    let alerts = this.alerts.value.filter((a) => !a.resolvedAt);

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    return alerts;
  }

  /**
   * Get alert count by severity
   */
  getAlertCount(severity?: AlertSeverity): number {
    if (severity) {
      return this.alerts.value.filter((a) => a.severity === severity && !a.resolvedAt).length;
    }
    return this.alerts.value.filter((a) => !a.resolvedAt).length;
  }

  /**
   * Clear all alerts
   */
  clearAll(): void {
    this.alerts.next([]);
  }

  /**
   * Check if should alert based on severity
   */
  private shouldAlert(severity: AlertSeverity): boolean {
    const severityOrder: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
    const minIndex = severityOrder.indexOf(this.config.minSeverity || 'warning');
    const currentIndex = severityOrder.indexOf(severity);

    return currentIndex >= minIndex;
  }

  /**
   * Send to external alerting systems
   */
  private async sendToExternalSystems(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack
    if (this.config.enableSlackWebhook && this.config.slackWebhookUrl) {
      promises.push(this.sendToSlack(alert));
    }

    // Email
    if (this.config.enableEmail && this.config.emailRecipients) {
      promises.push(this.sendEmail(alert));
    }

    // PagerDuty
    if (this.config.enablePagerDuty && this.config.pagerDutyKey) {
      promises.push(this.sendToPagerDuty(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      return;
    }

    const emoji = this.getSeverityEmoji(alert.severity);
    const color = this.getSeverityColor(alert.severity);

    try {
      await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color,
              title: `${emoji} ${alert.title}`,
              text: alert.message,
              fields: [
                { title: 'Severity', value: alert.severity, short: true },
                { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error('[Alerting] Failed to send to Slack:', error);
    }
  }

  /**
   * Send alert via email
   */
  private async sendEmail(alert: Alert): Promise<void> {
    // TODO: Implement email sending
    console.log('[Alerting] Email alert:', alert.title);
  }

  /**
   * Send alert to PagerDuty
   */
  private async sendToPagerDuty(alert: Alert): Promise<void> {
    if (!this.config.pagerDutyKey) {
      return;
    }

    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token token=${this.config.pagerDutyKey || ''}`,
        },
        body: JSON.stringify({
          routing_key: this.config.pagerDutyKey,
          event_action: 'trigger',
          payload: {
            summary: alert.title,
            severity: alert.severity,
            source: alert.source || 'osi-cards',
            custom_details: alert.metadata,
          },
        }),
      });
    } catch (error) {
      console.error('[Alerting] Failed to send to PagerDuty:', error);
    }
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis: Record<AlertSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return emojis[severity];
  }

  /**
   * Get color for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      info: '#36a64f',
      warning: '#ff9800',
      error: '#f44336',
      critical: '#d32f2f',
    };
    return colors[severity];
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
