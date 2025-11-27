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
        [disabled]="disabled || isSimulating"
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
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--color-brand, #FF7900);
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .simulation-button:hover:not(:disabled):not(.active) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .simulation-button.active {
      background: #ef4444;
    }

    .simulation-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
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







