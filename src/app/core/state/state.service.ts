import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AICardConfig } from '../../models/card.model';

export interface AppState {
  cards: AICardConfig[];
  selectedCard: AICardConfig | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  cards: [],
  selectedCard: null,
  isLoading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private state$ = new BehaviorSubject<AppState>(initialState);

  // Selectors
  get state(): Observable<AppState> {
    return this.state$.asObservable();
  }

  get cards(): Observable<AICardConfig[]> {
    return new Observable(subscriber => {
      this.state$.subscribe(state => subscriber.next(state.cards));
    });
  }

  get selectedCard(): Observable<AICardConfig | null> {
    return new Observable(subscriber => {
      this.state$.subscribe(state => subscriber.next(state.selectedCard));
    });
  }

  get isLoading(): Observable<boolean> {
    return new Observable(subscriber => {
      this.state$.subscribe(state => subscriber.next(state.isLoading));
    });
  }

  get error(): Observable<string | null> {
    return new Observable(subscriber => {
      this.state$.subscribe(state => subscriber.next(state.error));
    });
  }

  // Actions
  setCards(cards: AICardConfig[]): void {
    this.updateState({ cards });
  }

  addCard(card: AICardConfig): void {
    const currentState = this.state$.value;
    this.updateState({
      cards: [...currentState.cards, card]
    });
  }

  updateCard(updatedCard: AICardConfig): void {
    const currentState = this.state$.value;
    const cards = currentState.cards.map(card =>
      card.id === updatedCard.id ? updatedCard : card
    );
    this.updateState({ cards });
  }

  deleteCard(cardId: string): void {
    const currentState = this.state$.value;
    const cards = currentState.cards.filter(card => card.id !== cardId);
    this.updateState({ cards });
  }

  selectCard(card: AICardConfig | null): void {
    this.updateState({ selectedCard: card });
  }

  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // Helper method to update state immutably
  private updateState(updates: Partial<AppState>): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      ...updates
    });
  }

  // Reset state to initial
  reset(): void {
    this.state$.next(initialState);
  }
}
