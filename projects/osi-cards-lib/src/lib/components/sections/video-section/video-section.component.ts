import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CardItem } from '../../../models';
import { LucideIconsModule } from '../../../icons';
import { BaseSectionComponent, SectionLayoutConfig } from '../base-section.component';
import { inject } from '@angular/core';

/**
 * Video item configuration
 */
export interface VideoItem extends CardItem {
  /** Video URL (YouTube, Vimeo, or direct) */
  videoUrl?: string;
  /** Video source URL alias */
  src?: string;
  /** Fallback URL */
  url?: string;
  /** Video thumbnail URL */
  thumbnail?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Video provider (youtube, vimeo, custom) */
  provider?: 'youtube' | 'vimeo' | 'custom';
  /** Aspect ratio */
  aspectRatio?: string;
  /** Autoplay on load */
  autoplay?: boolean;
  /** Show controls */
  controls?: boolean;
  /** Muted by default */
  muted?: boolean;
}

/**
 * Video Section Component
 *
 * Displays embedded videos from YouTube, Vimeo, or direct sources
 * with thumbnail previews and playback controls.
 *
 * @example
 * ```html
 * <app-video-section [section]="videoSection"></app-video-section>
 * ```
 */
@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './video-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoSectionComponent extends BaseSectionComponent<VideoItem> {
  /** Video sections typically need more width */
  static readonly layoutConfig: SectionLayoutConfig = {
    preferredColumns: 2,
    minColumns: 1,
    maxColumns: 3,
    expandOnItemCount: 2,
  };

  private readonly sanitizer = inject(DomSanitizer);

  /** Currently playing video index */
  playingIndex = signal<number | null>(null);

  get items(): VideoItem[] {
    return super.getItems() as VideoItem[];
  }

  /**
   * Get video URL from item
   */
  getVideoUrl(item: VideoItem): string {
    return item.videoUrl || item.src || item.url || '';
  }

  /**
   * Get safe embed URL for iframe
   */
  getEmbedUrl(item: VideoItem): SafeResourceUrl {
    const url = this.getVideoUrl(item);
    let embedUrl = url;

    // Convert YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      embedUrl = this.getYouTubeEmbedUrl(url, item);
    }
    // Convert Vimeo URLs
    else if (url.includes('vimeo.com')) {
      embedUrl = this.getVimeoEmbedUrl(url, item);
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Get YouTube embed URL
   */
  private getYouTubeEmbedUrl(url: string, item: VideoItem): string {
    let videoId = '';

    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    }

    const params = new URLSearchParams({
      autoplay: item.autoplay ? '1' : '0',
      mute: item.muted ? '1' : '0',
      controls: item.controls !== false ? '1' : '0',
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  /**
   * Get Vimeo embed URL
   */
  private getVimeoEmbedUrl(url: string, item: VideoItem): string {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';

    const params = new URLSearchParams({
      autoplay: item.autoplay ? '1' : '0',
      muted: item.muted ? '1' : '0',
    });

    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnail(item: VideoItem): string {
    if (item.thumbnail) return item.thumbnail;

    const url = this.getVideoUrl(item);

    // Get YouTube thumbnail
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      }
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return '';
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds?: number): string {
    if (!seconds) return '';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Play video
   */
  playVideo(index: number): void {
    this.playingIndex.set(index);

    const item = this.items[index];
    if (item) {
      this.emitItemInteraction(item, {
        sectionTitle: this.section.title,
        action: 'play',
        index
      });
    }
  }

  /**
   * Check if video is playing
   */
  isPlaying(index: number): boolean {
    return this.playingIndex() === index;
  }

  /**
   * Get aspect ratio style
   */
  getAspectRatio(item: VideoItem): string {
    return item.aspectRatio || '16 / 9';
  }

  override trackItem(index: number, item: VideoItem): string {
    return item.id ?? `video-${index}-${item.videoUrl || item.title || ''}`;
  }
}

