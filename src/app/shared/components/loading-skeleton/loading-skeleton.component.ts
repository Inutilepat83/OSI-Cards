import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading skeleton component
 * Replaces loading spinners with skeleton screens for better perceived performance
 */
@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [class]="'skeleton--' + type">
      <div *ngIf="type === 'card'" class="skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line" *ngFor="let i of [1, 2, 3]"></div>
        </div>
      </div>
      <div *ngIf="type === 'section'" class="skeleton-section">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-grid">
          <div class="skeleton-item" *ngFor="let i of [1, 2, 3, 4]">
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-short"></div>
          </div>
        </div>
      </div>
      <div *ngIf="type === 'line'" class="skeleton-line"></div>
      <div *ngIf="type === 'circle'" class="skeleton-circle"></div>
      <div *ngIf="type === 'rectangle'" class="skeleton-rectangle"></div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    @keyframes skeleton-loading {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .skeleton-card {
      padding: 1rem;
      background: rgba(20, 30, 50, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
    }

    .skeleton-header {
      margin-bottom: 1rem;
    }

    .skeleton-title {
      height: 1.5rem;
      width: 60%;
      margin-bottom: 0.5rem;
    }

    .skeleton-subtitle {
      height: 1rem;
      width: 40%;
    }

    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-line {
      height: 1rem;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.1) 100%
      );
      background-size: 200% 100%;
      border-radius: 0.25rem;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-line.skeleton-short {
      width: 60%;
    }

    .skeleton-circle {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.1) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-rectangle {
      width: 100%;
      height: 200px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.1) 100%
      );
      background-size: 200% 100%;
      border-radius: 0.5rem;
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-section {
      padding: 1rem;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .skeleton-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    @keyframes skeleton-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'section' | 'line' | 'circle' | 'rectangle' = 'card';
}


