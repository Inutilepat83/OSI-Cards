import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardAction } from '../../models';
import {
  AICardRendererComponent,
  CardFieldInteractionEvent,
  StreamingStage,
} from '../ai-card-renderer/ai-card-renderer.component';
import {
  OSI_THEME_CONFIG_TOKEN,
  OSI_ANIMATION_CONFIG,
  OSIAnimationConfig,
} from '../../providers/injection-tokens';

/**
 * OSI Cards Component
 *
 * Single entry point component for the OSI Cards library.
 * This component provides a simplified API for rendering AI cards with
 * full encapsulation and automatic style isolation.
 *
 * Features:
 * - Automatic Shadow DOM encapsulation
 * - Theme support (day/night)
 * - Streaming animation support
 * - Full event system
 * - Container width management
 *
 * @example
 * ```html
 * <osi-cards
 *   [card]="cardConfig"
 *   [theme]="'day'"
 *   (fieldClick)="onFieldClick($event)"
 *   (actionClick)="onActionClick($event)">
 * </osi-cards>
 * ```
 *
 * @example
 * With streaming:
 * ```html
 * <osi-cards
 *   [card]="streamingCard"
 *   [isStreaming]="true"
 *   [streamingStage]="'streaming'">
 * </osi-cards>
 * ```
 */
@Component({
  selector: 'osi-cards',
  standalone: true,
  imports: [CommonModule, AICardRendererComponent],
  template: `
    <div
      class="osi-cards-container osi-cards-root"
      [attr.data-theme]="effectiveTheme"
      [class.osi-cards-fullscreen]="fullscreen"
    >
      <app-ai-card-renderer
        [cardConfig]="card"
        [isFullscreen]="fullscreen"
        [tiltEnabled]="shouldEnableTilt"
        [streamingStage]="streamingStage"
        [streamingProgress]="streamingProgress ?? 0"
        [isStreaming]="isStreaming"
        [showLoadingByDefault]="showLoadingByDefault"
        [containerWidth]="containerWidth ?? 0"
        [loadingMessages]="loadingMessages ?? []"
        [loadingTitle]="loadingTitle"
        (fieldInteraction)="onFieldInteraction($event)"
        (cardInteraction)="onCardInteraction($event)"
        (fullscreenToggle)="onFullscreenToggle($event)"
        (agentAction)="onAgentAction($event)"
        (questionAction)="onQuestionAction($event)"
        (export)="onExport()"
      >
      </app-ai-card-renderer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .osi-cards-root {
        width: 100%;
        min-height: 200px;
      }

      .osi-cards-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-modal, 500);
        background: var(--background, #ffffff);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Uses AICardRenderer's Shadow DOM
})
export class OsiCardsComponent {
  // Inject configuration
  private readonly defaultThemeConfig = inject(OSI_THEME_CONFIG_TOKEN, { optional: true });
  private readonly animationConfig = inject<OSIAnimationConfig | null>(OSI_ANIMATION_CONFIG, {
    optional: true,
  });

  constructor() {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'osi-cards.component.ts:114',
        message: 'OsiCardsComponent constructor',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'card-debug',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
  }

  // ========================================
  // CARD DATA INPUTS
  // ========================================

  /** The card configuration to render */
  @Input() set card(value: AICardConfig | undefined) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'osi-cards.component.ts:126',
        message: 'Card input set',
        data: {
          hasCard: !!value,
          hasSections: !!value?.sections,
          sectionsCount: value?.sections?.length || 0,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'card-debug',
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion
    this._card = value;
  }
  get card(): AICardConfig | undefined {
    return this._card;
  }
  private _card?: AICardConfig;

  // ========================================
  // DISPLAY INPUTS
  // ========================================

  /** Theme to apply ('day' or 'night') */
  @Input() theme?: 'day' | 'night';

  /** Whether to display in fullscreen mode */
  @Input() fullscreen = false;

  /** Enable 3D tilt effect on hover */
  @Input() tiltEnabled = true;

  /** Explicit container width for layout calculations */
  @Input() containerWidth?: number;

  // ========================================
  // STREAMING INPUTS
  // ========================================

  /** Current streaming stage */
  @Input() streamingStage?: StreamingStage;

  /** Streaming progress (0-1) */
  @Input() streamingProgress?: number;

  /** Whether streaming is active */
  @Input() isStreaming = false;

  /** Show loading state when no card data */
  @Input() showLoadingByDefault = true;

  /** Custom loading messages */
  @Input() loadingMessages?: string[];

  /** Custom loading title */
  @Input() loadingTitle = 'Creating OSI Card';

  // ========================================
  // OUTPUTS
  // ========================================

  /** Emitted when a field is clicked */
  @Output() fieldClick = new EventEmitter<CardFieldInteractionEvent>();

  /** Emitted when an action button is clicked */
  @Output() actionClick = new EventEmitter<{ action: string; card: AICardConfig }>();

  /** Emitted when fullscreen is toggled */
  @Output() fullscreenChange = new EventEmitter<boolean>();

  /** Emitted for agent-type actions */
  @Output() agentAction = new EventEmitter<{
    action: CardAction;
    card: AICardConfig;
    agentId?: string;
    context?: Record<string, unknown>;
  }>();

  /** Emitted for question-type actions */
  @Output() questionAction = new EventEmitter<{
    action: CardAction;
    card: AICardConfig;
    question?: string;
  }>();

  /** Emitted when export is requested */
  @Output() export = new EventEmitter<void>();

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  /** Effective theme (component input > provider config > default) */
  get effectiveTheme(): 'day' | 'night' {
    if (this.theme) return this.theme;
    const configTheme = this.defaultThemeConfig?.defaultTheme;
    if (configTheme === 'day' || configTheme === 'night') return configTheme;
    if (configTheme === 'dark') return 'night';
    return 'day';
  }

  /** Check if tilt should be enabled based on animation config */
  get shouldEnableTilt(): boolean {
    if (!this.tiltEnabled) return false;
    // Check animation config for tilt feature
    if (!this.animationConfig) return true;
    return this.animationConfig.enabled !== false;
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  onFieldInteraction(event: CardFieldInteractionEvent): void {
    this.fieldClick.emit(event);
  }

  onCardInteraction(event: { action: string; card: AICardConfig }): void {
    this.actionClick.emit(event);
  }

  onFullscreenToggle(isFullscreen: boolean): void {
    this.fullscreen = isFullscreen;
    this.fullscreenChange.emit(isFullscreen);
  }

  onAgentAction(event: {
    action: CardAction;
    card: AICardConfig;
    agentId?: string;
    context?: Record<string, unknown>;
  }): void {
    this.agentAction.emit(event);
  }

  onQuestionAction(event: { action: CardAction; card: AICardConfig; question?: string }): void {
    this.questionAction.emit(event);
  }

  onExport(): void {
    this.export.emit();
  }
}
