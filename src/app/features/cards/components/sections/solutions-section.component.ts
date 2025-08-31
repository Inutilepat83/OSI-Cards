import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CardSection } from '../../../../models/card.model';

@Component({
  selector: 'app-solutions-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule],
  template: `
    <div class="solutions-section">
      <h3 class="section-title">{{ section.title }}</h3>

      <div class="solutions-grid">
        <div class="solution-card" *ngFor="let item of section.items; trackBy: trackByItem">
          <div class="solution-header">
            <div class="solution-icon" *ngIf="item.icon">
              <mat-icon>{{ item.icon }}</mat-icon>
            </div>
            <div class="solution-meta">
              <h4 class="solution-title">{{ item.title }}</h4>
              <div class="solution-category" *ngIf="item.meta?.category">
                {{ item.meta.category }}
              </div>
            </div>
            <div class="solution-badge" *ngIf="item.meta?.priority">
              <span class="priority-badge" [class]="'priority-' + item.meta.priority">
                {{ item.meta.priority }}
              </span>
            </div>
          </div>

          <div class="solution-description" *ngIf="item.description">
            {{ item.description }}
          </div>

          <div class="solution-benefits" *ngIf="item.meta?.benefits">
            <h5 class="benefits-title">Key Benefits</h5>
            <ul class="benefits-list">
              <li *ngFor="let benefit of item.meta.benefits" class="benefit-item">
                <mat-icon class="benefit-icon">check_circle</mat-icon>
                {{ benefit }}
              </li>
            </ul>
          </div>

          <div class="solution-technologies" *ngIf="item.meta?.technologies">
            <h5 class="tech-title">Technologies</h5>
            <div class="tech-chips">
              <mat-chip-set>
                <mat-chip *ngFor="let tech of item.meta.technologies">
                  {{ tech }}
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>

          <div class="solution-metrics" *ngIf="item.meta?.metrics">
            <div class="metric-item" *ngFor="let metric of item.meta.metrics">
              <span class="metric-value">{{ metric.value }}</span>
              <span class="metric-label">{{ metric.label }}</span>
            </div>
          </div>

          <div class="solution-actions">
            <button mat-raised-button color="primary" class="action-btn">
              <mat-icon>rocket_launch</mat-icon>
              Get Started
            </button>
            <button mat-stroked-button class="action-btn">
              <mat-icon>info</mat-icon>
              Learn More
            </button>
            <button
              mat-icon-button
              class="bookmark-btn"
              [attr.aria-label]="'Bookmark ' + item.title"
            >
              <mat-icon>bookmark_border</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="solutions-summary" *ngIf="section.meta?.summary">
        <div class="summary-card">
          <mat-icon class="summary-icon">lightbulb</mat-icon>
          <div class="summary-content">
            <h4 class="summary-title">Why Choose Our Solutions?</h4>
            <p class="summary-text">{{ section.meta.summary }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .solutions-section {
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

      .solutions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }

      .solution-card {
        padding: 2rem;
        background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .solution-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
      }

      .solution-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
      }

      .solution-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .solution-icon {
        margin-right: 1rem;
        color: #3b82f6;
        font-size: 2rem;
      }

      .solution-meta {
        flex: 1;
      }

      .solution-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }

      .solution-category {
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .solution-badge {
        margin-left: auto;
      }

      .priority-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .priority-high {
        background: #fee2e2;
        color: #991b1b;
      }

      .priority-medium {
        background: #fef3c7;
        color: #92400e;
      }

      .priority-low {
        background: #dcfce7;
        color: #166534;
      }

      .solution-description {
        color: #6b7280;
        margin-bottom: 1.5rem;
        line-height: 1.6;
      }

      .benefits-title,
      .tech-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
      }

      .benefits-list {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
      }

      .benefit-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        color: #374151;
      }

      .benefit-icon {
        color: #059669;
        margin-right: 0.75rem;
        font-size: 1.125rem;
      }

      .tech-chips {
        margin-bottom: 1.5rem;
      }

      .solution-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f1f5f9;
        border-radius: 8px;
      }

      .metric-item {
        text-align: center;
      }

      .metric-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .metric-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .solution-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .bookmark-btn {
        margin-left: auto;
        color: #f59e0b;
      }

      .solutions-summary {
        margin-top: 2rem;
      }

      .summary-card {
        display: flex;
        align-items: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-radius: 12px;
        border-left: 4px solid #f59e0b;
      }

      .summary-icon {
        color: #d97706;
        margin-right: 1rem;
        font-size: 2rem;
      }

      .summary-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #92400e;
      }

      .summary-text {
        margin: 0;
        color: #78350f;
        line-height: 1.5;
      }

      @media (max-width: 768px) {
        .solutions-grid {
          grid-template-columns: 1fr;
        }

        .solution-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .action-btn {
          width: 100%;
          justify-content: center;
        }

        .bookmark-btn {
          margin-left: 0;
          align-self: center;
        }

        .summary-card {
          flex-direction: column;
          text-align: center;
        }

        .summary-icon {
          margin-right: 0;
          margin-bottom: 1rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolutionsSectionComponent {
  @Input() section!: CardSection;

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }
}
