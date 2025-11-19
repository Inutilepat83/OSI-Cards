import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap, take, finalize } from 'rxjs/operators';
import { encode } from '@toon-format/toon';
import * as CardsActions from './cards.state';
import { CardDataService, PerformanceService } from '../../core';
import { AICardConfig, CardType } from '../../models/card.model';
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
  private readonly store = inject(Store);

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() => {
        const startTime = performance.now();
        let cardCount = 0;
        let totalSize = 0;
        
        // Use streaming API for progressive loading
        return this.cardConfigService.getAllCardsStreaming().pipe(
          // Dispatch incremental updates as cards load
          mergeMap((card: AICardConfig) => {
            cardCount++;
            const cardLoadTime = performance.now() - startTime;
            const cardSize = encode(card, { indent: 2, keyFolding: 'safe' }).length;
            totalSize += cardSize;
            
            // Record per-card metrics
            this.performanceService.recordMetric('loadCard', cardLoadTime, {
              cardId: card.id,
              cardIndex: cardCount,
              cardSize
            });
            
            // Dispatch incremental success for immediate UI update
            return of(CardsActions.loadCardIncremental({ card }));
          }),
          // Complete when all cards loaded
          finalize(() => {
            const totalDuration = performance.now() - startTime;
            this.performanceService.recordMetric('loadCards', totalDuration, {
              totalCards: cardCount,
              totalSize,
              avgSize: cardCount > 0 ? totalSize / cardCount : 0
            });
            // Dispatch completion action
            this.store.dispatch(CardsActions.loadCardsComplete());
          }),
          catchError((error) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadCards', duration, { 
              error: true,
              cardsLoaded: cardCount
            });
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
          map((card) => CardsActions.generateCardSuccess({ card, changeType: 'structural' })),
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
              cardSize: encode(template, { indent: 2, keyFolding: 'safe' }).length,
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

  loadFirstCardExample$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadFirstCardExample),
      mergeMap(() => {
        const startTime = performance.now();
        // Use streaming to get the first card quickly and then compute variant index
        return this.cardConfigService.getAllCardsStreaming().pipe(
          take(1),
          mergeMap((firstCard) => {
            const cardType = (firstCard.cardType || 'company') as CardType;
            // load other cards of same type to find index -> variant
            return this.cardConfigService.getCardsByType(cardType).pipe(
              take(1),
              map((cardsByType) => ({ firstCard, cardsByType }))
            );
          }),
          mergeMap(({ firstCard, cardsByType }) => {
            const scrubbed = removeAllIds(firstCard);
            const hydrated = ensureCardIds({ ...scrubbed });
            delete hydrated.cardSubtitle;

            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadFirstExample', duration, {
              cardType: firstCard.cardType,
              cardSize: encode(firstCard, { indent: 2, keyFolding: 'safe' }).length
            });

            const typeAction = CardsActions.setCardType({ cardType: (firstCard.cardType || 'company') as CardType });
            // compute variant index (1-based) from array position
            const variantIndex = Math.max(1, (cardsByType.findIndex(c => c.id === firstCard.id) + 1) || 1);
            const variantAction = CardsActions.setCardVariant({ variant: Math.min(Math.max(1, variantIndex), 3) });
            const successAction = CardsActions.loadTemplateSuccess({ template: hydrated });

            return of(typeAction, variantAction, successAction);
          }),
          catchError((error: unknown) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadFirstExample', duration, { error: true });
            return of(CardsActions.loadTemplateFailure({ error: error instanceof Error ? error.message : String(error) }));
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
