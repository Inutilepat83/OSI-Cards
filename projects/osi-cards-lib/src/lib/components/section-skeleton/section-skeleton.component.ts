/**
 * Section Skeleton Component
 *
 * Provides skeleton loading states for different section types.
 * Shows appropriate placeholder content while data is being loaded.
 *
 * The skeleton types are dynamically generated from the sections directory.
 * Run `npm run generate:skeleton-types` to regenerate after adding new sections.
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

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { SECTION_MANIFEST } from '../../section-manifest.generated';
import {
  ALL_SECTION_TYPES,
  getAllSectionTypes as getGeneratedSectionTypes,
  isValidSectionType,
  SectionType,
} from './skeleton-types.generated';

// ============================================================================
// TYPES - Derived from auto-generated skeleton-types.generated.ts
// ============================================================================

/**
 * Re-export the auto-generated section types array
 * Source: scripts/generate-skeleton-types.js scanning sections directory
 */
export { ALL_SECTION_TYPES, isValidSectionType, SectionType };

/**
 * Section type for skeleton rendering
 * Accepts any string to handle dynamic/unknown types gracefully
 * Known types get specialized templates, unknown types get default skeleton
 */
export type SkeletonSectionType = SectionType | 'default' | string;

/**
 * Get all valid section types (for external use)
 */
export function getAllSkeletonTypes(): string[] {
  return [...getGeneratedSectionTypes(), 'default'];
}

/**
 * Check if a section type has a specialized skeleton template
 */
export function hasSkeletonTemplate(type: string): boolean {
  return isValidSectionType(type);
}

/**
 * Normalize section type for skeleton rendering
 * Maps aliases and unknown types to their appropriate skeleton
 */
export function normalizeSkeletonType(type: string): SectionType | 'default' {
  const normalizedType = type.toLowerCase();

  // Check if it's a known template type
  if (isValidSectionType(normalizedType)) {
    return normalizedType;
  }

  // Check for aliases in manifest
  const manifestEntry = SECTION_MANIFEST.find(
    (entry) => entry.type === normalizedType || entry.aliases.includes(normalizedType)
  );

  if (manifestEntry && isValidSectionType(manifestEntry.type)) {
    return manifestEntry.type as SectionType;
  }

  return 'default';
}

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
      [class]="'section-skeleton--' + normalizedType"
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

      <!-- Section Content based on normalized type -->
      <div class="section-skeleton__content" [ngSwitch]="normalizedType">
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

        <!-- Network Card Skeleton -->
        <ng-container *ngSwitchCase="'network-card'">
          <div class="skeleton-network" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--avatar-sm"></div>
            <div class="skeleton-network__info">
              <div class="skeleton-bone skeleton-bone--name"></div>
              <div class="skeleton-bone skeleton-bone--desc"></div>
            </div>
            <div class="skeleton-bone skeleton-bone--badge"></div>
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
              <div
                class="skeleton-bone skeleton-bone--bar"
                *ngFor="let h of chartBarHeights"
                [style.height.%]="h"
              ></div>
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
              <div class="skeleton-bone skeleton-bone--tag" *ngFor="let i of [1, 2, 3]"></div>
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

        <!-- Event/Timeline Section Skeleton -->
        <ng-container *ngSwitchCase="'event'">
          <div class="skeleton-timeline">
            <div class="skeleton-timeline__item" *ngFor="let i of getFieldArray()">
              <div class="skeleton-bone skeleton-bone--dot"></div>
              <div class="skeleton-timeline__content">
                <div class="skeleton-bone skeleton-bone--date"></div>
                <div class="skeleton-bone skeleton-bone--title-sm"></div>
                <div class="skeleton-bone skeleton-bone--desc" *ngIf="i === 0"></div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Timeline Section Skeleton -->
        <ng-container *ngSwitchCase="'timeline'">
          <div class="skeleton-timeline">
            <div class="skeleton-timeline__item" *ngFor="let i of getFieldArray()">
              <div class="skeleton-bone skeleton-bone--dot"></div>
              <div class="skeleton-timeline__content">
                <div class="skeleton-bone skeleton-bone--date"></div>
                <div class="skeleton-bone skeleton-bone--title-sm"></div>
                <div class="skeleton-bone skeleton-bone--desc" *ngIf="i === 0"></div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- News Section Skeleton -->
        <ng-container *ngSwitchCase="'news'">
          <div class="skeleton-news" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--thumbnail"></div>
            <div class="skeleton-news__content">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--desc"></div>
              <div class="skeleton-bone skeleton-bone--meta"></div>
            </div>
          </div>
        </ng-container>

        <!-- Product Section Skeleton -->
        <ng-container *ngSwitchCase="'product'">
          <div class="skeleton-product">
            <div class="skeleton-bone skeleton-bone--image"></div>
            <div class="skeleton-product__info">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--desc"></div>
              <div class="skeleton-bone skeleton-bone--price"></div>
            </div>
          </div>
        </ng-container>

        <!-- Quotation Section Skeleton -->
        <ng-container *ngSwitchCase="'quotation'">
          <div class="skeleton-quote">
            <div class="skeleton-bone skeleton-bone--quote-mark"></div>
            <div class="skeleton-quote__content">
              <div class="skeleton-bone skeleton-bone--paragraph"></div>
              <div class="skeleton-bone skeleton-bone--paragraph skeleton-bone--paragraph-sm"></div>
              <div class="skeleton-bone skeleton-bone--author"></div>
            </div>
          </div>
        </ng-container>

        <!-- Gallery Section Skeleton -->
        <ng-container *ngSwitchCase="'gallery'">
          <div class="skeleton-gallery">
            <div
              class="skeleton-bone skeleton-bone--gallery-item"
              *ngFor="let i of [1, 2, 3, 4, 5, 6]"
            ></div>
          </div>
        </ng-container>

        <!-- Pricing Section Skeleton -->
        <ng-container *ngSwitchCase="'pricing'">
          <div class="skeleton-pricing">
            <div class="skeleton-pricing__card" *ngFor="let i of [1, 2, 3]">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--price-lg"></div>
              <div class="skeleton-bone skeleton-bone--line" *ngFor="let j of [1, 2, 3, 4]"></div>
              <div class="skeleton-bone skeleton-bone--button"></div>
            </div>
          </div>
        </ng-container>

        <!-- FAQ Section Skeleton -->
        <ng-container *ngSwitchCase="'faq'">
          <div class="skeleton-faq" *ngFor="let i of getFieldArray()">
            <div class="skeleton-faq__header">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--chevron"></div>
            </div>
            <div class="skeleton-bone skeleton-bone--paragraph" *ngIf="i === 0"></div>
          </div>
        </ng-container>

        <!-- Code Section Skeleton -->
        <ng-container *ngSwitchCase="'code'">
          <div class="skeleton-code">
            <div class="skeleton-code__header">
              <div class="skeleton-bone skeleton-bone--tab" *ngFor="let i of [1, 2]"></div>
            </div>
            <div class="skeleton-code__content">
              <div
                class="skeleton-bone skeleton-bone--code-line"
                *ngFor="let i of [1, 2, 3, 4, 5]"
                [style.width.%]="getRandomWidth(i)"
              ></div>
            </div>
          </div>
        </ng-container>

        <!-- Video Section Skeleton -->
        <ng-container *ngSwitchCase="'video'">
          <div class="skeleton-video">
            <div class="skeleton-bone skeleton-bone--video-player"></div>
            <div class="skeleton-video__controls">
              <div class="skeleton-bone skeleton-bone--play-btn"></div>
              <div class="skeleton-bone skeleton-bone--progress"></div>
            </div>
          </div>
        </ng-container>

        <!-- Rating Section Skeleton -->
        <ng-container *ngSwitchCase="'rating'">
          <div class="skeleton-rating">
            <div class="skeleton-rating__score">
              <div class="skeleton-bone skeleton-bone--score-lg"></div>
              <div class="skeleton-bone skeleton-bone--stars"></div>
            </div>
            <div class="skeleton-rating__breakdown">
              <div class="skeleton-rating__bar" *ngFor="let i of [1, 2, 3, 4, 5]">
                <div class="skeleton-bone skeleton-bone--label-sm"></div>
                <div class="skeleton-bone skeleton-bone--progress"></div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Kanban Section Skeleton -->
        <ng-container *ngSwitchCase="'kanban'">
          <div class="skeleton-kanban">
            <div class="skeleton-kanban__column" *ngFor="let i of [1, 2, 3]">
              <div class="skeleton-bone skeleton-bone--column-title"></div>
              <div class="skeleton-bone skeleton-bone--kanban-card" *ngFor="let j of [1, 2]"></div>
            </div>
          </div>
        </ng-container>

        <!-- Comparison Section Skeleton -->
        <ng-container *ngSwitchCase="'comparison'">
          <div class="skeleton-comparison">
            <div class="skeleton-comparison__header">
              <div class="skeleton-bone skeleton-bone--cell"></div>
              <div class="skeleton-bone skeleton-bone--cell" *ngFor="let i of [1, 2, 3]"></div>
            </div>
            <div class="skeleton-comparison__row" *ngFor="let i of getFieldArray()">
              <div class="skeleton-bone skeleton-bone--label"></div>
              <div class="skeleton-bone skeleton-bone--cell" *ngFor="let j of [1, 2, 3]"></div>
            </div>
          </div>
        </ng-container>

        <!-- Social Section Skeleton -->
        <ng-container *ngSwitchCase="'social'">
          <div class="skeleton-social">
            <div class="skeleton-social__links">
              <div
                class="skeleton-bone skeleton-bone--social-icon"
                *ngFor="let i of [1, 2, 3, 4]"
              ></div>
            </div>
          </div>
        </ng-container>

        <!-- Social Media Section Skeleton -->
        <ng-container *ngSwitchCase="'social-media'">
          <div class="skeleton-social-feed" *ngFor="let i of getFieldArray()">
            <div class="skeleton-social-feed__header">
              <div class="skeleton-bone skeleton-bone--avatar-sm"></div>
              <div class="skeleton-social-feed__meta">
                <div class="skeleton-bone skeleton-bone--name-sm"></div>
                <div class="skeleton-bone skeleton-bone--date"></div>
              </div>
            </div>
            <div class="skeleton-bone skeleton-bone--paragraph"></div>
            <div class="skeleton-social-feed__engagement">
              <div
                class="skeleton-bone skeleton-bone--engagement-btn"
                *ngFor="let j of [1, 2, 3]"
              ></div>
            </div>
          </div>
        </ng-container>

        <!-- Solutions Section Skeleton -->
        <ng-container *ngSwitchCase="'solutions'">
          <div class="skeleton-solutions" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--icon-lg"></div>
            <div class="skeleton-solutions__content">
              <div class="skeleton-bone skeleton-bone--title-sm"></div>
              <div class="skeleton-bone skeleton-bone--desc"></div>
              <div class="skeleton-bone skeleton-bone--tag" *ngFor="let j of [1, 2]"></div>
            </div>
          </div>
        </ng-container>

        <!-- Brand Colors Section Skeleton -->
        <ng-container *ngSwitchCase="'brand-colors'">
          <div class="skeleton-colors">
            <div
              class="skeleton-bone skeleton-bone--color-swatch"
              *ngFor="let i of [1, 2, 3, 4, 5, 6]"
            ></div>
          </div>
        </ng-container>

        <!-- Text Reference Section Skeleton -->
        <ng-container *ngSwitchCase="'text-reference'">
          <div class="skeleton-text-ref" *ngFor="let i of getFieldArray()">
            <div class="skeleton-bone skeleton-bone--title-sm"></div>
            <div class="skeleton-bone skeleton-bone--paragraph"></div>
            <div class="skeleton-bone skeleton-bone--link"></div>
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
  styles: [
    `
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
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* Pulse animation */
      .section-skeleton--pulse .skeleton-bone {
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
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

      /* Network card skeleton */
      .skeleton-network {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .skeleton-network__info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .skeleton-bone--avatar-sm {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-bone--badge {
        width: 3rem;
        height: 1.25rem;
        border-radius: 9999px;
      }

      /* Timeline skeleton */
      .skeleton-timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-left: 1rem;
        border-left: 2px solid var(--skeleton-bg);
      }

      .skeleton-timeline__item {
        display: flex;
        gap: 0.75rem;
        position: relative;
      }

      .skeleton-timeline__content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .skeleton-bone--dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        position: absolute;
        left: -1.375rem;
        flex-shrink: 0;
      }

      .skeleton-bone--date {
        width: 5rem;
        height: 0.625rem;
      }

      /* News skeleton */
      .skeleton-news {
        display: flex;
        gap: 1rem;
      }

      .skeleton-news__content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .skeleton-bone--thumbnail {
        width: 5rem;
        height: 4rem;
        border-radius: 6px;
        flex-shrink: 0;
      }

      .skeleton-bone--meta {
        width: 40%;
        height: 0.625rem;
      }

      /* Product skeleton */
      .skeleton-product {
        display: flex;
        gap: 1rem;
      }

      .skeleton-product__info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .skeleton-bone--image {
        width: 6rem;
        height: 6rem;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .skeleton-bone--price {
        width: 4rem;
        height: 1.25rem;
      }

      /* Quote skeleton */
      .skeleton-quote {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-left: 3px solid var(--skeleton-bg);
      }

      .skeleton-quote__content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .skeleton-bone--quote-mark {
        width: 1.5rem;
        height: 1.25rem;
        flex-shrink: 0;
      }

      .skeleton-bone--author {
        width: 35%;
        height: 0.75rem;
        margin-top: 0.5rem;
      }

      /* Gallery skeleton */
      .skeleton-gallery {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }

      .skeleton-bone--gallery-item {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 6px;
      }

      /* Pricing skeleton */
      .skeleton-pricing {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .skeleton-pricing__card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--skeleton-bg);
        border-radius: 8px;
      }

      .skeleton-bone--price-lg {
        width: 60%;
        height: 2rem;
      }

      .skeleton-bone--button {
        width: 100%;
        height: 2.5rem;
        border-radius: 6px;
        margin-top: auto;
      }

      /* FAQ skeleton */
      .skeleton-faq {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        border: 1px solid var(--skeleton-bg);
        border-radius: 6px;
      }

      .skeleton-faq__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .skeleton-bone--chevron {
        width: 1rem;
        height: 1rem;
        border-radius: 2px;
      }

      /* Code skeleton */
      .skeleton-code {
        border: 1px solid var(--skeleton-bg);
        border-radius: 8px;
        overflow: hidden;
      }

      .skeleton-code__header {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--skeleton-bg);
      }

      .skeleton-code__content {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        padding: 1rem;
      }

      .skeleton-bone--tab {
        width: 4rem;
        height: 1.25rem;
        border-radius: 4px;
      }

      .skeleton-bone--code-line {
        height: 0.875rem;
        border-radius: 2px;
      }

      /* Video skeleton */
      .skeleton-video {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-bone--video-player {
        width: 100%;
        aspect-ratio: 16/9;
        border-radius: 8px;
      }

      .skeleton-video__controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .skeleton-bone--play-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* Rating skeleton */
      .skeleton-rating {
        display: flex;
        gap: 2rem;
      }

      .skeleton-rating__score {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .skeleton-rating__breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .skeleton-rating__bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .skeleton-bone--score-lg {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
      }

      .skeleton-bone--stars {
        width: 5rem;
        height: 1rem;
      }

      .skeleton-bone--label-sm {
        width: 1.5rem;
        height: 0.75rem;
        flex-shrink: 0;
      }

      /* Kanban skeleton */
      .skeleton-kanban {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .skeleton-kanban__column {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--skeleton-bg);
        border-radius: 8px;
        opacity: 0.5;
      }

      .skeleton-bone--column-title {
        width: 60%;
        height: 1rem;
        margin-bottom: 0.25rem;
      }

      .skeleton-bone--kanban-card {
        width: 100%;
        height: 4rem;
        border-radius: 6px;
        background: var(--osi-surface-primary, #ffffff);
      }

      /* Comparison skeleton */
      .skeleton-comparison {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-comparison__header,
      .skeleton-comparison__row {
        display: grid;
        grid-template-columns: 1fr repeat(3, 1fr);
        gap: 0.5rem;
      }

      .skeleton-comparison__header {
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--skeleton-bg);
      }

      .skeleton-bone--cell {
        height: 1.5rem;
        border-radius: 4px;
      }

      /* Social skeleton */
      .skeleton-social {
        padding: 0.5rem;
      }

      .skeleton-social__links {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .skeleton-bone--social-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
      }

      /* Social media feed skeleton */
      .skeleton-social-feed {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--skeleton-bg);
        border-radius: 8px;
      }

      .skeleton-social-feed__header {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .skeleton-social-feed__meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .skeleton-social-feed__engagement {
        display: flex;
        gap: 1rem;
      }

      .skeleton-bone--name-sm {
        width: 5rem;
        height: 0.75rem;
      }

      .skeleton-bone--engagement-btn {
        width: 3rem;
        height: 1.25rem;
        border-radius: 4px;
      }

      /* Solutions skeleton */
      .skeleton-solutions {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--skeleton-bg);
        border-radius: 8px;
      }

      .skeleton-solutions__content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .skeleton-bone--icon-lg {
        width: 3rem;
        height: 3rem;
        border-radius: 8px;
        flex-shrink: 0;
      }

      /* Brand colors skeleton */
      .skeleton-colors {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }

      .skeleton-bone--color-swatch {
        width: 100%;
        height: 4rem;
        border-radius: 8px;
      }

      /* Text reference skeleton */
      .skeleton-text-ref {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        border-left: 3px solid var(--skeleton-bg);
      }

      .skeleton-bone--link {
        width: 30%;
        height: 0.75rem;
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .section-skeleton--shimmer .skeleton-bone::after,
        .section-skeleton--pulse .skeleton-bone {
          animation: none;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 640px) {
        .skeleton-pricing,
        .skeleton-kanban {
          grid-template-columns: 1fr;
        }

        .skeleton-gallery {
          grid-template-columns: repeat(2, 1fr);
        }

        .skeleton-comparison__header,
        .skeleton-comparison__row {
          grid-template-columns: 1fr repeat(2, 1fr);
        }

        .skeleton-rating {
          flex-direction: column;
          gap: 1rem;
        }
      }
    `,
  ],
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

  /** Cached random widths for code lines */
  private readonly codeLineWidths: number[] = [85, 65, 90, 45, 70];

  /**
   * Get the normalized section type for skeleton rendering
   * Maps aliases and unknown types to their appropriate skeleton template
   */
  get normalizedType(): SectionType | 'default' {
    return normalizeSkeletonType(this.sectionType);
  }

  /**
   * Generate array for ngFor based on fieldCount
   */
  getFieldArray(): number[] {
    return Array.from({ length: this.fieldCount }, (_, i) => i);
  }

  /**
   * Get pseudo-random width for code lines based on index
   * Uses a deterministic approach for consistent rendering
   */
  getRandomWidth(index: number): number {
    return this.codeLineWidths[index % this.codeLineWidths.length] ?? 75;
  }

  /**
   * Check if the current section type has a specialized skeleton
   */
  get hasSpecializedSkeleton(): boolean {
    return hasSkeletonTemplate(this.sectionType);
  }

  /**
   * Get all available skeleton types (for debugging/documentation)
   */
  static getAvailableTypes(): string[] {
    return getAllSkeletonTypes();
  }
}
