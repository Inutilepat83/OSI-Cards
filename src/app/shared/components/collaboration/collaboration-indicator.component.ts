/**
 * Collaboration Indicator Component
 *
 * Displays collaboration presence and activity indicators for cards.
 * Shows who's viewing/editing a card and recent activity.
 *
 * Features:
 * - Presence indicators (avatars/colors)
 * - Activity feed display
 * - Conflict warnings
 * - Real-time updates
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  CardCollaborationState,
  CollaborationService,
} from '../../../core/services/collaboration.service';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

@Component({
  selector: 'app-collaboration-indicator',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <div class="collaboration-indicator" *ngIf="collaborationState$ | async as state">
      <!-- Presence indicators -->
      <div
        class="presence-indicators"
        *ngIf="state.collaborators && state.collaborators.length > 0"
      >
        <div
          *ngFor="let collaborator of state.collaborators"
          class="presence-avatar"
          [title]="collaborator.name"
          [style.background-color]="collaborator.color"
        >
          <span class="presence-initial">{{ getInitial(collaborator.name) }}</span>
        </div>
        <span class="presence-count" *ngIf="state.collaborators && state.collaborators.length > 3">
          +{{ (state.collaborators.length || 0) - 3 }}
        </span>
      </div>

      <!-- Editing indicator -->
      <div class="editing-indicator" *ngIf="state.isBeingEdited && state.editedBy">
        <lucide-icon name="edit-3" size="14"></lucide-icon>
        <span>{{ state.editedBy }} is editing</span>
      </div>

      <!-- Conflict warning -->
      <div class="conflict-warning" *ngIf="state.conflictDetected">
        <lucide-icon name="alert-triangle" size="14"></lucide-icon>
        <span>Conflict detected</span>
      </div>
    </div>
  `,
  styles: [
    `
      .collaboration-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 8px);
        font-size: var(--text-sm, 0.875rem);
        color: var(--muted-foreground, #6b7280);
      }

      .presence-indicators {
        display: flex;
        align-items: center;
        gap: calc(var(--spacing-sm, 4px) * -1);
      }

      .presence-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--background, #ffffff);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        color: white;
        position: relative;
        z-index: 1;
      }

      .presence-avatar:not(:first-child) {
        margin-left: -8px;
      }

      .presence-initial {
        text-transform: uppercase;
      }

      .presence-count {
        margin-left: var(--spacing-xs, 2px);
        font-size: var(--text-xs, 0.75rem);
        color: var(--muted-foreground, #6b7280);
      }

      .editing-indicator,
      .conflict-warning {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 2px);
        padding: var(--spacing-xs, 2px) var(--spacing-sm, 4px);
        border-radius: var(--radius-sm, 4px);
        background: var(--muted, #f3f4f6);
      }

      .conflict-warning {
        background: var(--destructive, #ef4444);
        color: white;
      }

      .conflict-warning lucide-icon {
        color: white;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollaborationIndicatorComponent implements OnInit, OnDestroy {
  @Input() cardId!: string;
  @Input() showActivity = false;

  collaborationState$!: Observable<CardCollaborationState>;

  private readonly collaboration = inject(CollaborationService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.cardId) {
      console.warn('CollaborationIndicatorComponent: cardId is required');
      return;
    }

    // Join card to track presence
    this.collaboration.joinCard(this.cardId);

    // Get collaboration state
    this.collaborationState$ = this.collaboration.getCardCollaborationState(this.cardId);
  }

  ngOnDestroy(): void {
    // Leave card when component is destroyed
    if (this.cardId) {
      this.collaboration.leaveCard(this.cardId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
