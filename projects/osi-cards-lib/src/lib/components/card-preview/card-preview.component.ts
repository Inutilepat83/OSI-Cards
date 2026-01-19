import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardAction } from '@osi-cards/models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '@osi-cards/components';
import { CardSkeletonComponent } from '@osi-cards/components';

/**
 * Event payload for agent action triggered from card
 */
export interface AgentActionEvent {
  action: CardAction;
  card: AICardConfig;
  agentId?: string;
  context?: Record<string, unknown>;
}

/**
 * Event payload for question action triggered from card
 */
export interface QuestionActionEvent {
  action: CardAction;
  card: AICardConfig;
  question?: string;
}

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent, CardSkeletonComponent],
  templateUrl: './card-preview.component.html',
  styleUrls: ['./card-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() generatedCard: AICardConfig | null = null;
  @Input() isGenerating = false;
  @Input() isInitialized = false;
  @Input() isFullscreen = false;

  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();
  @Output() agentAction = new EventEmitter<AgentActionEvent>();
  @Output() questionAction = new EventEmitter<QuestionActionEvent>();

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

  onAgentAction(event: AgentActionEvent): void {
    this.agentAction.emit(event);
  }

  onQuestionAction(event: QuestionActionEvent): void {
    this.questionAction.emit(event);
  }
}
