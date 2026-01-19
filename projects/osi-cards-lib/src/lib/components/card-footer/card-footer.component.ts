import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideIconsModule } from '@osi-cards/icons';
import { CardAction } from '@osi-cards/models';

/**
 * Card Footer Component
 *
 * Composable component for rendering card footer with actions and optional signature.
 * Can be used independently or as part of the full card renderer.
 *
 * @example
 * ```html
 * <app-card-footer
 *   [actions]="card.actions"
 *   [showSignature]="true"
 *   (actionClick)="onActionClick($event)">
 * </app-card-footer>
 * ```
 */
@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="card-footer" *ngIf="hasActions || showSignature">
      <!-- Action Buttons -->
      <div *ngIf="hasActions" class="card-actions">
        <div class="flex flex-wrap items-center gap-3" style="margin-left: 4px; margin-right: 4px;">
          <button
            *ngFor="let action of actions; trackBy: trackAction"
            type="button"
            class="action-button"
            [ngClass]="getActionButtonClasses(action)"
            [style.border-radius]="'var(--section-card-border-radius, 10px)'"
            (click)="onActionClick(action)"
            (keydown.enter)="onActionClick(action)"
            (keydown.space)="$event.preventDefault(); onActionClick(action)"
          >
            <!-- Lucide icon -->
            <lucide-icon
              *ngIf="getActionIconNameForDisplay(action) as iconName"
              [name]="iconName"
              [size]="16"
              aria-hidden="true"
            >
            </lucide-icon>
            <!-- Image icon -->
            <img
              *ngIf="hasImageIcon(action)"
              [src]="action.icon"
              [alt]="action.label + ' icon'"
              style="width: 16px; height: 16px;"
              aria-hidden="true"
            />
            <!-- Text icon -->
            <span *ngIf="hasTextIcon(action)" aria-hidden="true">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- Signature -->
      <div *ngIf="showSignature" class="card-signature">
        {{ signatureText }}
      </div>
    </div>
  `,
  styles: [
    `
      /* Reset host styles */
      :host {
        display: block !important;
        font-family:
          Helvetica,
          'Helvetica Neue',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Arial,
          sans-serif !important;
      }

      .card-footer {
        margin-top: auto !important;
        padding-top: calc(var(--section-card-gap, 8px) + 4px) !important;
        padding-bottom: 20px !important;
        font-family: inherit !important;
      }

      .card-actions {
        margin-bottom: 12px !important;
      }

      .flex {
        display: flex !important;
      }

      .flex-wrap {
        flex-wrap: wrap !important;
      }

      .items-center {
        align-items: center !important;
      }

      .gap-3 {
        gap: 0.75rem !important;
      }

      /* ENFORCED Action Button Styles */
      .action-button {
        margin: 0 !important;
        padding: 10px 20px !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        font-size: 0.875rem !important;
        font-weight: 600 !important;
        font-family:
          Helvetica,
          'Helvetica Neue',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Arial,
          sans-serif !important;
        line-height: 1.25rem !important;
        cursor: pointer !important;
        border-radius: var(--section-card-border-radius, 10px) !important;
        transition: all 0.2s ease !important;
        box-sizing: border-box !important;
        white-space: nowrap !important;
        -webkit-appearance: none !important;
        appearance: none !important;
        text-decoration: none !important;
      }

      .action-button--primary {
        background-color: var(--color-brand, #ff7900) !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: 0 2px 4px rgba(255, 121, 0, 0.2) !important;
      }

      .action-button--primary:hover {
        background-color: #e66d00 !important;
        box-shadow: 0 4px 12px rgba(255, 121, 0, 0.35) !important;
        transform: translateY(-1px) !important;
      }

      .action-button--secondary {
        background-color: transparent !important;
        color: var(--color-brand, #ff7900) !important;
        border: 2px solid var(--color-brand, #ff7900) !important;
      }

      .action-button--secondary:hover {
        background-color: rgba(255, 121, 0, 0.08) !important;
        box-shadow: 0 2px 8px rgba(255, 121, 0, 0.15) !important;
      }

      .action-button span {
        color: inherit !important;
        font-family: inherit !important;
      }

      .action-button img {
        width: 18px !important;
        height: 18px !important;
        object-fit: contain !important;
      }

      /* ENFORCED Card Signature Styles */
      .card-signature {
        display: block !important;
        margin: 12px 0 0 0 !important;
        padding: 8px 0 !important;
        font-size: 0.75rem !important;
        font-weight: 500 !important;
        color: var(--muted-foreground, rgba(85, 88, 97, 0.6)) !important;
        text-align: center !important;
        font-family:
          Helvetica,
          'Helvetica Neue',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Arial,
          sans-serif !important;
        line-height: 1.4 !important;
        letter-spacing: 0.02em !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Lucide icon styling */
      lucide-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      lucide-icon svg {
        stroke: currentColor !important;
        fill: none !important;
        stroke-width: 2 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFooterComponent {
  /** Actions to display */
  @Input() actions: CardAction[] = [];

  /** Whether to show the signature */
  @Input() showSignature = true;

  /** Signature text to display */
  @Input() signatureText = 'Powered by Orange Sales Intelligence';

  /** Emitted when an action is clicked */
  @Output() actionClick = new EventEmitter<CardAction>();

  // IconService available for future use
  // private readonly iconService = inject(IconService);

  get hasActions(): boolean {
    return this.actions && this.actions.length > 0;
  }

  trackAction(index: number, action: CardAction): string {
    return action.id || `${action.type}-${index}`;
  }

  getActionButtonClasses(action: CardAction): Record<string, boolean> {
    return {
      'action-button--primary': action.variant === 'primary',
      'action-button--secondary': action.variant === 'secondary' || !action.variant,
    };
  }

  getActionIconNameForDisplay(action: CardAction): string | null {
    if (!action.icon) {
      return null;
    }

    // If it's a lucide icon name, return it
    if (
      typeof action.icon === 'string' &&
      !action.icon.startsWith('http') &&
      !action.icon.match(/[\u{1F300}-\u{1F9FF}]/u)
    ) {
      return action.icon;
    }

    // If it's a URL or emoji, return null (handled by other icons)
    return null;
  }

  hasImageIcon(action: CardAction): boolean {
    return !!action.icon && typeof action.icon === 'string' && action.icon.startsWith('http');
  }

  hasTextIcon(action: CardAction): boolean {
    if (!action.icon || typeof action.icon !== 'string' || action.icon.startsWith('http')) {
      return false;
    }
    const emojiMatch = action.icon.match(/[\u{1F300}-\u{1F9FF}]/u);
    return !!emojiMatch || action.icon.length <= 2;
  }

  onActionClick(action: CardAction): void {
    this.actionClick.emit(action);
  }
}
