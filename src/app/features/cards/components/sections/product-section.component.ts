import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-product-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatBadgeModule],
  template: `
    <div class="product-section">
      <h3 class="section-title">{{ section.title }}</h3>

      <div class="product-overview" *ngIf="section.fields">
        <div class="product-stats">
          <div class="stat-card" *ngFor="let field of section.fields; trackBy: trackByField">
            <div class="stat-icon">
              <mat-icon [style.color]="field.valueColor || '#10b981'">
                {{ getStatIcon(field.label) }}
              </mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">{{ field.label }}</div>
              <div class="stat-value" [style.color]="field.valueColor || '#10b981'">
                {{ field.value }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="product-items" *ngIf="section.items">
        <div class="product-card" *ngFor="let item of section.items; trackBy: trackByItem">
          <div class="product-header">
            <div class="product-icon" *ngIf="item.icon">
              <mat-icon>{{ item.icon }}</mat-icon>
            </div>
            <div class="product-title-section">
              <h4 class="product-title">{{ item.title }}</h4>
              <div class="product-price" *ngIf="item.value">{{ item.value }}</div>
            </div>
            <div class="product-badge" *ngIf="item.meta?.status">
              <span class="badge" [class]="'badge-' + item.meta.status">
                {{ item.meta.status }}
              </span>
            </div>
          </div>

          <div class="product-description" *ngIf="item.description">
            {{ item.description }}
          </div>

          <div class="product-features" *ngIf="item.meta?.features">
            <div class="feature-item" *ngFor="let feature of item.meta.features">
              <mat-icon class="feature-icon">check_circle</mat-icon>
              <span>{{ feature }}</span>
            </div>
          </div>

          <div class="product-actions">
            <button mat-raised-button color="primary" class="action-btn">
              <mat-icon>shopping_cart</mat-icon>
              Add to Cart
            </button>
            <button mat-stroked-button class="action-btn">
              <mat-icon>info</mat-icon>
              Learn More
            </button>
            <button
              mat-icon-button
              class="favorite-btn"
              [attr.aria-label]="'Add ' + item.title + ' to favorites'"
            >
              <mat-icon>favorite_border</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .product-section {
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

      .product-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 8px;
        border-left: 4px solid #0ea5e9;
      }

      .stat-icon {
        margin-right: 1rem;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 0.25rem;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 700;
      }

      .product-items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .product-card {
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }

      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .product-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .product-icon {
        margin-right: 1rem;
        color: #3b82f6;
      }

      .product-title-section {
        flex: 1;
      }

      .product-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
      }

      .product-price {
        font-size: 1.25rem;
        font-weight: 700;
        color: #059669;
      }

      .product-badge {
        margin-left: auto;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-new {
        background: #dcfce7;
        color: #166534;
      }

      .badge-popular {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-sale {
        background: #fee2e2;
        color: #991b1b;
      }

      .product-description {
        color: #6b7280;
        margin-bottom: 1rem;
        line-height: 1.5;
      }

      .product-features {
        margin-bottom: 1.5rem;
      }

      .feature-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #374151;
      }

      .feature-icon {
        color: #059669;
        margin-right: 0.5rem;
        font-size: 1rem;
      }

      .product-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .favorite-btn {
        margin-left: auto;
        color: #ec4899;
      }

      @media (max-width: 768px) {
        .product-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }

        .favorite-btn {
          margin-left: 0;
          align-self: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSectionComponent {
  @Input() section!: CardSection;

  trackByField(index: number, field: any): any {
    return field.id || index;
  }

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  getStatIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      price: 'attach_money',
      rating: 'star',
      reviews: 'rate_review',
      stock: 'inventory',
      sales: 'trending_up',
      category: 'category',
      brand: 'business',
    };

    const key = label.toLowerCase();
    return iconMap[key] || 'analytics';
  }
}
