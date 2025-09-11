import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAction } from '../../../../models';

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="actions && actions.length > 0" class="card-footer">
      <button *ngFor="let action of actions; trackBy: trackByIndex"
              class="card-action-btn"
              [ngClass]="'btn-' + (action.variant || 'primary')"
              (click)="onActionClick(action.label)"
              [attr.aria-label]="action.label">
        <i *ngIf="action.icon" [class]="action.icon + ' action-icon'" aria-hidden="true"></i>
        <span>{{ action.label }}</span>
      </button>
    </div>
  `,
  styles: [`
    .card-footer {
      padding: 20px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .card-action-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF7900 0%, #ff9500 100%);
      color: #000000;
      box-shadow: 0 2px 8px rgba(255, 121, 0, 0.3);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #ff9500 0%, #FF7900 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 121, 0, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 121, 0, 0.1);
      color: #FF7900;
      border-color: rgba(255, 121, 0, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 121, 0, 0.2);
      border-color: #FF7900;
      color: #ffffff;
    }

    .btn-danger {
      background: linear-gradient(135deg, #d4183d 0%, #ef4444 100%);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(212, 24, 61, 0.3);
    }

    .btn-danger:hover {
      background: linear-gradient(135deg, #ef4444 0%, #d4183d 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(212, 24, 61, 0.4);
    }

    .card-action-btn:focus {
      outline: 2px solid #FF7900;
      outline-offset: 2px;
    }

    .action-icon {
      font-size: 0.875rem;
    }
  `]
})
export class CardFooterComponent {
  @Input() actions: CardAction[] = [];
  @Output() actionClick = new EventEmitter<string>();

  onActionClick(action: string): void {
    this.actionClick.emit(action);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
