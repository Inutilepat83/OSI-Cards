import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="card-type-selector">
      <button
        *ngFor="let type of cardTypes"
        (click)="onTypeClick(type)"
        [class.active]="selectedType === type"
        [disabled]="disabled"
        type="button"
        [attr.aria-pressed]="selectedType === type"
        [attr.aria-label]="'Select ' + type + ' card type'">
        {{ type === 'sko' ? 'SKO' : type.charAt(0).toUpperCase() + type.slice(1) }}
      </button>
    </div>
  `,
  styles: [`
    .card-type-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .card-type-selector button {
      padding: 0.5rem 1rem;
      background: var(--card-background);
      border: 2px solid color-mix(in srgb, var(--border) 60%, transparent);
      border-radius: 0.375rem;
      color: var(--foreground);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px color-mix(in srgb, var(--foreground) 5%, transparent);
    }

    .card-type-selector button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--color-brand, #FF7900);
    }

    .card-type-selector button.active {
      background: var(--color-brand, #FF7900);
      border-color: var(--color-brand, #FF7900);
      color: white;
    }

    .card-type-selector button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .card-type-selector button:focus {
      outline: none;
      border-color: var(--color-brand, #FF7900);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTypeSelectorComponent {
  @Input() selectedType: CardType = 'company';
  @Input() cardTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'sko'];
  @Input() disabled = false;
  @Output() typeChange = new EventEmitter<CardType>();

  onTypeClick(type: CardType): void {
    if (!this.disabled) {
      this.typeChange.emit(type);
    }
  }
}



