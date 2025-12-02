import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Streaming stage type representing the current state of card generation.
 * - 'idle': No streaming activity
 * - 'thinking': AI is processing/thinking before streaming
 * - 'streaming': Actively streaming card content
 * - 'complete': Streaming finished successfully
 * - 'aborted': Streaming was cancelled
 * - 'error': An error occurred during streaming
 */
export type StreamingStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error' | undefined;

/**
 * Card Streaming Indicator Component
 * 
 * Displays streaming progress and status for card generation.
 * Provides visual feedback during LLM streaming with:
 * - Progress bar with animated fill
 * - Stage-specific ARIA labels for accessibility
 * - Customizable progress labels
 * 
 * @example
 * ```html
 * <app-card-streaming-indicator
 *   [streamingStage]="'streaming'"
 *   [streamingProgress]="0.75"
 *   [streamingProgressLabel]="'STREAMING JSON (75%)'">
 * </app-card-streaming-indicator>
 * ```
 */
@Component({
  selector: 'app-card-streaming-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-streaming-indicator.component.html',
  styleUrls: ['./card-streaming-indicator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CardStreamingIndicatorComponent {
  /**
   * Current streaming stage.
   * Controls visibility and ARIA attributes of the indicator.
   */
  @Input() streamingStage: StreamingStage = undefined;

  /**
   * Streaming progress as a value between 0 and 1.
   * Used to fill the progress bar.
   */
  @Input() streamingProgress?: number;

  /**
   * Custom label to display below the progress bar.
   * If not provided, a screen-reader-only label will be used.
   */
  @Input() streamingProgressLabel?: string;

  /**
   * Whether the indicator should be visible.
   * Shows during 'streaming' and 'thinking' stages.
   */
  get isStreamingActive(): boolean {
    return this.streamingStage === 'streaming' || this.streamingStage === 'thinking';
  }

  /**
   * Progress as a percentage (0-100).
   */
  get progressPercentage(): number {
    return this.streamingProgress ? Math.round(this.streamingProgress * 100) : 0;
  }

  /**
   * Get ARIA label for the streaming indicator.
   * Provides appropriate context based on current stage.
   */
  getAriaLabel(): string {
    switch (this.streamingStage) {
      case 'thinking':
        return 'Thinking, please wait';
      case 'streaming':
        const progress = this.streamingProgress 
          ? Math.round(this.streamingProgress * 100) 
          : 0;
        return `Streaming progress: ${progress}%`;
      case 'error':
        return 'Error occurred during streaming';
      case 'aborted':
        return 'Streaming was aborted';
      case 'complete':
        return 'Streaming complete';
      default:
        return 'Streaming status';
    }
  }
}









