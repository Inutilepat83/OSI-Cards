import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AICardConfig, CardSection, CardField, CardAction } from '../../../../models';
import { LocalCardConfigurationService } from '../../../../core';
import * as CardActions from '../../../../store/cards/cards.actions';
import * as CardSelectors from '../../../../store/cards/cards.selectors';
import { AppState } from '../../../../store/app.state';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit, OnDestroy {
  @ViewChild('textareaRef', { static: false }) textareaRef!: ElementRef<HTMLTextAreaElement>;

  private destroy$ = new Subject<void>();

  // Component properties
  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event' = 'company';
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

  cardTypes: ('company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event')[] = [
    'company', 'contact', 'opportunity', 'product', 'analytics', 'project', 'event'
  ];

  constructor(
    private store: Store<AppState>,
    private localCardConfigurationService: LocalCardConfigurationService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  // Subscribe to store selectors

    // Subscribe to store selectors
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntil(this.destroy$))
      .subscribe(card => {
        this.generatedCard = card;
        this.cd.markForCheck();
      });

  // Removed selectIsGenerating; using selectLoading instead

  this.store.select(CardSelectors.selectIsFullscreen)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isFullscreen => {
        this.isFullscreen = isFullscreen;
    this.cd.markForCheck();
      });

  this.store.select(CardSelectors.selectJsonInput)
      .pipe(takeUntil(this.destroy$))
      .subscribe(jsonInput => {
        this.jsonInput = jsonInput;
    this.cd.markForCheck();
      });

  this.store.select(CardSelectors.selectError)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.jsonError = error || '';
        this.isJsonValid = !error;
    this.cd.markForCheck();
      });
    // Subscribe to template loading to control spinner
    this.store.select(CardSelectors.selectLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isGenerating = loading;
        this.cd.markForCheck();
      });
  // Initialize system and load initial company card
  this.initializeSystem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSystem(): void {
    this.isInitialized = true;
    // Load initial company card
    this.store.dispatch(CardActions.setCardType({ cardType: this.cardType }));
    this.store.dispatch(CardActions.setCardVariant({ variant: this.cardVariant }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: this.cardType, variant: this.cardVariant }));
  }

  switchCardType(type: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'project' | 'event'): void {
    if (this.switchingType) return;
    this.switchingType = true;
    this.cardType = type;
    console.log(`🔄 Switching to ${type} card type, variant ${this.cardVariant}...`);
    // Update state and load template
    this.store.dispatch(CardActions.setCardType({ cardType: type }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: type, variant: this.cardVariant }));
    this.switchingType = false;
  }

  switchCardVariant(variant: number): void {
    if (variant < 1 || variant > 3) return; // Ensure variant is within valid range
    this.cardVariant = variant as 1 | 2 | 3;
    this.store.dispatch(CardActions.setCardVariant({ variant }));
    this.switchCardType(this.cardType);
  }

  onJsonInputChange(): void {
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
        this.store.dispatch(CardActions.generateCardSuccess({ card: defaultCard }));
        return;
      }

      let data: unknown;
      try {
        data = JSON.parse(this.jsonInput);
      } catch (parseError) {
        console.error('Invalid JSON format:', parseError);
        this.store.dispatch(CardActions.generateCardFailure({ error: 'Invalid JSON format. Please check your syntax.' }));
        return;
      }

      // Validate that data is an object
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        this.store.dispatch(CardActions.generateCardFailure({ error: 'Card configuration must be a valid object.' }));
        return;
      }

      const cardData = data as Record<string, unknown>;

      // Auto-generate id if not provided
      if (!cardData['id']) {
        cardData['id'] = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Auto-generate section and field IDs if missing
      if (cardData['sections'] && Array.isArray(cardData['sections'])) {
        cardData['sections'] = (cardData['sections'] as CardSection[]).map((section: CardSection, sIndex: number) => {
          if (!section.id) {
            section.id = `section_${sIndex}`;
          }
          if (section.fields && Array.isArray(section.fields)) {
            section.fields = section.fields.map((field: CardField, fIndex: number) => {
              if (!field.id) {
                field.id = `field_${sIndex}_${fIndex}`;
              }
              return field;
            });
          }
          return section;
        });
      }

      // Auto-generate action IDs if missing
      if (cardData['actions'] && Array.isArray(cardData['actions'])) {
        cardData['actions'] = (cardData['actions'] as CardAction[]).map((action: CardAction, aIndex: number) => {
          if (!action.id) {
            action.id = `action_${aIndex}`;
          }
          return action;
        });
      }

      // Validate and use the card data
      if (cardData['cardTitle'] && cardData['cardType'] && cardData['sections'] && Array.isArray(cardData['sections'])) {
        console.log('✅ Setting generated card:', cardData);
        this.store.dispatch(CardActions.generateCardSuccess({ card: cardData as unknown as AICardConfig }));
      } else {
        throw new Error('Invalid card configuration format - missing required fields (cardTitle, cardType, sections)');
      }
    } catch (error: unknown) {
      console.error('❌ Card generation error:', error);
      this.store.dispatch(CardActions.generateCardFailure({ error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  }

  onCardInteraction(event: unknown): void {
    console.log('Card interaction:', event);
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.isFullscreen = isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: isFullscreen }));
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: this.isFullscreen }));
  }

  // Helper function to remove all IDs from objects recursively
  private removeAllIds(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeAllIds(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'id') {
          newObj[key] = this.removeAllIds(value);
        }
      }
      return newObj;
    }
    return obj;
  }

  // TrackBy functions for performance optimization
  trackByCardType(index: number, type: string): string {
    return type;
  }

  trackByVariant(index: number, variant: number): number {
    return variant;
  }
}
