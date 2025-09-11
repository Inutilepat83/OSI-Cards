import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';
import { AICardRendererComponent } from '../ai-card-renderer.component';

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

  @Output() cardInteraction = new EventEmitter<unknown>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  onCardInteraction(event: unknown): void {
    this.cardInteraction.emit(event);
  }

  onFullscreenToggle(event: any): void {
    this.fullscreenToggle.emit(event);
  }
}
