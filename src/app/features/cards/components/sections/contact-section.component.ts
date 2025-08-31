import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CardSection } from '../../../../models/card.model';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="contact-section">
      <h3 class="section-title">{{ section.title }}</h3>
      <div class="contact-grid">
        <div class="contact-item" *ngFor="let field of section.fields; trackBy: trackByField">
          <div class="contact-icon">
            <mat-icon>{{ getContactIcon(field.label) }}</mat-icon>
          </div>
          <div class="contact-info">
            <div class="contact-label">{{ field.label }}</div>
            <div class="contact-value">{{ field.value }}</div>
          </div>
          <button
            mat-icon-button
            class="contact-action"
            [attr.aria-label]="'Contact via ' + field.label"
            (click)="handleContactAction(field)"
          >
            <mat-icon>{{ getActionIcon(field.label) }}</mat-icon>
          </button>
        </div>
      </div>

      <div class="contact-actions" *ngIf="section.meta?.showActions">
        <button mat-raised-button color="primary" class="contact-btn">
          <mat-icon>email</mat-icon>
          Send Message
        </button>
        <button mat-raised-button class="contact-btn">
          <mat-icon>phone</mat-icon>
          Schedule Call
        </button>
        <button mat-raised-button class="contact-btn">
          <mat-icon>person_add</mat-icon>
          Add to Contacts
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .contact-section {
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }

      .contact-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .contact-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
        transition: all 0.2s ease;
      }

      .contact-item:hover {
        background: #e2e8f0;
        transform: translateX(2px);
      }

      .contact-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        margin-right: 1rem;
      }

      .contact-info {
        flex: 1;
      }

      .contact-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }

      .contact-value {
        font-weight: 600;
        color: #1f2937;
        font-size: 1rem;
      }

      .contact-action {
        color: #6b7280;
        transition: color 0.2s ease;
      }

      .contact-action:hover {
        color: #3b82f6;
      }

      .contact-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .contact-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 768px) {
        .contact-actions {
          flex-direction: column;
        }

        .contact-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  @Input() section!: CardSection;

  constructor(private logger: LoggingService) {}

  trackByField(index: number, field: any): any {
    return field.id || index;
  }

  getContactIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      email: 'email',
      phone: 'phone',
      mobile: 'smartphone',
      address: 'location_on',
      website: 'language',
      linkedin: 'work',
      twitter: 'alternate_email',
      skype: 'video_call',
      whatsapp: 'chat',
    };

    const key = label.toLowerCase();
    return iconMap[key] || 'contact_mail';
  }

  getActionIcon(label: string): string {
    const actionMap: { [key: string]: string } = {
      email: 'send',
      phone: 'call',
      mobile: 'call',
      address: 'directions',
      website: 'open_in_new',
      linkedin: 'open_in_new',
      twitter: 'open_in_new',
    };

    const key = label.toLowerCase();
    return actionMap[key] || 'more_vert';
  }

  handleContactAction(field: any): void {
    const value = field.value;
    const label = field.label.toLowerCase();

    switch (label) {
      case 'email':
        window.open(`mailto:${value}`, '_blank');
        break;
      case 'phone':
      case 'mobile':
        window.open(`tel:${value}`, '_blank');
        break;
      case 'website':
        window.open(value.startsWith('http') ? value : `https://${value}`, '_blank');
        break;
      case 'address':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(value)}`, '_blank');
        break;
      default:
        this.logger.log('ContactSectionComponent', 'Contact action', { label, value });
    }
  }
}
