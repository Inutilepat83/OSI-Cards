import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

/**
 * Video Section Component
 *
 * Displays video content with thumbnails and playback controls.
 * Supports: YouTube, Vimeo, native HTML5 video.
 */
@Component({
  selector: 'lib-video-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './video-section.component.html',
  styleUrl: './video-section.scss',
})
export class VideoSectionComponent extends BaseSectionComponent implements OnInit {
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('video', (section: CardSection, availableColumns: number) => {
      return this.calculateVideoLayoutPreferences(section, availableColumns);
    });
  }

  /**
   * Calculate layout preferences for video section based on content.
   * Video sections: 2 cols default, can shrink to 1, expands to 3-4 for wide videos
   */
  private calculateVideoLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    const items = section.items ?? [];
    const itemCount = items.length;

    // Video sections: 2 cols default, can shrink to 1, expands to 3-4 for wide videos
    let preferredColumns: 1 | 2 | 3 | 4 = 2;
    if (itemCount >= 3 && availableColumns >= 3) {
      preferredColumns = 3;
    }
    if (itemCount <= 1) {
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
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 25, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        itemCount: 3, // Expand to 3 columns at 3+ videos
      },
    };
  }

  /**
   * Get layout preferences for video section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateVideoLayoutPreferences(this.section, availableColumns);
  }

  /**
   * Get video URL
   */
  getVideoUrl(item: any): string {
    return item.meta?.url || item.url || '';
  }

  /**
   * Get safe video URL for iframe
   */
  getSafeVideoUrl(item: any): SafeResourceUrl {
    const url = this.getVideoUrl(item);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Check if URL is embeddable (YouTube/Vimeo)
   */
  isEmbeddable(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  }

  /**
   * Get thumbnail URL
   */
  getThumbnail(item: any): string | null {
    return item.meta?.thumbnail || null;
  }

  /**
   * Track expanded state for descriptions
   */
  descriptionExpandedStates: boolean[] = [];

  /**
   * Toggle description expansion
   */
  toggleDescriptionExpanded(index: number): void {
    this.descriptionExpandedStates[index] = !this.descriptionExpandedStates[index];
  }

  /**
   * Check if description is expanded
   */
  isDescriptionExpanded(index: number): boolean {
    return !!this.descriptionExpandedStates[index];
  }

  /**
   * Check if description needs "Show more" button
   */
  shouldShowExpandButton(video: any): boolean {
    const description = video.description;
    return description && description.length > 150;
  }
}
