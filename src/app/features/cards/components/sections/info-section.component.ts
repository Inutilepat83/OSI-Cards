import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardSection, CardField } from '../../../../models/card.model';

@Component({
  selector: 'app-info-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-section.component.html',
  styleUrls: ['./info-section.component.css']
})
export class InfoSectionComponent {
  @Input() section!: CardSection;
  @Input() layout: 'list' | 'grid' | 'compact' = 'list';
  @Output() fieldInteraction = new EventEmitter<{ field: CardField; section: CardSection; action: string }>();

  get fields(): CardField[] {
    return this.section.fields || [];
  }

  trackByFn(index: number, item: CardField): string {
    return item.id || index.toString();
  }

  onFieldClick(field: CardField): void {
    if (field.clickable || field.link) {
      this.fieldInteraction.emit({
        field: field,
        section: this.section,
        action: 'click'
      });
    }
  }

  formatFieldValue(field: CardField): string {
    if (field.value === null || field.value === undefined) return '';
    
    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(field.value));
      
      case 'percentage':
        return `${field.value}%`;
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(field.value));
      
      case 'date': {
        const date = new Date(field.value as string);
        return date.toLocaleDateString('en-US');
      }
      
      case 'email':
      case 'url':
      case 'phone':
        return String(field.value);
      
      default:
        return String(field.value);
    }
  }

  getFieldClass(field: CardField): string {
    const classes = ['info-field'];
    
    if (field.type) {
      classes.push(`field-${field.type}`);
    }
    
    if (field.clickable || field.link) {
      classes.push('clickable');
    }
    
    return classes.join(' ');
  }

  getTrendIcon(trend?: string): string {
    switch (trend) {
      case 'up':
        return 'fas fa-arrow-up';
      case 'down':
        return 'fas fa-arrow-down';
      default:
        return 'fas fa-minus';
    }
  }

  getTrendClass(trend?: string): string {
    switch (trend) {
      case 'up':
        return 'trend-up';
      case 'down':
        return 'trend-down';
      default:
        return 'trend-neutral';
    }
  }

  getStarArray(rating: number, maxRating = 5): boolean[] {
    return Array.from({ length: maxRating }, (_, i) => i < rating);
  }

  formatChange(change?: number): string {
    if (change === undefined || change === null) return '';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}`;
  }
}
