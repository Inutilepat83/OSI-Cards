import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction } from '../../models';
import { LucideIconsModule } from '../../icons';
import { IconService } from '../../services/icon.service';

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
            (keydown.space)="$event.preventDefault(); onActionClick(action)">
            <!-- Lucide icon -->
            <lucide-icon 
              *ngIf="getActionIconNameForDisplay(action) as iconName"
              [name]="iconName"
              [size]="16"
              aria-hidden="true">
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
  styles: [`
    .card-footer {
      margin-top: auto;
      padding-top: var(--section-card-gap, 12px);
      padding-bottom: 16px;
    }
    
    .card-actions {
      margin-bottom: 8px;
    }
    
    .action-button {
      padding: 10px 20px;
      font-size: 0.875rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    
    .action-button--primary {
      background: var(--primary, #ff7900);
      color: var(--primary-foreground, #ffffff);
    }
    
    .action-button--primary:hover {
      background: color-mix(in srgb, var(--primary) 85%, transparent);
      border-color: var(--primary);
    }
    
    .action-button--secondary {
      background: var(--secondary, #f5f5f5);
      color: var(--secondary-foreground, #1a1a1a);
    }
    
    .action-button--secondary:hover {
      background: color-mix(in srgb, var(--secondary) 90%, transparent);
      border-color: var(--secondary);
    }
    
    .card-signature {
      font-size: 0.75rem;
      color: var(--muted-foreground, rgba(128, 128, 128, 0.6));
      text-align: center;
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  private readonly iconService = inject(IconService);

  get hasActions(): boolean {
    return this.actions && this.actions.length > 0;
  }

  trackAction(index: number, action: CardAction): string {
    return action.id || `${action.type}-${index}`;
  }

  getActionButtonClasses(action: CardAction): Record<string, boolean> {
    return {
      'action-button--primary': action.variant === 'primary',
      'action-button--secondary': action.variant === 'secondary' || !action.variant
    };
  }

  getActionIconNameForDisplay(action: CardAction): string | null {
    if (!action.icon) {
      return null;
    }

    // If it's a lucide icon name, return it
    if (typeof action.icon === 'string' && !action.icon.startsWith('http') && !action.icon.match(/[\u{1F300}-\u{1F9FF}]/u)) {
      return action.icon;
    }

    // If it's a URL or emoji, return null (handled by other icons)
    return null;
  }

  hasImageIcon(action: CardAction): boolean {
    return !!action.icon && typeof action.icon === 'string' && action.icon.startsWith('http');
  }

  hasTextIcon(action: CardAction): boolean {
    return !!action.icon && typeof action.icon === 'string' && 
           !action.icon.startsWith('http') && 
           (action.icon.match(/[\u{1F300}-\u{1F9FF}]/u) || action.icon.length <= 2);
  }

  onActionClick(action: CardAction): void {
    this.actionClick.emit(action);
  }
}

