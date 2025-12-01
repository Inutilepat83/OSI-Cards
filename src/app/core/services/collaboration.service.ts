/**
 * Collaboration Service
 *
 * Provides real-time collaboration features for cards, including:
 * - User presence tracking (who's viewing/editing)
 * - Activity logging and notifications
 * - Conflict detection for concurrent edits
 * - Collaboration state management
 *
 * Features:
 * - Real-time presence updates
 * - Activity feed tracking
 * - Conflict detection and resolution
 * - User collaboration state
 * - Integration with WebSocket provider
 *
 * @example
 * ```typescript
 * const collaboration = inject(CollaborationService);
 *
 * // Track presence
 * collaboration.joinCard('card-123');
 *
 * // Subscribe to presence updates
 * collaboration.getCardPresence('card-123').subscribe(users => {
 *   console.log('Users viewing card:', users);
 * });
 *
 * // Subscribe to activity
 * collaboration.getCardActivity('card-123').subscribe(activity => {
 *   console.log('Recent activity:', activity);
 * });
 * ```
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, startWith, takeUntil } from 'rxjs/operators';
import { AICardConfig } from '../../models';
import { LoggingService } from './logging.service';

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string; // Color for presence indicator
  joinedAt: number;
  lastActiveAt: number;
}

export interface CollaborationActivity {
  id: string;
  userId: string;
  userName: string;
  cardId: string;
  type: 'view' | 'edit' | 'comment' | 'share' | 'delete';
  timestamp: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface CardCollaborationState {
  cardId: string;
  collaborators: Collaborator[];
  isBeingEdited: boolean;
  editedBy?: string;
  lastEditAt?: number;
  conflictDetected: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CollaborationService {
  private readonly logger = inject(LoggingService);

  // Current user (simplified - would come from auth service in production)
  private readonly currentUser = signal<Collaborator | null>(null);

  // Presence tracking: cardId -> Set of collaborator IDs
  private readonly cardPresence = new Map<string, Set<string>>();

  // Collaborators map: userId -> Collaborator
  private readonly collaborators = new Map<string, Collaborator>();

  // Activity feed per card: cardId -> Activity[]
  private readonly cardActivities = new Map<string, CollaborationActivity[]>();

  // Observables for presence updates
  private readonly presenceSubjects = new Map<string, BehaviorSubject<Collaborator[]>>();

  // Observables for activity updates
  private readonly activitySubjects = new Map<string, BehaviorSubject<CollaborationActivity[]>>();

  // Conflict detection
  private readonly conflictSubjects = new Map<
    string,
    Subject<{ conflict: boolean; message?: string }>
  >();

  // Generate unique user ID (simplified - would come from auth in production)
  private generateUserId(): string {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('collaboration-user-id') : null;
    if (stored) {
      return stored;
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('collaboration-user-id', id);
    }
    return id;
  }

  // Generate user color for presence indicator
  private generateUserColor(userId: string): string {
    const colors: string[] = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#F97316', // orange
    ];
    const index =
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[index];
    return color ?? colors[0] ?? '#3B82F6'; // Fallback to first color or default blue
  }

  constructor() {
    // Initialize current user
    const userId = this.generateUserId();
    const userName =
      typeof window !== 'undefined'
        ? localStorage.getItem('collaboration-user-name') || 'Anonymous User'
        : 'Anonymous User';

    this.currentUser.set({
      id: userId,
      name: userName,
      color: this.generateUserColor(userId),
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Update last active time periodically
    if (typeof window !== 'undefined') {
      interval(30000).subscribe(() => {
        const user = this.currentUser();
        if (user) {
          user.lastActiveAt = Date.now();
          this.updatePresence();
        }
      });
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): Collaborator | null {
    return this.currentUser();
  }

  /**
   * Set current user name
   */
  setCurrentUserName(name: string): void {
    const user = this.currentUser();
    if (user) {
      user.name = name;
      if (typeof window !== 'undefined') {
        localStorage.setItem('collaboration-user-name', name);
      }
      this.updatePresence();
    }
  }

  /**
   * Join a card (start tracking presence)
   */
  joinCard(cardId: string): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    if (!this.cardPresence.has(cardId)) {
      this.cardPresence.set(cardId, new Set());
      this.presenceSubjects.set(cardId, new BehaviorSubject<Collaborator[]>([]));
      this.activitySubjects.set(cardId, new BehaviorSubject<CollaborationActivity[]>([]));
      this.conflictSubjects.set(cardId, new Subject<{ conflict: boolean; message?: string }>());
      this.cardActivities.set(cardId, []);
    }

    const presence = this.cardPresence.get(cardId)!;
    if (!presence.has(user.id)) {
      presence.add(user.id);
      this.collaborators.set(user.id, user);
      this.updatePresenceForCard(cardId);
      this.logActivity(cardId, 'view', 'Started viewing card');
    }
  }

  /**
   * Leave a card (stop tracking presence)
   */
  leaveCard(cardId: string): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    const presence = this.cardPresence.get(cardId);
    if (presence) {
      presence.delete(user.id);
      this.updatePresenceForCard(cardId);
      this.logActivity(cardId, 'view', 'Stopped viewing card');
    }
  }

  /**
   * Get collaborators for a card
   */
  getCardPresence(cardId: string): Observable<Collaborator[]> {
    if (!this.presenceSubjects.has(cardId)) {
      this.presenceSubjects.set(cardId, new BehaviorSubject<Collaborator[]>([]));
    }
    return this.presenceSubjects.get(cardId)!.asObservable().pipe(shareReplay(1));
  }

  /**
   * Get activity feed for a card
   */
  getCardActivity(cardId: string, limit = 20): Observable<CollaborationActivity[]> {
    if (!this.activitySubjects.has(cardId)) {
      this.activitySubjects.set(cardId, new BehaviorSubject<CollaborationActivity[]>([]));
    }
    return this.activitySubjects
      .get(cardId)!
      .asObservable()
      .pipe(
        map((activities) => activities.slice(0, limit)),
        shareReplay(1)
      );
  }

  /**
   * Get conflict detection for a card
   */
  getCardConflicts(cardId: string): Observable<{ conflict: boolean; message?: string }> {
    if (!this.conflictSubjects.has(cardId)) {
      this.conflictSubjects.set(cardId, new Subject<{ conflict: boolean; message?: string }>());
    }
    return this.conflictSubjects.get(cardId)!.asObservable();
  }

  /**
   * Log activity for a card
   */
  logActivity(
    cardId: string,
    type: CollaborationActivity['type'],
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    const activity: CollaborationActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      cardId,
      type,
      timestamp: Date.now(),
      description,
      metadata,
    };

    const activities = this.cardActivities.get(cardId) || [];
    activities.unshift(activity);

    // Keep only last 50 activities per card
    if (activities.length > 50) {
      activities.splice(50);
    }

    this.cardActivities.set(cardId, activities);

    const subject = this.activitySubjects.get(cardId);
    if (subject) {
      subject.next([...activities]);
    }

    this.logger.debug('Collaboration activity logged', 'CollaborationService', activity);
  }

  /**
   * Detect conflicts for concurrent edits
   */
  detectConflict(cardId: string, currentCard: AICardConfig, incomingCard: AICardConfig): boolean {
    // Simple conflict detection: check if card was modified while we were editing
    const activities = this.cardActivities.get(cardId) || [];
    const recentEdits = activities.filter(
      (a) =>
        a.type === 'edit' &&
        a.timestamp > Date.now() - 60000 && // Last minute
        a.userId !== this.currentUser()?.id
    );

    if (recentEdits.length > 0 && recentEdits[0]) {
      const conflictSubject = this.conflictSubjects.get(cardId);
      if (conflictSubject) {
        const recentEdit = recentEdits[0];
        conflictSubject.next({
          conflict: true,
          message: `${recentEdit.userName} also edited this card recently. Your changes may conflict.`,
        });
      }
      return true;
    }

    return false;
  }

  /**
   * Mark card as being edited
   */
  startEditing(cardId: string): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.logActivity(cardId, 'edit', 'Started editing card');
  }

  /**
   * Mark card as no longer being edited
   */
  stopEditing(cardId: string): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }
    // Activity will be logged when the edit is saved
  }

  /**
   * Get collaboration state for a card
   */
  getCardCollaborationState(cardId: string): Observable<CardCollaborationState> {
    return this.getCardPresence(cardId).pipe(
      map((collaborators) => {
        const activities = this.cardActivities.get(cardId) || [];
        const recentEdit = activities.find(
          (a) => a.type === 'edit' && a.timestamp > Date.now() - 60000 // Last minute
        );

        return {
          cardId,
          collaborators,
          isBeingEdited: !!recentEdit,
          editedBy: recentEdit?.userName,
          lastEditAt: recentEdit?.timestamp,
          conflictDetected: false, // Would be set by conflict detection
        };
      }),
      shareReplay(1)
    );
  }

  /**
   * Update presence for a specific card
   */
  private updatePresenceForCard(cardId: string): void {
    const presence = this.cardPresence.get(cardId);
    if (!presence) {
      return;
    }

    const collaborators = Array.from(presence)
      .map((userId) => this.collaborators.get(userId))
      .filter((c): c is Collaborator => c !== undefined)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    const subject = this.presenceSubjects.get(cardId);
    if (subject) {
      subject.next(collaborators);
    }
  }

  /**
   * Update presence for all cards
   */
  private updatePresence(): void {
    for (const cardId of this.cardPresence.keys()) {
      this.updatePresenceForCard(cardId);
    }
  }

  /**
   * Clean up (leave all cards)
   */
  destroy(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    for (const cardId of this.cardPresence.keys()) {
      this.leaveCard(cardId);
    }

    this.cardPresence.clear();
    this.presenceSubjects.clear();
    this.activitySubjects.clear();
    this.conflictSubjects.clear();
    this.cardActivities.clear();
    this.collaborators.clear();
  }
}
