import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons';

/**
 * Card Header Component
 * 
 * Composable component for rendering card header with title, subtitle, and optional actions.
 * Can be used independently or as part of the full card renderer.
 * 
 * @example
 * ```html
 * <app-card-header
 *   [title]="card.cardTitle"
 *   [subtitle]="card.cardSubtitle"
 *   [showFullscreenButton]="true"
 *   [isFullscreen]="false"
 *   (fullscreenToggle)="onFullscreenToggle($event)">
 * </app-card-header>
 * ```
 */
@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="card-header" *ngIf="title">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-foreground">
          {{ title }}
        </h1>
        <button
          *ngIf="showFullscreenButton"
          type="button"
          class="ai-card-fullscreen-btn"
          [attr.aria-label]="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          (click)="onFullscreenClick()">
          <lucide-icon 
            [name]="isFullscreen ? 'minimize-2' : 'maximize-2'" 
            [size]="16" 
            aria-hidden="true">
          </lucide-icon>
        </button>
      </div>
      
      <p *ngIf="subtitle" class="ai-card-subtitle">
        {{ subtitle }}
      </p>
    </div>
  `,
  styles: [`
    .card-header {
      width: 100%;
    }
    
    .ai-card-fullscreen-btn {
      padding: 8px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      color: var(--card-text-secondary);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ai-card-fullscreen-btn:hover {
      background: var(--hover-bg, rgba(255, 121, 0, 0.1));
      border-color: var(--color-brand);
      color: var(--color-brand);
    }
    
    .ai-card-subtitle {
      font-size: 0.875rem;
      color: var(--card-text-secondary, var(--muted-foreground));
      margin: 0 0 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardHeaderComponent {
  /** Card title */
  @Input() title?: string;
  
  /** Card subtitle */
  @Input() subtitle?: string;
  
  /** Whether to show fullscreen toggle button */
  @Input() showFullscreenButton = false;
  
  /** Current fullscreen state */
  @Input() isFullscreen = false;
  
  /** Emitted when fullscreen button is clicked */
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  onFullscreenClick(): void {
    this.fullscreenToggle.emit(!this.isFullscreen);
  }
}

