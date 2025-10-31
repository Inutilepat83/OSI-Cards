import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-controls.component.html',
  styleUrls: ['./card-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardControlsComponent {
  @Input() cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event' = 'company';
  @Input() cardVariant = 1;
  @Input() switchingType = false;

  @Output() cardTypeChange = new EventEmitter<'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event'>();
  @Output() cardVariantChange = new EventEmitter<number>();

  @ViewChildren('cardTypeButton') private cardTypeButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChildren('variantButton') private variantButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  cardTypes: ('company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event')[] = [
    'company', 'contact', 'opportunity', 'product', 'analytics', 'project', 'event'
  ];

  onCardTypeChange(type: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event'): void {
    if (!this.switchingType) {
      this.cardTypeChange.emit(type);
    }
  }

  onCardVariantChange(variant: number): void {
    if (!this.switchingType) {
      this.cardVariantChange.emit(variant);
    }
  }

  // TrackBy functions for performance optimization
  trackByCardType(index: number, type: string): string {
    return type;
  }

  trackByVariant(index: number, variant: number): number {
    return variant;
  }

  onCardTypeKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % this.cardTypes.length;
      this.focusCardTypeButton(nextIndex);
      this.onCardTypeChange(this.cardTypes[nextIndex]);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = (currentIndex - 1 + this.cardTypes.length) % this.cardTypes.length;
      this.focusCardTypeButton(nextIndex);
      this.onCardTypeChange(this.cardTypes[nextIndex]);
    }
  }

  onVariantKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % 3;
      this.focusVariantButton(nextIndex);
      this.onCardVariantChange(nextIndex + 1);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex - 1 + 3) % 3;
      this.focusVariantButton(nextIndex);
      this.onCardVariantChange(nextIndex + 1);
    }
  }

  private focusCardTypeButton(index: number): void {
    const button = this.cardTypeButtons?.get(index)?.nativeElement;
    button?.focus();
  }

  private focusVariantButton(index: number): void {
    const button = this.variantButtons?.get(index)?.nativeElement;
    button?.focus();
  }
}
