import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseSectionComponent } from '../base-section.component';

/**
 * Video Section Component
 *
 * Displays video content with thumbnails and playback controls.
 * Supports: YouTube, Vimeo, native HTML5 video.
 */
@Component({
  selector: 'lib-video-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-section.component.html',
  styleUrl: './video-section.scss'
})
export class VideoSectionComponent extends BaseSectionComponent {

  constructor(private sanitizer: DomSanitizer) {
    super();
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
}
