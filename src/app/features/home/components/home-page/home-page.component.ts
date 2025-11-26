import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject, NgZone, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { LLMStreamingService } from '../../../../core/services/llm-streaming.service';

// Import standalone components
import { AICardRendererComponent, CardPreviewComponent } from '../../../../shared/components/cards';
import { ensureCardIds, removeAllIds } from '../../../../shared';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';
import { JsonEditorComponent } from '../../../../shared/components/json-editor/json-editor.component';
import { CardTypeSelectorComponent } from '../../../../shared/components/card-type-selector/card-type-selector.component';
import { LLMSimulationControlsComponent } from '../../../../shared/components/llm-simulation-controls/llm-simulation-controls.component';
import { PreviewControlsComponent } from '../../../../shared/components/preview-controls/preview-controls.component';
import { SystemStatsComponent } from '../../../../shared/components/system-stats/system-stats.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AICardRendererComponent,
    CardPreviewComponent,
    LucideIconsModule,
    JsonEditorComponent,
    CardTypeSelectorComponent,
    LLMSimulationControlsComponent,
    PreviewControlsComponent,
    SystemStatsComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {
  private readonly store: Store<AppState> = inject(Store);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggingService);
  private readonly exportService = inject(ExportService);
  private readonly commandService = inject(CommandService);
  private readonly llmStreamingService = inject(LLMStreamingService);
  
  // Batch section completions to prevent excessive dispatches
  private completionBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly COMPLETION_BATCH_DELAY_MS = 70; // Batch completions every 70ms (30% faster) for more responsive updates
  private pendingCompletedSectionIndices: number[] = []; // Track sections that completed in this batch
  private pendingStructuralChanges = false; // Track if we have structural changes pending
  
  // Phase 1: Current streaming update for direct channel
  currentStreamingUpdate: { card: AICardConfig; changeType: CardChangeType; completedSections?: number[] } | null = null;
  
  // Debug logging for section states
  private sectionStateLogInterval: ReturnType<typeof setInterval> | null = null;
  private readonly ENABLE_SECTION_STATE_LOGGING = true; // Set to false to disable

  @ViewChild('previewRegion') private previewRegion?: ElementRef<HTMLDivElement>;
  @ViewChild(CardPreviewComponent) private cardPreviewComponent?: CardPreviewComponent;
  @ViewChild('jsonTextareaRef') private jsonTextareaRef?: ElementRef<HTMLTextAreaElement>;
  
  // Phase 1: Direct Update Channel - bypass store for streaming updates
  @Output() streamingCardUpdate = new EventEmitter<{
    card: AICardConfig;
    changeType: CardChangeType;
    completedSections?: number[];
  }>();

  // Component properties
  cardType: CardType = 'company';
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
  // LLM simulation properties
  isSimulatingLLM = false;
  private readonly simulationFallbackCard: AICardConfig = {
    cardTitle: 'Simulated Opportunity',
    cardSubtitle: 'LLM Draft',
    sections: [
      {
        id: 'sim-intro',
        title: 'Priority Update',
        type: 'info',
        fields: [
          { id: 'sim-status', label: 'Status', value: 'LLM thinking…', type: 'text' }
        ]
      },
      {
        id: 'sim-progress',
        title: 'Milestones',
        type: 'list',
        items: [
          { id: 'sim-item-1', title: 'Streaming layout' },
          { id: 'sim-item-2', title: 'Updating KPI' }
        ]
      }
    ]
  };

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
  private lastJsonHash = ''; // Track JSON hash to detect actual changes
  private previousJsonInput = ''; // For undo/redo tracking
  private jsonCommandSubject = new Subject<{ oldJson: string; newJson: string }>();
  // LLM simulation state (now managed by LLMStreamingService)
  private llmPlaceholderCard: AICardConfig | null = null;
  private readonly sectionHashCache = new WeakMap<CardSection, string>();
  private readonly fieldHashCache = new WeakMap<CardField, string>();
  private readonly itemHashCache = new WeakMap<CardItem, string>();
  // Cache sanitized cards so repeated objects don't require re-sanitization
  private readonly sanitizedCardCache = new WeakMap<object, AICardConfig>();
  // Store-level guard to avoid duplicate final persists
  private persistInProgress = false;
  private lastPersistedFingerprint: string | null = null;

  ngOnInit(): void {
    // Subscribe to store selectors
    this.store.select(CardSelectors.selectCurrentCard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(card => {
        // Only update from store if user is not actively editing (no live preview)
        // This ensures live edits take precedence over store updates
        if (!this.livePreviewCard && !this.jsonInput?.trim()) {
          const cardChanged = this.generatedCard !== card;
          this.generatedCard = card;
          if (cardChanged && card && !this.isGenerating && !this.jsonError) {
            const cardTypeLabel = card.cardType ? `${card.cardType} ` : '';
            this.announceStatus(`${cardTypeLabel}card preview updated.`);
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
        if (card) {
          // Update JSON editor with the loaded card (remove IDs for clean JSON)
          const cardWithoutIds = removeAllIds(card);
          const cardJson = JSON.stringify(cardWithoutIds, null, 2);
          if (cardJson !== this.jsonInput) {
            this.jsonInput = cardJson;
            this.lastProcessedJson = cardJson;
            this.lastImmediateJson = cardJson;
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
        this.isGenerating = loading;
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
    
    // Setup immediate JSON processing for live preview updates
    // Very short debounce (10ms) for near-instant visual feedback
    this.immediateJsonSubject.pipe(
      debounceTime(10), // 10ms for near-instant visual feedback
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(jsonInput => {
      // Always process to ensure live updates work
      this.lastImmediateJson = jsonInput;
      // Run inside Angular zone to ensure change detection works
      this.ngZone.run(() => {
        this.processJsonInputImmediate(jsonInput);
      });
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

    // Setup debounced command creation for undo/redo (only for significant changes)
    this.jsonCommandSubject.pipe(
      debounceTime(1000), // 1 second debounce - only create command after user stops typing
      distinctUntilChanged((prev, curr) => prev.newJson === curr.newJson),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ oldJson, newJson }) => {
      // Only create command if change is significant (not just whitespace)
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

    // Subscribe to LLM streaming service
    this.llmStreamingService.state$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.isSimulatingLLM = state.isActive;
      this.cd.markForCheck();
    });

    // Subscribe to LLM card updates
    this.llmStreamingService.cardUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(update => {
      this.currentStreamingUpdate = update;
      this.llmPlaceholderCard = update.card;
      this.streamingCardUpdate.emit(update);
      
      // Dispatch to store for state management
      this.ngZone.run(() => {
        this.store.dispatch(CardActions.generateCardSuccess({ 
          card: update.card, 
          changeType: update.changeType
        }));
        this.cd.markForCheck();
      });
    });

    // Subscribe to LLM buffer updates (for JSON editor synchronization)
    this.llmStreamingService.bufferUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(buffer => {
      // Update JSON input during streaming (silent - no change detection trigger)
      this.jsonInput = buffer;
    });

    // Cleanup on destroy
  }

  private initializeSystem(): void {
    // Pre-load initial card immediately
    this.isInitialized = true;
    this.announceStatus('Loading the first JSON example.');
    this.store.dispatch(CardActions.loadFirstCardExample());
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
    
    // Process through both streams:
    // 1. Immediate stream for live preview (50ms debounce)
    this.immediateJsonSubject.next(jsonInput);
    // 2. Debounced stream for final validation (300ms debounce)
    if (this.shouldTriggerDebouncedProcessing()) {
      this.jsonInputSubject.next(jsonInput);
    }
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
    this.switchingType = true;
    this.cardType = type;
    // Reset processed JSON payloads before loading template to ensure updates
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
    // Reset processed JSON payloads before switching to ensure updates
    this.lastProcessedJson = '';
    this.lastImmediateJson = '';
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
   * Immediate JSON processing for live preview updates.
   * Lightweight parsing with ALL JSON content displayed in real-time.
   * Very permissive - accepts partial/incomplete JSON for instant visual feedback.
   * Only updates when actual structural/content changes are detected (not whitespace).
   */
  private processJsonInputImmediate(jsonInput: string): void {
    if (!this.isInitialized) return;

    // Always process for live updates - don't skip based on hash
    // This ensures every keystroke triggers an update
    const currentHash = this.calculateJsonHash(jsonInput);
    this.lastJsonHash = currentHash;

    // Quick validation - check if empty
    if (!jsonInput || jsonInput.trim() === '') {
      // Clear live preview when JSON is empty so store updates can come through
      this.livePreviewCard = null;
      // Show empty card immediately for live feedback
      const emptyCard: AICardConfig = {
        cardTitle: '',
        sections: []
      };
      this.generatedCard = emptyCard;
      // Force immediate change detection
      this.ngZone.run(() => {
        this.cd.detectChanges();
      });
      return;
    }

    // Try to parse JSON - if it fails, try to extract partial data
    let data: unknown;
    try {
      data = JSON.parse(jsonInput);
    } catch {
      // JSON is incomplete - try to extract partial data
      data = this.tryParsePartialJson(jsonInput);
      if (!data) {
        // If we can't parse at all, try to show what we can from the last valid card
        // but merge in any visible changes from the current JSON string
        if (this.generatedCard) {
          // Try to extract cardTitle if visible in JSON
          const titleMatch = jsonInput.match(/"cardTitle"\s*:\s*"([^"]*)"/);
          if (titleMatch) {
            const newCard = { ...this.generatedCard, cardTitle: titleMatch[1] };
            this.updateLivePreviewCard(newCard, 'content');
          }
        }
        return;
      }
    }

    // Validate that data is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      // Invalid structure - don't update preview
      return;
    }

    const cardData = data as Partial<AICardConfig> & Record<string, unknown>;

    // Create a complete card config with defaults for missing required fields
    // Always create new object and array references to ensure change detection
    const liveCard: AICardConfig = {
      // Preserve all existing properties from JSON payload
      ...cardData,
      // Ensure required fields are always set (provide defaults if missing)
      cardTitle: typeof cardData.cardTitle === 'string' ? cardData.cardTitle : (this.generatedCard?.cardTitle || ''),
      // Always create new array reference to ensure change detection
      sections: Array.isArray(cardData.sections) 
        ? cardData.sections.map(s => ({ ...s })) // Deep clone sections
        : (this.generatedCard?.sections ? [...this.generatedCard.sections] : [])
    };

    // Always update - don't check if it's valid, just try to render what we have
    // Lightweight processing - ensure IDs exist for rendering
    const sanitized = this.recheckCardStructure(liveCard) ?? liveCard;
    // Always update to ensure live preview works
    this.updateLivePreviewCard(sanitized, 'content');
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
        if (sectionsMatch) {
          const sectionsContent = sectionsMatch[1];
          const sections: any[] = [];
          
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
                    let openCount = (fixedSection.match(/{/g) || []).length;
                    let closeCount = (fixedSection.match(/}/g) || []).length;
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
              // Skip incomplete section
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
    // Always create a completely new card object to ensure reference change
    // This is critical for Angular's OnPush change detection
    const createNewReference = (card: AICardConfig): AICardConfig => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(card);
      }
      // Fallback: deep clone via JSON
      return JSON.parse(JSON.stringify(card));
    };
    
    const newCard: AICardConfig = createNewReference(nextCard);
    
    // Update generatedCard directly with new reference - this is what the template uses
    // Always assign new reference to trigger change detection
    this.generatedCard = newCard;
    this.livePreviewCard = newCard;
    this.livePreviewChangeType = changeTypeOverride ?? 'content';
    
    // Force change detection immediately - use detectChanges for immediate update
    // Run in zone to ensure it happens in the correct context
    this.ngZone.run(() => {
      this.cd.detectChanges();
    });
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
      if (sectionMatch) {
        // start new section
        currentSection = {
          title: sectionMatch[1].trim(),
          type: 'info',
          fields: []
        } as CardSection;
        sections.push(currentSection);
        inFieldsBlock = false;
        continue;
      }

      // type line within a section
      const typeMatch = line.match(/^type\s*:\s*([a-zA-Z-]+)/i);
      if (typeMatch && currentSection) {
        currentSection.type = typeMatch[1].trim() as any;
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
          if (maybeSection) {
            currentSection = {
              title: maybeSection[1].trim(),
              type: 'info',
              fields: []
            } as CardSection;
            sections.push(currentSection);
          }
          continue;
        }

        // Basic CSV split for label/value
        const csvMatch = line.match(/^(?:"([^"]+)"|([^,\{]+))\s*,\s*(?:"([^"]+)"|(.+))$/);
        if (csvMatch) {
          const label = (csvMatch[1] || csvMatch[2] || '').trim();
          const rawValue = (csvMatch[3] || csvMatch[4] || '').trim();
          const field: any = { label };
          // Percentage handling
          const percentMatch = rawValue.match(/([0-9,.]+)\s*%/);
          if (percentMatch) {
            field.value = percentMatch[1];
            field.percentage = parseFloat(percentMatch[1].replace(/,/g, '.'));
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
        if (dashField) {
          const label = dashField[1].trim();
          const value = dashField[2].trim();
          currentSection.fields = currentSection.fields || [];
          currentSection.fields.push({ label, value } as any);
          continue;
        }
        // item with details (e.g. '- John Doe | CTO | cto@example.com') -> CardItem
        const itemDetailMatch = line.match(/^[-*]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
        if (itemDetailMatch && currentSection) {
          let title = itemDetailMatch[1].trim();
          // icon prefix in the title e.g., '[TL] John Doe' -> icon 'TL'
          const iconPrefix = title.match(/^\[([A-Za-z0-9_-]+)\]\s*(.+)$/);
          let icon: string | undefined;
          if (iconPrefix) {
            icon = iconPrefix[1];
            title = iconPrefix[2];
          }
          const subtitle = itemDetailMatch[2].trim();
          const metaVal = itemDetailMatch[3].trim();
          currentSection.items = currentSection.items || [];
          currentSection.items.push({ title, description: subtitle, meta: { contact: metaVal }, icon } as CardItem);
          continue;
        }
        // item with two parts (e.g. '- John Doe | CTO')
        const itemTwoParts = line.match(/^[-*]\s*(.+?)\s*\|\s*(.+)$/);
        if (itemTwoParts && currentSection) {
          const title = itemTwoParts[1].trim();
          const subtitle = itemTwoParts[2].trim();
          currentSection.items = currentSection.items || [];
          currentSection.items.push({ title, description: subtitle } as CardItem);
          continue;
        }
        // List item in a list section: '- John Doe' -> CardItem
        const listItemMatch = line.match(/^[-*]\s+([^:]+)$/);
        if (listItemMatch && currentSection && /list|timeline|event/i.test(String(currentSection.type))) {
          const title = listItemMatch[1].trim();
          currentSection.items = currentSection.items || [];
          currentSection.items.push({ title } as any);
          continue;
        }
      }

      // Dash item outside of fields block (for list-type sections)
      if (!inFieldsBlock && currentSection && /^[-*]\s+([^:]+)$/.test(line) && /list|timeline|event/i.test(String(currentSection.type))) {
        const m = line.match(/^[-*]\s+([^:]+)$/);
        if (m) {
          const title = m[1].trim();
          currentSection.items = currentSection.items || [];
          currentSection.items.push({ title } as any);
        }
      }

      // KPI-like lines outside fields block: 'ARR: 12.5' or 'Growth: 23% ▲'
      const kpiMatch = line.match(/^([A-Za-z0-9 _-]+)\s*[:=]\s*(.+)$/);
      if (kpiMatch && currentSection) {
        const label = kpiMatch[1].trim();
        const rawValue = kpiMatch[2].trim();
        const field: any = { label };
        const percentMatch = rawValue.match(/([0-9.,]+)\s*%/);
        if (percentMatch) {
          field.value = percentMatch[1];
          field.percentage = parseFloat(percentMatch[1].replace(/,/g, '.'));
          field.format = 'percentage';
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
        const headers = tableRows[0].map(h => h.trim());
        const datasets = tableRows.slice(1).map(row => ({ label: row[0], data: row.slice(1).map(v => ({ value: v })) }));
        previewCard.sections = previewCard.sections || [];
        previewCard.sections.push({ title: 'Table', type: 'table', chartData: { labels: headers.slice(1), datasets: datasets.map(d => ({ label: d.label, data: d.data.map(x => Number(x.value) || 0) })) } as any } as any);
      }
    }

    // Chart detection: look for 'chartType:' and 'labels:' lines
    const chartTypeLine = lines.find(l => /^chartType\s*:\s*\w+/i.test(l));
    const chartLabelsLine = lines.find(l => /^labels\s*:\s*\[.*\]/i.test(l));
    if (chartTypeLine && chartLabelsLine) {
      const chartType = (chartTypeLine.split(':')[1] || 'bar').trim();
      const labelsPart = chartLabelsLine.replace(/labels\s*:\s*\[(.*)\]/i, '$1');
      const labels = labelsPart.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      // Try to parse datasets lines after the labelsLine in the input
      const datasets: any[] = [];
      const labelIndex = lines.indexOf(chartLabelsLine);
      for (let idx = labelIndex + 1; idx < Math.min(labelIndex + 10, lines.length); idx++) {
        const line = lines[idx];
        const dsMatch = line.match(/^([^:]+):\s*\[(.*)\]$/);
        if (dsMatch) {
          const dsLabel = dsMatch[1].trim();
          const values = dsMatch[2].split(',').map(v => Number(v.trim().replace(/[^0-9.-]+/g, '')) || 0);
          datasets.push({ label: dsLabel, data: values });
        }
      }
      if (datasets.length) {
        previewCard.sections = previewCard.sections || [];
        previewCard.sections.push({ title: 'Chart', type: 'chart', chartType: chartType as any, chartData: { labels, datasets } as any } as any);
      }
    }

    return this.recheckCardStructure(previewCard) ?? previewCard;
  }

  /**
   * Debounced JSON processing for final validation and merging.
   * Full validation, error handling, and smart merging with existing card.
   */
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

  onSimulateLLMStart(): void {
    const payload = this.getSimulationPayload();
    if (!payload) {
      this.announceStatus('Provide JSON or select a card before starting the LLM simulation.', true);
      return;
    }
    
    // Start section state logging
    if (this.ENABLE_SECTION_STATE_LOGGING) {
      this.startSectionStateLogging();
    }
    
    this.store.dispatch(CardActions.clearError());
    this.llmStreamingService.start(payload);
    
    // Get initial placeholder card
    const placeholderCard = this.llmStreamingService.getPlaceholderCard();
    if (placeholderCard) {
      this.llmPlaceholderCard = placeholderCard;
      this.ngZone.run(() => {
        this.store.dispatch(CardActions.generateCardSuccess({ 
          card: placeholderCard, 
          changeType: 'structural'
        }));
        this.cd.markForCheck();
      });
    }
  }

  onSimulateLLMCancel(): void {
    this.llmStreamingService.stop();
    this.stopSectionStateLogging();
    this.announceStatus('Simulation cancelled.');
  }

  // LLM simulation logic moved to LLMStreamingService

  /**
   * Get the simulation payload from user input.
   * Works with complete or incomplete JSON - the simulation will handle parsing
   * as the JSON becomes complete during streaming.
   */
  private getSimulationPayload(): string {
    const trimmed = this.jsonInput?.trim();
    // Return any input, even if incomplete JSON - simulation handles it gracefully
    if (trimmed) {
      return trimmed;
    }
    // Fallback to default card if no input
    return JSON.stringify(this.simulationFallbackCard, null, 2);
  }

  // All LLM simulation methods removed - now handled by LLMStreamingService
  // Removed: scheduleNextLlmChunk, finishLlmSimulation, cancelLlmSimulation, createLlmChunks,
  // computeChunkDelay, batchSectionCompletions, clearLlmTimers, tryParseLlmBuffer,
  // initializePlaceholdersIfNeeded, checkSectionCompletions, checkFieldCompletions,
  // updateCompletedSectionsOnly, updateCompletedFieldsOnly, calculateSectionCompletionPercentage,
  // isSectionComplete, initializeLlmPlaceholders, createPlaceholderSection, createPlaceholderField,
  // createPlaceholderItem, syncPlaceholderSections, applySectionContentToPlaceholder,
  // syncPlaceholderFields, syncPlaceholderItems, cloneSectionStructure, cloneStreamingPreview,
  // getCardHash, estimateSectionsUnlocked, resolveLlmChangeType, updateSectionProgress

  private isLlmStreamingActive(): boolean {
    if (!this.isSimulatingLLM) {
      return false;
    }
    const state = this.llmStreamingService.getState();
    return state.stage !== 'complete' && state.stage !== 'aborted' && state.stage !== 'error';
  }

  private getSectionHash(section: CardSection): string {
    const cached = this.sectionHashCache.get(section);
    if (cached) {
      return cached;
    }
    const fieldsHash = (section.fields ?? []).map((field) => this.getFieldHash(field)).join('|');
    const itemsHash = (section.items ?? []).map((item) => this.getItemHash(item)).join('|');
    const key = [
      section.id ?? '',
      section.title ?? '',
      section.subtitle ?? '',
      section.type ?? '',
      section.description ?? '',
      section.columns ?? '',
      section.colSpan ?? '',
      section.collapsed ?? '',
      section.emoji ?? '',
      section.chartType ?? '',
      this.normalizeValue(section.chartData),
      fieldsHash,
      itemsHash
    ].join('|');
    const hash = this.fastHash(key);
    this.sectionHashCache.set(section, hash);
    return hash;
  }

  private getFieldHash(field: CardField): string {
    const cached = this.fieldHashCache.get(field);
    if (cached) {
      return cached;
    }
    const key = [
      field.id ?? '',
      field.label ?? '',
      field.title ?? '',
      this.normalizeValue(field.value),
      field.type ?? '',
      field.status ?? '',
      field.priority ?? '',
      field.trend ?? '',
      field.format ?? '',
      field.description ?? '',
      this.normalizeValue(field.meta)
    ].join('|');
    const hash = this.fastHash(key);
    this.fieldHashCache.set(field, hash);
    return hash;
  }

  private getItemHash(item: CardItem): string {
    const cached = this.itemHashCache.get(item);
    if (cached) {
      return cached;
    }
    const key = [
      item.id ?? '',
      item.title ?? '',
      item.description ?? '',
      this.normalizeValue(item.value),
      item.status ?? '',
      this.normalizeValue(item.meta)
    ].join('|');
    const hash = this.fastHash(key);
    this.itemHashCache.set(item, hash);
    return hash;
  }

  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    return String(value);
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
    if (!this.llmPlaceholderCard) {
      return;
    }

    const incomingSections = incoming.sections ?? [];
    const placeholderSections = this.llmPlaceholderCard.sections ?? [];

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
    const sectionHashes = (card.sections ?? []).map(s => this.getSectionHash(s)).join('|');
    const key = `${card.id ?? ''}|${card.cardTitle ?? ''}|${sectionHashes}`;
    return this.fastHash(key);
  }

  private shouldTriggerDebouncedProcessing(): boolean {
    if (!this.isSimulatingLLM) {
      return true;
    }
    // LLM state check removed
    return false;
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
    // During simulation, fall back to parsed LLM preview; otherwise use generated card
    if (this.isLlmStreamingActive()) {
      return this.generatedCard;
    }
    return this.generatedCard ?? null;
  }

  get previewChangeType(): CardChangeType {
    if (this.isLlmStreamingActive()) {
      // During LLM streaming, use structural changes for layout recalculation
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
    // TODO: Implement agent triggering logic
    // Example: this.agentService.triggerAgent(event.agentId, event.context);
  }

  onQuestionAction(event: { action: any; card: AICardConfig; question?: string }): void {
    // Handle question action - write a new message to the chat
    this.logger.info('Question action triggered', 'HomePageComponent', event);
    // TODO: Implement chat message logic
    // Example: this.chatService.sendMessage(event.question || event.action.label);
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.store.dispatch(CardActions.setFullscreen({ fullscreen: this.isFullscreen }));
    this.focusPreviewRegion();
  }

  async onExportCard(): Promise<void> {
    console.log('onExportCard called');
    this.logger.info('Export button clicked', 'HomePageComponent');
    
    if (!this.generatedCard) {
      this.announceStatus('No card to export', true);
      this.logger.warn('No card to export', 'HomePageComponent');
      return;
    }

    // Wait a tick to ensure the view is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    const containerElement = this.cardPreviewComponent?.getCardElement();
    console.log('Container element:', containerElement);
    
    if (!containerElement) {
      this.announceStatus('Card element not found', true);
      this.logger.warn('Card container element not found', 'HomePageComponent');
      return;
    }

    // Find the actual card article element inside the container
    // Try multiple selectors to find the card element
    let cardElement: HTMLElement | null = containerElement.querySelector('article.ai-card-surface');
    console.log('Card element (article):', cardElement);
    
    if (!cardElement) {
      // Fallback 1: try tilt-container
      cardElement = containerElement.querySelector('.tilt-container') as HTMLElement;
      console.log('Card element (tilt-container):', cardElement);
    }
    
    if (!cardElement) {
      // Fallback 2: try any article element
      cardElement = containerElement.querySelector('article') as HTMLElement;
      console.log('Card element (any article):', cardElement);
    }
    
    if (!cardElement) {
      // Fallback 3: use the container itself
      cardElement = containerElement;
      this.logger.warn('Using container element for export (card article not found)', 'HomePageComponent');
      console.log('Using container as card element');
    }

    try {
      const filename = `${this.generatedCard.cardTitle || 'card'}.png`.replace(/[^a-z0-9.-]/gi, '_');
      console.log('Starting PNG export with:', { 
        element: cardElement.tagName, 
        className: cardElement.className,
        filename,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight
      });
      this.logger.info('Exporting card as PNG', 'HomePageComponent', { 
        element: cardElement.tagName, 
        className: cardElement.className,
        filename,
        dimensions: { width: cardElement.offsetWidth, height: cardElement.offsetHeight }
      });
      await this.exportService.exportAsPngNative(cardElement, filename, 2);
      console.log('PNG export completed successfully');
      this.announceStatus('Card exported as PNG');
    } catch (error) {
      console.error('PNG export failed:', error);
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
    // Stop section state logging
    this.stopSectionStateLogging();
    
    // Stop LLM streaming if active
    this.llmStreamingService.stop();
    
    this.jsonInputSubject.complete();
    this.immediateJsonSubject.complete();
    this.jsonCommandSubject.complete();
  }
  
  /**
   * Start logging section states every second for debugging
   */
  private startSectionStateLogging(): void {
    // Clear any existing interval
    if (this.sectionStateLogInterval) {
      clearInterval(this.sectionStateLogInterval);
    }
    
    // Log immediately
    this.logSectionStates();
    
    // Then log every second
    this.sectionStateLogInterval = setInterval(() => {
      this.logSectionStates();
    }, 1000);
  }
  
  /**
   * Stop section state logging
   */
  private stopSectionStateLogging(): void {
    if (this.sectionStateLogInterval) {
      clearInterval(this.sectionStateLogInterval);
      this.sectionStateLogInterval = null;
    }
  }
  
  /**
   * Log current section states and completion status
   */
  private logSectionStates(): void {
    if (!this.ENABLE_SECTION_STATE_LOGGING || !this.isSimulatingLLM) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const placeholderCard = this.llmPlaceholderCard;
    const state = this.llmStreamingService.getState();
    
    if (!placeholderCard) {
      this.logger.warn('⚠️ No placeholder card yet', 'HomePageComponent', { timestamp });
      return;
    }
    
    const sections = (placeholderCard.sections ?? []).map((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      
      // Check field completion
      const fields = section.fields ?? [];
      const fieldStates = fields.map((field, fieldIdx) => {
        const meta = field.meta as Record<string, unknown> | undefined;
        const isPlaceholder = field.value === 'Streaming…' || 
                             field.value === undefined ||
                             field.value === null ||
                             (meta && meta['placeholder'] === true);
        
        return {
          index: fieldIdx,
          id: field.id || `field-${index}-${fieldIdx}`,
          label: field.label || field.title || 'no-label',
          value: field.value,
          isPlaceholder
        };
      });
      
      // Check item completion
      const items = section.items ?? [];
      const itemStates = items.map((item, itemIdx) => {
        const meta = item.meta as Record<string, unknown> | undefined;
        const isPlaceholder = item.description === 'Streaming…' ||
                             !item.title ||
                             item.title.startsWith('Item ') ||
                             (meta && meta['placeholder'] === true);
        
        return {
          index: itemIdx,
          id: item.id || `item-${index}-${itemIdx}`,
          title: item.title,
          description: item.description,
          isPlaceholder
        };
      });
      
      const allFieldsComplete = fieldStates.length > 0 && fieldStates.every(f => !f.isPlaceholder);
      const allItemsComplete = itemStates.length > 0 && itemStates.every(i => !i.isPlaceholder);
      const sectionShouldBeComplete = (fieldStates.length === 0 || allFieldsComplete) && 
                                      (itemStates.length === 0 || allItemsComplete);
      const isComplete = sectionShouldBeComplete; // Simplified - completion is determined by current state
      
      return {
        index,
        key: sectionKey,
        id: section.id || 'no-id',
        title: section.title || 'no-title',
        type: section.type || 'no-type',
        isComplete,
        shouldBeComplete: sectionShouldBeComplete,
        completionMismatch: false, // No longer tracking mismatches since service handles it
        fieldCount: fields.length,
        itemCount: items.length,
        fields: fieldStates,
        items: itemStates
      };
    });
    
    const logData = {
      timestamp,
      isSimulating: this.isSimulatingLLM,
      stage: state.stage,
      bufferLength: state.bufferLength,
      targetLength: state.targetLength,
      progress: Math.floor(state.progress * 100) + '%',
      placeholderCardId: placeholderCard.id,
      placeholderSectionCount: placeholderCard.sections?.length ?? 0,
      totalSections: sections.length,
      completedSections: sections.filter(s => s.isComplete).length,
      sections
    };
    
    this.logger.debug(`📊 Section States - ${timestamp}`, 'HomePageComponent', {
      streamingStatus: {
        isSimulating: logData.isSimulating,
        progress: logData.progress,
        bufferLength: logData.bufferLength,
        targetLength: logData.targetLength
      },
      cardState: {
        placeholderCardId: logData.placeholderCardId,
        placeholderSections: logData.placeholderSectionCount
      },
      completionSummary: {
        total: logData.totalSections,
        completed: logData.completedSections,
        pending: logData.totalSections - logData.completedSections
      },
      sections: sections.map(s => ({
        index: s.index,
        id: s.id,
        title: s.title,
        type: s.type,
        isComplete: s.isComplete,
        shouldBeComplete: s.shouldBeComplete,
        completionMismatch: s.completionMismatch,
        fieldCount: s.fieldCount,
        itemCount: s.itemCount,
        fieldsComplete: s.fields.filter(f => !f.isPlaceholder).length + '/' + s.fieldCount,
        itemsComplete: s.items.filter(i => !i.isPlaceholder).length + '/' + s.itemCount
      }))
    });
    
    // Log sections with mismatches
    const mismatches = sections.filter(s => s.completionMismatch);
    if (mismatches.length > 0) {
      this.logger.warn('⚠️ Completion Mismatches', 'HomePageComponent', mismatches);
    }
  }
}
