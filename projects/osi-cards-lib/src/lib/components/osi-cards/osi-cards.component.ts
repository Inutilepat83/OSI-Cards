import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  ViewEncapsulation,
  inject,
  Optional
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig, CardAction, CardField, CardItem } from '../../models';
import { AICardRendererComponent, CardFieldInteractionEvent, StreamingStage } from '../ai-card-renderer/ai-card-renderer.component';
import { 
  DEFAULT_THEME, 
  ANIMATION_CONFIG, 
  AnimationConfig,
  isAnimationFeatureEnabled 
} from '../../providers/osi-cards.providers';

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
      class="osi-cards-root"
      [attr.data-theme]="effectiveTheme"
      [class.osi-cards-fullscreen]="fullscreen">
      <app-ai-card-renderer
        [cardConfig]="card"
        [isFullscreen]="fullscreen"
        [tiltEnabled]="tiltEnabled"
        [streamingStage]="streamingStage"
        [streamingProgress]="streamingProgress"
        [isStreaming]="isStreaming"
        [showLoadingByDefault]="showLoadingByDefault"
        [containerWidth]="containerWidth"
        [loadingMessages]="loadingMessages"
        [loadingTitle]="loadingTitle"
        (fieldInteraction)="onFieldInteraction($event)"
        (cardInteraction)="onCardInteraction($event)"
        (fullscreenToggle)="onFullscreenToggle($event)"
        (agentAction)="onAgentAction($event)"
        (questionAction)="onQuestionAction($event)"
        (export)="onExport()">
      </app-ai-card-renderer>
    </div>
  `,
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None // Uses AICardRenderer's Shadow DOM
})
export class OsiCardsComponent {
  // Inject configuration
  private readonly defaultThemeConfig = inject(DEFAULT_THEME, { optional: true });
  private readonly animationConfig = inject<AnimationConfig | null>(ANIMATION_CONFIG, { optional: true });

  // ========================================
  // CARD DATA INPUTS
  // ========================================

  /** The card configuration to render */
  @Input() card?: AICardConfig;

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
    context?: Record<string, unknown> 
  }>();

  /** Emitted for question-type actions */
  @Output() questionAction = new EventEmitter<{ 
    action: CardAction; 
    card: AICardConfig; 
    question?: string 
  }>();

  /** Emitted when export is requested */
  @Output() export = new EventEmitter<void>();

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  /** Effective theme (component input > provider config > default) */
  get effectiveTheme(): 'day' | 'night' {
    return this.theme ?? this.defaultThemeConfig ?? 'day';
  }

  /** Check if tilt should be enabled based on animation config */
  get shouldEnableTilt(): boolean {
    if (!this.tiltEnabled) return false;
    return isAnimationFeatureEnabled(this.animationConfig, 'tilt');
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
    context?: Record<string, unknown> 
  }): void {
    this.agentAction.emit(event);
  }

  onQuestionAction(event: { 
    action: CardAction; 
    card: AICardConfig; 
    question?: string 
  }): void {
    this.questionAction.emit(event);
  }

  onExport(): void {
    this.export.emit();
  }
}







