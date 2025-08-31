import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-list-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-section">
      <h3 class="section-title">{{ section.title }}</h3>
      <div class="list-container">
        <div class="list-item" *ngFor="let item of section.items; trackBy: trackByItem">
          <div class="item-content">
            <div class="item-header">
              <i *ngIf="item.icon" class="pi {{ item.icon }}"></i>
              <span class="item-title">{{ item.title }}</span>
            </div>
            <div class="item-description" *ngIf="item.description">
              {{ item.description }}
            </div>
            <div class="item-meta" *ngIf="item.meta">
              <span class="meta-item" *ngFor="let [key, value] of item.meta | keyvalue">
                {{ key }}: {{ value }}
              </span>
            </div>
          </div>
          <div class="item-value" *ngIf="item.value">
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .list-section {
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

      .list-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #10b981;
        transition: all 0.2s ease;
      }

      .list-item:hover {
        background: #e2e8f0;
        transform: translateX(2px);
      }

      .item-content {
        flex: 1;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .item-title {
        font-weight: 600;
        color: #1f2937;
      }

      .item-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .item-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .meta-item {
        font-size: 0.75rem;
        color: #9ca3af;
        background: #f3f4f6;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
      }

      .item-value {
        font-weight: 700;
        color: #059669;
        font-size: 1.125rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSectionComponent {
  @Input() section!: CardSection;

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }
}
