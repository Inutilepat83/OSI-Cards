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

// Import standalone components
import { AICardRendererComponent, CardPreviewComponent } from '../../../../shared/components/cards';
import { ensureCardIds, removeAllIds } from '../../../../shared';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AICardRendererComponent,
    CardPreviewComponent,
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
  private readonly ngZone = inject(NgZone);
  
  // Batch section completions to prevent excessive dispatches
  private completionBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly COMPLETION_BATCH_DELAY_MS = 100; // Batch completions every 100ms for more responsive updates
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
  private llmPreviewCard: AICardConfig | null = null;
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
  private llmTargetJson = '';
  private llmBuffer = '';
  private llmChunksQueue: string[] = [];
  private llmThinkingTimer: ReturnType<typeof setTimeout> | null = null;
  private llmChunkTimer: ReturnType<typeof setTimeout> | null = null;
  private llmFastTokenCounter = 0;
  private progressiveCardDispatchTimer: ReturnType<typeof setTimeout> | null = null;
  private llmParsedCard: AICardConfig | null = null;
  private llmPreviewChangeType: CardChangeType = 'structural';
  private llmPreviewSectionCount = 0;
  private llmSectionBlueprints: CardSection[] = [];
  private llmPlaceholderCard: AICardConfig | null = null;
  private lastKnownSectionCount = 0;
  private sectionCompletionStates = new Map<string, boolean>(); // Track which sections are complete
  private sectionCompletionPercentages = new Map<string, number>(); // Track partial completion (0-1)
  private lastDispatchedCardHash = ''; // Track last dispatched card to avoid duplicate dispatches
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
    this.jsonInput = jsonInput;
    
    // Validate JSON syntax immediately for error display
    this.validateJsonSyntax(jsonInput);
    
    // Process through both streams:
    // 1. Immediate stream for live preview (50ms debounce)
    this.immediateJsonSubject.next(jsonInput);
    // 2. Debounced stream for final validation (300ms debounce)
    if (this.shouldTriggerDebouncedProcessing()) {
      this.jsonInputSubject.next(jsonInput);
    }
  }
  
  private validateJsonSyntax(jsonInput: string): void {
    if (!jsonInput || jsonInput.trim() === '') {
      this.isJsonValid = true;
      this.jsonError = '';
      this.jsonErrorPosition = null;
      this.jsonErrorSuggestion = '';
      return;
    }
    
    try {
      JSON.parse(jsonInput);
      this.isJsonValid = true;
      this.jsonError = '';
      this.jsonErrorPosition = null;
      this.jsonErrorSuggestion = '';
    } catch (e) {
      this.isJsonValid = false;
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON syntax';
      this.jsonError = errorMessage;
      
      // Extract position from error message if available
      const positionMatch = errorMessage.match(/position (\d+)/i);
      if (positionMatch) {
        this.jsonErrorPosition = parseInt(positionMatch[1], 10);
      } else {
        // Try to find common error patterns
        if (errorMessage.includes('Unexpected token')) {
          this.jsonErrorPosition = jsonInput.length - 1;
        } else {
          this.jsonErrorPosition = null;
        }
      }
      
      // Generate suggestions based on error type
      this.jsonErrorSuggestion = this.generateJsonErrorSuggestion(errorMessage, jsonInput);
    }
    this.cd.markForCheck();
  }

  /**
   * Generate helpful suggestions based on JSON error type
   */
  private generateJsonErrorSuggestion(errorMessage: string, jsonInput: string): string {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('unexpected token')) {
      if (lowerError.includes('in json')) {
        return 'Check for missing commas, quotes, or brackets';
      }
      return 'Unexpected character found. Check for typos or missing punctuation';
    }
    
    if (lowerError.includes('unexpected end')) {
      return 'JSON appears incomplete. Check for missing closing brackets or braces';
    }
    
    if (lowerError.includes('expected')) {
      return 'Missing required syntax. Check for missing commas, colons, or quotes';
    }
    
    if (lowerError.includes('trailing comma')) {
      return 'Remove the trailing comma before the closing bracket or brace';
    }
    
    // Check for common issues
    const openBraces = (jsonInput.match(/{/g) || []).length;
    const closeBraces = (jsonInput.match(/}/g) || []).length;
    const openBrackets = (jsonInput.match(/\[/g) || []).length;
    const closeBrackets = (jsonInput.match(/\]/g) || []).length;
    
    if (openBraces > closeBraces) {
      return `Missing ${openBraces - closeBraces} closing brace(s)`;
    }
    
    if (openBrackets > closeBrackets) {
      return `Missing ${openBrackets - closeBrackets} closing bracket(s)`;
    }
    
    return 'Check JSON syntax and try again';
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
    this.startLlmSimulation(payload);
  }

  onSimulateLLMCancel(): void {
    this.cancelLlmSimulation('Simulation cancelled.');
  }

  private startLlmSimulation(targetJson: string): void {
    this.cancelLlmSimulation();
    this.store.dispatch(CardActions.clearError());
    this.isSimulatingLLM = true;
    
    // Start section state logging
    if (this.ENABLE_SECTION_STATE_LOGGING) {
      this.startSectionStateLogging();
    }
    this.llmTargetJson = targetJson;
    this.llmBuffer = '';
    this.llmChunksQueue = this.createLlmChunks(targetJson);
    this.llmParsedCard = null;
    this.llmPreviewSectionCount = 0;
    this.llmPreviewChangeType = 'structural';
    if (!this.llmChunksQueue.length) {
      this.isSimulatingLLM = false;
      this.announceStatus('Nothing to stream — JSON payload is empty.', true);
      return;
    }

    // Update LLM state FIRST to trigger card display immediately
    const thinkingHint = this.llmParsedCard
      ? 'Expect the first tokens in about five seconds.'
      : 'JSON must remain text-only until it parses successfully.';

    // LLM state update removed

    // Create empty card structure immediately for visual feedback
    const emptyCard: AICardConfig = {
      cardTitle: 'Generating card…',
      sections: []
    };
    this.llmPreviewCard = this.recheckCardStructure(ensureCardIds(emptyCard));
    
    // Dispatch empty card to store immediately
    if (this.llmPreviewCard) {
      this.ngZone.run(() => {
        this.store.dispatch(CardActions.generateCardSuccess({ 
          card: this.llmPreviewCard!, 
          changeType: 'structural'
        }));
        this.cd.markForCheck();
      });
    }

    // Begin streaming after the thinking delay (preserve existing JSON for live editing)
    this.llmThinkingTimer = setTimeout(() => {
      // LLM state update removed
      this.scheduleNextLlmChunk();
    }, 5000);
  }

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

  private scheduleNextLlmChunk(): void {
    if (!this.isSimulatingLLM) {
      return;
    }

    // Add timeout detection for stalled streams (30 seconds)
    const streamStartTime = Date.now();
    const STREAM_TIMEOUT_MS = 30000;
    
    if (!this.llmChunksQueue.length) {
      this.llmChunkTimer = setTimeout(() => this.finishLlmSimulation(), 600);
      return;
    }
    
    // Check for timeout
    if (Date.now() - streamStartTime > STREAM_TIMEOUT_MS) {
      this.cancelLlmSimulation('Stream timeout - no data received for 30 seconds');
      return;
    }

    const nextChunk = this.llmChunksQueue.shift() ?? '';
    this.llmBuffer += nextChunk;
    const hasMore = this.llmChunksQueue.length > 0;
    
    // Update editor buffer (silent - no change detection)
      this.jsonInput = this.llmBuffer;
    
    // Parse and check for section completions ONLY
    // Do NOT update card during streaming - only check for completions
    const parsed = this.tryParseLlmBuffer();
    if (parsed) {
      // Step 1: Initialize placeholders if sections are declared for first time
      const placeholdersCreated = this.initializePlaceholdersIfNeeded(parsed);
      if (placeholdersCreated && this.llmPlaceholderCard) {
        // Phase 1: Update current streaming update (triggers @Input setter in CardPreview)
        this.currentStreamingUpdate = {
          card: this.llmPlaceholderCard,
          changeType: 'structural'
        };
        
        // Also emit event for backwards compatibility
        this.streamingCardUpdate.emit(this.currentStreamingUpdate);
        
        // Also dispatch to store for initial placeholders (needed for state management)
        this.ngZone.run(() => {
          this.llmPreviewCard = this.llmPlaceholderCard;
          this.store.dispatch(CardActions.generateCardSuccess({ 
            card: this.llmPlaceholderCard!, 
            changeType: 'structural'
          }));
          this.cd.markForCheck();
        });
      }
      
      // Step 2: Check if any sections completed - batch completions to prevent excessive updates
      if (this.llmPlaceholderCard) {
        const completedSections = this.checkSectionCompletions(parsed);
        
        // Step 2b: Check for field-level completions for smoother progressive rendering
        const completedFields = this.checkFieldCompletions(parsed);
        
        // Debug logging
        if (this.ENABLE_SECTION_STATE_LOGGING && (completedSections.length > 0 || completedFields.length > 0)) {
          console.log('✅ [HomePage] Sections/Fields completed', {
            timestamp: new Date().toISOString(),
            completedSectionIndices: completedSections,
            completedFieldCount: completedFields.length,
            totalSections: this.llmPlaceholderCard.sections?.length ?? 0,
            bufferLength: this.llmBuffer.length,
            progress: Math.floor((this.llmBuffer.length / (this.llmTargetJson.length || 1)) * 100) + '%'
          });
        }
        
        // Update if sections or fields completed
        if (completedSections.length > 0 || completedFields.length > 0) {
          // Update only completed sections IN-PLACE (preserves object references)
          if (completedSections.length > 0) {
            this.updateCompletedSectionsOnly(parsed, completedSections);
          }
          
          // Update completed fields in-place for smoother progressive rendering
          if (completedFields.length > 0) {
            this.updateCompletedFieldsOnly(parsed, completedFields);
          }
          
          // Track completed sections for this batch
          this.pendingCompletedSectionIndices.push(...completedSections);
          
          // Batch completions - only dispatch every 300ms to prevent excessive updates
          this.batchSectionCompletions();
        }
      }
      // If no completions and no new placeholders, do NOTHING - no updates, no dispatches, no change detection
    }

    // Progress tracking removed - no longer needed without streaming

    const delay = hasMore ? this.computeChunkDelay(nextChunk) : 100;
    this.llmChunkTimer = setTimeout(() => {
      if (hasMore) {
        this.scheduleNextLlmChunk();
      } else {
        this.finishLlmSimulation();
      }
    }, delay);
  }


  private finishLlmSimulation(): void {
    if (!this.isSimulatingLLM) {
      return;
    }
    
    // Stop section state logging
    this.stopSectionStateLogging();
    
    this.clearLlmTimers();
    this.isSimulatingLLM = false;
    
    // Clear any pending completion batches
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
      this.completionBatchTimer = null;
    }
    this.pendingCompletedSectionIndices = [];
    
    // Final parse and check for any remaining completions
    const parsed = this.tryParseLlmBuffer();
    if (parsed && this.llmPlaceholderCard) {
      // Check for any final section completions
      const completedSections = this.checkSectionCompletions(parsed);
      if (completedSections.length > 0) {
        this.updateCompletedSectionsOnly(parsed, completedSections);
      }
      
      // Final dispatch with complete card - use structural for final layout calculation
      this.store.dispatch(CardActions.generateCardSuccess({ 
        card: this.llmPlaceholderCard, 
        changeType: 'structural'
      }));
    }
    
    // Reset streaming state
    this.llmParsedCard = null;
    this.llmPreviewCard = null;
    this.llmPreviewSectionCount = 0;
    this.llmPreviewChangeType = 'structural';
    this.lastKnownSectionCount = 0;
    this.sectionCompletionStates.clear();
    this.lastDispatchedCardHash = '';
    // LLM state update removed
      this.jsonInputSubject.next(this.jsonInput);
  }

  private cancelLlmSimulation(reason?: string): void {
    // LLM simulation removed - method kept for compatibility but does nothing
  }

  private createLlmChunks(payload: string): string[] {
    const sanitized = payload.replace(/\r\n/g, '\n');
    const chunks: string[] = [];
    let buffer = '';
    const minChunk = 18;
    const maxChunk = 64;

    for (const char of sanitized) {
      buffer += char;
      const isBoundary = /[\n,}\]]/.test(char);
      const reachedMax = buffer.length >= maxChunk;
      const reachedBoundary = buffer.length >= minChunk && isBoundary;
      if (reachedMax || reachedBoundary) {
        chunks.push(buffer);
        buffer = '';
      }
    }

    if (buffer) {
      chunks.push(buffer);
    }

    return chunks;
  }

  /**
   * Compute delay for chunk to achieve 100 tokens per second
   * Approximate: 1 token ≈ 4 characters, so 100 tokens/sec = 400 chars/sec = ~2.5ms per char
   * For smooth streaming, use chunk length to calculate delay
   */
  private computeChunkDelay(chunk: string): number {
    // 100 tokens per second = 10ms per token
    // Approximate 1 token = 4 characters, so ~2.5ms per character
    const charsPerToken = 4;
    const tokensPerSecond = 100;
    const msPerToken = 1000 / tokensPerSecond; // 10ms per token
    const tokensInChunk = Math.max(1, chunk.length / charsPerToken);
    return Math.round(tokensInChunk * msPerToken);
  }

  /**
   * Phase 1: Batch section completions and emit direct updates (bypass store)
   * Only dispatches every 100ms, allowing multiple sections to complete together
   * Uses requestAnimationFrame for visual updates to align with browser paint cycles
   */
  private batchSectionCompletions(): void {
    // Clear existing timer
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
    }
    
    // Schedule batched dispatch with smart prioritization
    this.completionBatchTimer = setTimeout(() => {
      if (this.llmPlaceholderCard && this.pendingCompletedSectionIndices.length > 0) {
        // Use requestAnimationFrame for visual updates to align with browser paint cycles
        requestAnimationFrame(() => {
          // CRITICAL: Create new object references ONLY for completed sections
          // This ensures Angular detects changes while minimizing object creation
          const completedSet = new Set(this.pendingCompletedSectionIndices);
          // CRITICAL: When sections complete during streaming, always use 'structural' change type
          // This ensures masonry grid properly recalculates layout regardless of field updates
          const changeType: CardChangeType = this.pendingCompletedSectionIndices.length > 0 ? 'structural' : (this.pendingStructuralChanges ? 'structural' : 'content');
          const updatedCard: AICardConfig = {
            ...this.llmPlaceholderCard!,
            cardTitle: this.llmPlaceholderCard!.cardTitle || '',
            sections: (this.llmPlaceholderCard?.sections || []).map((section, index) => {
              // Only create new reference for completed sections
              if (completedSet.has(index)) {
                return {
                  ...section,
                  fields: section.fields?.map(field => ({ ...field })),
                  items: section.items?.map(item => ({ ...item }))
                };
              }
              // Keep existing reference for unchanged sections
              return section;
            })
          };
          
          // Update the placeholder card reference to the new object
          this.llmPlaceholderCard = updatedCard;
          
          // Phase 1: Update current streaming update (triggers @Input setter in CardPreview)
          // Use 'structural' change type when sections complete to trigger layout recalculation
          this.currentStreamingUpdate = {
            card: updatedCard,
            changeType: changeType,
            completedSections: [...this.pendingCompletedSectionIndices] // Pass completed sections for potential optimization
          };
          
          // Also emit event for backwards compatibility
          this.streamingCardUpdate.emit(this.currentStreamingUpdate);
          
          // Also update local preview card reference
          this.llmPreviewCard = updatedCard;
          
          // Clear pending completed sections and structural change flag
          this.pendingCompletedSectionIndices = [];
          this.pendingStructuralChanges = false;
          
          // Trigger change detection to update @Input binding
          this.cd.markForCheck();
          
          // Only dispatch to store for initial placeholders (structural change)
          // Content updates go directly to CardPreview via streamingCardUpdate
        });
      }
      this.completionBatchTimer = null;
    }, this.COMPLETION_BATCH_DELAY_MS);
  }

  private clearLlmTimers(): void {
    if (this.llmThinkingTimer) {
      clearTimeout(this.llmThinkingTimer);
      this.llmThinkingTimer = null;
    }
    if (this.llmChunkTimer) {
      clearTimeout(this.llmChunkTimer);
      this.llmChunkTimer = null;
    }
    if (this.completionBatchTimer) {
      clearTimeout(this.completionBatchTimer);
      this.completionBatchTimer = null;
    }
  }

  /**
   * Update per-section progress information for visual indicators
   */
  private updateSectionProgress(parsed: AICardConfig): void {
    if (!this.llmPlaceholderCard) {
      return;
    }

    const sections = parsed.sections ?? [];
    const sectionProgress = sections.map((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      const progress = this.sectionCompletionPercentages.get(sectionKey) || 0;
      const isComplete = this.sectionCompletionStates.get(sectionKey) || false;
      
      return {
        sectionId: sectionKey,
        sectionIndex: index,
        progress: Math.min(1, Math.max(0, progress)),
        isComplete
      };
    });

    // LLM state update removed
  }


  // Removed updateLlmPreviewCard - card updates now happen directly in scheduleNextLlmChunk
  // This ensures values are never modified once displayed


  private estimateSectionsUnlocked(totalSections: number, progress: number): number {
    if (!totalSections || !this.llmParsedCard) {
      return 0;
    }
    if (progress >= 0.995) {
      return totalSections;
    }
    const scaled = Math.floor(progress * totalSections + 0.2);
    const baseline = progress > 0 ? 1 : 0;
    return Math.max(baseline, scaled);
  }

  private resolveLlmChangeType(previousVisible: number, nextVisible: number): CardChangeType {
    if (nextVisible > previousVisible) {
      return 'structural';
    }
    if (nextVisible < previousVisible) {
      return 'structural';
    }
    return nextVisible === 0 ? 'structural' : 'content';
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

  private tryParseLlmBuffer(): AICardConfig | null {
    try {
      const parsed = JSON.parse(this.llmBuffer) as unknown;
      if (CardTypeGuards.isAICardConfig(parsed)) {
        return this.recheckCardStructure(parsed) ?? parsed as AICardConfig;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Initialize placeholders when sections are first declared
   * This is called ONCE when sections appear in the JSON
   */
  private initializePlaceholdersIfNeeded(parsed: AICardConfig): boolean {
    const sanitized = this.recheckCardStructure(parsed) as AICardConfig;
    if (!sanitized) {
      return false;
    }

    // Store parsed card for completion checking
    this.llmParsedCard = sanitized;

    const sections = sanitized.sections ?? [];
    const currentSectionCount = sections.length;

    // If sections are declared for the first time, create placeholders
    if (currentSectionCount > this.lastKnownSectionCount && currentSectionCount > 0) {
      this.lastKnownSectionCount = currentSectionCount;
      // Initialize placeholders for all declared sections
      this.initializeLlmPlaceholders(sanitized);
      return true; // Placeholders were created
    }

    return false; // No new placeholders needed
  }

  /**
   * Check which sections are complete (all fields/items have real values)
   * Returns array of section indices that are newly complete
   * Also tracks partial completion percentage for smoother progressive rendering
   */
  private checkSectionCompletions(parsed: AICardConfig): number[] {
    const sections = parsed.sections ?? [];
    const newlyCompleted: number[] = [];

    sections.forEach((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      const wasComplete = this.sectionCompletionStates.get(sectionKey) || false;

      if (wasComplete) {
        return; // Already marked as complete
      }

      // Calculate completion percentage for partial updates
      const completionPercentage = this.calculateSectionCompletionPercentage(section);
      this.sectionCompletionPercentages.set(sectionKey, completionPercentage);

      // Check if section is complete (all fields and items have real values)
      const isComplete = this.isSectionComplete(section);

      if (isComplete) {
        this.sectionCompletionStates.set(sectionKey, true);
        this.sectionCompletionPercentages.set(sectionKey, 1.0);
        newlyCompleted.push(index);
      } else if (completionPercentage > 0) {
        // Section is partially complete - emit update even if not fully complete
        // This allows progressive rendering of partial content
        const previousPercentage = this.sectionCompletionPercentages.get(sectionKey) || 0;
        if (completionPercentage > previousPercentage + 0.1) {
          // Only update if completion increased by at least 10% to avoid excessive updates
          newlyCompleted.push(index);
        }
      }
    });

    return newlyCompleted;
  }

  /**
   * Check which fields have completed (have real values, not placeholders)
   * Returns array of field identifiers: { sectionIndex, fieldIndex }
   */
  private checkFieldCompletions(parsed: AICardConfig): Array<{ sectionIndex: number; fieldIndex: number }> {
    const sections = parsed.sections ?? [];
    const completedFields: Array<{ sectionIndex: number; fieldIndex: number }> = [];

    sections.forEach((section, sectionIndex) => {
      const fields = section.fields ?? [];
      fields.forEach((field, fieldIndex) => {
        const meta = field.meta as Record<string, unknown> | undefined;
        const isPlaceholder = field.value === 'Streaming…' || 
                             field.value === undefined ||
                             field.value === null ||
                             (meta && meta['placeholder'] === true);
        
        // Check if this field was previously a placeholder and now has a real value
        if (!isPlaceholder && field.value !== '') {
          const placeholderSection = this.llmPlaceholderCard?.sections?.[sectionIndex];
          const placeholderField = placeholderSection?.fields?.[fieldIndex];
          if (placeholderField) {
            const placeholderMeta = placeholderField.meta as Record<string, unknown> | undefined;
            const wasPlaceholder = placeholderField.value === 'Streaming…' ||
                                  placeholderMeta?.['placeholder'] === true;
            if (wasPlaceholder) {
              completedFields.push({ sectionIndex, fieldIndex });
            }
          }
        }
      });
    });

    return completedFields;
  }

  /**
   * Update only completed fields IN-PLACE for smoother progressive rendering
   */
  private updateCompletedFieldsOnly(incoming: AICardConfig, completedFields: Array<{ sectionIndex: number; fieldIndex: number }>): void {
    if (!this.llmPlaceholderCard) {
      return;
    }

    const incomingSections = incoming.sections ?? [];
    const placeholderSections = this.llmPlaceholderCard.sections ?? [];

    completedFields.forEach(({ sectionIndex, fieldIndex }) => {
      const placeholderSection = placeholderSections[sectionIndex];
      const incomingSection = incomingSections[sectionIndex];
      
      if (!placeholderSection || !incomingSection) {
        return;
      }

      const placeholderFields = placeholderSection.fields ?? [];
      const incomingFields = incomingSection.fields ?? [];
      const placeholderField = placeholderFields[fieldIndex];
      const incomingField = incomingFields[fieldIndex];

      if (!placeholderField || !incomingField) {
        return;
      }

      // Update field properties in-place (preserve object reference)
      placeholderField.label = incomingField.label ?? placeholderField.label;
      placeholderField.value = incomingField.value ?? placeholderField.value;
      placeholderField.type = incomingField.type ?? placeholderField.type;
      placeholderField.format = incomingField.format ?? placeholderField.format;
      
      // Remove placeholder flag
      const meta = placeholderField.meta as Record<string, unknown> | undefined;
      if (meta) {
        meta['placeholder'] = false;
      }
    });
  }

  /**
   * Calculate completion percentage for a section (0-1)
   * Based on how many fields/items have real values vs placeholders
   */
  private calculateSectionCompletionPercentage(section: CardSection): number {
    const fields = section.fields ?? [];
    const items = section.items ?? [];
    const totalElements = fields.length + items.length;

    if (totalElements === 0) {
      // Section with no fields/items is considered complete if it has metadata
      return section.title ? 0.5 : 0;
    }

    let completedCount = 0;

    // Check fields
    fields.forEach(field => {
      const meta = field.meta as Record<string, unknown> | undefined;
      const isPlaceholder = field.value === 'Streaming…' || 
                           field.value === undefined ||
                           field.value === null ||
                           (meta && meta['placeholder'] === true);
      if (!isPlaceholder && field.value !== '') {
        completedCount++;
      }
    });

    // Check items
    items.forEach(item => {
      const meta = item.meta as Record<string, unknown> | undefined;
      const isPlaceholder = (meta && meta['placeholder'] === true) ||
                           (item.title === 'Item' && !item.description);
      if (!isPlaceholder && item.title) {
        completedCount++;
      }
    });

    return totalElements > 0 ? completedCount / totalElements : 0;
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
   * Get a simple hash of the card for comparison
   */
  private getCardHash(card: AICardConfig): string {
    const sections = card.sections ?? [];
    const sectionHashes = sections.map((s, idx) => {
      const sectionKey = s.id || `section-${idx}`;
      const fieldCount = s.fields?.length ?? 0;
      const itemCount = s.items?.length ?? 0;
      const completionState = this.sectionCompletionStates.get(sectionKey) ? 'complete' : 'incomplete';
      return `${sectionKey}:${fieldCount}:${itemCount}:${completionState}`;
    });
    return `${card.id || ''}:${sections.length}:${sectionHashes.join('|')}`;
  }


  private initializeLlmPlaceholders(card: AICardConfig): void {
    const sections = card.sections ?? [];
    this.llmSectionBlueprints = sections.map((section, index) => this.createPlaceholderSection(section, index));
    const placeholderCard: AICardConfig = {
      ...card,
      sections: this.llmSectionBlueprints.map(section => this.cloneSectionStructure(section))
    };
    this.llmPlaceholderCard = this.recheckCardStructure(placeholderCard);
    this.llmParsedCard = card; // Store parsed card for progressive updates
    if (this.llmPlaceholderCard) {
      // Use the same object reference for preview card (no cloning)
      // This maintains stable references and prevents blinking
      this.llmPreviewCard = this.llmPlaceholderCard;
      this.llmPreviewChangeType = 'structural';
      // Mark all sections as incomplete initially
      sections.forEach((section, index) => {
        const sectionKey = section.id || `section-${index}`;
        this.sectionCompletionStates.set(sectionKey, false);
      });
    }
  }

  private createPlaceholderSection(section: CardSection, sectionIndex: number): CardSection {
    const baseId = section.id ?? `llm-section-${sectionIndex}`;
    return {
      ...section,
      id: baseId,
      title: section.title || `Section ${sectionIndex + 1}`,
      fields: (section.fields ?? []).map((field, fieldIndex) => this.createPlaceholderField(field, sectionIndex, fieldIndex)),
      items: (section.items ?? []).map((item, itemIndex) => this.createPlaceholderItem(item, sectionIndex, itemIndex)),
      meta: { ...(section.meta ?? {}), placeholder: true, streamingOrder: sectionIndex }
    };
  }

  private cloneSectionStructure(section: CardSection): CardSection {
    return {
      ...section,
      fields: section.fields?.map(field => ({ ...field })),
      items: section.items?.map(item => ({ ...item }))
    };
  }

  private cloneStreamingPreview(source: AICardConfig): AICardConfig {
    return {
      ...source,
      sections: (source.sections ?? []).map(section => ({
        ...section,
        fields: section.fields?.map(field => ({ ...field })),
        items: section.items?.map(item => ({ ...item }))
      })),
      actions: source.actions?.map(action => ({ ...action }))
    };
  }

  private createPlaceholderField(field: CardField, sectionIndex: number, fieldIndex: number): CardField {
    return {
      ...field,
      id: field.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
      label: field.label || field.title || `Field ${fieldIndex + 1}`,
      value: field.value ?? '', // Use actual value from JSON if available
      percentage: field.percentage,
      trend: field.trend,
      meta: { ...(field.meta ?? {}), placeholder: true }
    };
  }

  private createPlaceholderItem(item: CardItem, sectionIndex: number, itemIndex: number): CardItem {
    return {
      ...item,
      id: item.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
      title: item.title || `Item ${itemIndex + 1}`,
      description: item.description ?? '', // Use actual description from JSON if available
      meta: { ...(item.meta ?? {}), placeholder: true }
    };
  }

  private syncPlaceholderSections(visibleCount: number): void {
    if (!this.llmPlaceholderCard || !this.llmParsedCard) {
      return;
    }
    const parsedSections = this.llmParsedCard.sections ?? [];
    const totalSections = this.llmPlaceholderCard.sections?.length ?? 0;
    for (let index = 0; index < totalSections; index++) {
      const unlocked = index < visibleCount;
      const source = parsedSections[index];
      this.applySectionContentToPlaceholder(index, source, unlocked);
    }
  }

  private applySectionContentToPlaceholder(index: number, source: CardSection | undefined, unlocked: boolean): void {
    if (!this.llmPlaceholderCard?.sections) {
      return;
    }
    const target = this.llmPlaceholderCard.sections[index];
    if (!target) {
      return;
    }

    if (!source) {
      target.meta = { ...(target.meta ?? {}), placeholder: true };
      return;
    }

    target.title = source.title ?? target.title;
    target.subtitle = source.subtitle ?? target.subtitle;
    target.type = source.type ?? target.type;
    target.description = source.description ?? target.description;
    target.emoji = source.emoji ?? target.emoji;
    target.columns = source.columns ?? target.columns;
    target.colSpan = source.colSpan ?? target.colSpan;
    target.chartType = source.chartType ?? target.chartType;
    target.chartData = unlocked ? source.chartData : target.chartData;
    target.fields = this.syncPlaceholderFields(target.fields ?? [], source.fields ?? [], index, unlocked);
    target.items = this.syncPlaceholderItems(target.items ?? [], source.items ?? [], index, unlocked);
    const streamingOrder = (target.meta as Record<string, unknown> | undefined)?.['streamingOrder'] ?? (source.meta as Record<string, unknown> | undefined)?.['streamingOrder'] ?? index;
    target.meta = {
      ...(source.meta ?? {}),
      streamingOrder,
      placeholder: !unlocked
    };
  }

  private syncPlaceholderFields(existing: CardField[], incoming: CardField[], sectionIndex: number, unlocked: boolean): CardField[] {
    const maxLength = Math.max(existing.length, incoming.length);
    const nextFields: CardField[] = [];
    for (let fieldIndex = 0; fieldIndex < maxLength; fieldIndex++) {
      const existingField = existing[fieldIndex] ?? this.createPlaceholderField({} as CardField, sectionIndex, fieldIndex);
      const incomingField = incoming[fieldIndex];
      if (!incomingField || !unlocked) {
        nextFields.push({
          ...existingField,
          label: incomingField?.label ?? existingField.label ?? `Field ${fieldIndex + 1}`,
          value: incomingField?.value ?? existingField.value ?? '', // Use actual value from JSON if available
          meta: { ...(existingField.meta ?? {}), placeholder: true }
        });
        continue;
      }
      nextFields.push({
        ...incomingField,
        id: incomingField.id ?? existingField.id ?? `llm-field-${sectionIndex}-${fieldIndex}`,
        meta: { ...(incomingField.meta ?? {}), placeholder: false }
      });
    }
    return nextFields;
  }

  private syncPlaceholderItems(existing: CardItem[], incoming: CardItem[], sectionIndex: number, unlocked: boolean): CardItem[] {
    const maxLength = Math.max(existing.length, incoming.length);
    const nextItems: CardItem[] = [];
    for (let itemIndex = 0; itemIndex < maxLength; itemIndex++) {
      const existingItem = existing[itemIndex] ?? this.createPlaceholderItem({ title: '' }, sectionIndex, itemIndex);
      const incomingItem = incoming[itemIndex];
      if (!incomingItem || !unlocked) {
        nextItems.push({
          ...existingItem,
          title: incomingItem?.title ?? existingItem.title ?? `Item ${itemIndex + 1}`,
          description: incomingItem?.description ?? existingItem.description ?? '', // Use actual description from JSON if available
          meta: { ...(existingItem.meta ?? {}), placeholder: true }
        });
        continue;
      }
      nextItems.push({
        ...incomingItem,
        id: incomingItem.id ?? existingItem.id ?? `llm-item-${sectionIndex}-${itemIndex}`,
        meta: { ...(incomingItem.meta ?? {}), placeholder: false }
      });
    }
    return nextItems;
  }

  private isLlmStreamingActive(): boolean {
    if (!this.isSimulatingLLM) {
      return false;
    }
    // LLM stage removed
    const stage = undefined;
    return stage !== 'complete' && stage !== 'aborted' && stage !== 'error';
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
      return this.llmPreviewChangeType ?? 'structural';
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

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonInput);
      // Remove IDs before formatting
      const cleaned = removeAllIds(parsed);
      this.jsonInput = JSON.stringify(cleaned, null, 2) + '\n';
      this.onJsonInputChange(this.jsonInput);
      this.announceStatus('JSON formatted successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown formatting issue.';
      this.announceStatus(`Unable to format JSON: ${message}`, true);
    }
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.formatJson();
    }
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
    
    this.clearLlmTimers();
    this.jsonInputSubject.complete();
    this.immediateJsonSubject.complete();
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
    const parsedCard = this.llmParsedCard;
    
    if (!placeholderCard) {
      console.log('⚠️ [HomePage] No placeholder card yet', { timestamp });
      return;
    }
    
    const sections = (placeholderCard.sections ?? []).map((section, index) => {
      const sectionKey = section.id || `section-${index}`;
      const isComplete = this.sectionCompletionStates.get(sectionKey) || false;
      const parsedSection = parsedCard?.sections?.[index];
      
      // Check field completion
      const fields = section.fields ?? [];
      const fieldStates = fields.map((field, fieldIdx) => {
        const meta = field.meta as Record<string, unknown> | undefined;
        const isPlaceholder = field.value === 'Streaming…' || 
                             field.value === undefined ||
                             field.value === null ||
                             (meta && meta['placeholder'] === true);
        const parsedField = parsedSection?.fields?.[fieldIdx];
        
        return {
          index: fieldIdx,
          id: field.id || `field-${index}-${fieldIdx}`,
          label: field.label || field.title || 'no-label',
          value: field.value,
          isPlaceholder,
          hasParsedValue: !!parsedField?.value && parsedField.value !== 'Streaming…',
          parsedValue: parsedField?.value
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
        const parsedItem = parsedSection?.items?.[itemIdx];
        
        return {
          index: itemIdx,
          id: item.id || `item-${index}-${itemIdx}`,
          title: item.title,
          description: item.description,
          isPlaceholder,
          hasParsedTitle: !!parsedItem?.title && !parsedItem.title.startsWith('Item '),
          parsedTitle: parsedItem?.title
        };
      });
      
      const allFieldsComplete = fieldStates.length > 0 && fieldStates.every(f => !f.isPlaceholder);
      const allItemsComplete = itemStates.length > 0 && itemStates.every(i => !i.isPlaceholder);
      const sectionShouldBeComplete = (fieldStates.length === 0 || allFieldsComplete) && 
                                      (itemStates.length === 0 || allItemsComplete);
      
      return {
        index,
        key: sectionKey,
        id: section.id || 'no-id',
        title: section.title || 'no-title',
        type: section.type || 'no-type',
        isComplete,
        shouldBeComplete: sectionShouldBeComplete,
        completionMismatch: isComplete !== sectionShouldBeComplete,
        fieldCount: fields.length,
        itemCount: items.length,
        fields: fieldStates,
        items: itemStates,
        hasParsedSection: !!parsedSection
      };
    });
    
    const logData = {
      timestamp,
      isSimulating: this.isSimulatingLLM,
      // stage removed
      bufferLength: this.llmBuffer.length,
      targetLength: this.llmTargetJson.length,
      progress: Math.floor((this.llmBuffer.length / (this.llmTargetJson.length || 1)) * 100) + '%',
      placeholderCardId: placeholderCard.id,
      placeholderSectionCount: placeholderCard.sections?.length ?? 0,
      parsedCardId: parsedCard?.id,
      parsedSectionCount: parsedCard?.sections?.length ?? 0,
      lastKnownSectionCount: this.lastKnownSectionCount,
      totalSections: sections.length,
      completedSections: sections.filter(s => s.isComplete).length,
      sections
    };
    
    console.group(`📊 [HomePage] Section States - ${timestamp}`);
    console.log('Streaming Status:', {
      isSimulating: logData.isSimulating,
      // stage removed
      progress: logData.progress,
      bufferLength: logData.bufferLength,
      targetLength: logData.targetLength
    });
    console.log('Card State:', {
      placeholderCardId: logData.placeholderCardId,
      placeholderSections: logData.placeholderSectionCount,
      parsedCardId: logData.parsedCardId,
      parsedSections: logData.parsedSectionCount,
      lastKnownCount: logData.lastKnownSectionCount
    });
    console.log('Completion Summary:', {
      total: logData.totalSections,
      completed: logData.completedSections,
      pending: logData.totalSections - logData.completedSections
    });
    console.table(sections.map(s => ({
      Index: s.index,
      ID: s.id,
      Title: s.title,
      Type: s.type,
      'Is Complete': s.isComplete ? '✅' : '⏳',
      'Should Complete': s.shouldBeComplete ? '✅' : '⏳',
      'Mismatch': s.completionMismatch ? '⚠️' : '✓',
      Fields: s.fieldCount,
      Items: s.itemCount,
      'Fields Complete': s.fields.filter(f => !f.isPlaceholder).length + '/' + s.fieldCount,
      'Items Complete': s.items.filter(i => !i.isPlaceholder).length + '/' + s.itemCount
    })));
    
    // Log sections with mismatches
    const mismatches = sections.filter(s => s.completionMismatch);
    if (mismatches.length > 0) {
      console.warn('⚠️ Completion Mismatches:', mismatches);
    }
    
    console.groupEnd();
  }
}
