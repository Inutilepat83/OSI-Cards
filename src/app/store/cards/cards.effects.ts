import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as CardsActions from './cards.state';
import { CardDataService } from '../../core';
import { AICardConfig } from '../../models/card.model';
import { ensureCardIds, removeAllIds } from '../../shared';

type GenerateCardAction = ReturnType<typeof CardsActions.generateCard>;
type LoadTemplateAction = ReturnType<typeof CardsActions.loadTemplate>;
type DeleteCardAction = ReturnType<typeof CardsActions.deleteCard>;
type SearchCardsAction = ReturnType<typeof CardsActions.searchCards>;

@Injectable()
export class CardsEffects {
  private readonly actions$ = inject(Actions);
  private readonly cardConfigService = inject(CardDataService);

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
      mergeMap(({ config }: GenerateCardAction) =>
        of(config).pipe(
          map((card) => CardsActions.generateCardSuccess({ card })),
          catchError((error: unknown) => of(CardsActions.generateCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  loadTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadTemplate),
      mergeMap(({ cardType, variant }: LoadTemplateAction) =>
        this.cardConfigService.getCardsByType(cardType).pipe(
          map((cards) => {
            if (!cards.length) {
              return CardsActions.loadTemplateFailure({ error: `No templates available for card type "${cardType}".` });
            }

            const template = cards[Math.min(variant - 1, cards.length - 1)] ?? cards[0];
            const scrubbed = removeAllIds(template);
            const hydrated = ensureCardIds({ ...scrubbed });
            delete hydrated.cardSubtitle;
            return CardsActions.loadTemplateSuccess({ template: hydrated });
          }),
          catchError((error: unknown) => of(CardsActions.loadTemplateFailure({ error: String(error) })))
        )
      )
    )
  );

  deleteCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.deleteCard),
      mergeMap(({ id }: DeleteCardAction) =>
        of(id).pipe(
          map((cardId: string) => CardsActions.deleteCardSuccess({ id: cardId })),
          catchError((error: unknown) => of(CardsActions.deleteCardFailure({ error: error instanceof Error ? error.message : String(error) })))
        )
      )
    )
  );

  searchCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.searchCards),
      mergeMap(({ query }: SearchCardsAction) =>
        this.cardConfigService.searchCards(query).pipe(
          map((results: AICardConfig[]) => {
            return CardsActions.searchCardsSuccess({ query, results });
          }),
          catchError((error: unknown) => of(CardsActions.searchCardsFailure({
            query,
            error: error instanceof Error ? error.message : String(error)
          })))
        )
      )
    )
  );
}
