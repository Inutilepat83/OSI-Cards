import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardSection } from '../../../../models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '../ai-card-renderer.component';
import { CardSkeletonComponent } from '../card-skeleton/card-skeleton.component';
import { CardDataService } from '../../../../core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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

  // Progressive loading state
  showSkeleton = false;
  progressiveCard: AICardConfig | null = null;
  isTransitioning = false;
  cardOpacity = 1;

  /**
   * Get the card to display (progressiveCard during loading, otherwise generatedCard)
   */
  get displayCard(): AICardConfig | undefined {
    // Only use progressiveCard if we're actively streaming sections
    // For live updates, use generatedCard directly to avoid duplicates
    if (this.showSkeleton && this.progressiveCard) {
      return this.progressiveCard;
    }
    // Once loaded or for live updates, use generatedCard directly
    return this.generatedCard || undefined;
  }
  private streamTimeout: any = null;
  private currentStreamCardId: string | null = null;
  private fadeTimeout: any = null;
  private readonly cardDataService = inject(CardDataService);
  private readonly destroyed$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize progressive state on init if card is already available
    if (this.generatedCard && !this.isGenerating) {
      this.updateProgressiveState();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Always update progressive state when inputs change
    this.updateProgressiveState();
    
    // Also trigger change detection explicitly
    if (changes['generatedCard'] || changes['isGenerating'] || changes['isInitialized']) {
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
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private updateProgressiveState(): void {
    // Cancel any ongoing stream
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
      this.streamTimeout = null;
    }

    // Show skeleton if generating or no card yet
    if (this.isGenerating || !this.generatedCard) {
      this.showSkeleton = this.isGenerating;
      this.progressiveCard = null;
      this.currentStreamCardId = null;
      this.isTransitioning = false;
      this.cardOpacity = 1;
      this.cdr.markForCheck();
      return;
    }

    // Card is available - use local streaming for progressive effect
    const cardId = this.generatedCard.id || this.generateCardId(this.generatedCard);
    const isNewCard = this.currentStreamCardId !== cardId;
    
    // If it's a new card, add smooth transition
    if (isNewCard) {
      this.currentStreamCardId = cardId;
      // Smooth fade transition for card changes
      this.smoothCardTransition(() => {
        this.streamSections();
      });
    } else if (!this.progressiveCard && this.generatedCard) {
      // Card ID hasn't changed but progressiveCard is null - initialize it
      this.streamSections();
    } else {
      // Same card, just update smoothly (for live JSON updates)
      // No fade transition - just smoothly update content
      // For live updates, don't use progressive loading - show full card immediately
      this.cardOpacity = 1;
      this.isTransitioning = false;
      this.showSkeleton = false;
      // Clear progressiveCard so we use generatedCard directly
      this.progressiveCard = null;
      this.cdr.markForCheck();
    }
    
    this.cdr.markForCheck();
  }

  /**
   * Smooth fade transition when card changes
   */
  private smoothCardTransition(callback: () => void): void {
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
    // Initialize with empty card
    if (this.generatedCard) {
      this.progressiveCard = {
        ...this.generatedCard,
        sections: []
      };
      this.showSkeleton = true;
      this.cdr.markForCheck();
    }

    // Subscribe to section-level streaming
    this.cardDataService.getCardSectionsStreaming(cardId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (section: CardSection) => {
          if (!this.progressiveCard || this.currentStreamCardId !== cardId) {
            return; // Card changed, ignore this update
          }

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
          this.showSkeleton = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback to local streaming on error
          this.streamSections();
        }
      });
  }

  private streamSections(): void {
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
