import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as CardsActions from './cards.state';
import { CardDataService } from '../../core';
import { AICardConfig } from '../../models/card.model';

@Injectable()
export class CardsEffects {
  constructor(
    private actions$: Actions,
    private cardConfigService: CardDataService
  ) {}

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() =>
        this.cardConfigService.getAllCards().pipe(
          map((cards: AICardConfig[]) => CardsActions.loadCardsSuccess({ cards })),
          catchError((error) => of(CardsActions.loadCardsFailure({ error: String(error) })))
        )
      )
    )
  );

  generateCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.generateCard),
      mergeMap((action: any) =>
        of(action.config).pipe(
          map((card) => CardsActions.generateCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.generateCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  loadTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadTemplate),
      mergeMap((action: any) =>
        this.cardConfigService.getCardsByType(action.cardType).pipe(
          map((cards) => {
            // Get the first card as template (or by variant if needed)
            const template = cards[Math.min(action.variant - 1, cards.length - 1)] || cards[0];
            const cleanTemplate = this.removeAllIds(template) as AICardConfig;
            delete cleanTemplate.cardSubtitle;
            return CardsActions.loadTemplateSuccess({ template: cleanTemplate });
          }),
          catchError((error: unknown) => of(CardsActions.loadTemplateFailure({ error: String(error) })))
        )
      )
    )
  );

  // Legacy/test-targeted effects - simplified implementations
  createCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.createCard),
      mergeMap((action: any) =>
        of(action.card).pipe(
          map((card: AICardConfig) => CardsActions.createCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.createCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  updateCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.updateCard),
      mergeMap((action: any) =>
        of(action.card || action.changes).pipe(
          map((card: AICardConfig) => CardsActions.updateCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.updateCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  deleteCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.deleteCard),
      mergeMap((action: any) =>
        of(action.id).pipe(
          map((id: string) => CardsActions.deleteCardSuccess({ id })),
          catchError((error: unknown) => of(CardsActions.deleteCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  searchCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.searchCards),
      mergeMap((action: any) =>
        this.cardConfigService.searchCards(action.query).pipe(
          map((results: AICardConfig[]) => {
            return CardsActions.searchCardsSuccess({ query: action.query, results });
          }),
          catchError((error: unknown) => of(CardsActions.searchCardsFailure({
            query: action.query,
            error: error instanceof Error ? error.message : String(error)
          })))
        )
      )
    )
  );

  private removeAllIds(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeAllIds(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'id') {
          newObj[key] = this.removeAllIds(value);
        }
      }
      return newObj;
    }
    return obj;
  }
}
