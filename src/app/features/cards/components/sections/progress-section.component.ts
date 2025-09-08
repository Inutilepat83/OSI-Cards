import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardSection, ProgressItem } from '../../../../models/card.model';

@Component({
  selector: 'app-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: ['./progress-section.component.css']
})
export class ProgressSectionComponent {
  @Input() section!: CardSection;
  @Input() showValues = true;
  @Input() animated = true;
  @Output() progressInteraction = new EventEmitter<{ item: ProgressItem; section: CardSection; action: string }>();

  get progressItems(): ProgressItem[] {
    return this.section.progressItems || [];
  }

  trackByFn(index: number, item: ProgressItem): string {
    return item.id || index.toString();
  }

  onProgressClick(item: ProgressItem): void {
    this.progressInteraction.emit({
      item: item,
      section: this.section,
      action: 'click'
    });
  }

  calculatePercentage(item: ProgressItem): number {
    const max = item.max || 100;
    return Math.min((item.value / max) * 100, 100);
  }

  formatValue(item: ProgressItem): string {
    switch (item.format) {
      case 'percentage':
        return `${item.value}%`;
      case 'number':
        return `${item.value}${item.max ? `/${item.max}` : ''}`;
      default:
        return String(item.value);
    }
  }

  getProgressColor(item: ProgressItem): string {
    if (item.color) return item.color;
    
    const percentage = this.calculatePercentage(item);
    if (percentage >= 80) return '#10b981'; // Success
    if (percentage >= 60) return '#f59e0b'; // Warning
    if (percentage >= 40) return '#3b82f6'; // Info
    return '#ef4444'; // Danger
  }
}
