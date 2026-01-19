import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { CardSection } from '@osi-cards/models';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    let url = this.getVideoUrl(item);

    if (!url || url.trim() === '') {
      // Return a safe empty URL instead of empty string to prevent blocking
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    // Convert video URLs to embed format
    try {
      // Handle YouTube URLs
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v');
        if (videoId && videoId.trim() !== '') {
          url = `https://www.youtube.com/embed/${videoId}`;
        } else {
          console.warn('Invalid YouTube URL - missing video ID:', url);
          return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        }
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]?.trim();
        if (videoId && videoId !== '') {
          url = `https://www.youtube.com/embed/${videoId}`;
        } else {
          console.warn('Invalid YouTube short URL - missing video ID:', url);
          return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        }
      }
      // Handle Vimeo URLs
      else if (url.includes('vimeo.com/')) {
        // Extract Vimeo video ID from various URL formats
        // Supports: https://vimeo.com/123456789, https://vimeo.com/123456789?share=copy
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch && vimeoMatch[1]) {
          url = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        } else {
          console.warn('Invalid Vimeo URL - missing video ID:', url);
          return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        }
      }
      // If already an embed URL (YouTube or Vimeo), validate and use as-is
      else if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) {
        // Already in embed format, validate it's a proper URL
        try {
          new URL(url); // Validate URL format
        } catch {
          console.warn('Invalid embed URL format:', url);
          return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        }
      } else {
        // Unknown URL format - might be a direct video file or invalid URL
        console.warn('Unknown video URL format - may not be embeddable:', url);
        // Return blank to prevent blocking error, component will fall back to native video or thumbnail
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }
    } catch (error) {
      // If URL parsing fails, log and return blank
      console.warn('Failed to parse video URL:', url, error);
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    // Final validation - ensure URL is not empty before sanitizing
    if (!url || url.trim() === '') {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Check if URL is embeddable (YouTube/Vimeo)
   * Direct video files (.mp4, .webm, etc.) are not embeddable and use native <video> tag
   */
  isEmbeddable(url: string): boolean {
    if (!url) {
      return false;
    }
    // Check for embeddable platforms
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');

    // Direct video files should use native <video> tag, not iframe
    const isDirectVideo = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?|$)/i.test(url);

    return (isYouTube || isVimeo) && !isDirectVideo;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnail(item: any): string | null {
    return item.meta?.thumbnail || null;
  }

  /**
   * Handle thumbnail image loading errors
   * Hides the image when it fails to load to prevent broken image icons
   */
  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide the image to prevent broken image icon from showing
    img.style.display = 'none';
    // Optionally, could set a placeholder image here:
    // img.src = 'assets/placeholder-video.png';
  }

  /**
   * Handle video loading errors (including poster image errors)
   * Silently handles errors to prevent console noise
   */
  onVideoError(event: Event): void {
    // Silently handle video/poster errors - they're non-critical
    // The video element will handle its own error state
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
