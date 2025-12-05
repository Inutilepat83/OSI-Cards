/**
 * Collaboration Service
 *
 * Stub implementation for backward compatibility.
 * Apps should implement their own collaboration strategy.
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CollaborationState {
  activeUsers: number;
  isCollaborating: boolean;
}

export interface CardCollaborationState extends CollaborationState {
  cardId: string;
  editedBy?: string;
  conflictDetected?: boolean;
  collaborators?: any[];
  isBeingEdited?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CollaborationService {
  joinCard(cardId: string): void {
    console.warn('CollaborationService: Implement collaboration in your app');
  }

  leaveCard(cardId: string): void {
    console.warn('CollaborationService: Implement collaboration in your app');
  }

  getCardCollaborationState(cardId: string): Observable<CardCollaborationState> {
    return of({ cardId, activeUsers: 1, isCollaborating: false });
  }
}
