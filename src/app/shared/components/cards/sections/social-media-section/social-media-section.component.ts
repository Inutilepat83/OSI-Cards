import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';
import { CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

@Component({
  selector: 'app-social-media-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './social-media-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialMediaSectionComponent extends BaseSectionComponent<CardItem> {
  get posts(): CardItem[] {
    return this.getItems();
  }

  formatPlatform(item: CardItem): string {
    const meta = (item.meta ?? {}) as Record<string, unknown>;
    return typeof meta['platform'] === 'string'
      ? meta['platform']
      : typeof meta['network'] === 'string'
        ? meta['network']
        : 'Social';
  }

  formatMetric(item: CardItem): string {
    const meta = (item.meta ?? {}) as Record<string, unknown>;
    const likes = meta['likes'];
    const comments = meta['comments'];
    if (typeof likes === 'number' && typeof comments === 'number') {
      return `${likes} likes · ${comments} comments`;
    }
    if (typeof likes === 'number') {
      return `${likes} likes`;
    }
    if (typeof comments === 'number') {
      return `${comments} comments`;
    }
    return '';
  }

  trackPost(index: number, post: CardItem): string {
    return post.id ?? `social-post-${index}`;
  }
}
