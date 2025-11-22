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
      <label for="card-type-select" class="selector-label">Card Type</label>
      <select
        id="card-type-select"
        [value]="selectedType"
        (change)="onTypeChange($event)"
        class="type-select"
        aria-label="Select card type"
      >
        <option *ngFor="let type of cardTypes" [value]="type">
          {{ type | titlecase }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .card-type-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .selector-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--card-text-primary, #FFFFFF);
    }

    .type-select {
      padding: 0.5rem;
      background: rgba(20, 30, 50, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
      color: var(--card-text-primary, #FFFFFF);
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .type-select:focus {
      outline: none;
      border-color: var(--color-brand, #FF7900);
    }

    .type-select option {
      background: rgba(20, 30, 50, 0.95);
      color: var(--card-text-primary, #FFFFFF);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTypeSelectorComponent {
  @Input() selectedType: CardType = 'company';
  @Input() cardTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'sko'];
  @Output() typeChange = new EventEmitter<CardType>();

  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.typeChange.emit(target.value as CardType);
  }
}


