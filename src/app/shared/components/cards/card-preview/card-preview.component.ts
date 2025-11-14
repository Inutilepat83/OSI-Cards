import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '../ai-card-renderer.component';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent],
  templateUrl: './card-preview.component.html',
  styleUrls: ['./card-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardPreviewComponent {
  @Input() generatedCard: AICardConfig | null = null;
  @Input() isGenerating = false;
  @Input() isInitialized = false;
  @Input() isFullscreen = false;

  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  onCardInteraction(event: { action: string; card: AICardConfig }): void {
    this.cardInteraction.emit(event);
  }

  onFieldInteraction(event: CardFieldInteractionEvent): void {
    this.fieldInteraction.emit(event);
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.fullscreenToggle.emit(isFullscreen);
  }
}
