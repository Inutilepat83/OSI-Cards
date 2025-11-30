import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject, NgZone, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AICardConfig, CardType, CardTypeGuards, CardSection, CardField, CardItem } from '../../../../models';
import * as CardActions from '../../../../store/cards/cards.state';
import * as CardSelectors from '../../../../store/cards/cards.selectors';
import { AppState } from '../../../../store/app.state';
import { CardDiffUtil, CardChangeType } from '../../../../shared/utils/card-diff.util';
import { LoggingService } from '../../../../core/services/logging.service';
import { ExportService } from '../../../../shared/services/export.service';
import { CommandService } from '../../../../shared/services/command.service';
import { CardDataService } from '../../../../core/services/card-data/card-data.service';
import { AgentService } from '../../../../core/services/agent.service';
import { ChatService } from '../../../../core/services/chat.service';

// Import library streaming service and types
import { OSICardsStreamingService, StreamingState, CardUpdate } from '../../../../../../projects/osi-cards-lib/src/lib/services/streaming.service';
import { AICardRendererComponent } from '../../../../../../projects/osi-cards-lib/src/lib/components/ai-card-renderer/ai-card-renderer.component';
import { AICardConfig as LibraryCardConfig } from '../../../../../../projects/osi-cards-lib/src/lib/models/card.model';

// Import standalone components
import { ensureCardIds, removeAllIds } from '../../../../shared';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
import { JsonEditorComponent } from '../../../../shared/components/json-editor/json-editor.component';
import { CardTypeSelectorComponent } from '../../../../shared/components/card-type-selector/card-type-selector.component';
import { PreviewControlsComponent } from '../../../../shared/components/preview-controls/preview-controls.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AICardRendererComponent,
    LucideIconsModule,
    JsonEditorComponent,
    CardTypeSelectorComponent,
    PreviewControlsComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly store: Store<AppState> = inject(Store);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggingService);
  private readonly exportService = inject(ExportService);
  private readonly commandService = inject(CommandService);
  private readonly streamingService = inject(OSICardsStreamingService);
  private readonly cardDataService = inject(CardDataService);
  private readonly agentService = inject(AgentService);
  private readonly chatService = inject(ChatService);
  private readonly document = inject(DOCUMENT);
  
  theme: 'day' | 'night' = 'night';

  @ViewChild('previewRegion') private previewRegion?: ElementRef<HTMLDivElement>;
  @ViewChild('cardRenderer') private cardRenderer?: AICardRendererComponent;
  @ViewChild('jsonTextareaRef') private jsonTextareaRef?: ElementRef<HTMLTextAreaElement>;
  
  // Phase 1: Direct Update Channel - bypass store for streaming updates
  @Output() streamingCardUpdate = new EventEmitter<{
    card: AICardConfig;
    changeType: CardChangeType;
    completedSections?: number[];
  }>();

  // Component properties
  cardType: CardType = 'all';
  cardVariant = 1;
  generatedCard: AICardConfig | null = null;
  isGenerating = false;
  isInitialized = false;
  isFullscreen = false;
  lastChangeType: CardChangeType = 'structural';
  jsonInput = '';
  jsonError = '';
  jsonErrorPosition: number | null = null;
  jsonErrorSuggestion = '';
  isJsonValid = true;
  switchingType = false;
  systemStats = { totalFiles: 18 };
  livePreviewCard: AICardConfig | null = null;
  livePreviewChangeType: CardChangeType = 'structural';

  // Library Streaming State (replaces old LLMStreamingService)
  streamingState: StreamingState | null = null;
  useStreaming = true;
  streamingSpeed = 80; // tokens per second
  thinkingDelay = 2000; // milliseconds to simulate LLM thinking

  cardTypes: CardType[] = []; // Dynamically loaded from examples
  
  // Track available variants for each card type
  availableVariants = new Map<CardType, number>();
  
  // Get available variants for current card type
  get variants(): number[] {
    const maxVariants = this.availableVariants.get(this.cardType) || 1;
    return Array.from({ length: maxVariants }, (_, i) => i + 1);
  }

  // Streaming computed properties (following iLibrary pattern)
  get showCardRenderer(): boolean {
    return this.isGenerating || this.hasCard;
  }

  get hasCard(): boolean {
    return this.generatedCard !== null && 
           this.generatedCard.sections !== undefined && 
           this.generatedCard.sections.length > 0;
  }

  get cardConfigForRenderer(): LibraryCardConfig {
    return (this.generatedCard ?? { cardTitle: 'Generating...', sections: [] }) as LibraryCardConfig;
  }

  get progressPercent(): number {
    return Math.round((this.streamingState?.progress ?? 0) * 100);
  }

  get stageLabel(): string {
    switch (this.streamingState?.stage) {
      case 'thinking': return 'Thinking...';
      case 'streaming': return 'Streaming';
      case 'complete': return 'Complete';
      case 'aborted': return 'Aborted';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  }

  get isStreamingActive(): boolean {
    return this.streamingState?.isActive ?? false;
  }

  statusMessage = '';
  private statusTone: 'polite' | 'assertive' = 'polite';
  private statusRole: 'status' | 'alert' = 'status';
  private previousLoading = false;
  private previousError = '';
  
  // Debounced JSON input processing
  private jsonInputSubject = new Subject<string>();
  private lastProcessedJson = '';
  private lastJsonHash = ''; // Track JSON hash to detect actual changes
  private previousJsonInput = ''; // For undo/redo tracking
  private jsonCommandSubject = new Subject<{ oldJson: string; newJson: string }>();
  // Cache sanitized cards so repeated objects don't require re-sanitization
  private readonly sanitizedCardCache = new WeakMap<object, AICardConfig>();
  // Store-level guard to avoid duplicate final persists
  private persistInProgress = false;
  private lastPersistedFingerprint: string | null = null;

  ngOnInit(): void {
    // Initialize theme
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('osi-theme');
      if (storedTheme === 'day' || storedTheme === 'night') {
        this.theme = storedTheme;
      }
    }
    this.applyTheme();
    
    // Subscribe to streaming service state (following iLibrary pattern)
    this.streamingService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.streamingState = state;
        this.isGenerating = state.isActive;
        this.cd.markForCheck();
      });

    // Subscribe to card updates from streaming service
    this.streamingService.cardUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: CardUpdate) => {
        this.generatedCard = update.card;
        this.livePreviewCard = update.card;
        this.livePreviewChangeType = update.changeType;
        
        // Emit for external listeners
        this.streamingCardUpdate.emit({
          card: update.card,
          changeType: update.changeType,
          completedSections: update.completedSections
        });
        
        this.cd.markForCheck();
      });

    // Subscribe to buffer updates for JSON editor sync
    this.streamingService.bufferUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(buffer => {
        // Update JSON editor during streaming
        if (this.isStreamingActive) {
          this.jsonInput = buffer;
          this.lastProcessedJson = buffer;
          this.lastJsonHash = this.calculateJsonHash(buffer);
        }
        this.cd.markForCheck();
      });
    
    // Subscribe to store selectors
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(card => {
        // Only update from store if not actively streaming
        if (!this.isStreamingActive && !this.livePreviewCard) {
          const cardChanged = this.generatedCard !== card;
          this.generatedCard = card;
          if (cardChanged && card && !this.isGenerating && !this.jsonError) {
            this.announceStatus('Card preview updated.');
          }
          this.cd.markForCheck();
        } else if (!this.livePreviewCard && card) {
          // If there's no live preview but there's a card from store, use it as fallback
          this.generatedCard = card;
          this.cd.markForCheck();
        }
      });

    this.store.select(CardSelectors.selectIsFullscreen)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isFullscreen => {
        this.isFullscreen = isFullscreen;
        this.cd.markForCheck();
      });

    // Subscribe to current card to populate JSON editor
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(card => {
        if (card && !this.isStreamingActive) {
          // Update JSON editor with the loaded card (remove IDs and cardType for clean JSON)
          const cardWithoutIds = removeAllIds(card);
          delete cardWithoutIds.cardType;
          const cardJson = JSON.stringify(cardWithoutIds, null, 2);
          if (cardJson !== this.jsonInput) {
            this.jsonInput = cardJson;
            this.lastProcessedJson = cardJson;
            // Set hash so user edits trigger fresh processing
            this.lastJsonHash = this.calculateJsonHash(cardJson);
            this.isJsonValid = true;
            this.jsonError = '';
          }
        }
        this.cd.markForCheck();
      });

    this.store.select(CardSelectors.selectError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        this.jsonError = error || '';
        this.isJsonValid = !error;
        if (error && error !== this.previousError) {
          this.announceStatus(`JSON error: ${error}`, true);
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
        // Only use store busy state if not streaming
        if (!this.isStreamingActive) {
          this.isGenerating = loading;
        }
        if (loading && !this.previousLoading) {
          this.announceStatus('Generating card preview. Please wait.');
        } else if (!loading && this.previousLoading && !this.jsonError) {
          this.announceStatus('Card generation complete. Preview ready.');
        }
        this.previousLoading = loading;
        this.cd.markForCheck();
      });

    this.store.select(CardSelectors.selectLastChangeType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(changeType => {
        this.lastChangeType = changeType;
        this.cd.markForCheck();
      });

    // Initialize system and load initial company card
    this.initializeSystem();
    
    // Load available variants for each card type
    this.loadAvailableVariants();
    
    // Setup debounced JSON processing for final validation and merging
    this.jsonInputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(jsonInput => {
      if (jsonInput === this.lastProcessedJson) {
        return;
      }
      this.lastProcessedJson = jsonInput;
      this.processJsonInput(jsonInput);
    });

    // Setup debounced command creation for undo/redo
    this.jsonCommandSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged((prev, curr) => prev.newJson === curr.newJson),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ oldJson, newJson }) => {
      if (oldJson.trim() !== newJson.trim()) {
        const command = this.commandService.createJsonChangeCommand(
          oldJson,
          newJson,
          (json: string) => {
            this.jsonInput = json;
            this.previousJsonInput = json;
            this.onJsonInputChange(json);
          },
          'JSON edit'
        );
        this.commandService.execute(command);
      }
    });
  }

  private initializeSystem(): void {
    // Pre-load initial card via streaming (instant mode for immediate display)
    this.isInitialized = true;
    this.announceStatus('Loading the All Sections example.');
    
    // Load the "all" type card by default (All Sections demo)
    this.cardDataService.getCardsByType('all').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cards => {
      const card = cards?.[0];
      if (card) {
        // Prepare card JSON for streaming (remove IDs for clean JSON)
        const cardWithoutIds = removeAllIds(card);
        delete cardWithoutIds.cardType;
        const cardJson = JSON.stringify(cardWithoutIds, null, 2);
        
        // Start streaming with instant mode - processes all chunks immediately
        this.streamingService.start(cardJson, { instant: true });
      } else {
        // Fallback: if no "all" card found, try first card
        this.cardDataService.getFirstCard().pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(fallbackCard => {
          if (fallbackCard) {
            const cardWithoutIds = removeAllIds(fallbackCard);
            delete cardWithoutIds.cardType;
            const cardJson = JSON.stringify(cardWithoutIds, null, 2);
            this.streamingService.start(cardJson, { instant: true });
          } else {
            this.announceStatus('No cards available. Please check your configuration.', true);
          }
        });
      }
    });
  }

  private loadAvailableVariants(): void {
    // First, load available card types from the manifest/examples
    this.cardDataService.getAvailableCardTypes().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(types => {
      // Set card types dynamically from examples, ensuring 'all' is first
      if (types.length > 0) {
        // Move 'all' to the front if it exists, otherwise add it
        const allIndex = types.indexOf('all');
        if (allIndex > 0) {
          types.splice(allIndex, 1);
          types.unshift('all');
        } else if (allIndex === -1) {
          types.unshift('all');
        }
        this.cardTypes = types;
      } else {
        this.cardTypes = ['all'];
      }
      
      // Then load variant counts for each card type
      this.cardTypes.forEach(cardType => {
        if (cardType === 'all') {
          // 'all' type always has exactly 1 variant
          this.availableVariants.set('all', 1);
        } else {
          // For other types, count available cards
          this.cardDataService.getCardsByType(cardType).pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe(cards => {
            const count = Math.max(cards.length, 1); // At least 1 variant
            this.availableVariants.set(cardType, count);
            this.cd.markForCheck();
          });
        }
      });
      
      this.cd.markForCheck();
    });
  }

  onCardTypeChange(type: CardType): void {
    this.switchCardType(type);
  }

  onCardVariantChange(variant: number): void {
    this.switchCardVariant(variant);
  }

  onJsonInputChange(jsonInput: string): void {
    // Track changes for undo/redo (debounced to avoid too many commands)
    if (this.previousJsonInput && jsonInput !== this.previousJsonInput) {
      // Emit to command subject (will be debounced)
      this.jsonCommandSubject.next({
        oldJson: this.previousJsonInput,
        newJson: jsonInput
      });
    }
    
    this.previousJsonInput = jsonInput;
    this.jsonInput = jsonInput;
    
    // Process through debounced stream for validation
    this.jsonInputSubject.next(jsonInput);
  }

  onJsonValidChange(isValid: boolean): void {
    this.isJsonValid = isValid;
    this.cd.markForCheck();
  }

  onJsonErrorChange(error: string | null): void {
    this.jsonError = error || '';
    if (error && error !== this.previousError) {
      this.announceStatus(`JSON error: ${error}`, true);
    }
    if (!error && this.previousError) {
      this.announceStatus('JSON issues resolved. Card preview will refresh shortly.');
    }
    this.previousError = error || '';
    this.cd.markForCheck();
  }

  onJsonErrorDetailsChange(details: { error: string | null; position: number | null; suggestion: string }): void {
    this.jsonError = details.error || '';
    this.jsonErrorPosition = details.position;
    this.jsonErrorSuggestion = details.suggestion;
    this.cd.markForCheck();
  }
  

  private switchCardType(type: CardType): void {
    if (this.switchingType) return;
    
    // Stop streaming if active when switching cards
    if (this.isStreamingActive) {
      this.stopGeneration();
    }
    
    this.switchingType = true;
    this.cardType = type;
    // Reset variant to 1 if current variant exceeds available variants for new type
    const maxVariants = this.availableVariants.get(type) || 1;
    if (this.cardVariant > maxVariants) {
      this.cardVariant = 1;
    }
    // Reset processed JSON payloads before loading template to ensure updates
    this.lastProcessedJson = '';
    // Clear live preview and streaming state to allow store updates to come through
    this.livePreviewCard = null;
    this.lastJsonHash = '';
    // Update state and load template
    this.store.dispatch(CardActions.setCardType({ cardType: type }));
    this.store.dispatch(CardActions.loadTemplate({ cardType: type, variant: this.cardVariant }));
    this.switchingType = false;
  }

  private switchCardVariant(variant: number): void {
    const maxVariants = this.availableVariants.get(this.cardType) || 1;
    if (variant < 1 || variant > maxVariants) return; // Ensure variant is within valid range
    this.cardVariant = variant;
    // Reset processed JSON payloads before switching to ensure updates
    this.lastProcessedJson = '';
    this.store.dispatch(CardActions.setCardVariant({ variant }));
    this.switchCardType(this.cardType);
  }

  /**
   * Calculate a simple hash of JSON content (ignoring whitespace differences)
   * Used to detect actual structural/content changes vs just whitespace
   */
  private calculateJsonHash(jsonInput: string): string {
    // Normalize whitespace for comparison
    const normalized = jsonInput.replace(/\s+/g, ' ').trim();
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return String(hash);
  }


  /**
   * Check if we can do an in-place update (structure is unchanged)
   * Returns true if sections have same count, types, and field/item counts
   */
  private canDoInPlaceUpdate(existingSections: CardSection[], incomingSections: Partial<CardSection>[]): boolean {
    // Different section count = structural change
    if (existingSections.length !== incomingSections.length) {
      return false;
    }
    
    // Check each section for structural compatibility
    for (let i = 0; i < existingSections.length; i++) {
      const existing = existingSections[i];
      const incoming = incomingSections[i];
      
      if (!existing || !incoming) return false;
      
      // Different type = structural change
      if (incoming.type && existing.type !== incoming.type) {
        return false;
      }
      
      // Different field count = structural change
      const existingFieldCount = existing.fields?.length ?? 0;
      const incomingFieldCount = incoming.fields?.length ?? 0;
      if (existingFieldCount !== incomingFieldCount) {
        return false;
      }
      
      // Different item count = structural change
      const existingItemCount = existing.items?.length ?? 0;
      const incomingItemCount = incoming.items?.length ?? 0;
      if (existingItemCount !== incomingItemCount) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Update a section's content in-place without creating new objects
   * Returns true if any content changed
   */
  private updateSectionInPlace(existing: CardSection, incoming: Partial<CardSection>): boolean {
    let changed = false;
    
    // Update section-level properties
    if (incoming.title !== undefined && existing.title !== incoming.title) {
      existing.title = incoming.title;
      changed = true;
    }
    if (incoming.subtitle !== undefined && existing.subtitle !== incoming.subtitle) {
      existing.subtitle = incoming.subtitle;
      changed = true;
    }
    if (incoming.description !== undefined && existing.description !== incoming.description) {
      existing.description = incoming.description;
      changed = true;
    }
    if (incoming.emoji !== undefined && existing.emoji !== incoming.emoji) {
      existing.emoji = incoming.emoji;
      changed = true;
    }
    
    // Update fields in-place
    if (incoming.fields && existing.fields) {
      for (let i = 0; i < existing.fields.length && i < incoming.fields.length; i++) {
        const existingField = existing.fields[i];
        const incomingField = incoming.fields[i];
        if (existingField && incomingField) {
          if (incomingField.label !== undefined && existingField.label !== incomingField.label) {
            existingField.label = incomingField.label;
            changed = true;
          }
          if (incomingField.value !== undefined && existingField.value !== incomingField.value) {
            existingField.value = incomingField.value;
            changed = true;
          }
          if (incomingField.type !== undefined && existingField.type !== incomingField.type) {
            existingField.type = incomingField.type;
            changed = true;
          }
          if (incomingField.percentage !== undefined && existingField.percentage !== incomingField.percentage) {
            existingField.percentage = incomingField.percentage;
            changed = true;
          }
          if (incomingField.trend !== undefined && existingField.trend !== incomingField.trend) {
            existingField.trend = incomingField.trend;
            changed = true;
          }
          if (incomingField.description !== undefined && existingField.description !== incomingField.description) {
            existingField.description = incomingField.description;
            changed = true;
          }
        }
      }
    }
    
    // Update items in-place
    if (incoming.items && existing.items) {
      for (let i = 0; i < existing.items.length && i < incoming.items.length; i++) {
        const existingItem = existing.items[i];
        const incomingItem = incoming.items[i];
        if (existingItem && incomingItem) {
          if (incomingItem.title !== undefined && existingItem.title !== incomingItem.title) {
            existingItem.title = incomingItem.title;
            changed = true;
          }
          if (incomingItem.description !== undefined && existingItem.description !== incomingItem.description) {
            existingItem.description = incomingItem.description;
            changed = true;
          }
          if (incomingItem.value !== undefined && existingItem.value !== incomingItem.value) {
            existingItem.value = incomingItem.value;
            changed = true;
          }
          if (incomingItem.status !== undefined && existingItem.status !== incomingItem.status) {
            existingItem.status = incomingItem.status;
            changed = true;
          }
        }
      }
    }
    
    return changed;
  }

  /**
   * Detect if sections have changed between old and new sections arrays
   * Returns information about whether sections changed and if structure changed
   */
  private detectSectionsChange(
    oldSections: CardSection[],
    newSections: CardSection[]
  ): { hasChanges: boolean; structureChanged: boolean } {
    // If section count changed, structure definitely changed
    if (oldSections.length !== newSections.length) {
      return { hasChanges: true, structureChanged: true };
    }

    // If no sections in either, no changes
    if (oldSections.length === 0 && newSections.length === 0) {
      return { hasChanges: false, structureChanged: false };
    }

    let hasChanges = false;
    let structureChanged = false;

    // Compare each section
    for (let i = 0; i < newSections.length; i++) {
      const oldSection = oldSections[i];
      const newSection = newSections[i];

      // If section doesn't exist in old, structure changed
      if (!oldSection) {
        structureChanged = true;
        hasChanges = true;
        continue;
      }

      if (!newSection) {
        structureChanged = true;
        hasChanges = true;
        continue;
      }

      // Check if section title, type, or other properties changed
      if (
        oldSection.title !== newSection.title ||
        oldSection.type !== newSection.type ||
        oldSection.subtitle !== newSection.subtitle
      ) {
        hasChanges = true;
        // Type change is structural
        if (oldSection.type !== newSection.type) {
          structureChanged = true;
        }
      }

      // Check if fields changed
      const oldFields = oldSection.fields || [];
      const newFields = newSection?.fields || [];
      if (oldFields.length !== newFields.length) {
        structureChanged = true;
        hasChanges = true;
      } else {
        // Compare field values
        for (let j = 0; j < newFields.length; j++) {
          const oldField = oldFields[j];
          const newField = newFields[j];
          if (
            oldField?.label !== newField?.label ||
            oldField?.value !== newField?.value ||
            oldField?.type !== newField?.type
          ) {
            hasChanges = true;
          }
        }
      }

      // Check if items changed
      const oldItems = oldSection.items || [];
      const newItems = newSection?.items || [];
      if (oldItems.length !== newItems.length) {
        structureChanged = true;
        hasChanges = true;
      } else {
        // Compare item values
        for (let j = 0; j < newItems.length; j++) {
          const oldItem = oldItems[j];
          const newItem = newItems[j];
          if (
            oldItem?.title !== newItem?.title ||
            oldItem?.description !== newItem?.description ||
            oldItem?.value !== newItem?.value
          ) {
            hasChanges = true;
          }
        }
      }
    }

    return { hasChanges, structureChanged };
  }

  /**
   * Try to extract partial data from incomplete JSON.
   * This allows showing partial results even when JSON is not fully complete.
   * Enhanced to handle more edge cases: trailing commas, incomplete strings, nested structures.
   */
  private tryParsePartialJson(jsonInput: string): Partial<AICardConfig> | null {
    try {
      // Try to close incomplete JSON by adding missing closing braces/brackets
      let sanitized = jsonInput.trim();
      
      // Remove trailing commas before closing braces/brackets (common in incomplete JSON)
      sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
      
      // Count open/close braces and brackets
      const openBraces = (sanitized.match(/{/g) || []).length;
      const closeBraces = (sanitized.match(/}/g) || []).length;
      const openBrackets = (sanitized.match(/\[/g) || []).length;
      const closeBrackets = (sanitized.match(/\]/g) || []).length;
      
      // Add missing closing brackets first (for arrays), then braces (for objects)
      let tempJson = sanitized;
      
      // Handle incomplete strings - close any unclosed strings
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < tempJson.length; i++) {
        const char = tempJson[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
        }
      }
      if (inString) {
        tempJson += '"';
      }
      
      // If the string doesn't end with a comma, add one before closing (if needed)
      const lastChar = tempJson.trim().slice(-1);
      if (lastChar && !/[}\],]/.test(lastChar)) {
        // Check if we're in the middle of a value (not a key)
        const lastQuote = tempJson.lastIndexOf('"');
        const lastColon = tempJson.lastIndexOf(':');
        if (lastColon > lastQuote && !inString) {
          // We're in a value, might need to close it
          // But let's be conservative and just add closing brackets/braces
        }
      }
      
      // Add missing closing brackets/braces in reverse order (inner to outer)
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        tempJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        tempJson += '}';
      }
      
      // Try to parse the sanitized JSON
      const parsed = JSON.parse(tempJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Partial<AICardConfig>;
      }
    } catch {
      // If that fails, try to extract key-value pairs using regex
      try {
        const cardData: Partial<AICardConfig> = {};
        
        // Extract cardTitle (handle both string and unquoted values)
        const titleMatch = jsonInput.match(/"cardTitle"\s*:\s*"([^"]*)"/) || 
                          jsonInput.match(/'cardTitle'\s*:\s*'([^']*)'/);
        if (titleMatch) {
          cardData.cardTitle = titleMatch[1];
        }
        
        // Try to extract sections array (even if incomplete)
        // Look for "sections": [ and try to extract complete section objects
        const sectionsMatch = jsonInput.match(/"sections"\s*:\s*\[([\s\S]*)/);
        if (sectionsMatch && sectionsMatch[1]) {
          const sectionsContent = sectionsMatch[1];
          const sections: CardSection[] = [];
          
          // Try to find complete section objects by matching braces
          let depth = 0;
          let currentSection = '';
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < sectionsContent.length; i++) {
            const char = sectionsContent[i];
            
            if (escapeNext) {
              currentSection += char;
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              currentSection += char;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              currentSection += char;
              continue;
            }
            
            if (inString) {
              currentSection += char;
              continue;
            }
            
            if (char === '{') {
              if (depth === 0) {
                currentSection = '{';
              } else {
                currentSection += char;
              }
              depth++;
            } else if (char === '}') {
              currentSection += char;
              depth--;
              if (depth === 0) {
                // Complete section object found
                try {
                  const section = JSON.parse(currentSection);
                  if (section && typeof section === 'object') {
                    sections.push(section);
                  }
                } catch {
                  // Try to fix common issues in incomplete sections
                  try {
                    // Add missing closing braces if needed
                    let fixedSection = currentSection;
                    const openCount = (fixedSection.match(/{/g) || []).length;
                    const closeCount = (fixedSection.match(/}/g) || []).length;
                    for (let j = 0; j < openCount - closeCount; j++) {
                      fixedSection += '}';
                    }
                    const section = JSON.parse(fixedSection);
                    if (section && typeof section === 'object') {
                      sections.push(section);
                    }
                  } catch {
                    // Skip this section
                  }
                }
                currentSection = '';
              }
            } else if (depth > 0) {
              currentSection += char;
            }
          }
          
          // Try to parse the last incomplete section if we have one
          if (currentSection.trim() && depth > 0) {
            try {
              // Close the incomplete section
              let fixedSection = currentSection;
              for (let j = 0; j < depth; j++) {
                fixedSection += '}';
              }
              const section = JSON.parse(fixedSection);
              if (section && typeof section === 'object') {
                sections.push(section);
              }
            } catch {
              // Try to extract partial section data even if incomplete
              const partialSection = this.extractPartialSection(currentSection);
              if (partialSection && partialSection.title && partialSection.type) {
                sections.push(partialSection as CardSection);
              }
            }
          }
          
          // Also try to extract sections that might be partially written
          // This handles cases where sections array is incomplete
          if (sections.length === 0) {
            const partialSections = this.extractPartialSectionsFromJson(jsonInput);
            // Filter to only include sections with required properties
            const validSections = partialSections.filter(s => s.title && s.type) as CardSection[];
            if (validSections.length > 0) {
              sections.push(...validSections);
            }
          }
          
          if (sections.length > 0) {
            cardData.sections = sections;
          }
        }
        
        // Only return if we extracted at least some data
        if (cardData.cardTitle || (cardData.sections && cardData.sections.length > 0)) {
          return cardData;
        }
      } catch {
        // Couldn't extract partial data
      }
    }
    
    return null;
  }

  /**
   * Extract partial section data from incomplete section JSON string
   * Handles cases where section object is incomplete (missing closing braces, incomplete fields/items)
   */
  private extractPartialSection(sectionStr: string): Partial<CardSection> | null {
    try {
      const section: Partial<CardSection> = {};
      
      // Extract title
      const titleMatch = sectionStr.match(/"title"\s*:\s*"([^"]*)"/);
      if (titleMatch) {
        section.title = titleMatch[1];
      }
      
      // Extract type
      const typeMatch = sectionStr.match(/"type"\s*:\s*"([^"]*)"/);
      if (typeMatch) {
        section.type = typeMatch[1] as any;
      }
      
      // Extract subtitle
      const subtitleMatch = sectionStr.match(/"subtitle"\s*:\s*"([^"]*)"/);
      if (subtitleMatch) {
        section.subtitle = subtitleMatch[1];
      }
      
      // Extract description
      const descMatch = sectionStr.match(/"description"\s*:\s*"([^"]*)"/);
      if (descMatch) {
        section.description = descMatch[1];
      }
      
      // Try to extract fields array (even if incomplete)
      const fieldsMatch = sectionStr.match(/"fields"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
      if (fieldsMatch && fieldsMatch[1]) {
        const fieldsContent = fieldsMatch[1];
        if (fieldsContent) {
          const fields = this.extractPartialFields(fieldsContent);
          if (fields.length > 0) {
            section.fields = fields;
          }
        }
      }
      
      // Try to extract items array (even if incomplete)
      const itemsMatch = sectionStr.match(/"items"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
      if (itemsMatch && itemsMatch[1]) {
        const itemsContent = itemsMatch[1];
        if (itemsContent) {
          const partialItems = this.extractPartialItems(itemsContent);
          // Filter out items without required 'title' property and ensure they match CardItem type
          const items: CardItem[] = partialItems
          .filter((item): item is CardItem => typeof item.title === 'string' && item.title.length > 0)
          .map(item => ({
            ...item,
            title: item.title! // We know title exists due to filter
          }));
          if (items.length > 0) {
            section.items = items;
          }
        }
      }
      
      // Only return if we extracted at least title or type
      if (section.title || section.type) {
        return section;
      }
    } catch {
      // Failed to extract partial section
    }
    
    return null;
  }

  /**
   * Extract partial fields from incomplete fields array JSON
   */
  private extractPartialFields(fieldsContent: string): Partial<CardField>[] {
    const fields: Partial<CardField>[] = [];
    
    // Try to find field objects by matching braces
    let depth = 0;
    let currentField = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < fieldsContent.length; i++) {
      const char = fieldsContent[i];
      
      if (escapeNext) {
        currentField += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentField += char;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        currentField += char;
        continue;
      }
      
      if (inString) {
        currentField += char;
        continue;
      }
      
      if (char === '{') {
        if (depth === 0) {
          currentField = '{';
        } else {
          currentField += char;
        }
        depth++;
      } else if (char === '}') {
        currentField += char;
        depth--;
        if (depth === 0) {
          // Complete or partial field found
          try {
            const field = JSON.parse(currentField);
            if (field && typeof field === 'object') {
              fields.push(field);
            }
          } catch {
            // Try to extract partial field
            const partialField = this.extractPartialField(currentField);
            if (partialField) {
              fields.push(partialField);
            }
          }
          currentField = '';
        }
      } else if (depth > 0) {
        currentField += char;
      }
    }
    
    // Handle last incomplete field
    if (currentField.trim() && depth > 0) {
      try {
        let fixedField = currentField;
        for (let j = 0; j < depth; j++) {
          fixedField += '}';
        }
        const field = JSON.parse(fixedField);
        if (field && typeof field === 'object') {
          fields.push(field);
        }
      } catch {
        const partialField = this.extractPartialField(currentField);
        if (partialField) {
          fields.push(partialField);
        }
      }
    }
    
    return fields;
  }

  /**
   * Extract partial field data from incomplete field JSON string
   */
  private extractPartialField(fieldStr: string): Partial<CardField> | null {
    try {
      const field: Partial<CardField> = {};
      
      // Extract label
      const labelMatch = fieldStr.match(/"label"\s*:\s*"([^"]*)"/);
      if (labelMatch) {
        field.label = labelMatch[1];
      }
      
      // Extract value
      const valueMatch = fieldStr.match(/"value"\s*:\s*"([^"]*)"/);
      if (valueMatch) {
        field.value = valueMatch[1];
      }
      
      // Extract type
      const typeMatch = fieldStr.match(/"type"\s*:\s*"([^"]*)"/);
      if (typeMatch) {
        field.type = typeMatch[1] as any;
      }
      
      // Only return if we extracted at least label or value
      if (field.label || field.value !== undefined) {
        return field;
      }
    } catch {
      // Failed to extract partial field
    }
    
    return null;
  }

  /**
   * Extract partial items from incomplete items array JSON
   */
  private extractPartialItems(itemsContent: string): Partial<CardItem>[] {
    const items: Partial<CardItem>[] = [];
    
    // Try to find item objects by matching braces
    let depth = 0;
    let currentItem = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < itemsContent.length; i++) {
      const char = itemsContent[i];
      
      if (escapeNext) {
        currentItem += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentItem += char;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        currentItem += char;
        continue;
      }
      
      if (inString) {
        currentItem += char;
        continue;
      }
      
      if (char === '{') {
        if (depth === 0) {
          currentItem = '{';
        } else {
          currentItem += char;
        }
        depth++;
      } else if (char === '}') {
        currentItem += char;
        depth--;
        if (depth === 0) {
          // Complete or partial item found
          try {
            const item = JSON.parse(currentItem);
            if (item && typeof item === 'object') {
              items.push(item);
            }
          } catch {
            // Try to extract partial item
            const partialItem = this.extractPartialItem(currentItem);
            if (partialItem) {
              items.push(partialItem);
            }
          }
          currentItem = '';
        }
      } else if (depth > 0) {
        currentItem += char;
      }
    }
    
    // Handle last incomplete item
    if (currentItem.trim() && depth > 0) {
      try {
        let fixedItem = currentItem;
        for (let j = 0; j < depth; j++) {
          fixedItem += '}';
        }
        const item = JSON.parse(fixedItem);
        if (item && typeof item === 'object') {
          items.push(item);
        }
      } catch {
        const partialItem = this.extractPartialItem(currentItem);
        if (partialItem) {
          items.push(partialItem);
        }
      }
    }
    
    return items;
  }

  /**
   * Extract partial item data from incomplete item JSON string
   */
  private extractPartialItem(itemStr: string): Partial<CardItem> | null {
    try {
      const item: Partial<CardItem> = {};
      
      // Extract title
      const titleMatch = itemStr.match(/"title"\s*:\s*"([^"]*)"/);
      if (titleMatch) {
        item.title = titleMatch[1];
      }
      
      // Extract description
      const descMatch = itemStr.match(/"description"\s*:\s*"([^"]*)"/);
      if (descMatch) {
        item.description = descMatch[1];
      }
      
      // Extract value
      const valueMatch = itemStr.match(/"value"\s*:\s*"([^"]*)"/);
      if (valueMatch) {
        item.value = valueMatch[1];
      }
      
      // Only return if we extracted at least title
      if (item.title) {
        return item;
      }
    } catch {
      // Failed to extract partial item
    }
    
    return null;
  }

  /**
   * Extract partial sections directly from JSON string using regex patterns
   * This is a fallback when the main parsing fails
   */
  private extractPartialSectionsFromJson(jsonInput: string): Partial<CardSection>[] {
    const sections: Partial<CardSection>[] = [];
    
    // Look for section-like patterns in the JSON
    // Match patterns like: "title": "Section Name" followed by other properties
    const sectionPattern = /"title"\s*:\s*"([^"]*)"[^}]*"type"\s*:\s*"([^"]*)"/g;
    let match;
    
    while ((match = sectionPattern.exec(jsonInput)) !== null) {
      const section: Partial<CardSection> = {
        title: match[1],
        type: match[2] as any
      };
      sections.push(section);
    }
    
    return sections;
  }

  /**
   * Fast fallback processing used for per-token updates when streaming.
   * Avoids the cost of full decode and uses the fallback parser for instant updates.
   */
  private processJsonInputFast(jsonInput: string): void {
    if (!this.isInitialized) return;
    if (!jsonInput || jsonInput.trim() === '') {
      const emptyCard: AICardConfig = { cardTitle: '', sections: [] };
      this.updateLivePreviewCard(this.recheckCardStructure(emptyCard) ?? emptyCard, 'structural');
      return;
    }
    // Use fallback parser for fast incremental rendering
    const fallback = this.createFallbackPreviewCard(jsonInput);
    this.updateLivePreviewCard(fallback);
  }

  private updateLivePreviewCard(nextCard: AICardConfig, changeTypeOverride?: CardChangeType): void {
    const currentCard = this.generatedCard;
    
    // Helper to trigger change detection appropriately
    const triggerChangeDetection = () => {
      this.cd.markForCheck();
    };
    
    // If no existing card, create new one (structural change)
    if (!currentCard) {
      this.generatedCard = nextCard;
      this.livePreviewCard = nextCard;
      this.livePreviewChangeType = changeTypeOverride ?? 'structural';
      triggerChangeDetection();
      return;
    }
    
    // Check if structure changed (sections added/removed/reordered)
    const structureChanged = this.didStructureChange(currentCard.sections, nextCard.sections);
    const changeType: CardChangeType = changeTypeOverride ?? (structureChanged ? 'structural' : 'content');
    
    // For structural changes, we need new references
    if (structureChanged) {
      // Use merge for structural changes to preserve what we can
      const mergeResult = CardDiffUtil.mergeCardUpdates(currentCard, nextCard);
      this.generatedCard = mergeResult.card;
      this.livePreviewCard = mergeResult.card;
      this.livePreviewChangeType = changeType;
      triggerChangeDetection();
      return;
    }
    
    // For content-only updates: mutate in-place to preserve all references
    // Track if any actual changes were made
    let hasChanges = false;
    
    // Update top-level properties in-place (only if changed)
    if (nextCard.cardTitle !== undefined && currentCard.cardTitle !== nextCard.cardTitle) {
      currentCard.cardTitle = nextCard.cardTitle;
      hasChanges = true;
    }
    if (nextCard.description !== undefined && currentCard.description !== nextCard.description) {
      currentCard.description = nextCard.description;
      hasChanges = true;
    }
    if (nextCard.columns !== undefined && currentCard.columns !== nextCard.columns) {
      currentCard.columns = nextCard.columns;
      hasChanges = true;
    }
    if (nextCard.actions !== undefined && currentCard.actions !== nextCard.actions) {
      currentCard.actions = nextCard.actions;
      hasChanges = true;
    }
    
    // Update sections in-place (preserves sections array reference)
    const sectionsChanged = this.updateSectionsInPlaceWithTracking(currentCard.sections, nextCard.sections);
    if (sectionsChanged) hasChanges = true;
    
    // Only trigger change detection if something actually changed
    if (hasChanges) {
      // Update live preview tracking
      this.livePreviewCard = currentCard;
      this.livePreviewChangeType = changeType;
      triggerChangeDetection();
    }
  }
  
  /**
   * Check if structure changed (sections added/removed/reordered)
   */
  private didStructureChange(oldSections: CardSection[], newSections: CardSection[]): boolean {
    if (oldSections.length !== newSections.length) {
      return true;
    }
    return oldSections.some((oldSection, index) => {
      const newSection = newSections[index];
      if (!newSection) {
        return true;
      }
      // Check if section ID changed (reordering)
      if ((oldSection.id || index) !== (newSection.id || index)) {
        return true;
      }
      // Check if section type changed
      if (oldSection.type !== newSection.type) {
        return true;
      }
      // Check if field/item count changed
      const oldFieldsLength = oldSection.fields?.length ?? 0;
      const newFieldsLength = newSection.fields?.length ?? 0;
      const oldItemsLength = oldSection.items?.length ?? 0;
      const newItemsLength = newSection.items?.length ?? 0;
      return oldFieldsLength !== newFieldsLength || newItemsLength !== oldItemsLength;
    });
  }
  
  /**
   * Update sections array in-place and track if changes were made
   * Returns true if any content changed
   */
  private updateSectionsInPlaceWithTracking(existingSections: CardSection[], incomingSections: CardSection[]): boolean {
    let hasChanges = false;
    
    // Check if array lengths changed (structural, but we track it as a change)
    if (existingSections.length !== incomingSections.length) {
      hasChanges = true;
    }
    
    const minLength = Math.min(existingSections.length, incomingSections.length);
    
    for (let i = 0; i < minLength; i++) {
      const existingSection = existingSections[i];
      const incomingSection = incomingSections[i];
      
      if (!existingSection || !incomingSection) continue;
      
      // Check and update each property, tracking changes
      if (incomingSection.title !== undefined && existingSection.title !== incomingSection.title) {
        existingSection.title = incomingSection.title;
        hasChanges = true;
      }
      if (incomingSection.subtitle !== undefined && existingSection.subtitle !== incomingSection.subtitle) {
        existingSection.subtitle = incomingSection.subtitle;
        hasChanges = true;
      }
      if (incomingSection.description !== undefined && existingSection.description !== incomingSection.description) {
        existingSection.description = incomingSection.description;
        hasChanges = true;
      }
      
      // Update fields with tracking
      if (incomingSection.fields && existingSection.fields) {
        for (let j = 0; j < Math.min(existingSection.fields.length, incomingSection.fields.length); j++) {
          const ef = existingSection.fields[j];
          const inf = incomingSection.fields[j];
          if (ef && inf) {
            if (inf.label !== undefined && ef.label !== inf.label) { ef.label = inf.label; hasChanges = true; }
            if (inf.value !== undefined && ef.value !== inf.value) { ef.value = inf.value; hasChanges = true; }
            if (inf.type !== undefined && ef.type !== inf.type) { ef.type = inf.type; hasChanges = true; }
            if (inf.percentage !== undefined && ef.percentage !== inf.percentage) { ef.percentage = inf.percentage; hasChanges = true; }
          }
        }
      }
      
      // Update items with tracking
      if (incomingSection.items && existingSection.items) {
        for (let j = 0; j < Math.min(existingSection.items.length, incomingSection.items.length); j++) {
          const ei = existingSection.items[j];
          const ini = incomingSection.items[j];
          if (ei && ini) {
            if (ini.title !== undefined && ei.title !== ini.title) { ei.title = ini.title; hasChanges = true; }
            if (ini.description !== undefined && ei.description !== ini.description) { ei.description = ini.description; hasChanges = true; }
            if (ini.value !== undefined && ei.value !== ini.value) { ei.value = ini.value; hasChanges = true; }
          }
        }
      }
    }
    
    return hasChanges;
  }

  /**
   * Update sections array in-place to preserve object references
   * Only mutates existing sections, preserves all references for unchanged sections
   */
  private updateSectionsInPlace(existingSections: CardSection[], incomingSections: CardSection[]): void {
    const maxLength = Math.max(existingSections.length, incomingSections.length);
    
    // Extend array if needed (only for new sections)
    while (existingSections.length < maxLength) {
      const sectionIndex = existingSections.length;
      const incomingSection = incomingSections[sectionIndex];
      if (incomingSection) {
        existingSections.push(incomingSection);
      }
    }
    
    // Update existing sections in-place
    for (let i = 0; i < Math.min(existingSections.length, incomingSections.length); i++) {
      const existingSection = existingSections[i];
      const incomingSection = incomingSections[i];
      
      if (!existingSection || !incomingSection) {
        continue;
      }
      
      // Update section properties in-place (preserve object reference)
      if (incomingSection.title !== undefined) {
        existingSection.title = incomingSection.title;
      }
      if (incomingSection.subtitle !== undefined) {
        existingSection.subtitle = incomingSection.subtitle;
      }
      if (incomingSection.type !== undefined) {
        existingSection.type = incomingSection.type;
      }
      if (incomingSection.description !== undefined) {
        existingSection.description = incomingSection.description;
      }
      if (incomingSection.emoji !== undefined) {
        existingSection.emoji = incomingSection.emoji;
      }
      if (incomingSection.columns !== undefined) {
        existingSection.columns = incomingSection.columns;
      }
      if (incomingSection.colSpan !== undefined) {
        existingSection.colSpan = incomingSection.colSpan;
      }
      if (incomingSection.collapsed !== undefined) {
        existingSection.collapsed = incomingSection.collapsed;
      }
      if (incomingSection.chartType !== undefined) {
        existingSection.chartType = incomingSection.chartType;
      }
      if (incomingSection.chartData !== undefined) {
        existingSection.chartData = incomingSection.chartData;
      }
      if (incomingSection.meta !== undefined) {
        existingSection.meta = incomingSection.meta;
      }
      
      // Update fields in-place (preserves fields array reference)
      if (incomingSection.fields !== undefined) {
        if (!existingSection.fields) {
          existingSection.fields = [];
        }
        this.updateFieldsInPlace(existingSection.fields, incomingSection.fields, i);
      }
      
      // Update items in-place (preserves items array reference)
      if (incomingSection.items !== undefined) {
        if (!existingSection.items) {
          existingSection.items = [];
        }
        this.updateItemsInPlace(existingSection.items, incomingSection.items, i);
      }
    }
  }

  private createFallbackPreviewCard(jsonInput: string): AICardConfig {
    const lines = jsonInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Card title
    const titleMatch = lines.find(l => /^cardTitle\s*:\s*/i.test(l));
    const cardTitle = titleMatch ? titleMatch.replace(/^cardTitle\s*:\s*/i, '').trim() : 'Preview';

    const sections: CardSection[] = [];

    // Simple stateful parse for sections and fields
    let currentSection: CardSection | null = null;
    let inFieldsBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // section header: '- title: Name' or 'title: Name' within a section
      const sectionMatch = line.match(/^-?\s*title\s*:\s*(.+)$/i);
      if (sectionMatch && sectionMatch[1]) {
        const titleMatch = sectionMatch[1];
        if (titleMatch) {
          // start new section
          currentSection = {
            title: titleMatch.trim(),
            type: 'info',
            fields: []
          } as CardSection;
          sections.push(currentSection);
          inFieldsBlock = false;
          continue;
        }
      }

      // type line within a section
      const typeMatch = line.match(/^type\s*:\s*([a-zA-Z-]+)/i);
      if (typeMatch && typeMatch[1] && currentSection) {
        const typeValue = typeMatch[1];
        if (typeValue) {
          currentSection.type = typeValue.trim() as any;
        }
        continue;
      }

      // fields[...] block header (start of field list)
      const fieldsHeaderMatch = line.match(/^fields\[\d+\](?:\{[^}]*\})?\s*:\s*$/i);
      if (fieldsHeaderMatch && currentSection) {
        inFieldsBlock = true;
        continue;
      }

      // If inside a fields block, lines that look like 'Label,Value' are parsed
      if (inFieldsBlock && currentSection) {
        // stop the block if we encounter a new section or list marker
        if (/^-\s*title\s*:|^sections\[.*\]/i.test(line)) {
          inFieldsBlock = false;
          // re-evaluate this line for section start
          const maybeSection = line.match(/^-?\s*title\s*:\s*(.+)$/i);
          if (maybeSection && maybeSection[1]) {
            const maybeTitle = maybeSection[1];
            if (maybeTitle) {
              currentSection = {
                title: maybeTitle.trim(),
                type: 'info',
                fields: []
              } as CardSection;
              sections.push(currentSection);
            }
          }
          continue;
        }

        // Basic CSV split for label/value
        const csvMatch = line.match(/^(?:"([^"]+)"|([^,\{]+))\s*,\s*(?:"([^"]+)"|(.+))$/);
        if (csvMatch) {
          const label = (csvMatch[1] || csvMatch[2] || '').trim();
          const rawValue = (csvMatch[3] || csvMatch[4] || '').trim();
          const field: CardField = { label };
          // Percentage handling
          const percentMatch = rawValue.match(/([0-9,.]+)\s*%/);
          if (percentMatch && percentMatch[1]) {
            const percentValue = percentMatch[1];
            if (percentValue) {
              field.value = percentValue;
              field.percentage = parseFloat(percentValue.replace(/,/g, '.'));
            }
            field.format = 'percentage';
          } else if (/^[0-9,.]+$/.test(rawValue)) {
            // Numeric KPI
            const numeric = parseFloat(rawValue.replace(/,/g, ''));
            field.value = numeric;
            field.format = 'number';
          } else {
            field.value = rawValue;
          }
          currentSection.fields = currentSection.fields || [];
          currentSection.fields.push(field as any);
          continue;
        }

        // generic dash-item within fields (e.g., '- Industry: Value')
        const dashField = line.match(/^[-*]\s*(.+?)\s*[:=]\s*(.+)$/);
        if (dashField && dashField[1] && dashField[2]) {
          const labelStr = dashField[1];
          const valueStr = dashField[2];
          if (labelStr && valueStr) {
            const label = labelStr.trim();
            const value = valueStr.trim();
            currentSection.fields = currentSection.fields || [];
            currentSection.fields.push({ label, value } as any);
            continue;
          }
        }
        // item with details (e.g. '- John Doe | CTO | cto@example.com') -> CardItem
        const itemDetailMatch = line.match(/^[-*]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
        if (itemDetailMatch && itemDetailMatch[1] && itemDetailMatch[2] && itemDetailMatch[3] && currentSection) {
          const titleStr = itemDetailMatch[1];
          const subtitleStr = itemDetailMatch[2];
          const metaValStr = itemDetailMatch[3];
          if (titleStr && subtitleStr && metaValStr) {
            let title = titleStr.trim();
            // icon prefix in the title e.g., '[TL] John Doe' -> icon 'TL'
            const iconPrefix = title.match(/^\[([A-Za-z0-9_-]+)\]\s*(.+)$/);
            let icon: string | undefined;
            if (iconPrefix && iconPrefix[1] && iconPrefix[2]) {
              const iconValue = iconPrefix[1];
              const titleValue = iconPrefix[2];
              if (iconValue && titleValue) {
                icon = iconValue;
                title = titleValue;
              }
            }
            const subtitle = subtitleStr.trim();
            const metaVal = metaValStr.trim();
            currentSection.items = currentSection.items || [];
            currentSection.items.push({ title, description: subtitle, meta: { contact: metaVal }, icon } as CardItem);
            continue;
          }
        }
        // item with two parts (e.g. '- John Doe | CTO')
        const itemTwoParts = line.match(/^[-*]\s*(.+?)\s*\|\s*(.+)$/);
        if (itemTwoParts && itemTwoParts[1] && itemTwoParts[2] && currentSection) {
          const titleStr = itemTwoParts[1];
          const subtitleStr = itemTwoParts[2];
          if (titleStr && subtitleStr) {
            const title = titleStr.trim();
            const subtitle = subtitleStr.trim();
            currentSection.items = currentSection.items || [];
            currentSection.items.push({ title, description: subtitle } as CardItem);
            continue;
          }
        }
        // List item in a list section: '- John Doe' -> CardItem
        const listItemMatch = line.match(/^[-*]\s+([^:]+)$/);
        if (listItemMatch && listItemMatch[1] && currentSection && /list|timeline|event/i.test(String(currentSection.type))) {
          const titleStr = listItemMatch[1];
          if (titleStr) {
            const title = titleStr.trim();
            currentSection.items = currentSection.items || [];
            currentSection.items.push({ title } as any);
            continue;
          }
        }
      }

      // Dash item outside of fields block (for list-type sections)
      if (!inFieldsBlock && currentSection && /^[-*]\s+([^:]+)$/.test(line) && /list|timeline|event/i.test(String(currentSection.type))) {
        const m = line.match(/^[-*]\s+([^:]+)$/);
        if (m && m[1]) {
          const titleStr = m[1];
          if (titleStr) {
            const title = titleStr.trim();
            currentSection.items = currentSection.items || [];
            currentSection.items.push({ title } as any);
          }
        }
      }

      // KPI-like lines outside fields block: 'ARR: 12.5' or 'Growth: 23% ▲'
      const kpiMatch = line.match(/^([A-Za-z0-9 _-]+)\s*[:=]\s*(.+)$/);
      if (kpiMatch && kpiMatch[1] && kpiMatch[2] && currentSection) {
        const labelStr = kpiMatch[1];
        const rawValueStr = kpiMatch[2];
        if (labelStr && rawValueStr) {
          const label = labelStr.trim();
          const rawValue = rawValueStr.trim();
          const field: any = { label };
          const percentMatch = rawValue.match(/([0-9.,]+)\s*%/);
          if (percentMatch && percentMatch[1]) {
            const percentValue = percentMatch[1];
            if (percentValue) {
              field.value = percentValue;
              field.percentage = parseFloat(percentValue.replace(/,/g, '.'));
              field.format = 'percentage';
            }
          } else if (/^[0-9.,]+$/.test(rawValue)) {
            const numeric = parseFloat(rawValue.replace(/,/g, ''));
            field.value = numeric;
            field.format = 'number';
          } else {
            field.value = rawValue;
          }
          // detect performance markers
          if (rawValue.includes('▲') || /up/i.test(rawValue)) {
            field.performance = 'up';
          } else if (rawValue.includes('▼') || /down/i.test(rawValue)) {
            field.performance = 'down';
          }
          currentSection.fields = currentSection.fields || [];
          currentSection.fields.push(field as any);
        }
      }
    }

    const previewCard: AICardConfig = {
      cardTitle: cardTitle || 'Preview',
      sections: sections.length ? sections : []
    };

    // Parse tables (|' separated rows) into chartData if present
    // Heuristic: if lines contain '|' and the line above or below indicates 'table' or 'chart', parse simple table
    // Also detect 'chartData' block: 'labels: [a,b,c]' and 'datasets:' lines
    const tableRegex = /\|/;
    const hasTableLines = lines.some(l => tableRegex.test(l));
    if (hasTableLines) {
      // Build simple table as chartData: first row as labels, rest as rows
      const tableRows = lines.filter(l => tableRegex.test(l)).map(r => r.split('|').map(c => c.trim()));
      if (tableRows.length > 0) {
        const firstRow = tableRows[0];
        if (firstRow && firstRow.length > 0) {
          const headers = firstRow.filter((h): h is string => h !== undefined).map(h => h.trim());
          const datasets = tableRows.slice(1).map(row => ({ label: row[0], data: row.slice(1).map(v => ({ value: v })) }));
          previewCard.sections = previewCard.sections || [];
          previewCard.sections.push({ title: 'Table', type: 'table', chartData: { labels: headers.slice(1), datasets: datasets.map(d => ({ label: d.label, data: d.data.map(x => Number(x.value) || 0) })) } as any } as any);
        }
      }
    }

    // Chart detection: look for 'chartType:' and 'labels:' lines
    const chartTypeLine = lines.find(l => /^chartType\s*:\s*\w+/i.test(l));
    const chartLabelsLine = lines.find(l => /^labels\s*:\s*\[.*\]/i.test(l));
    if (chartTypeLine && chartLabelsLine) {
      const chartTypePart = chartTypeLine.split(':')[1];
      const chartType = (chartTypePart || 'bar').trim();
      const labelsPart = chartLabelsLine.replace(/labels\s*:\s*\[(.*)\]/i, '$1');
      const labels = labelsPart.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      // Try to parse datasets lines after the labelsLine in the input
      const datasets: any[] = [];
      const labelIndex = lines.indexOf(chartLabelsLine);
      for (let idx = labelIndex + 1; idx < Math.min(labelIndex + 10, lines.length); idx++) {
        const line = lines[idx];
        if (!line) continue;
        const dsMatch = line.match(/^([^:]+):\s*\[(.*)\]$/);
        if (dsMatch && dsMatch[1] && dsMatch[2]) {
          const dsLabelStr = dsMatch[1];
          const dsValuesStr = dsMatch[2];
          if (dsLabelStr && dsValuesStr) {
            const dsLabel = dsLabelStr.trim();
            const values = dsValuesStr.split(',').map(v => Number(v.trim().replace(/[^0-9.-]+/g, '')) || 0);
            datasets.push({ label: dsLabel, data: values });
          }
        }
      }
      if (datasets.length) {
        previewCard.sections = previewCard.sections || [];
        previewCard.sections.push({ title: 'Chart', type: 'chart', chartType: chartType as any, chartData: { labels, datasets } as any } as any);
      }
    }

    // Recheck and return the card structure
    // Always return previewCard if recheckCardStructure returns null
    const rechecked: AICardConfig | null = this.recheckCardStructure(previewCard);
    if (rechecked === null) {
      return previewCard;
    }
    return rechecked;
  }

  private processJsonInput(jsonInput: string): void {
    if (!this.isInitialized) return;

    // Quick validation - check if empty
    if (!jsonInput || jsonInput.trim() === '') {
      const defaultCard: AICardConfig = {
        cardTitle: 'Empty Card',
        sections: []
      };
      this.store.dispatch(CardActions.generateCardSuccess({ card: this.recheckCardStructure(defaultCard) ?? defaultCard, changeType: 'structural' }));
      return;
    }

    // Parse JSON in a try-catch for performance
    let data: unknown;
    try {
      data = JSON.parse(jsonInput);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Invalid JSON format';
      this.store.dispatch(CardActions.generateCardFailure({ error: `Invalid JSON: ${error}` }));
      return;
    }

    // Validate that data is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      this.store.dispatch(CardActions.generateCardFailure({ error: 'Card configuration must be a valid JSON object.' }));
      return;
    }

    const cardData = data as AICardConfig;

    // Validate and use the card data
    if (CardTypeGuards.isAICardConfig(cardData)) {
      const sanitized = this.needsSanitization(cardData) ? ensureCardIds(cardData) : cardData;
      // Re-check final card structure before merging/persisting
      const rechecked = this.recheckCardStructure(sanitized) ?? sanitized;
      
      // Smart merging with existing card for optimal updates
      // The card preview component will handle streaming sections
      if (this.generatedCard) {
        const { card: mergedCard, changeType } = CardDiffUtil.mergeCardUpdates(this.generatedCard, rechecked);
        this.maybePersistCard(mergedCard, changeType);
      } else {
        // First load - dispatch immediately to show skeleton frame
        this.maybePersistCard(rechecked, 'structural');
      }
      this.updateLivePreviewCard(rechecked);
    } else {
      this.store.dispatch(CardActions.generateCardFailure({ error: 'Invalid card configuration format - missing required fields (cardTitle, sections)' }));
    }
  }

  /**
   * Persist a card iff not currently persisting a card with the same fingerprint.
   * This avoids double-dispatching identical sanitized cards in quick succession.
   */
  private maybePersistCard(card: AICardConfig, changeType: CardChangeType): void {
    const fingerprint = this.getCardFingerprint(card);
    if (this.persistInProgress && this.lastPersistedFingerprint === fingerprint) {
      // Skip duplicate persist
      return;
    }
    this.persistInProgress = true;
    this.lastPersistedFingerprint = fingerprint;
    // Persist
    this.store.dispatch(CardActions.generateCardSuccess({ card, changeType }));
    // Release the persist guard after a short delay to coalesce rapid updates
    setTimeout(() => {
      this.persistInProgress = false;
    }, 300);
  }

  /**
   * Generate card (start streaming or instant load)
   * Following iLibrary pattern
   */
  generateCard(): void {
    const payload = this.jsonInput?.trim();
    if (!payload || payload === '{}') {
      this.announceStatus('Provide JSON configuration before generating a card.', true);
      return;
    }

    // Reset current card to show streaming state
    this.generatedCard = null;
    this.livePreviewCard = null;
    
    // Configure streaming with user-controlled thinking delay
    this.streamingService.configure({
      tokensPerSecond: this.streamingSpeed,
      thinkingDelayMs: this.useStreaming ? this.thinkingDelay : 0
    });

    // Start streaming
    this.streamingService.start(payload, { 
      instant: !this.useStreaming 
    });
    
    this.store.dispatch(CardActions.clearError());
    this.announceStatus(this.useStreaming ? 'Starting card generation...' : 'Generating card...');
  }

  /**
   * Stop current generation
   */
  stopGeneration(): void {
    this.streamingService.stop();
    
    // Get the current card from streaming or other sources
    const currentCard = this.generatedCard || this.livePreviewCard;
    
    // If we have a card, load the full JSON into the editor
    if (currentCard) {
      try {
        const cardWithoutIds = removeAllIds(currentCard);
        delete cardWithoutIds.cardType;
        const cardJson = JSON.stringify(cardWithoutIds, null, 2);
        
        this.jsonInput = cardJson;
        this.lastProcessedJson = cardJson;
        this.isJsonValid = true;
        this.jsonError = '';
        
        const card = ensureCardIds(currentCard);
        this.store.dispatch(CardActions.generateCardSuccess({ 
          card, 
          changeType: 'structural'
        }));
        
        this.announceStatus('Generation stopped. Card loaded into editor.');
      } catch (error) {
        this.logger.error('Error loading card into editor after stopping generation', 'HomePageComponent', error);
      }
    }
    
    this.cd.markForCheck();
  }

  /**
   * Toggle streaming simulation (called from template)
   */
  onSimulateLLMStart(): void {
    if (this.isStreamingActive) {
      this.stopGeneration();
    } else {
      this.generateCard();
    }
  }

  private fastHash(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return String(hash);
  }

  // Old LLM methods removed - now handled by LLMStreamingService
  // All LLM simulation logic (chunking, parsing, placeholder management, completion tracking)
  // has been moved to LLMStreamingService for better separation of concerns and testability

  /**
   * Ensure section structure is properly cloned with all nested arrays (fields, items)
   * This is critical for Angular change detection to detect section updates
   */
  private ensureSectionStructure(section: Partial<CardSection> | CardSection): CardSection {
    // Create a new section object to ensure reference change
    const newSection: CardSection = {
      ...section,
      id: section.id || `section-${Date.now()}`,
      type: section.type || 'info',
      title: section.title || '',
      // Deep clone fields array to ensure change detection
      fields: Array.isArray(section.fields)
        ? section.fields.map(f => ({ ...f, id: f.id || `field-${Date.now()}-${Math.random()}` }))
        : [],
      // Deep clone items array to ensure change detection
      items: Array.isArray(section.items)
        ? section.items.map(i => ({ ...i, id: i.id || `item-${Date.now()}-${Math.random()}` }))
        : []
    };
    return newSection;
  }

  private recheckCardStructure(card: AICardConfig | null): AICardConfig | null {
    if (!card) return null;
    // Return cached sanitized card if we've already sanitized this exact object
    const cached = this.sanitizedCardCache.get(card);
    if (cached) return cached;

    // Ensure IDs and basic invariants via helper only if necessary
    const sanitized = this.needsSanitization(card) ? ensureCardIds({ ...card }) : { ...card };
    // Ensure sections array exists
    sanitized.sections = (sanitized.sections ?? []).map((s, index) => {
      const sec = { ...s };
      // Default type
      sec.type = sec.type ?? 'info';
      // The ensureCardIds() call has already set item/field IDs, but ensure non-empty arrays are present
      sec.fields = sec.fields ?? [];
      sec.items = sec.items ?? [];
      sec.id = sec.id ?? `section_${index}`;
      return sec;
    });
    return sanitized;
  }

  /**
   * Update only completed sections IN-PLACE to preserve object references
   * This prevents full section re-renders and maintains stable DOM elements
   */
  private updateCompletedSectionsOnly(incoming: AICardConfig, completedIndices: number[]): void {
    if (!this.generatedCard) {
      return;
    }

    const incomingSections = incoming.sections ?? [];
    const placeholderSections = this.generatedCard.sections ?? [];

    // Update only completed sections IN-PLACE (mutate existing objects)
    completedIndices.forEach(index => {
      const placeholderSection = placeholderSections[index];
      const incomingSection = incomingSections[index];
      
      if (!placeholderSection || !incomingSection) {
        return;
      }

      // Update section properties in-place (preserve object reference)
      placeholderSection.title = incomingSection.title ?? placeholderSection.title;
      placeholderSection.subtitle = incomingSection.subtitle ?? placeholderSection.subtitle;
      placeholderSection.type = incomingSection.type ?? placeholderSection.type;
      placeholderSection.description = incomingSection.description ?? placeholderSection.description;
      placeholderSection.emoji = incomingSection.emoji ?? placeholderSection.emoji;
      placeholderSection.columns = incomingSection.columns ?? placeholderSection.columns;
      placeholderSection.colSpan = incomingSection.colSpan ?? placeholderSection.colSpan;
      placeholderSection.chartType = incomingSection.chartType ?? placeholderSection.chartType;
      placeholderSection.chartData = incomingSection.chartData ?? placeholderSection.chartData;
      
      // Update fields in-place
      this.updateFieldsInPlace(placeholderSection.fields ?? [], incomingSection.fields ?? [], index);
      
      // Update items in-place
      this.updateItemsInPlace(placeholderSection.items ?? [], incomingSection.items ?? [], index);
      
      // Remove placeholder flag
      const meta = placeholderSection.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    });
  }

  /**
   * Update fields array in-place to preserve object references
   */
  private updateFieldsInPlace(existing: CardField[], incoming: CardField[], sectionIndex: number): void {
    const maxLength = Math.max(existing.length, incoming.length);
    
    // Extend array if needed
    while (existing.length < maxLength) {
      const fieldIndex = existing.length;
      const incomingField = incoming[fieldIndex];
      existing.push({
        id: incomingField?.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
        label: incomingField?.label ?? `Field ${fieldIndex + 1}`,
        value: incomingField?.value ?? '', // Use actual value from JSON if available
        meta: { placeholder: true, ...(incomingField?.meta ?? {}) }
      } as CardField);
    }

    // Update existing fields in-place
    for (let i = 0; i < maxLength; i++) {
      const existingField = existing[i];
      const incomingField = incoming[i];

      if (!incomingField) {
        continue;
      }

      if (!existingField) {
        existing[i] = incomingField;
        continue;
      }

      // Update field properties in-place (preserve object reference)
      existingField.label = incomingField.label ?? existingField.label;
      existingField.value = incomingField.value ?? existingField.value;
      existingField.percentage = incomingField.percentage ?? existingField.percentage;
      existingField.trend = incomingField.trend ?? existingField.trend;
      existingField.type = incomingField.type ?? existingField.type;
      existingField.status = incomingField.status ?? existingField.status;
      existingField.priority = incomingField.priority ?? existingField.priority;
      existingField.format = incomingField.format ?? existingField.format;
      existingField.description = incomingField.description ?? existingField.description;
      
      // Remove placeholder flag
      const meta = existingField.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    }
  }

  /**
   * Update items array in-place to preserve object references
   */
  private updateItemsInPlace(existing: CardItem[], incoming: CardItem[], sectionIndex: number): void {
    const maxLength = Math.max(existing.length, incoming.length);
    
    // Extend array if needed
    while (existing.length < maxLength) {
      const itemIndex = existing.length;
      const incomingItem = incoming[itemIndex];
      existing.push({
        id: incomingItem?.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
        title: incomingItem?.title ?? `Item ${itemIndex + 1}`,
        description: incomingItem?.description ?? '', // Use actual description from JSON if available
        meta: { placeholder: true, ...(incomingItem?.meta ?? {}) }
      } as CardItem);
    }

    // Update existing items in-place
    for (let i = 0; i < maxLength; i++) {
      const existingItem = existing[i];
      const incomingItem = incoming[i];

      if (!incomingItem) {
        continue;
      }

      if (!existingItem) {
        existing[i] = incomingItem;
        continue;
      }

      // Update item properties in-place (preserve object reference)
      existingItem.title = incomingItem.title ?? existingItem.title;
      existingItem.description = incomingItem.description ?? existingItem.description;
      existingItem.value = incomingItem.value ?? existingItem.value;
      existingItem.status = incomingItem.status ?? existingItem.status;
      existingItem.icon = incomingItem.icon ?? existingItem.icon;
      
      // Remove placeholder flag
      const meta = existingItem.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    }
  }





  /**
   * Check if a section is complete (all fields/items have real values, not placeholders)
   */
  private isSectionComplete(section: CardSection): boolean {
    // Check fields
    const fields = section.fields ?? [];
    for (const field of fields) {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder = field.value === 'Streaming…' || 
                           field.value === undefined ||
                           field.value === null ||
                           (meta && meta['placeholder'] === true);
      if (isPlaceholder) {
        return false;
      }
    }

    // Check items
    const items = section.items ?? [];
    for (const item of items) {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder = item.description === 'Streaming…' ||
                           !item.title ||
                           item.title.startsWith('Item ') ||
                           (meta && meta['placeholder'] === true);
      if (isPlaceholder) {
        return false;
      }
    }

    return true;
  }



  /**
   * Re-check and sanitize the card structure by ensuring IDs and required defaults.
   * This function should be called whenever a section is generated and again at the end of the card generation.
   */
  private needsSanitization(card: AICardConfig | null): boolean {
    if (!card) return true;
    if (!card.id) return true;
    if (!card.sections) return false;
    for (const s of card.sections) {
      if (!s) return true;
      if (!s.id) return true;
      if (s.fields && s.fields.some(f => !f || !f.id)) return true;
      if (s.items && s.items.some(i => !i || !i.id)) return true;
    }
    return false;
  }

  private getCardFingerprint(card: AICardConfig): string {
    const sectionIds = (card.sections ?? []).map(s => s.id ?? s.title ?? '').join('|');
    const key = `${card.id ?? ''}|${card.cardTitle ?? ''}|${sectionIds}`;
    return this.fastHash(key);
  }

  get previewCard(): AICardConfig | null {
    // Prefer the live preview from editor (if present) even when simulating so editor-driven tokens show immediately
    if (this.livePreviewCard) {
      return this.livePreviewCard;
    }
    // If no live preview but editor has text, parse a fallback preview so the right column stays in sync
    if (this.jsonInput && this.jsonInput.trim() !== '') {
      // Try to parse JSON for preview
      try {
        const parsed = JSON.parse(this.jsonInput);
        if (CardTypeGuards.isAICardConfig(parsed)) {
          return this.recheckCardStructure(parsed) ?? parsed;
        }
      } catch {
        // Invalid JSON, return null
      }
    }
    // During streaming, fall back to generated card
    if (this.isStreamingActive) {
      return this.generatedCard;
    }
    return this.generatedCard ?? null;
  }

  get previewChangeType(): CardChangeType {
    if (this.isStreamingActive) {
      // During streaming, use structural changes for layout recalculation
      return 'structural';
    }
    if (this.livePreviewCard) {
      return this.livePreviewChangeType;
    }
    return this.lastChangeType;
  }

  onCardInteraction(event: unknown): void {
    if (!event) {
      return;
    }
    // Hook for future card-level analytics (no-op for now)
  }

  onFieldInteraction(event: unknown): void {
    if (!event) {
      return;
    }
    // Hook for future field-level analytics (no-op for now)
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.isFullscreen = isFullscreen;
  }

  onAgentAction(event: { action: any; card: AICardConfig; agentId?: string; context?: Record<string, unknown> }): void {
    // Handle agent action - trigger agent with the provided context
    this.logger.info('Agent action triggered', 'HomePageComponent', event);
    this.agentService.triggerAgent(event.agentId, event.context).catch(error => {
      this.logger.error('Failed to trigger agent', 'HomePageComponent', error);
    });
  }

  onQuestionAction(event: { action: any; card: AICardConfig; question?: string }): void {
    // Handle question action - write a new message to the chat
    this.logger.info('Question action triggered', 'HomePageComponent', event);
    const message = event.question || event.action?.label || '';
    if (message) {
      this.chatService.sendMessage(message, {
        cardId: event.card.id,
        cardTitle: event.card.cardTitle,
        actionType: event.action?.type
      });
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: this.isFullscreen }));
    this.focusPreviewRegion();
  }

  async onExportCard(): Promise<void> {
    this.logger.info('Export button clicked', 'HomePageComponent');
    
    if (!this.generatedCard) {
      this.announceStatus('No card to export', true);
      this.logger.warn('No card to export', 'HomePageComponent');
      return;
    }

    // Wait a tick to ensure the view is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find the card element from the preview region
    const previewElement = this.previewRegion?.nativeElement;
    if (!previewElement) {
      this.announceStatus('Card element not found', true);
      this.logger.warn('Preview region not found', 'HomePageComponent');
      return;
    }

    // Find the actual card article element inside the preview
    let cardElement: HTMLElement | null = previewElement.querySelector('article.ai-card-surface');
    
    if (!cardElement) {
      // Fallback 1: try tilt-container
      cardElement = previewElement.querySelector('.tilt-container') as HTMLElement;
    }
    
    if (!cardElement) {
      // Fallback 2: try any article element
      cardElement = previewElement.querySelector('article') as HTMLElement;
    }
    
    if (!cardElement) {
      // Fallback 3: try app-ai-card-renderer
      cardElement = previewElement.querySelector('app-ai-card-renderer') as HTMLElement;
    }

    if (!cardElement) {
      this.announceStatus('Card element not found', true);
      this.logger.warn('Card element not found in preview region', 'HomePageComponent');
      return;
    }

    try {
      const filename = `${this.generatedCard.cardTitle || 'card'}.png`.replace(/[^a-z0-9.-]/gi, '_');
      this.logger.info('Exporting card as PNG', 'HomePageComponent', { 
        element: cardElement.tagName, 
        className: cardElement.className,
        filename,
        dimensions: { width: cardElement.offsetWidth, height: cardElement.offsetHeight }
      });
      await this.exportService.exportAsPngNative(cardElement, filename, 2);
      this.logger.info('PNG export completed successfully', 'HomePageComponent');
      this.announceStatus('Card exported as PNG');
    } catch (error) {
      this.logger.error('Failed to export card as PNG', 'HomePageComponent', error);
      this.announceStatus('Failed to export PNG: ' + (error instanceof Error ? error.message : 'Unknown error'), true);
    }
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
  
  ngOnDestroy(): void {
    // Stop streaming if active
    this.streamingService.stop();
    
    // Complete subjects
    this.jsonInputSubject.complete();
    this.jsonCommandSubject.complete();
  }
  
  toggleTheme(): void {
    this.theme = this.theme === 'night' ? 'day' : 'night';
    this.applyTheme();
    this.cd.markForCheck();
  }

  private applyTheme(): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = this.theme;
    localStorage.setItem('osi-theme', this.theme);
    if (typeof window !== 'undefined') {
      const styles = getComputedStyle(root);
      this.document.body.style.background = styles.getPropertyValue('--background');
      this.document.body.style.color = styles.getPropertyValue('--foreground');
    }
  }
}
