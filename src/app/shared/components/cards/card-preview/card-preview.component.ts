import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '../ai-card-renderer.component';
import { CardSkeletonComponent } from '../card-skeleton/card-skeleton.component';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent, CardSkeletonComponent],
  templateUrl: './card-preview.component.html',
  styleUrls: ['./card-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() generatedCard: AICardConfig | null = null;
  @Input() isGenerating = false;
  @Input() isInitialized = false;
  @Input() isFullscreen = false;

  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  @Output() export = new EventEmitter<void>();
  @Output() agentAction = new EventEmitter<{ action: any; card: AICardConfig; agentId?: string; context?: Record<string, unknown> }>();
  @Output() questionAction = new EventEmitter<{ action: any; card: AICardConfig; question?: string }>();

  @ViewChild('cardElement') cardElementRef?: ElementRef<HTMLDivElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Component initialized
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['generatedCard'] || changes['isGenerating'] || changes['isInitialized']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  get showSkeleton(): boolean {
    return this.isGenerating && !this.generatedCard;
  }

  onCardInteraction(event: { action: string; card: AICardConfig }): void {
    this.cardInteraction.emit(event);
  }

  onFieldInteraction(event: CardFieldInteractionEvent): void {
    this.fieldInteraction.emit(event);
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.fullscreenToggle.emit(isFullscreen);
  }

  onExport(): void {
    this.export.emit();
  }

  onAgentAction(event: { action: any; card: AICardConfig; agentId?: string; context?: Record<string, unknown> }): void {
    this.agentAction.emit(event);
  }

  onQuestionAction(event: { action: any; card: AICardConfig; question?: string }): void {
    this.questionAction.emit(event);
  }

  /**
   * Get the card element for export purposes
   */
  getCardElement(): HTMLElement | null {
    return this.cardElementRef?.nativeElement ?? null;
  }
}
