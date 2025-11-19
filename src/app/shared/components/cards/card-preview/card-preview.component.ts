import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardSection } from '../../../../models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '../ai-card-renderer.component';
import { CardSkeletonComponent } from '../card-skeleton/card-skeleton.component';
import { CardDataService } from '../../../../core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CardChangeType } from '../../../../shared/utils/card-diff.util';
import { LlmStreamState, LlmStreamStage } from './llm-stream-state.model';

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
  @Input() changeType: CardChangeType = 'structural';
  @Input() llmStreamState: LlmStreamState | null = null;
  @Input() llmPreviewCard: AICardConfig | null = null;
  
  // Phase 1 & 2: Direct streaming updates with local state management
  private _streamingCard: AICardConfig | null = null;
  private _streamingCardVersion = 0;
  private _streamingChangeType: CardChangeType = 'structural';
  
  @Input() set streamingCardUpdate(update: { card: AICardConfig; changeType: CardChangeType; completedSections?: number[] } | null) {
    if (!update) {
      this._streamingCard = null;
      return;
    }
    
    // Update local state
    this._streamingCard = update.card;
    this._streamingChangeType = update.changeType;
    this._streamingCardVersion++;
    
    // Since we're now creating new object references in batchSectionCompletions,
    // Angular's change detection will detect the change. We just need to trigger it.
    // Use requestAnimationFrame to batch with other updates for better performance
    requestAnimationFrame(() => {
      this.cdr.markForCheck();
    });
  }

  @Output() cardInteraction = new EventEmitter<{ action: string; card: AICardConfig }>();
  @Output() fieldInteraction = new EventEmitter<CardFieldInteractionEvent>();
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  // Progressive loading state
  showSkeleton = false;
  progressiveCard: AICardConfig | null = null;
  isTransitioning = false;
  cardOpacity = 1;
  private smoothUpdatePending = false;
  private readonly sectionStreamStop$ = new Subject<void>();
  
  // State transition tracking
  private previousStage: LlmStreamStage | null = null;
  private stateTransitionClass = 'state-entered'; // Start with visible state
  private stateTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Phase 2: Get the card to display with local streaming state priority
   * Ensures card is visible as soon as it starts rendering during streaming
   */
  get displayCard(): AICardConfig | undefined {
    // During LLM simulation, prioritize showing the card as soon as possible
    if (this.llmStreamState?.isSimulating) {
      // Show thinking frame only during thinking stage
      if (this.llmStreamState.stage === 'thinking') {
        return undefined;
      }

      // Phase 2: Prioritize local streaming card (direct updates, no store overhead)
      if (this._streamingCard) {
        return this._streamingCard;
      }

      // Fallback to llmPreviewCard (from store)
      if (this.llmPreviewCard) {
        return this.llmPreviewCard;
      }

      // Fallback to generatedCard if llmPreviewCard not available
      if (this.generatedCard) {
        return this.generatedCard;
      }
    }
    
    // Only use progressiveCard if we're actively streaming sections
    // For live updates, use generatedCard directly to avoid duplicates
    if (this.showSkeleton && this.progressiveCard) {
      return this.progressiveCard;
    }
    
    // Once loaded or for live updates, use generatedCard directly
    return this.generatedCard || undefined;
  }
  
  /**
   * Phase 2: Get change type with local streaming state priority
   */
  get displayChangeType(): CardChangeType {
    if (this.llmStreamState?.isSimulating && this._streamingCard) {
      return this._streamingChangeType;
    }
    return this.changeType;
  }
  
  private streamTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentStreamCardId: string | null = null;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly cardDataService = inject(CardDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroyed$ = new Subject<void>();

  get showCardSkeleton(): boolean {
    if (this.showLlmThinkingFrame) {
      return true;
    }
    return this.showSkeleton && (this.isGenerating || !this.generatedCard);
  }

  get showLlmThinkingFrame(): boolean {
    if (!this.llmStreamState?.isSimulating) {
      return false;
    }
    return this.llmStreamState.stage === 'thinking';
  }

  get skeletonTitle(): string {
    return this.generatedCard?.cardTitle || this.llmPreviewCard?.cardTitle || 'Rendering card…';
  }

  get skeletonSectionCount(): number {
    if (this.generatedCard?.sections?.length) {
      return this.generatedCard.sections.length;
    }
    if (this.llmPreviewCard?.sections?.length) {
      return this.llmPreviewCard.sections.length;
    }
    return 4;
  }

  ngOnInit(): void {
    // Initialize progressive state on init if card is already available
    if (this.generatedCard && !this.isGenerating) {
      this.updateProgressiveState();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle state transitions for LLM simulation
    if (changes['llmStreamState']) {
      this.handleStateTransition();
    }
    
    // Always update progressive state when inputs change
    this.updateProgressiveState();
    
    // Also trigger change detection explicitly
    if (changes['generatedCard'] || changes['isGenerating'] || changes['isInitialized'] || changes['changeType']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
    }
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }
    if (this.stateTransitionTimeout) {
      clearTimeout(this.stateTransitionTimeout);
    }
    this.cancelSectionStream();
    this.sectionStreamStop$.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Handle smooth state transitions between thinking, streaming, and complete
   * Optimized: Uses requestAnimationFrame for better performance
   * During streaming, skip exit animations to keep card visible
   */
  private handleStateTransition(): void {
    const currentStage = this.llmStreamState?.stage || null;
    
    // Skip if no state change
    if (currentStage === this.previousStage) {
      return;
    }
    
    // During streaming, keep card visible - skip exit animations
    if (currentStage === 'streaming' && this.displayCard) {
      // Just apply enter/entered state immediately to keep card visible
      this.stateTransitionClass = 'state-entered';
      this.previousStage = currentStage;
      this.cdr.markForCheck();
      return;
    }
    
    // Clear any pending transition
    if (this.stateTransitionTimeout) {
      clearTimeout(this.stateTransitionTimeout);
      this.stateTransitionTimeout = null;
    }
    
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      // Apply exit animation if transitioning from a previous state
      // But skip exit if we're going into streaming with a visible card
      if (this.previousStage !== null && currentStage !== null && !(currentStage === 'streaming' && this.displayCard)) {
        this.stateTransitionClass = 'state-transition-exit';
        this.cdr.markForCheck();
        
        // After exit animation, apply enter animation
        this.stateTransitionTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            this.stateTransitionClass = 'state-transition-enter';
            this.previousStage = currentStage;
            this.cdr.markForCheck();
            
            // Mark as entered after animation completes
            this.stateTransitionTimeout = setTimeout(() => {
              requestAnimationFrame(() => {
                this.stateTransitionClass = 'state-entered';
                this.cdr.markForCheck();
              });
            }, 400); // Match animation duration
          });
        }, 300); // Match exit animation duration
      } else {
        // Initial state or streaming with card - just apply enter animation
        this.stateTransitionClass = 'state-transition-enter';
        this.previousStage = currentStage;
        this.cdr.markForCheck();
        
        // Mark as entered after animation completes
        this.stateTransitionTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            this.stateTransitionClass = 'state-entered';
            this.cdr.markForCheck();
          });
        }, 400);
      }
    });
  }

  /**
   * Get state transition class for template
   * Returns empty string if no transition class to avoid binding issues
   */
  getStateTransitionClass(): string {
    // During streaming with visible card, ensure it's visible
    if (this.llmStreamState?.stage === 'streaming' && this.displayCard) {
      return 'state-entered';
    }
    return this.stateTransitionClass || '';
  }

  /**
   * Check if we should show error animation
   */
  get showErrorAnimation(): boolean {
    return this.llmStreamState?.stage === 'error' || this.llmStreamState?.stage === 'aborted';
  }

  private updateProgressiveState(): void {
    // During LLM streaming, skip progressive streaming logic - card updates come from store
    if (this.llmStreamState?.isSimulating && this.llmStreamState.stage === 'streaming') {
      // Ensure card is visible and smooth during streaming
      this.showSkeleton = false;
      this.isTransitioning = false;
      this.cardOpacity = 1;
      this.stateTransitionClass = 'state-entered';
      this.cdr.markForCheck();
      return;
    }

    // Cancel any ongoing stream
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
      this.streamTimeout = null;
    }
    this.cancelSectionStream();

    // Show skeleton if generating or no card yet
    if (this.isGenerating || !this.generatedCard) {
      this.showSkeleton = this.isGenerating;
      this.progressiveCard = null;
      this.currentStreamCardId = null;
      this.isTransitioning = false;
      this.cardOpacity = 1;
      this.cancelSectionStream();
      this.cdr.markForCheck();
      return;
    }

    const cardId = this.generatedCard.id || this.generateCardId(this.generatedCard);
    const isNewCard = this.currentStreamCardId !== cardId;
    this.currentStreamCardId = cardId;

    if (!this.shouldRunProgressiveStreaming()) {
      this.showSkeleton = false;
      this.progressiveCard = null;
      this.isTransitioning = false;
      this.cardOpacity = 1;
      this.cdr.markForCheck();
      return;
    }

    // Card is available - use local streaming for progressive effect
    const treatAsStructuralChange = this.changeType === 'structural';
    const shouldTransition = treatAsStructuralChange || (isNewCard && this.changeType !== 'content');
    
    if (shouldTransition) {
      // Smooth fade transition for card changes
      this.smoothCardTransition(() => {
        if (this.generatedCard?.id) {
          this.streamSectionsFromService(this.generatedCard.id);
        } else {
          this.streamSections();
        }
      });
    } else if (!this.progressiveCard && this.generatedCard && this.changeType !== 'content') {
      // Card ID hasn't changed but progressiveCard is null - initialize it
      if (this.generatedCard.id) {
        this.streamSectionsFromService(this.generatedCard.id);
      } else {
        this.streamSections();
      }
    } else {
      this.applySmoothContentUpdate();
    }
    
    this.cdr.markForCheck();
  }

  private shouldRunProgressiveStreaming(): boolean {
    if (this.llmStreamState && (this.llmStreamState.stage === 'thinking' || this.llmStreamState.stage === 'streaming')) {
      return false;
    }
    if (this.llmPreviewCard) {
      return false;
    }
    if (!this.generatedCard) {
      return false;
    }
    const cardId = this.generatedCard.id ?? '';
    const isEditorDriven = cardId.startsWith('card_');
    if (isEditorDriven) {
      return false;
    }
    return this.changeType !== 'content';
  }

  get showLlmPlaceholder(): boolean {
    if (!this.llmStreamState) {
      return false;
    }
    const stage = this.llmStreamState.stage;
    const awaitingCard = !this.displayCard;
    if (!awaitingCard) {
      return false;
    }
    return stage === 'thinking' || stage === 'streaming' || (stage === 'complete' && this.llmStreamState.isSimulating);
  }

  get showLlmStreamIndicator(): boolean {
    if (!this.llmStreamState) {
      return false;
    }
    if (!this.displayCard) {
      return false;
    }
    if (!this.llmStreamState.isSimulating) {
      return false;
    }
    return this.llmStreamState.stage === 'streaming';
  }

  get llmStatusLabel(): string {
    if (!this.llmStreamState) {
      return '';
    }
    if (this.llmStreamState.error) {
      return this.llmStreamState.error;
    }
    return this.llmStreamState.statusLabel;
  }

  get llmProgressPercent(): number {
    const progress = this.llmStreamState?.progress ?? 0;
    const clamped = Math.min(1, Math.max(0, progress));
    return Math.round(clamped * 100);
  }

  get llmThinkingTitle(): string {
    if (!this.llmStreamState) {
      return 'Awaiting response…';
    }
    switch (this.llmStreamState.stage) {
      case 'thinking':
        return 'LLM is thinking…';
      case 'streaming':
        return 'Streaming TOON chunks…';
      case 'error':
        return 'Simulation error';
      case 'aborted':
        return 'Simulation canceled';
      default:
        return 'Preparing preview…';
    }
  }

  get llmHint(): string {
    if (this.llmStreamState?.hint) {
      return this.llmStreamState.hint;
    }
    if (this.llmStreamState?.stage === 'thinking') {
      return 'Tokens will appear after a short pause to mimic an LLM response.';
    }
    if (this.llmStreamState?.stage === 'streaming') {
      return `Streaming ${this.llmProgressPercent}% complete.`;
    }
    return '';
  }

  private applySmoothContentUpdate(): void {
    // During streaming, keep card fully visible - no opacity changes
    if (this.llmStreamState?.isSimulating && this.llmStreamState.stage === 'streaming') {
      this.cardOpacity = 1;
      this.showSkeleton = false;
      this.isTransitioning = false;
      this.cdr.markForCheck();
      return;
    }

    if (this.smoothUpdatePending) {
      return;
    }
    this.smoothUpdatePending = true;
    // Use subtle opacity change for smooth updates (not during streaming)
    this.cardOpacity = 0.97;
    this.cdr.markForCheck();
    requestAnimationFrame(() => {
      this.cardOpacity = 1;
      this.showSkeleton = false;
      this.progressiveCard = null;
      this.isTransitioning = false;
      this.smoothUpdatePending = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * Smooth fade transition when card changes
   * During streaming, skip fade to keep card visible
   */
  private smoothCardTransition(callback: () => void): void {
    // During streaming, skip fade transitions to keep card visible
    if (this.llmStreamState?.isSimulating && this.llmStreamState.stage === 'streaming') {
      callback();
      this.cardOpacity = 1;
      this.isTransitioning = false;
      this.cdr.markForCheck();
      return;
    }

    // Cancel any existing fade
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }

    // Fade out quickly
    this.isTransitioning = true;
    this.cardOpacity = 0;
    this.cdr.markForCheck();

    // Fade in after brief delay
    this.fadeTimeout = setTimeout(() => {
      callback();
      this.cardOpacity = 1;
      this.isTransitioning = false;
      this.cdr.markForCheck();
      this.fadeTimeout = null;
    }, 150); // Short fade duration for smooth feel
  }

  /**
   * Generate a simple card ID for comparison (fast hash)
   */
  private generateCardId(card: AICardConfig): string {
    const key = `${card.cardTitle || ''}|${card.cardType || ''}|${card.sections?.length || 0}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return String(hash);
  }

  /**
   * Stream sections from CardDataService (true progressive loading)
   */
  private streamSectionsFromService(cardId: string): void {
    if (!this.shouldUseServiceStreaming(cardId)) {
      this.streamSections();
      return;
    }

    this.cancelSectionStream();

    // Initialize with empty card
    if (this.generatedCard) {
      this.progressiveCard = {
        ...this.generatedCard,
        sections: []
      };
      this.showSkeleton = true;
      this.cdr.markForCheck();
    }

    let receivedSections = false;

    // Subscribe to section-level streaming
    this.cardDataService.getCardSectionsStreaming(cardId)
      .pipe(takeUntil(this.sectionStreamStop$), takeUntil(this.destroyed$))
      .subscribe({
        next: (section: CardSection) => {
          if (!this.progressiveCard || this.currentStreamCardId !== cardId) {
            return; // Card changed, ignore this update
          }

          receivedSections = true;
          // Add section to progressive card
          this.progressiveCard = {
            ...this.progressiveCard,
            sections: [...(this.progressiveCard.sections || []), section]
          };
          
          // Check if all sections loaded
          if (this.generatedCard && this.progressiveCard.sections.length >= this.generatedCard.sections.length) {
            this.showSkeleton = false;
          }
          
          this.cdr.markForCheck();
        },
        complete: () => {
          if (!receivedSections) {
            // Provider did not stream sections (likely local-only card). Fallback to local streaming.
            this.streamSections();
            return;
          }
          this.showSkeleton = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback to local streaming on error
          this.streamSections();
        }
      });
  }

  private shouldUseServiceStreaming(cardId: string): boolean {
    // Locally generated cards from the TOON editor receive ids prefixed with "card_".
    // These cards are not known to the provider, so streaming via CardDataService would
    // immediately complete with no sections. Instead, fall back to local streaming.
    return !!cardId && !cardId.startsWith('card_');
  }

  private streamSections(): void {
    this.cancelSectionStream();
    if (!this.generatedCard) {
      this.progressiveCard = null;
      this.showSkeleton = false;
      this.cdr.markForCheck();
      return;
    }

    const totalSections = this.generatedCard.sections?.length || 0;
    
    // If no sections, show card with empty sections immediately
    if (totalSections === 0) {
      this.showSkeleton = false;
      this.progressiveCard = {
        ...this.generatedCard,
        sections: []
      };
      this.cdr.markForCheck();
      return;
    }

    // For progressive loading: start with first section, then stream the rest
    // This shows the card immediately with the first section visible
    this.progressiveCard = {
      ...this.generatedCard,
      sections: [this.generatedCard.sections[0]]
    };
    this.showSkeleton = totalSections > 1;
    this.cdr.markForCheck();

    // If only one section, we're done - show card immediately
    if (totalSections <= 1) {
      this.showSkeleton = false;
      this.progressiveCard = {
        ...this.generatedCard,
        sections: this.generatedCard.sections
      };
      this.cdr.markForCheck();
      return;
    }

    // Stream remaining sections one by one with visual delay
    // Shorter delay for smoother, faster transitions during live updates
    const streamDelay = 50; // ms between sections for smooth progressive effect
    let currentIndex = 1; // Start from index 1 (first section already shown)
    const cardId = this.currentStreamCardId; // Capture for comparison

    const streamNext = () => {
      // Check if card changed during streaming
      if (!this.generatedCard || this.currentStreamCardId !== cardId) {
        return;
      }

      if (currentIndex < totalSections && this.progressiveCard) {
        // Add next section to progressive card
        this.progressiveCard = {
          ...this.progressiveCard,
          sections: [...this.progressiveCard.sections, this.generatedCard.sections[currentIndex]]
        };
        currentIndex++;
        this.showSkeleton = currentIndex < totalSections;
        this.cdr.markForCheck();

        // Continue streaming if more sections remain
        if (currentIndex < totalSections) {
          this.streamTimeout = setTimeout(streamNext, streamDelay);
        } else {
          // All sections loaded - hide skeleton smoothly
          this.showSkeleton = false;
          this.cdr.markForCheck();
        }
      }
    };

    // Start streaming remaining sections after a brief delay
    if (totalSections > 1) {
      this.streamTimeout = setTimeout(streamNext, streamDelay);
    }
  }

  private cancelSectionStream(): void {
    this.sectionStreamStop$.next();
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
}
