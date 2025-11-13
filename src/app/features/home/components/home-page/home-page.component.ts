import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AICardConfig, CardType, CardTypeGuards } from '../../../../models';
import * as CardActions from '../../../../store/cards/cards.state';
import * as CardSelectors from '../../../../store/cards/cards.selectors';
import { AppState } from '../../../../store/app.state';

// Import standalone components
import { AICardRendererComponent, CardControlsComponent, CardPreviewComponent } from '../../../../shared/components/cards';
import { JsonEditorComponent, ensureCardIds } from '../../../../shared';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    AICardRendererComponent,
    CardControlsComponent,
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

  cardTypes: CardType[] = ['company', 'contact', 'opportunity', 'product', 'analytics', 'project', 'event'];

  statusMessage = '';
  private statusTone: 'polite' | 'assertive' = 'polite';
  private statusRole: 'status' | 'alert' = 'status';
  private previousLoading = false;
  private previousError = '';

  ngOnInit(): void {
    // Subscribe to store selectors
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(card => {
        const cardChanged = this.generatedCard !== card;
        this.generatedCard = card;
        if (cardChanged && card && !this.isGenerating && !this.jsonError) {
          this.announceStatus(`${card.cardType} card preview updated.`);
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
  }

  private initializeSystem(): void {
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
    this.onJsonInputChangeInternal();
  }

  private switchCardType(type: CardType): void {
    if (this.switchingType) return;
    this.switchingType = true;
    this.cardType = type;
    // Update state and load template
    this.store.dispatch(CardActions.setCardType({ cardType: type }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: type, variant: this.cardVariant }));
    this.switchingType = false;
  }

  private switchCardVariant(variant: number): void {
    if (variant < 1 || variant > 3) return; // Ensure variant is within valid range
    this.cardVariant = variant as 1 | 2 | 3;
    this.store.dispatch(CardActions.setCardVariant({ variant }));
    this.switchCardType(this.cardType);
  }

  private onJsonInputChangeInternal(): void {
    if (!this.isInitialized) return;

    try {
      this.store.dispatch(CardActions.updateJsonInput({ jsonInput: this.jsonInput }));

      if (!this.jsonInput || this.jsonInput.trim() === '' || this.jsonInput.trim() === '{}') {
        // Create a default empty card instead of null
        const defaultCard: AICardConfig = {
          cardTitle: 'Empty Card',
          cardType: 'company',
          sections: []
        };
        this.store.dispatch(CardActions.generateCardSuccess({ card: ensureCardIds(defaultCard) }));
        return;
      }

      let data: unknown;
      try {
        data = JSON.parse(this.jsonInput);
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
        this.store.dispatch(CardActions.generateCardSuccess({ card: sanitized }));
      } else {
        throw new Error('Invalid card configuration format - missing required fields (cardTitle, cardType, sections)');
      }
    } catch (error: unknown) {
      this.store.dispatch(CardActions.generateCardFailure({ error: error instanceof Error ? error.message : 'Unknown error' }));
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
