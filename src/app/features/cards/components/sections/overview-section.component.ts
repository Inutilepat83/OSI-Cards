import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-section">
      <h3 class="section-title">{{ section.title }}</h3>
      <div class="overview-content">
        <div class="overview-stats" *ngIf="section.fields">
          <div class="stat-item" *ngFor="let field of section.fields">
            <div class="stat-label">{{ field.label }}</div>
            <div class="stat-value" [style.color]="field.valueColor || 'inherit'">
              {{ field.value }}
            </div>
          </div>
        </div>
        <div class="overview-items" *ngIf="section.items">
          <div class="overview-item" *ngFor="let item of section.items">
            <div class="item-header">
              <i *ngIf="item.icon" class="pi {{ item.icon }}"></i>
              <span class="item-title">{{ item.title }}</span>
            </div>
            <div class="item-description" *ngIf="item.description">
              {{ item.description }}
            </div>
            <div class="item-value" *ngIf="item.value">
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .overview-section {
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
      }

      .overview-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-item {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2563eb;
      }

      .overview-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .overview-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #2563eb;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .item-title {
        font-weight: 600;
        color: #333;
      }

      .item-description {
        color: #666;
        margin-bottom: 0.5rem;
      }

      .item-value {
        font-weight: 600;
        color: #2563eb;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewSectionComponent {
  @Input() section!: CardSection;
}
