import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './news-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsSectionComponent extends BaseSectionComponent<CardItem> {
  get newsItems(): CardItem[] {
    return this.getItems();
  }

  formatSource(item: CardItem): string {
    const meta = item.meta ?? {};
    return (typeof meta['source'] === 'string' && meta['source'])
      ? meta['source']
      : (typeof meta['publisher'] === 'string' ? meta['publisher'] : 'News');
  }

  formatTimestamp(item: CardItem): string {
    const meta = item.meta ?? {};
    const timestamp = meta['publishedAt'] ?? meta['time'] ?? meta['date'];
    return typeof timestamp === 'string' ? timestamp : '';
  }

  /**
   * Get display description, hiding "Streaming…" placeholder text
   */
  getDisplayDescription(item: CardItem): string {
    const description = item.description;
    if (description === 'Streaming…' || description === 'Streaming...') {
      return '';
    }
    return description ?? '';
  }

  override trackItem(index: number, item: CardItem): string {
    return item.id ?? `news-item-${index}-${this.formatSource(item)}`;
  }
}
