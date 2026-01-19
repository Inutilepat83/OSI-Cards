/**
 * Item Renderer Component
 *
 * Unified component for rendering list items across all section types.
 * Consolidates item rendering logic from list, timeline, features sections.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export interface ItemData {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  url?: string;
  value?: string | number;
  metadata?: Record<string, unknown>;
}

export interface ItemClickEvent {
  item: ItemData;
  index: number;
}

@Component({
  selector: 'osi-item-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="item"
      [class.item--clickable]="clickable"
      [class.item--compact]="compact"
      [class.item--with-image]="!!item.image"
      [attr.role]="clickable ? 'button' : null"
      [attr.tabindex]="clickable ? 0 : null"
    >
      @if (item.image) {
        <div class="item__image">
          <img [src]="item.image" [alt]="item.title" />
        </div>
      } @else if (item.icon) {
        <div class="item__icon" [innerHTML]="item.icon"></div>
      } @else if (showIndex) {
        <div class="item__index">{{ index + 1 }}</div>
      }

      <div class="item__content">
        <div class="item__header">
          <span class="item__title">{{ item.title }}</span>

          @if (item.badge) {
            <span class="item__badge" [style.background-color]="item.badgeColor">
              {{ item.badge }}
            </span>
          }

          @if (item.value !== undefined) {
            <span class="item__value">{{ item.value }}</span>
          }
        </div>

        @if (item.description) {
          <p class="item__description">{{ item.description }}</p>
        }
      </div>

      @if (clickable || item.url) {
        <span class="item__arrow">→</span>
      }
    </div>
  `,
  styles: [
    `
      .item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 8px;
        transition:
          background-color 0.15s ease,
          transform 0.15s ease;
      }

      .item.item--clickable {
        cursor: pointer;
      }

      .item.item--clickable:hover {
        background-color: var(--osi-item-hover-bg, rgba(0, 0, 0, 0.03));
        transform: translateX(2px);
      }

      .item.item--clickable:focus-visible {
        outline: 2px solid var(--osi-focus-ring, #4f46e5);
        outline-offset: 2px;
      }

      .item.item--compact {
        padding: 0.5rem;
      }

      .item.item--compact .item__description {
        display: none;
      }

      .item.item--with-image .item__image {
        width: 48px;
        height: 48px;
      }

      .item.item--with-image .item__image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }

      .item__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--osi-item-icon-bg, #f1f5f9);
        border-radius: 6px;
        flex-shrink: 0;
        font-size: 1rem;
      }

      .item__index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--osi-item-index-bg, #e2e8f0);
        border-radius: 50%;
        flex-shrink: 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--osi-item-index-color, #475569);
      }

      .item__content {
        flex: 1;
        min-width: 0;
      }

      .item__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .item__title {
        font-weight: 500;
        color: var(--osi-item-title-color, #1e293b);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item__badge {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: 9999px;
        background: var(--osi-item-badge-bg, #dbeafe);
        color: var(--osi-item-badge-color, #1d4ed8);
      }

      .item__value {
        margin-left: auto;
        font-weight: 600;
        color: var(--osi-item-value-color, #1e293b);
        flex-shrink: 0;
      }

      .item__description {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--osi-item-description-color, #64748b);
        line-height: 1.4;
      }

      .item__arrow {
        opacity: 0;
        transition:
          opacity 0.15s ease,
          transform 0.15s ease;
        color: var(--osi-item-arrow-color, #94a3b8);

        .item:hover & {
          opacity: 1;
          transform: translateX(2px);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemRendererComponent {
  @Input({ required: true }) item!: ItemData;
  @Input() index = 0;
  @Input() clickable = false;
  @Input() compact = false;
  @Input() showIndex = false;

  @Output() itemClick = new EventEmitter<ItemClickEvent>();

  @HostListener('click')
  @HostListener('keydown.enter')
  onClick(): void {
    if (this.clickable || this.item.url) {
      if (this.item.url) {
        window.open(this.item.url, '_blank');
      }
      this.itemClick.emit({ item: this.item, index: this.index });
    }
  }
}
