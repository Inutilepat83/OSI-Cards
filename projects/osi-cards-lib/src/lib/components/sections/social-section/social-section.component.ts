import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideIconsModule } from '../../../icons';
import { CardItem } from '../../../models';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';

/**
 * Social post item
 */
export interface SocialPost extends CardItem {
  /** Author name */
  author?: string;
  /** Author username/handle */
  handle?: string;
  /** Author avatar URL */
  avatar?: string;
  /** Post content/text */
  content?: string;
  /** Post timestamp */
  timestamp?: string;
  /** Platform (twitter, linkedin, facebook, instagram) */
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'other';
  /** Media attachments */
  media?: { type: 'image' | 'video'; url: string }[];
  /** Like count */
  likes?: number;
  /** Comment count */
  comments?: number;
  /** Share/retweet count */
  shares?: number;
  /** Whether post is verified */
  verified?: boolean;
  /** Post URL */
  postUrl?: string;
}

/**
 * Social Section Component
 *
 * Displays social media posts in a feed format,
 * supporting multiple platforms.
 *
 * @example
 * ```html
 * <app-social-section [section]="socialSection"></app-social-section>
 * ```
 */
@Component({
  selector: 'app-social-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './social-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSectionComponent extends BaseSectionComponent<SocialPost> {
  /** Social sections work well in 2 columns */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 2,
    expandOnItemCount: 4,
  };

  get items(): SocialPost[] {
    return super.getItems() as SocialPost[];
  }

  /**
   * Get author display name
   */
  getAuthorName(item: SocialPost): string {
    return item.author || item.title || 'Unknown';
  }

  /**
   * Get author handle/username
   */
  getHandle(item: SocialPost): string {
    return item.handle ? `@${item.handle.replace('@', '')}` : '';
  }

  /**
   * Get post content
   */
  getContent(item: SocialPost): string {
    return item.content || item.description || '';
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp?: string): string {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return timestamp;
    }
  }

  /**
   * Format engagement number
   */
  formatNumber(num?: number): string {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Get platform icon
   */
  getPlatformIcon(platform?: string): string {
    switch (platform) {
      case 'twitter':
        return 'twitter';
      case 'linkedin':
        return 'linkedin';
      case 'facebook':
        return 'facebook';
      case 'instagram':
        return 'instagram';
      default:
        return 'share-2';
    }
  }

  /**
   * Get platform color class
   */
  getPlatformClass(platform?: string): string {
    if (!platform) return '';
    return `social-post--${platform}`;
  }

  /**
   * Get initials for avatar fallback
   */
  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Handle post click
   */
  onPostClick(item: SocialPost): void {
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      platform: item.platform,
      action: 'view',
    });

    // Open post URL if available
    if (item.postUrl) {
      window.open(item.postUrl, '_blank', 'noopener');
    }
  }

  /**
   * Handle like action
   */
  onLike(item: SocialPost, event: Event): void {
    event.stopPropagation();
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      action: 'like',
    });
  }

  /**
   * Handle comment action
   */
  onComment(item: SocialPost, event: Event): void {
    event.stopPropagation();
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      action: 'comment',
    });
  }

  /**
   * Handle share action
   */
  onShare(item: SocialPost, event: Event): void {
    event.stopPropagation();
    this.emitItemInteraction(item, {
      sectionTitle: this.section.title,
      action: 'share',
    });
  }

  override trackItem(index: number, item: SocialPost): string {
    return item.id ?? `social-${index}-${item.author || ''}`;
  }
}
