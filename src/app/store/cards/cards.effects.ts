import { Injectable, Inject } from '@angular/core';
import { Action } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as CardsActions from './cards.actions';
import { LocalCardConfigurationService } from '../../core/services/local-card-configuration.service';
import { AICardConfig } from '../../models/card.model';

// Minimal typing for the test HTTP service used in unit tests
interface CardsHttpService {
  loadCards(): import('rxjs').Observable<AICardConfig[]>;
  createCard(card: any): import('rxjs').Observable<AICardConfig>;
  updateCard(id: string, changes: any): import('rxjs').Observable<AICardConfig>;
  deleteCard(id: string): import('rxjs').Observable<unknown>;
  searchCards(query: string): import('rxjs').Observable<AICardConfig[]>;
}

@Injectable()
export class CardsEffects {
  constructor(
    private actions$: Actions,
    private cardConfigService: LocalCardConfigurationService,
    @Inject('CardsHttpService') private cardsHttp: CardsHttpService
  ) {}

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() =>
        this.cardsHttp.loadCards().pipe(
          map((cards) => CardsActions.loadCardsSuccess({ cards })),
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
        this.cardConfigService.getTemplate(action.cardType, action.variant).pipe(
          map((template) => {
            const cleanTemplate = this.removeAllIds(template) as AICardConfig;
            delete cleanTemplate.cardSubtitle;
            return CardsActions.loadTemplateSuccess({ template: cleanTemplate });
          }),
          catchError((error: unknown) => of(CardsActions.loadTemplateFailure({ error: String(error) })))
        )
      )
    )
  );

  // Legacy/test-targeted effects
  createCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.createCard),
      mergeMap((action: any) =>
        this.cardsHttp.createCard(action.card).pipe(
          map((card) => CardsActions.createCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.createCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  updateCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.updateCard),
      mergeMap((action: any) =>
        this.cardsHttp.updateCard(action.id, action.changes).pipe(
          map((card) => CardsActions.updateCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.updateCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  deleteCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.deleteCard),
      mergeMap((action: any) =>
        this.cardsHttp.deleteCard(action.id).pipe(
          map(() => CardsActions.deleteCardSuccess({ id: action.id })),
          catchError((error: unknown) => of(CardsActions.deleteCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  searchCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.searchCards),
      mergeMap((action: any) =>
        this.cardsHttp.searchCards(action.query).pipe(
          map((results) => CardsActions.searchCardsSuccess({ query: action.query, results })),
          catchError((error: unknown) => of(CardsActions.searchCardsFailure({ query: action.query, error: error instanceof Error ? error.message : String(error) })))
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
