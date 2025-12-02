import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Social Media Section Component
 *
 * Displays social media profiles, links, and engagement metrics.
 * Features: platform icons, follower counts, verification badges.
 */
@Component({
  selector: 'lib-social-media-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-media-section.component.html',
  styleUrl: './social-media-section.scss'
})
export class SocialMediaSectionComponent extends BaseSectionComponent {

  /**
   * Get platform icon (emoji fallback)
   */
  getPlatformIcon(platform?: unknown): string {
    if (!platform || typeof platform !== 'string') return '🌐';
    const icons: Record<string, string> = {
      'twitter': '𝕏',
      'linkedin': '🔗',
      'facebook': '👤',
      'instagram': '📷',
      'youtube': '▶️',
      'tiktok': '🎵',
      'github': '💻'
    };
    return icons[platform.toLowerCase()] || '🌐';
  }

  /**
   * Format follower count
   */
  formatFollowers(count?: unknown): string {
    if (!count || typeof count !== 'number') return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
}
