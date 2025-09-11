import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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
}
