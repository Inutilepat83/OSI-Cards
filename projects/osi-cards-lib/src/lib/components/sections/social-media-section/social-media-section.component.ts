import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionHeaderComponent, EmptyStateComponent, BadgeComponent } from '../../shared';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

/**
 * Social Media Section Component
 *
 * Displays social media profiles, links, and engagement metrics.
 * Features: platform icons, follower counts, verification badges.
 */
@Component({
  selector: 'lib-social-media-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent, BadgeComponent],
  templateUrl: './social-media-section.component.html',
  styleUrl: './social-media-section.scss',
})
export class SocialMediaSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register(
      'social-media',
      (section: CardSection, availableColumns: number) => {
        return this.calculateSocialMediaLayoutPreferences(section, availableColumns);
      }
    );
  }

  /**
   * Calculate layout preferences for social media section based on content.
   * Social media sections: 2 cols default, can shrink to 1, expands based on item count
   */
  private calculateSocialMediaLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Social media sections: 2 cols default, can shrink to 1, expands based on item count
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (itemCount >= 5 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (itemCount <= 2) {
      preferredColumns = 1;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 3) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 22, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        itemCount: 5, // Expand to 3 columns at 5+ platforms
      },
    };
  }

  /**
   * Get layout preferences for social media section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateSocialMediaLayoutPreferences(this.section, availableColumns);
  }
  /**
   * Get platform icon (emoji fallback)
   */
  getPlatformIcon(platform?: unknown): string {
    if (!platform || typeof platform !== 'string') return '🌐';
    const icons: Record<string, string> = {
      twitter: '𝕏',
      linkedin: '🔗',
      facebook: '👤',
      instagram: '📷',
      youtube: '▶️',
      tiktok: '🎵',
      github: '💻',
    };
    return icons[platform.toLowerCase()] || '🌐';
  }

  /**
   * Format follower count
   */
  formatFollowers(count?: unknown): string {
    if (!count || typeof count !== 'number' || isNaN(count)) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
}
