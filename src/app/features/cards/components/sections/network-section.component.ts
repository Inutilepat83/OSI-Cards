import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-network-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatBadgeModule],
  template: `
    <div class="network-section">
      <h3 class="section-title">{{ section.title }}</h3>

      <div class="network-stats" *ngIf="section.fields">
        <div class="stat-circle" *ngFor="let field of section.fields; trackBy: trackByField">
          <div class="circle-content" [style.background]="getStatGradient(field.label)">
            <div class="stat-value">{{ field.value }}</div>
            <div class="stat-label">{{ field.label }}</div>
          </div>
        </div>
      </div>

      <div class="network-connections" *ngIf="section.items">
        <h4 class="connections-title">Your Network</h4>
        <div class="connection-grid">
          <div class="connection-card" *ngFor="let item of section.items; trackBy: trackByItem">
            <div class="connection-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(item.title)">
                <mat-icon *ngIf="item.icon; else initials">{{ item.icon }}</mat-icon>
                <ng-template #initials>
                  <span class="avatar-initials">{{ getInitials(item.title) }}</span>
                </ng-template>
              </div>
              <div
                class="connection-status"
                [class]="'status-' + (item.meta?.status || 'offline')"
                [attr.title]="item.meta?.status || 'offline'"
              ></div>
            </div>

            <div class="connection-info">
              <h5 class="connection-name">{{ item.title }}</h5>
              <div class="connection-role" *ngIf="item.description">
                {{ item.description }}
              </div>
              <div class="connection-company" *ngIf="item.meta?.company">
                {{ item.meta.company }}
              </div>
            </div>

            <div class="connection-metrics" *ngIf="item.meta?.metrics">
              <div class="metric-item" *ngFor="let metric of item.meta.metrics">
                <span class="metric-value">{{ metric.value }}</span>
                <span class="metric-label">{{ metric.label }}</span>
              </div>
            </div>

            <div class="connection-tags" *ngIf="item.meta?.tags">
              <span class="connection-tag" *ngFor="let tag of item.meta.tags">
                {{ tag }}
              </span>
            </div>

            <div class="connection-actions">
              <button
                mat-icon-button
                class="action-btn message"
                [attr.aria-label]="'Message ' + item.title"
              >
                <mat-icon>message</mat-icon>
              </button>
              <button
                mat-icon-button
                class="action-btn call"
                [attr.aria-label]="'Call ' + item.title"
              >
                <mat-icon>call</mat-icon>
              </button>
              <button
                mat-icon-button
                class="action-btn video"
                [attr.aria-label]="'Video call ' + item.title"
              >
                <mat-icon>videocam</mat-icon>
              </button>
              <button
                mat-icon-button
                class="action-btn more"
                [attr.aria-label]="'More options for ' + item.title"
              >
                <mat-icon>more_vert</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="network-insights" *ngIf="section.meta?.insights">
        <h4 class="insights-title">Network Insights</h4>
        <div class="insights-grid">
          <div class="insight-card" *ngFor="let insight of section.meta.insights">
            <div class="insight-icon">
              <mat-icon [style.color]="insight.color || '#3b82f6'">
                {{ insight.icon }}
              </mat-icon>
            </div>
            <div class="insight-content">
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-description">{{ insight.description }}</div>
              <div class="insight-value" *ngIf="insight.value">
                {{ insight.value }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="network-recommendations" *ngIf="section.meta?.recommendations">
        <h4 class="recommendations-title">Suggested Connections</h4>
        <div class="recommendation-list">
          <div class="recommendation-item" *ngFor="let rec of section.meta.recommendations">
            <div class="recommendation-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(rec.name)">
                <span class="avatar-initials">{{ getInitials(rec.name) }}</span>
              </div>
            </div>
            <div class="recommendation-info">
              <div class="recommendation-name">{{ rec.name }}</div>
              <div class="recommendation-role">{{ rec.role }}</div>
              <div class="recommendation-reason">{{ rec.reason }}</div>
            </div>
            <div class="recommendation-actions">
              <button mat-stroked-button class="connect-btn">
                <mat-icon>person_add</mat-icon>
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="network-actions">
        <button mat-raised-button color="primary" class="action-btn">
          <mat-icon>group_add</mat-icon>
          Invite Connections
        </button>
        <button mat-stroked-button class="action-btn">
          <mat-icon>import_contacts</mat-icon>
          Import Contacts
        </button>
        <button mat-stroked-button class="action-btn">
          <mat-icon>analytics</mat-icon>
          View Analytics
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .network-section {
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        margin: 0 0 2rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
      }

      .network-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 3rem;
        flex-wrap: wrap;
      }

      .stat-circle {
        position: relative;
      }

      .circle-content {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
      }

      .circle-content:hover {
        transform: scale(1.1);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: center;
      }

      .connections-title,
      .insights-title,
      .recommendations-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
      }

      .connection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .connection-card {
        padding: 1.5rem;
        background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
      }

      .connection-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      }

      .connection-avatar {
        position: relative;
        margin-bottom: 1rem;
      }

      .avatar-circle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        margin: 0 auto;
      }

      .avatar-initials {
        font-size: 1.25rem;
      }

      .connection-status {
        position: absolute;
        bottom: 0;
        right: calc(50% - 35px);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
      }

      .status-online {
        background: #10b981;
      }

      .status-away {
        background: #f59e0b;
      }

      .status-busy {
        background: #ef4444;
      }

      .status-offline {
        background: #6b7280;
      }

      .connection-info {
        text-align: center;
        margin-bottom: 1rem;
      }

      .connection-name {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
      }

      .connection-role {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }

      .connection-company {
        font-size: 0.875rem;
        color: #3b82f6;
        font-weight: 500;
      }

      .connection-metrics {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
      }

      .metric-item {
        text-align: center;
      }

      .metric-value {
        display: block;
        font-weight: 700;
        color: #3b82f6;
      }

      .metric-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
      }

      .connection-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1rem;
      }

      .connection-tag {
        padding: 0.25rem 0.5rem;
        background: #e0f2fe;
        color: #0369a1;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .connection-actions {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
      }

      .action-btn.message {
        color: #059669;
      }

      .action-btn.call {
        color: #3b82f6;
      }

      .action-btn.video {
        color: #7c3aed;
      }

      .action-btn.more {
        color: #6b7280;
      }

      .insights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 3rem;
      }

      .insight-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        border-left: 4px solid #3b82f6;
      }

      .insight-icon {
        margin-right: 1rem;
      }

      .insight-content {
        flex: 1;
      }

      .insight-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .insight-description {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }

      .insight-value {
        font-weight: 700;
        color: #3b82f6;
      }

      .recommendation-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 3rem;
      }

      .recommendation-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .recommendation-avatar {
        margin-right: 1rem;
      }

      .recommendation-avatar .avatar-circle {
        width: 48px;
        height: 48px;
        font-size: 1rem;
      }

      .recommendation-info {
        flex: 1;
      }

      .recommendation-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .recommendation-role {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }

      .recommendation-reason {
        font-size: 0.75rem;
        color: #3b82f6;
        font-style: italic;
      }

      .connect-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .network-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .network-actions .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 768px) {
        .network-stats {
          flex-direction: column;
          align-items: center;
        }

        .connection-grid {
          grid-template-columns: 1fr;
        }

        .insights-grid {
          grid-template-columns: 1fr;
        }

        .recommendation-item {
          flex-direction: column;
          text-align: center;
        }

        .recommendation-avatar {
          margin-right: 0;
          margin-bottom: 1rem;
        }

        .network-actions {
          flex-direction: column;
        }

        .network-actions .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkSectionComponent {
  @Input() section!: CardSection;

  trackByField(index: number, field: any): any {
    return field.id || index;
  }

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  getStatGradient(label: string): string {
    const gradients: { [key: string]: string } = {
      connections: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      mutual: 'linear-gradient(135deg, #059669, #047857)',
      messages: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      calls: 'linear-gradient(135deg, #dc2626, #991b1b)',
      meetings: 'linear-gradient(135deg, #f59e0b, #d97706)',
    };

    const key = label.toLowerCase();
    return gradients[key] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #059669, #047857)',
      'linear-gradient(135deg, #7c3aed, #5b21b6)',
      'linear-gradient(135deg, #dc2626, #991b1b)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #be185d)',
    ];

    const hash = name.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
