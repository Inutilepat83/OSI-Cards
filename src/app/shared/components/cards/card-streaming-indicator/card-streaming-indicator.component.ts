import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StreamingStage =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'complete'
  | 'aborted'
  | 'error'
  | undefined;

/**
 * Card Streaming Indicator Component
 *
 * Displays streaming progress and status for card generation.
 * Extracted from AICardRendererComponent for better separation of concerns.
 */
@Component({
  selector: 'app-card-streaming-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-streaming-indicator.component.html',
  styleUrls: ['./card-streaming-indicator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStreamingIndicatorComponent {
  @Input() streamingStage: StreamingStage = undefined;
  @Input() streamingProgress?: number; // Progress 0-1
  @Input() streamingProgressLabel?: string; // e.g., "STREAMING JSON (75%)"

  get isStreamingActive(): boolean {
    return this.streamingStage === 'streaming' || this.streamingStage === 'thinking';
  }

  get progressPercentage(): number {
    return this.streamingProgress ? Math.round(this.streamingProgress * 100) : 0;
  }

  /**
   * Get ARIA label for the streaming indicator
   */
  getAriaLabel(): string {
    switch (this.streamingStage) {
      case 'thinking':
        return 'Thinking, please wait';
      case 'streaming':
        const progress = this.streamingProgress ? Math.round(this.streamingProgress * 100) : 0;
        return `Streaming progress: ${progress}%`;
      case 'error':
        return 'Error occurred during streaming';
      case 'aborted':
        return 'Streaming was aborted';
      default:
        return 'Streaming status';
    }
  }
}
