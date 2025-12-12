import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// Import optimized card renderer from app (not library - uses optimized MagneticTiltService)
import { AICardRendererComponent } from '../../shared/components/cards/ai-card-renderer.component';
import { AICardConfig } from '../../../../projects/osi-cards-lib/src/lib/models';
import {
  CardUpdate,
  OSICardsStreamingService,
  StreamingState,
} from '../../../../projects/osi-cards-lib/src/lib/services/streaming.service';
import {
  ThemePreset,
  ThemeService,
} from '../../../../projects/osi-cards-lib/src/lib/themes/theme.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

/**
 * Simulated client environment configuration
 */
interface ClientEnvironment {
  id: string;
  name: string;
  description: string;
  cssClass: string;
}

/**
 * Card template configuration
 */
interface CardTemplate {
  id: string;
  name: string;
  path: string;
}

/**
 * iLibrary Integration Simulator Component
 *
 * Demonstrates OSI Cards integration into various client applications,
 * showcasing streaming logic, theme switching, and CSS encapsulation
 * across different stylesheet environments.
 */
@Component({
  selector: 'app-ilibrary',
  standalone: true,
  imports: [CommonModule, FormsModule, AICardRendererComponent, LucideIconsModule],
  templateUrl: './ilibrary.component.html',
  styleUrls: ['./ilibrary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IlibraryComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly streamingService = inject(OSICardsStreamingService);
  private readonly themeService = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);

  // Client environments for simulation
  readonly environments: ClientEnvironment[] = [
    {
      id: 'osi',
      name: 'OSI (Orange Sales Assistance)',
      description: 'Orange Sales Assistance environment with Boosted styling',
      cssClass: 'env-osi',
    },
    {
      id: 'corporate',
      name: 'Corporate Portal',
      description: 'Bootstrap/Boosted-like enterprise environment',
      cssClass: 'env-corporate',
    },
    {
      id: 'developer',
      name: 'Developer Console',
      description: 'Dark terminal aesthetic with monospace fonts',
      cssClass: 'env-developer',
    },
    {
      id: 'marketing',
      name: 'Marketing Site',
      description: 'Light, modern with conflicting styles',
      cssClass: 'env-marketing',
    },
    {
      id: 'legacy',
      name: 'Legacy System',
      description: 'Aggressive CSS resets and overrides',
      cssClass: 'env-legacy',
    },
  ];

  // Card templates - All Sections Complete is default for comprehensive testing
  readonly cardTemplates: CardTemplate[] = [
    // Generated test configs (most useful for testing - placed first)
    {
      id: 'complete',
      name: 'All Sections (Complete)',
      path: 'assets/configs/generated/all-sections-complete.json',
    },
    {
      id: 'all-components',
      name: 'All Components',
      path: 'assets/configs/all/all-components.json',
    },
    {
      id: 'minimal',
      name: 'All Sections (Minimal)',
      path: 'assets/configs/generated/all-sections-minimal.json',
    },
    {
      id: 'edge-cases',
      name: 'All Sections (Edge Cases)',
      path: 'assets/configs/generated/all-sections-edge-cases.json',
    },
    // Standard configs
    {
      id: 'company-basic',
      name: 'Company (Basic)',
      path: 'assets/configs/companies/company-basic-v1.json',
    },
    {
      id: 'company-enhanced',
      name: 'Company (Enhanced)',
      path: 'assets/configs/companies/company-enhanced-v2.json',
    },
    {
      id: 'contact-basic',
      name: 'Contact (Basic)',
      path: 'assets/configs/contacts/contact-basic-v1.json',
    },
    {
      id: 'opportunity-basic',
      name: 'Opportunity (Basic)',
      path: 'assets/configs/opportunities/opportunity-basic-v1.json',
    },
    {
      id: 'analytics-basic',
      name: 'Analytics (Basic)',
      path: 'assets/configs/analytics/analytics-basic-v1.json',
    },
  ];

  // Theme options
  readonly themeOptions: { id: ThemePreset; name: string }[] = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'system', name: 'System' },
  ];

  // State
  selectedEnvironment: ClientEnvironment = this.environments[0]!;
  selectedTemplate: CardTemplate = this.cardTemplates[0]!;
  selectedTheme: ThemePreset = 'dark';

  // Streaming configuration
  useStreaming = true;
  streamingSpeed = 80; // tokens per second
  thinkingDelay = 2000; // milliseconds to simulate LLM thinking (waiting for JSON)

  // Card state
  currentCard: AICardConfig | null = null;
  streamingState: StreamingState | null = null;

  // UI state
  isGenerating = false;
  cardJson = '';

  ngOnInit(): void {
    // Subscribe to streaming service state
    this.streamingService.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.streamingState = state;
      this.isGenerating = state.isActive;
      this.cdr.markForCheck();
    });

    // Subscribe to card updates
    this.streamingService.cardUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: CardUpdate) => {
        this.currentCard = update.card;
        this.cdr.markForCheck();
      });

    // Handle query params for automated testing
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.handleQueryParams(params);
    });

    // Set initial theme
    this.onThemeChange();

    // Load initial card
    this.loadCardTemplate();
  }

  /**
   * Handle query parameters for automated testing
   * Supported params:
   *   - theme: 'night' | 'day' | 'high-contrast' | 'osi-day' | 'osi-night'
   *   - state: 'normal' | 'streaming' | 'empty'
   *   - config: 'complete' | 'minimal' | 'edge-cases' | template id
   *   - env: 'osi' | 'corporate' | 'developer' | 'marketing' | 'legacy'
   */
  private handleQueryParams(params: Record<string, string>): void {
    let shouldAutoGenerate = false;

    // Handle environment param
    if (params.env) {
      const envId = params.env;
      const env = this.environments.find((e) => e.id === envId);
      if (env) {
        this.selectedEnvironment = env;
      }
    }

    // Handle theme param
    if (params.theme) {
      const theme = params.theme as ThemePreset;
      if (['night', 'day', 'high-contrast', 'osi-day', 'osi-night'].includes(theme)) {
        this.selectedTheme = theme;
        this.themeService.setTheme(theme);
      }
    }

    // Handle config param
    if (params.config) {
      const configId = params.config;
      const template = this.cardTemplates.find((t) => t.id === configId);
      if (template) {
        this.selectedTemplate = template;
        shouldAutoGenerate = true;
      }
    }

    // Handle state param
    if (params.state) {
      const state = params.state;

      switch (state) {
        case 'empty':
          // Set empty card (no sections)
          this.currentCard = { cardTitle: 'Empty Card', sections: [] };
          this.cardJson = JSON.stringify(this.currentCard, null, 2);
          this.cdr.markForCheck();
          return; // Don't auto-generate for empty state

        case 'streaming':
          // Enable streaming mode
          this.useStreaming = true;
          shouldAutoGenerate = true;
          break;

        case 'normal':
        default:
          // Normal mode - instant load
          this.useStreaming = false;
          shouldAutoGenerate = true;
          break;
      }
    }

    // Auto-generate if params were provided
    if (shouldAutoGenerate) {
      this.loadCardTemplateAndGenerate();
    }

    this.cdr.markForCheck();
  }

  /**
   * Load template and auto-generate (for query param automation)
   */
  private loadCardTemplateAndGenerate(): void {
    this.http
      .get<AICardConfig>(this.selectedTemplate.path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cardConfig) => {
          this.cardJson = JSON.stringify(cardConfig, null, 2);
          // Auto-generate after loading
          setTimeout(() => this.generateCard(), 100);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load card template:', err);
          this.cardJson = '{}';
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.streamingService.stop();
  }

  /**
   * Handle environment selection change
   */
  onEnvironmentChange(): void {
    this.cdr.markForCheck();
  }

  /**
   * Handle theme selection change
   */
  onThemeChange(): void {
    this.themeService.setTheme(this.selectedTheme);
    this.cdr.markForCheck();
  }

  /**
   * Handle card template selection change
   */
  onTemplateChange(): void {
    this.loadCardTemplate();
  }

  /**
   * Load the selected card template from assets
   */
  loadCardTemplate(): void {
    this.http
      .get<AICardConfig>(this.selectedTemplate.path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cardConfig) => {
          this.cardJson = JSON.stringify(cardConfig, null, 2);
          // Don't auto-generate, wait for user to click Generate
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load card template:', err);
          this.cardJson = '{}';
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Generate card (start streaming or instant load)
   */
  generateCard(): void {
    if (!this.cardJson || this.cardJson.trim() === '{}') {
      return;
    }

    // Reset current card
    this.currentCard = null;

    // Configure streaming with user-controlled thinking delay
    // The thinking delay simulates waiting for LLM to start returning JSON
    this.streamingService.configure({
      tokensPerSecond: this.streamingSpeed,
      thinkingDelayMs: this.useStreaming ? this.thinkingDelay : 0,
    });

    // Start streaming
    this.streamingService.start(this.cardJson, {
      instant: !this.useStreaming,
    });
  }

  /**
   * Stop current generation
   */
  stopGeneration(): void {
    this.streamingService.stop();
  }

  /**
   * Get progress percentage for display
   */
  get progressPercent(): number {
    return Math.round((this.streamingState?.progress ?? 0) * 100);
  }

  /**
   * Get streaming stage label
   */
  get stageLabel(): string {
    switch (this.streamingState?.stage) {
      case 'thinking':
        return 'Thinking...';
      case 'streaming':
        return 'Streaming';
      case 'complete':
        return 'Complete';
      case 'aborted':
        return 'Aborted';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  }

  /**
   * Check if card renderer should be visible.
   * Show card when streaming is active (to show empty state animation) OR has content.
   */
  get showCardRenderer(): boolean {
    return this.isGenerating || this.hasCard;
  }

  /**
   * Check if card has content (sections).
   */
  get hasCard(): boolean {
    const hasSections =
      this.currentCard !== null &&
      this.currentCard.sections !== undefined &&
      this.currentCard.sections.length > 0;
    return hasSections;
  }

  /**
   * Get the card config to pass to renderer.
   * Returns current card or a placeholder during generation.
   */
  get cardConfigForRenderer(): AICardConfig {
    return this.currentCard ?? { cardTitle: 'Generating...', sections: [] };
  }

  /**
   * Get current theme normalized to 'day'/'night' format for component input
   */
  get cardTheme(): 'day' | 'night' {
    const theme = this.themeService.getResolvedTheme();
    // Normalize theme to 'day'/'night' format
    if (theme === 'light' || theme === 'day') {
      return 'day';
    }
    if (theme === 'dark' || theme === 'night') {
      return 'night';
    }
    // For custom themes, default to 'day'
    return 'day';
  }

  /**
   * Get environment by ID
   */
  getEnvironmentById(id: string): ClientEnvironment | undefined {
    return this.environments.find((env) => env.id === id);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): CardTemplate | undefined {
    return this.cardTemplates.find((t) => t.id === id);
  }
}
