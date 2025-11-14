import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import * as CardsActions from './cards.state';
import { CardDataService, PerformanceService } from '../../core';
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
  private readonly performanceService = inject(PerformanceService);

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() => {
        const startTime = performance.now();
        return this.cardConfigService.getAllCards().pipe(
          tap((cards: AICardConfig[]) => {
            const duration = performance.now() - startTime;
            const totalSize = JSON.stringify(cards).length;
            
            // Record performance metric
            this.performanceService.recordMetric('loadCards', duration, {
              cardCount: cards.length,
              totalSize,
              avgSize: totalSize / cards.length
            });

            // Dispatch performance tracking action
            this.performanceService.measure('loadCards', () => {
              // Metric already recorded above
            });
          }),
          map((cards: AICardConfig[]) => CardsActions.loadCardsSuccess({ cards })),
          catchError((error) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadCards', duration, { error: true });
            return of(CardsActions.loadCardsFailure({ error: String(error) }));
          })
        );
      })
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
      mergeMap(({ cardType, variant }: LoadTemplateAction) => {
        const startTime = performance.now();
        return this.cardConfigService.getCardsByType(cardType).pipe(
          map((cards) => {
            if (!cards.length) {
              const duration = performance.now() - startTime;
              this.performanceService.recordMetric('loadTemplate', duration, { 
                cardType, 
                variant, 
                error: 'no_cards_found' 
              });
              return CardsActions.loadTemplateFailure({ error: `No templates available for card type "${cardType}".` });
            }

            const templateStartTime = performance.now();
            const template = cards[Math.min(variant - 1, cards.length - 1)] ?? cards[0];
            const scrubbed = removeAllIds(template);
            const hydrated = ensureCardIds({ ...scrubbed });
            delete hydrated.cardSubtitle;
            
            const duration = performance.now() - startTime;
            const processingTime = performance.now() - templateStartTime;
            
            this.performanceService.recordMetric('loadTemplate', duration, {
              cardType,
              variant,
              cardSize: JSON.stringify(template).length,
              processingTime
            });

            return CardsActions.loadTemplateSuccess({ template: hydrated });
          }),
          catchError((error: unknown) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadTemplate', duration, { 
              cardType, 
              variant, 
              error: true 
            });
            return of(CardsActions.loadTemplateFailure({ error: String(error) }));
          })
        );
      })
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
      mergeMap(({ query }: SearchCardsAction) => {
        const startTime = performance.now();
        return this.cardConfigService.searchCards(query).pipe(
          map((results: AICardConfig[]) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('searchCards', duration, {
              query,
              resultCount: results.length
            });
            return CardsActions.searchCardsSuccess({ query, results });
          }),
          catchError((error: unknown) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('searchCards', duration, {
              query,
              error: true
            });
            return of(CardsActions.searchCardsFailure({
              query,
              error: error instanceof Error ? error.message : String(error)
            }));
          })
        );
      })
    )
  );
}
