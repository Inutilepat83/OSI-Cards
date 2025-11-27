import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

/**
 * LLM Simulation Controls Component
 * Extracted from HomePageComponent for better separation of concerns
 * Handles LLM simulation start/stop controls
 */
@Component({
  selector: 'app-llm-simulation-controls',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="llm-simulation-controls">
      <button
        type="button"
        class="simulation-button"
        [class.active]="isSimulating"
        [class.disabled]="disabled"
        (click)="onToggleSimulation()"
        [disabled]="disabled"
        [attr.aria-pressed]="isSimulating"
        [attr.aria-label]="isSimulating ? 'Stop LLM simulation' : 'Simulate LLM generation'"
        [title]="isSimulating ? 'Stop simulation' : 'Simulate LLM generation (works with complete or incomplete JSON)'">
        <span class="spinner" *ngIf="isSimulating" aria-hidden="true"></span>
        <span>{{ isSimulating ? 'Stop Simulation' : 'Simulate LLM' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .llm-simulation-controls {
      display: flex;
      align-items: center;
    }

    .simulation-button {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: var(--card-background);
      color: var(--foreground);
      border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .simulation-button:hover:not(:disabled):not(.active) {
      background: color-mix(in srgb, var(--card-background) 95%, var(--foreground) 5%);
      border-color: color-mix(in srgb, var(--border) 80%, transparent);
    }

    .simulation-button.active {
      background: color-mix(in srgb, #ef4444 15%, transparent);
      color: #ef4444;
      border-color: color-mix(in srgb, #ef4444 40%, transparent);
    }

    .simulation-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid color-mix(in srgb, var(--foreground) 30%, transparent);
      border-top-color: var(--foreground);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LLMSimulationControlsComponent {
  @Input() isSimulating = false;
  @Input() disabled = false;
  @Output() simulationToggle = new EventEmitter<void>();

  onToggleSimulation(): void {
    if (!this.disabled) {
      this.simulationToggle.emit();
    }
  }
}








