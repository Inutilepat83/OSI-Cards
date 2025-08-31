import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-event-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule],
  template: `
    <div class="event-section">
      <h3 class="section-title">{{ section.title }}</h3>

      <div class="event-cards">
        <div class="event-card" *ngFor="let item of section.items; trackBy: trackByItem">
          <div class="event-header">
            <div class="event-date" *ngIf="item.meta?.date">
              <div class="date-month">{{ getMonth(item.meta.date) }}</div>
              <div class="date-day">{{ getDay(item.meta.date) }}</div>
            </div>
            <div class="event-info">
              <h4 class="event-title">{{ item.title }}</h4>
              <div class="event-subtitle" *ngIf="item.description">
                {{ item.description }}
              </div>
            </div>
            <div class="event-status" *ngIf="item.meta?.status">
              <span class="status-badge" [class]="'status-' + item.meta.status">
                {{ item.meta.status }}
              </span>
            </div>
          </div>

          <div class="event-details">
            <div class="detail-item" *ngIf="item.meta?.time">
              <mat-icon class="detail-icon">schedule</mat-icon>
              <span>{{ item.meta.time }}</span>
            </div>
            <div class="detail-item" *ngIf="item.meta?.location">
              <mat-icon class="detail-icon">location_on</mat-icon>
              <span>{{ item.meta.location }}</span>
            </div>
            <div class="detail-item" *ngIf="item.meta?.duration">
              <mat-icon class="detail-icon">timer</mat-icon>
              <span>{{ item.meta.duration }}</span>
            </div>
            <div class="detail-item" *ngIf="item.meta?.attendees">
              <mat-icon class="detail-icon">people</mat-icon>
              <span>{{ item.meta.attendees }} attendees</span>
            </div>
          </div>

          <div class="event-tags" *ngIf="item.meta?.tags">
            <mat-chip-set>
              <mat-chip *ngFor="let tag of item.meta.tags">
                {{ tag }}
              </mat-chip>
            </mat-chip-set>
          </div>

          <div class="event-agenda" *ngIf="item.meta?.agenda">
            <h5 class="agenda-title">Agenda</h5>
            <div class="agenda-items">
              <div class="agenda-item" *ngFor="let agendaItem of item.meta.agenda">
                <div class="agenda-time">{{ agendaItem.time }}</div>
                <div class="agenda-content">
                  <div class="agenda-session">{{ agendaItem.session }}</div>
                  <div class="agenda-speaker" *ngIf="agendaItem.speaker">
                    by {{ agendaItem.speaker }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="event-actions">
            <button
              mat-raised-button
              color="primary"
              class="action-btn"
              [disabled]="item.meta?.status === 'past'"
            >
              <mat-icon>event_available</mat-icon>
              {{ getActionText(item.meta?.status) }}
            </button>
            <button mat-stroked-button class="action-btn">
              <mat-icon>share</mat-icon>
              Share
            </button>
            <button
              mat-icon-button
              class="calendar-btn"
              [attr.aria-label]="'Add ' + item.title + ' to calendar'"
            >
              <mat-icon>calendar_today</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="event-summary" *ngIf="section.fields">
        <div class="summary-stats">
          <div class="stat-item" *ngFor="let field of section.fields; trackBy: trackByField">
            <mat-icon class="stat-icon">{{ getStatIcon(field.label) }}</mat-icon>
            <div class="stat-content">
              <div class="stat-value">{{ field.value }}</div>
              <div class="stat-label">{{ field.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .event-section {
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

      .event-cards {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .event-card {
        padding: 1.5rem;
        background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
      }

      .event-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      }

      .event-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .event-date {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.75rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border-radius: 12px;
        margin-right: 1rem;
        min-width: 60px;
      }

      .date-month {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .date-day {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .event-info {
        flex: 1;
      }

      .event-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }

      .event-subtitle {
        color: #6b7280;
        line-height: 1.5;
      }

      .event-status {
        margin-left: auto;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-upcoming {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-live {
        background: #dcfce7;
        color: #166534;
      }

      .status-past {
        background: #f3f4f6;
        color: #6b7280;
      }

      .event-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .detail-item {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: #374151;
      }

      .detail-icon {
        color: #6b7280;
        margin-right: 0.5rem;
        font-size: 1rem;
      }

      .event-tags {
        margin-bottom: 1.5rem;
      }

      .event-agenda {
        margin-bottom: 1.5rem;
      }

      .agenda-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
      }

      .agenda-items {
        background: #f8fafc;
        border-radius: 8px;
        padding: 1rem;
      }

      .agenda-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .agenda-item:last-child {
        margin-bottom: 0;
      }

      .agenda-time {
        font-weight: 600;
        color: #3b82f6;
        margin-right: 1rem;
        min-width: 80px;
        font-size: 0.875rem;
      }

      .agenda-content {
        flex: 1;
      }

      .agenda-session {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .agenda-speaker {
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
      }

      .event-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .calendar-btn {
        margin-left: auto;
        color: #059669;
      }

      .event-summary {
        margin-top: 2rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 12px;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .stat-item {
        display: flex;
        align-items: center;
        text-align: center;
      }

      .stat-icon {
        color: #0ea5e9;
        margin-right: 0.75rem;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0c4a6e;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #64748b;
      }

      @media (max-width: 768px) {
        .event-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .event-date {
          margin-right: 0;
          margin-bottom: 1rem;
          align-self: flex-start;
        }

        .event-status {
          margin-left: 0;
          margin-top: 1rem;
        }

        .event-details {
          grid-template-columns: 1fr;
        }

        .event-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }

        .calendar-btn {
          margin-left: 0;
          align-self: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventSectionComponent {
  @Input() section!: CardSection;

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  trackByField(index: number, field: any): any {
    return field.id || index;
  }

  getMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  getDay(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  getActionText(status?: string): string {
    switch (status) {
      case 'upcoming':
        return 'Register';
      case 'live':
        return 'Join Now';
      case 'past':
        return 'View Recording';
      default:
        return 'Learn More';
    }
  }

  getStatIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      'total events': 'event',
      attendees: 'people',
      speakers: 'record_voice_over',
      sessions: 'schedule',
      hours: 'schedule',
      networking: 'connect_without_contact',
    };

    const key = label.toLowerCase();
    return iconMap[key] || 'analytics';
  }
}
