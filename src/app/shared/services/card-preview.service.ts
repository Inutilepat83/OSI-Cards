import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AICardConfig } from '../../models';
import { CardChangeType } from '../utils/card-diff.util';

export interface CardPreviewState {
  card: AICardConfig | null;
  isGenerating: boolean;
  isInitialized: boolean;
  isFullscreen: boolean;
  changeType: CardChangeType;
  livePreviewCard: AICardConfig | null;
}

/**
 * Service for managing card preview state
 * Extracted from HomePageComponent for better separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class CardPreviewService {
  private readonly stateSubject = new BehaviorSubject<CardPreviewState>({
    card: null,
    isGenerating: false,
    isInitialized: false,
    isFullscreen: false,
    changeType: 'structural',
    livePreviewCard: null
  });

  readonly state$: Observable<CardPreviewState> = this.stateSubject.asObservable();

  /**
   * Get current preview state
   */
  getState(): CardPreviewState {
    return this.stateSubject.value;
  }

  /**
   * Update the preview card
   * @param card - The card to preview
   * @param changeType - The type of change
   */
  updateCard(card: AICardConfig | null, changeType: CardChangeType = 'content'): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      card,
      changeType
    });
  }

  /**
   * Update live preview card (for real-time editing)
   * @param card - The live preview card
   * @param changeType - The type of change
   */
  updateLivePreview(card: AICardConfig | null, changeType: CardChangeType = 'content'): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      livePreviewCard: card,
      changeType
    });
  }

  /**
   * Set generating state
   * @param isGenerating - Whether card is being generated
   */
  setGenerating(isGenerating: boolean): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      isGenerating
    });
  }

  /**
   * Set initialized state
   * @param isInitialized - Whether preview is initialized
   */
  setInitialized(isInitialized: boolean): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      isInitialized
    });
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      isFullscreen: !current.isFullscreen
    });
  }

  /**
   * Set fullscreen mode
   * @param isFullscreen - Whether to enable fullscreen
   */
  setFullscreen(isFullscreen: boolean): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      isFullscreen
    });
  }

  /**
   * Clear live preview
   */
  clearLivePreview(): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      livePreviewCard: null
    });
  }

  /**
   * Reset preview state
   */
  reset(): void {
    this.stateSubject.next({
      card: null,
      isGenerating: false,
      isInitialized: false,
      isFullscreen: false,
      changeType: 'structural',
      livePreviewCard: null
    });
  }
}



