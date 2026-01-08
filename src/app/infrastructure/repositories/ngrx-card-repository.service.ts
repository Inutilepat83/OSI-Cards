import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardRepository, Result } from '../../domain';
import { AICardConfig } from '../../models';
import { AppState } from '../../store/app.state';
import * as CardSelectors from '../../store/cards/cards.selectors';
import * as CardActions from '../../store/cards/cards.state';

/**
 * NgRx Card Repository
 *
 * Implements CardRepository using NgRx store.
 */
@Injectable({
  providedIn: 'root',
})
export class NgRxCardRepository implements CardRepository {
  constructor(private readonly store: Store<AppState>) {}

  findById(id: string): Promise<Result<AICardConfig, Error>> {
    return new Promise((resolve) => {
      this.store.select(CardSelectors.selectCardById(id)).subscribe((card) => {
        if (card) {
          resolve({ success: true, value: card });
        } else {
          resolve({ success: false, error: new Error(`Card with id ${id} not found`) });
        }
      });
    });
  }

  findAll(): Promise<Result<AICardConfig[], Error>> {
    return new Promise((resolve) => {
      this.store.select(CardSelectors.selectCards).subscribe((cards) => {
        resolve({ success: true, value: cards });
      });
    });
  }

  save(card: AICardConfig): Promise<Result<void, Error>> {
    return new Promise((resolve) => {
      this.store.dispatch(CardActions.upsertCard({ card }));
      resolve({ success: true, value: undefined });
    });
  }

  delete(id: string): Promise<Result<void, Error>> {
    return new Promise((resolve) => {
      this.store.dispatch(CardActions.deleteCard({ id }));
      resolve({ success: true, value: undefined });
    });
  }
}
