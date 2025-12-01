/**
 * Section Skeleton Component
 * 
 * Provides skeleton loading states for different section types.
 * Shows appropriate placeholder content while data is being loaded.
 * 
 * @example
 * ```html
 * <app-section-skeleton 
 *   [sectionType]="'analytics'"
 *   [showTitle]="true"
 *   [fieldCount]="4"
 * ></app-section-skeleton>
 * ```
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section type for skeleton rendering
 */
export type SkeletonSectionType =
  | 'info'
  | 'analytics'
  | 'contact-card'
  | 'list'
  | 'chart'
  | 'overview'
  | 'financials'
  | 'map'
  | 'default';

/**
 * Skeleton variant for different loading states
 */
export type SkeletonVariant = 'pulse' | 'shimmer' | 'none';

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-section-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="section-skeleton"
      [class]="'section-skeleton--' + sectionType"
      [class.section-skeleton--shimmer]="variant === 'shimmer'"
      [class.section-skeleton--pulse]="variant === 'pulse'"
      role="status"
      aria-busy="true"
      [attr.aria-label]="'Loading ' + sectionType + ' section'"
    >
      <!-- Section Header -->
      <div class="section-skeleton__header" *ngIf="showTitle">
        <div class="skeleton-bone skeleton-bone--title"></div>
        <div class="skeleton-bone skeleton-bone--subtitle" *ngIf="showSubtitle"></div>
      </div>

      <!-- Section Content based on type -->
      <div class="section-skeleton__content" [ngSwitch]="sectionType">
        <!-- Info Section Skeleton -->
        <ng-container *ngSwitchCase="'info'">
          <div class="skeleton-info" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--label"></div>
            <div class="skeleton-bone skeleton-bone--value"></div>
          </div>
        </ng-container>

        <!-- Analytics Section Skeleton -->
        <ng-container *ngSwitchCase="'analytics'">
          <div class="skeleton-analytics" *ngFor="let i of getFieldArray()">
            <div class="skeleton-analytics__left">
              <div class="skeleton-bone skeleton-bone--icon"></div>
              <div class="skeleton-analytics__text">
                <div class="skeleton-bone skeleton-bone--label"></div>
                <div class="skeleton-bone skeleton-bone--value-sm"></div>
              </div>
            </div>
            <div class="skeleton-bone skeleton-bone--progress"></div>
          </div>
        </ng-container>

        <!-- Contact Card Skeleton -->
        <ng-container *ngSwitchCase="'contact-card'">
          <div class="skeleton-contact">
            <div class="skeleton-bone skeleton-bone--avatar"></div>
            <div class="skeleton-contact__info">
              <div class="skeleton-bone skeleton-bone--name"></div>
              <div class="skeleton-bone skeleton-bone--role"></div>
              <div class="skeleton-bone skeleton-bone--email"></div>
            </div>
          </div>
        </ng-container>

        <!-- List Section Skeleton -->
        <ng-container *ngSwitchCase="'list'">
          <div class="skeleton-list" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--bullet"></div>
            <div class="skeleton-list__text">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--desc" *ngIf="i < 2"></div>
            </div>
          </div>
        </ng-container>

        <!-- Chart Section Skeleton -->
        <ng-container *ngSwitchCase="'chart'">
          <div class="skeleton-chart">
            <div class="skeleton-chart__bars">
              <div class="skeleton-bone skeleton-bone--bar" *ngFor="let h of chartBarHeights" [style.height.%]="h"></div>
            </div>
            <div class="skeleton-bone skeleton-bone--axis"></div>
          </div>
        </ng-container>

        <!-- Overview Section Skeleton -->
        <ng-container *ngSwitchCase="'overview'">
          <div class="skeleton-overview">
            <div class="skeleton-bone skeleton-bone--paragraph"></div>
            <div class="skeleton-bone skeleton-bone--paragraph skeleton-bone--paragraph-sm"></div>
            <div class="skeleton-overview__tags">
              <div class="skeleton-bone skeleton-bone--tag" *ngFor="let i of [1,2,3]"></div>
            </div>
          </div>
        </ng-container>

        <!-- Financials Section Skeleton -->
        <ng-container *ngSwitchCase="'financials'">
          <div class="skeleton-financials">
            <div class="skeleton-financials__row" *ngFor="let i of getFieldArray()">
              <div class="skeleton-bone skeleton-bone--label"></div>
              <div class="skeleton-bone skeleton-bone--currency"></div>
            </div>
          </div>
        </ng-container>

        <!-- Map Section Skeleton -->
        <ng-container *ngSwitchCase="'map'">
          <div class="skeleton-map">
            <div class="skeleton-bone skeleton-bone--map-area"></div>
            <div class="skeleton-bone skeleton-bone--pin"></div>
          </div>
        </ng-container>

        <!-- Default Skeleton -->
        <ng-container *ngSwitchDefault>
          <div class="skeleton-default" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--line"></div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .section-skeleton {
      --skeleton-bg: var(--osi-skeleton-bg, #e5e7eb);
      --skeleton-shimmer: var(--osi-skeleton-shimmer, #f3f4f6);
      
      padding: 1rem;
      border-radius: var(--osi-radius-md, 8px);
      background: var(--osi-surface-primary, #ffffff);
    }

    .section-skeleton__header {
      margin-bottom: 1rem;
    }

    .section-skeleton__content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Skeleton bone base */
    .skeleton-bone {
      background: var(--skeleton-bg);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    /* Shimmer animation */
    .section-skeleton--shimmer .skeleton-bone::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--skeleton-shimmer) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* Pulse animation */
    .section-skeleton--pulse .skeleton-bone {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Bone variants */
    .skeleton-bone--title {
      width: 60%;
      height: 1.25rem;
    }

    .skeleton-bone--subtitle {
      width: 40%;
      height: 0.875rem;
      margin-top: 0.5rem;
    }

    .skeleton-bone--label {
      width: 35%;
      height: 0.75rem;
    }

    .skeleton-bone--value {
      width: 50%;
      height: 1rem;
    }

    .skeleton-bone--value-sm {
      width: 30%;
      height: 0.75rem;
    }

    .skeleton-bone--icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-bone--progress {
      width: 100%;
      height: 0.5rem;
      border-radius: 9999px;
    }

    .skeleton-bone--avatar {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-bone--name {
      width: 70%;
      height: 1rem;
    }

    .skeleton-bone--role {
      width: 50%;
      height: 0.75rem;
    }

    .skeleton-bone--email {
      width: 80%;
      height: 0.75rem;
    }

    .skeleton-bone--bullet {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-bone--title-sm {
      width: 60%;
      height: 0.875rem;
    }

    .skeleton-bone--desc {
      width: 90%;
      height: 0.75rem;
    }

    .skeleton-bone--bar {
      width: 100%;
      min-height: 20px;
    }

    .skeleton-bone--axis {
      width: 100%;
      height: 2px;
      margin-top: 0.5rem;
    }

    .skeleton-bone--paragraph {
      width: 100%;
      height: 0.875rem;
    }

    .skeleton-bone--paragraph-sm {
      width: 75%;
    }

    .skeleton-bone--tag {
      width: 4rem;
      height: 1.5rem;
      border-radius: 9999px;
    }

    .skeleton-bone--currency {
      width: 25%;
      height: 1rem;
    }

    .skeleton-bone--line {
      width: 100%;
      height: 0.75rem;
    }

    .skeleton-bone--map-area {
      width: 100%;
      height: 150px;
      border-radius: 8px;
    }

    .skeleton-bone--pin {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Layout helpers */
    .skeleton-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skeleton-analytics {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-analytics__left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-analytics__text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .skeleton-contact {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .skeleton-contact__info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .skeleton-list {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .skeleton-list__text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .skeleton-chart {
      position: relative;
    }

    .skeleton-chart__bars {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 120px;
    }

    .skeleton-overview__tags {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .skeleton-financials__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skeleton-map {
      position: relative;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .section-skeleton--shimmer .skeleton-bone::after,
      .section-skeleton--pulse .skeleton-bone {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class SectionSkeletonComponent {
  /** Type of section to render skeleton for */
  @Input() sectionType: SkeletonSectionType = 'default';

  /** Animation variant */
  @Input() variant: SkeletonVariant = 'shimmer';

  /** Whether to show title skeleton */
  @Input() showTitle = true;

  /** Whether to show subtitle skeleton */
  @Input() showSubtitle = false;

  /** Number of fields/items to show */
  @Input() fieldCount = 3;

  /** Random bar heights for chart skeleton */
  readonly chartBarHeights = [65, 40, 80, 55, 70, 45, 75];

  /**
   * Generate array for ngFor based on fieldCount
   */
  getFieldArray(): number[] {
    return Array.from({ length: this.fieldCount }, (_, i) => i);
  }
}







