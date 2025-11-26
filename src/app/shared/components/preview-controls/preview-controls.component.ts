import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

/**
 * Preview Controls Component
 * Extracted from HomePageComponent for better separation of concerns
 * Handles preview-related controls (fullscreen, export, etc.)
 */
@Component({
  selector: 'app-preview-controls',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="preview-controls">
      <button
        type="button"
        class="control-button"
        (click)="onToggleFullscreen()"
        [attr.aria-label]="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        [title]="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
        <lucide-icon [name]="isFullscreen ? 'minimize-2' : 'maximize-2'" [size]="18"></lucide-icon>
        <span>{{ isFullscreen ? 'Exit' : 'Fullscreen' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .preview-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .control-button {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      color: var(--card-text-primary, #FFFFFF);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .control-button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--color-brand, #FF7900);
    }

    .control-button:active {
      transform: scale(0.98);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewControlsComponent {
  @Input() isFullscreen = false;
  @Output() toggleFullscreen = new EventEmitter<void>();

  onToggleFullscreen(): void {
    this.toggleFullscreen.emit();
  }
}






