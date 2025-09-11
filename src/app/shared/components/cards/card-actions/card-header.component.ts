import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-header">
      <div class="title-section">
        <h2 class="card-title">{{ cardConfig.cardTitle }}</h2>
        <p *ngIf="cardConfig.cardSubtitle" class="card-subtitle">{{ cardConfig.cardSubtitle }}</p>
      </div>

      <div class="card-actions">
        <button class="action-btn" (click)="toggleFullscreen()" aria-label="Toggle fullscreen">
          <i [ngClass]="isFullscreen ? 'minimize-icon' : 'maximize-icon'" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .card-subtitle {
      margin: 4px 0 0 0;
      color: #888888;
      font-size: 0.875rem;
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: rgba(255, 121, 0, 0.1);
      border: 1px solid rgba(255, 121, 0, 0.3);
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      color: #FF7900;
      transition: all 0.3s ease;
      font-style: normal;
    }

    .action-btn:hover {
      background: rgba(255, 121, 0, 0.2);
      border-color: #FF7900;
      color: #ffffff;
      transform: scale(1.05);
    }

    .action-btn:focus {
      outline: 2px solid #FF7900;
      outline-offset: 2px;
    }
  `]
})
export class CardHeaderComponent {
  @Input() cardConfig!: AICardConfig;
  @Input() isFullscreen = false;
  @Output() fullscreenToggle = new EventEmitter<boolean>();

  toggleFullscreen(): void {
    this.fullscreenToggle.emit(!this.isFullscreen);
  }
}
