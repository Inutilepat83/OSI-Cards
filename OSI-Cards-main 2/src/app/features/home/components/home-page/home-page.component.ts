import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AICardConfig, CardType, CardTypeGuards } from '../../../../models';
import * as CardActions from '../../../../store/cards/cards.state';
import * as CardSelectors from '../../../../store/cards/cards.selectors';
import { AppState } from '../../../../store/app.state';
import { CardDiffUtil } from '../../../../shared/utils/card-diff.util';

// Import standalone components
import { AICardRendererComponent, CardPreviewComponent } from '../../../../shared/components/cards';
import { JsonEditorComponent, ensureCardIds } from '../../../../shared';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    AICardRendererComponent,
    CardPreviewComponent,
    JsonEditorComponent,
    LucideIconsModule
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {
  private readonly store: Store<AppState> = inject(Store);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(JsonEditorComponent) private jsonEditorComponent?: JsonEditorComponent;
  @ViewChild('previewRegion') private previewRegion?: ElementRef<HTMLDivElement>;

  // Component properties
  cardType: CardType = 'company';
  cardVariant = 1;
  generatedCard: AICardConfig | null = null;
  isGenerating = false;
  isInitialized = false;
  isFullscreen = false;
  jsonInput = '{}';
  jsonError = '';
  isJsonValid = true;
  switchingType = false;
  systemStats = { totalFiles: 18 };

  cardTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'event', 'sko'];

  statusMessage = '';
  private statusTone: 'polite' | 'assertive' = 'polite';
  private statusRole: 'status' | 'alert' = 'status';
  private previousLoading = false;
  private previousError = '';
  
  // Dual-stream JSON input processing:
  // - Immediate stream: Live preview updates (50ms debounce for responsiveness)
  // - Debounced stream: Final validation and merging (300ms debounce for performance)
  private jsonInputSubject = new Subject<string>();
  private immediateJsonSubject = new Subject<string>();
  private lastProcessedJson = '';
  private lastImmediateJson = '';

  ngOnInit(): void {
    // Subscribe to store selectors
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(card => {
        const cardChanged = this.generatedCard !== card;
        this.generatedCard = card;
        if (cardChanged && card && !this.isGenerating && !this.jsonError) {
          const cardTypeLabel = card.cardType ? `${card.cardType} ` : '';
          this.announceStatus(`${cardTypeLabel}card preview updated.`);
        }
        this.cd.markForCheck();
      });

    this.store.select(CardSelectors.selectIsFullscreen)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isFullscreen => {
        this.isFullscreen = isFullscreen;
        this.cd.markForCheck();
      });

    this.store.select(CardSelectors.selectJsonInput)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(jsonInput => {
        this.jsonInput = jsonInput;
        this.cd.markForCheck();
      });

    this.store.select(CardSelectors.selectError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        this.jsonError = error || '';
        this.isJsonValid = !error;
        if (error && error !== this.previousError) {
          this.announceStatus(`JSON error: ${error}`, true);
          this.focusJsonEditor();
        }
        if (!error && this.previousError) {
          this.announceStatus('JSON issues resolved. Card preview will refresh shortly.');
        }
        this.previousError = error || '';
        this.cd.markForCheck();
      });

    // Subscribe to template loading to control spinner
    this.store.select(CardSelectors.selectIsBusy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.isGenerating = loading;
        if (loading && !this.previousLoading) {
          this.announceStatus('Generating card preview. Please wait.');
        } else if (!loading && this.previousLoading && !this.jsonError) {
          this.announceStatus('Card generation complete. Preview ready.');
        }
        this.previousLoading = loading;
        this.cd.markForCheck();
      });

    // Initialize system and load initial company card
    this.initializeSystem();
    
    // Setup immediate JSON processing for live preview updates
    // Very short debounce (50ms) for responsive feel while still batching rapid changes
    this.immediateJsonSubject.pipe(
      debounceTime(50), // 50ms for near-instant visual feedback
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(jsonInput => {
      // Skip if this JSON was already processed immediately (prevents loops)
      if (jsonInput === this.lastImmediateJson) {
        return;
      }
      // Mark as processed and update card immediately
      this.lastImmediateJson = jsonInput;
      this.processJsonInputImmediate(jsonInput);
    });
    
    // Setup debounced JSON processing for final validation and merging
    // Longer debounce (300ms) for expensive operations like diffing
    this.jsonInputSubject.pipe(
      debounceTime(300), // 300ms debounce for final processing
      distinctUntilChanged(), // Only process if JSON actually changed
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(jsonInput => {
      // Skip if this JSON was already processed (prevents loops)
      if (jsonInput === this.lastProcessedJson) {
        return;
      }
      // Mark as processed and update card with full validation
      this.lastProcessedJson = jsonInput;
      this.processJsonInput(jsonInput);
    });
  }

  private initializeSystem(): void {
    // Pre-load initial card immediately
    this.isInitialized = true;
    this.announceStatus('Loading default company card template.');
    
    // Load initial company card
    this.store.dispatch(CardActions.setCardType({ cardType: this.cardType }));
    this.store.dispatch(CardActions.setCardVariant({ variant: this.cardVariant }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: this.cardType, variant: this.cardVariant }));
  }

  onCardTypeChange(type: CardType): void {
    this.switchCardType(type);
  }

  onCardVariantChange(variant: number): void {
    this.switchCardVariant(variant);
  }

  onJsonInputChange(jsonInput: string): void {
    this.jsonInput = jsonInput;
    // Update store immediately for UI feedback
    this.store.dispatch(CardActions.updateJsonInput({ jsonInput }));
    
    // Process through both streams:
    // 1. Immediate stream for live preview (50ms debounce)
    this.immediateJsonSubject.next(jsonInput);
    // 2. Debounced stream for final validation (300ms debounce)
    this.jsonInputSubject.next(jsonInput);
  }

  private switchCardType(type: CardType): void {
    if (this.switchingType) return;
    this.switchingType = true;
    this.cardType = type;
    // Reset processed JSON before loading template to ensure updates
    this.lastProcessedJson = '';
    this.lastImmediateJson = '';
    // Update state and load template
    this.store.dispatch(CardActions.setCardType({ cardType: type }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: type, variant: this.cardVariant }));
    this.switchingType = false;
  }

  private switchCardVariant(variant: number): void {
    if (variant < 1 || variant > 3) return; // Ensure variant is within valid range
    this.cardVariant = variant as 1 | 2 | 3;
    // Reset processed JSON before switching to ensure updates
    this.lastProcessedJson = '';
    this.lastImmediateJson = '';
    this.store.dispatch(CardActions.setCardVariant({ variant }));
    this.switchCardType(this.cardType);
  }

  /**
   * Immediate JSON processing for live preview updates.
   * Lightweight parsing with ALL JSON content displayed in real-time.
   * Very permissive - accepts partial/incomplete JSON for instant visual feedback.
   */
  private processJsonInputImmediate(jsonInput: string): void {
    if (!this.isInitialized) return;

    // Quick validation - check if empty
    if (!jsonInput || jsonInput.trim() === '' || jsonInput.trim() === '{}') {
      // Show empty card immediately for live feedback
      const emptyCard: AICardConfig = {
        cardTitle: '',
        sections: []
      };
      this.store.dispatch(CardActions.generateCardSuccess({ card: ensureCardIds(emptyCard) }));
      this.cd.markForCheck();
      return;
    }

    // Parse JSON in a try-catch for performance
    let data: unknown;
    try {
      data = JSON.parse(jsonInput);
    } catch (parseError) {
      // Invalid JSON - don't update, let debounced stream handle error display
      return;
    }

    // Validate that data is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return;
    }

    const cardData = data as Partial<AICardConfig> & Record<string, unknown>;

    // Create a complete card config with defaults for missing required fields
    // This ensures ALL JSON content is preserved and displayed, even if incomplete
    const liveCard: AICardConfig = {
      // Preserve all existing properties from JSON (cardSubtitle, description, columns, actions, meta, etc.)
      ...cardData,
      // Ensure required fields are always set (provide defaults if missing)
      cardTitle: typeof cardData.cardTitle === 'string' ? cardData.cardTitle : '',
      sections: Array.isArray(cardData.sections) ? cardData.sections : []
    };

    // Lightweight processing - ensure IDs exist for rendering
    const sanitized = ensureCardIds(liveCard);
    
    // Dispatch immediately for live preview with ALL JSON content
    // No merging - direct replacement for instant feedback
    this.store.dispatch(CardActions.generateCardSuccess({ card: sanitized }));
    this.cd.markForCheck(); // Trigger change detection immediately
  }

  /**
   * Debounced JSON processing for final validation and merging.
   * Full validation, error handling, and smart merging with existing card.
   */
  private processJsonInput(jsonInput: string): void {
    if (!this.isInitialized) return;

    // Quick validation - check if empty
    if (!jsonInput || jsonInput.trim() === '' || jsonInput.trim() === '{}') {
      const defaultCard: AICardConfig = {
        cardTitle: 'Empty Card',
        sections: []
      };
      this.store.dispatch(CardActions.generateCardSuccess({ card: ensureCardIds(defaultCard) }));
      return;
    }

    // Parse JSON in a try-catch for performance
    let data: unknown;
    try {
      data = JSON.parse(jsonInput);
    } catch (parseError) {
      this.store.dispatch(CardActions.generateCardFailure({ error: 'Invalid JSON format. Please check your syntax.' }));
      return;
    }

    // Validate that data is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      this.store.dispatch(CardActions.generateCardFailure({ error: 'Card configuration must be a valid object.' }));
      return;
    }

    const cardData = data as AICardConfig;

    // Validate and use the card data
    if (CardTypeGuards.isAICardConfig(cardData)) {
      const sanitized = ensureCardIds(cardData);
      
      // Smart merging with existing card for optimal updates
      // The card preview component will handle streaming sections
      if (this.generatedCard) {
        const mergedCard = CardDiffUtil.mergeCardUpdates(this.generatedCard, sanitized);
        this.store.dispatch(CardActions.generateCardSuccess({ card: mergedCard }));
      } else {
        // First load - dispatch immediately to show skeleton frame
        this.store.dispatch(CardActions.generateCardSuccess({ card: sanitized }));
      }
    } else {
      this.store.dispatch(CardActions.generateCardFailure({ error: 'Invalid card configuration format - missing required fields (cardTitle, sections)' }));
    }
  }

  onCardInteraction(event: unknown): void {
    // Handle card interaction
  }

  onFieldInteraction(event: unknown): void {
    // Handle field interaction
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.isFullscreen = isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: isFullscreen }));
    this.focusPreviewRegion();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: this.isFullscreen }));
    this.focusPreviewRegion();
  }

  // TrackBy functions for performance optimization
  trackByCardType(index: number, type: string): string {
    return type;
  }

  trackByVariant(index: number, variant: number): number {
    return variant;
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isFullscreen) {
      event.preventDefault();
      this.toggleFullscreen();
    }
  }

  private focusJsonEditor(): void {
    this.jsonEditorComponent?.focusEditor(true);
  }

  private focusPreviewRegion(): void {
    if (!this.previewRegion) return;
    queueMicrotask(() => {
      this.previewRegion?.nativeElement.focus({ preventScroll: true });
    });
  }

  private announceStatus(message: string, assertive = false): void {
    this.statusMessage = message;
    this.statusTone = assertive ? 'assertive' : 'polite';
    this.statusRole = assertive ? 'alert' : 'status';
    this.cd.markForCheck();
  }

  get liveStatusTone(): 'polite' | 'assertive' {
    return this.statusTone;
  }

  get liveStatusRole(): 'status' | 'alert' {
    return this.statusRole;
  }
}
