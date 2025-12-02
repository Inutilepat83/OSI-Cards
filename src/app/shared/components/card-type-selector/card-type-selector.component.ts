import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CardType } from '../../../models';

/**
 * Card type selector component
 * Extracted from HomePageComponent for better separation of concerns
 */
@Component({
  selector: 'app-card-type-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-type-wrapper">
      <button
        *ngFor="let type of cardTypes"
        class="card-type-btn"
        (click)="onTypeClick(type)"
        [class.active]="selectedType === type"
        [disabled]="disabled"
        type="button"
        [attr.aria-pressed]="selectedType === type"
        [attr.aria-label]="'Select ' + type + ' card type'"
      >
        {{
          type === 'all'
            ? 'All Sections'
            : type === 'sko'
              ? 'SKO'
              : type.charAt(0).toUpperCase() + type.slice(1)
        }}
      </button>
    </div>
  `,
  styles: [
    `
      .card-type-btn {
        padding: 0.5rem 1rem;
        background: var(--card-background);
        border: none;
        border-radius: 0.375rem;
        color: var(--foreground);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px color-mix(in srgb, var(--foreground) 5%, transparent);
      }

      .card-type-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }

      .card-type-btn.active {
        background: var(--color-brand, #ff7900);
        color: white;
      }

      .card-type-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .card-type-btn:focus {
        outline: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTypeSelectorComponent {
  @Input() selectedType: CardType = 'company';
  @Input() cardTypes: CardType[] = [
    'company',
    'contact',
    'opportunity',
    'product',
    'analytics',
    'event',
    'sko',
  ];
  @Input() disabled = false;
  @Output() typeChange = new EventEmitter<CardType>();

  onTypeClick(type: CardType): void {
    if (!this.disabled) {
      this.typeChange.emit(type);
    }
  }
}
