import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap, take, finalize, withLatestFrom } from 'rxjs/operators';
import * as CardsActions from './cards.state';
import { CardDataService, PerformanceService } from '../../core';
import { AICardConfig, CardType } from '../../models/card.model';
import { ensureCardIds, removeAllIds } from '../../shared';
import { OptimisticUpdatesService } from '../../shared/services/optimistic-updates.service';
import * as CardsSelectors from './cards.selectors';

type GenerateCardAction = ReturnType<typeof CardsActions.generateCard>;
type LoadTemplateAction = ReturnType<typeof CardsActions.loadTemplate>;
type DeleteCardAction = ReturnType<typeof CardsActions.deleteCard>;
type SearchCardsAction = ReturnType<typeof CardsActions.searchCards>;
type UpdateCardAction = ReturnType<typeof CardsActions.updateCard>;

@Injectable()
export class CardsEffects {
  private readonly actions$ = inject(Actions);
  private readonly cardConfigService = inject(CardDataService);
  private readonly performanceService = inject(PerformanceService);
  private readonly store = inject(Store);
  private readonly optimisticUpdates = inject(OptimisticUpdatesService);

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() => {
        const startTime = performance.now();
        
        return this.cardConfigService.getAllCards().pipe(
          map((cards: AICardConfig[]) => {
            const totalDuration = performance.now() - startTime;
            const totalSize = cards.reduce((sum, card) => sum + JSON.stringify(card).length, 0);
            
            this.performanceService.recordMetric('loadCards', totalDuration, {
              totalCards: cards.length,
              totalSize,
              avgSize: cards.length > 0 ? totalSize / cards.length : 0
            });
            
            // Dispatch all cards at once
            return CardsActions.loadCardsSuccess({ cards });
          }),
          catchError((error) => {
            const duration = performance.now() - startTime;
            this.performanceService.recordMetric('loadCards', duration, { 
              error: true
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

  loadFirstCardExample$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadFirstCardExample),
      mergeMap(() => {
        const startTime = performance.now();
        // Get all cards and use the first one
        return this.cardConfigService.getAllCards().pipe(
          take(1),
          mergeMap((cards: AICardConfig[]) => {
            if (!cards || cards.length === 0) {
              return of(CardsActions.loadTemplateFailure({ error: 'No cards available' }));
            }
            
            const firstCard = cards[0];
            const cardType = (firstCard.cardType || 'company') as CardType;
            
            // Load other cards of same type to find index -> variant
            return this.cardConfigService.getCardsByType(cardType).pipe(
              take(1),
              map((cardsByType: AICardConfig[]) => {
                const scrubbed = removeAllIds(firstCard);
                const hydrated = ensureCardIds({ ...scrubbed });
                delete hydrated.cardSubtitle;

                const duration = performance.now() - startTime;
                this.performanceService.recordMetric('loadFirstExample', duration, {
                  cardType: firstCard.cardType,
                  cardSize: JSON.stringify(firstCard).length
                });

                const typeAction = CardsActions.setCardType({ cardType: (firstCard.cardType || 'company') as CardType });
                // compute variant index (1-based) from array position
                const variantIndex = Math.max(1, (cardsByType.findIndex((c: AICardConfig) => c.id === firstCard.id) + 1) || 1);
                const variantAction = CardsActions.setCardVariant({ variant: Math.min(Math.max(1, variantIndex), 3) });
                const successAction = CardsActions.loadTemplateSuccess({ template: hydrated });

                return { typeAction, variantAction, successAction };
              }),
              mergeMap(({ typeAction, variantAction, successAction }) => 
                of(typeAction, variantAction, successAction)
              )
            );
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

  /**
   * Update card with optimistic updates
   * Shows UI changes immediately, then confirms or reverts based on server response
   */
  updateCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.updateCard),
      withLatestFrom(this.store.select(CardsSelectors.selectCards)),
      mergeMap(([{ id, changes }, cards]: [UpdateCardAction, AICardConfig[]]) => {
        const originalCard = cards.find(c => c.id === id);
        if (!originalCard) {
          return of(CardsActions.updateCardFailure({ id, error: 'Card not found' }));
        }

        const optimisticCard = { ...originalCard, ...changes };
        
        // Apply optimistic update
        this.optimisticUpdates.applyUpdate(id, optimisticCard, originalCard, {
          maxRetries: 3,
          conflictResolver: {
            resolve: (serverValue, optimisticValue) => {
              // Merge strategy: prefer optimistic changes for user experience
              return { ...serverValue, ...changes };
            },
            description: 'Merge optimistic changes with server value'
          }
        });

        // Dispatch optimistic update to store immediately
        const optimisticAction = CardsActions.updateCardOptimistic({ id, changes });

        // Simulate API call (in real app, this would be an HTTP request)
        // For now, we'll use a timeout to simulate network delay
        return of(null).pipe(
          mergeMap(() => {
            // Simulate successful update
            // In real implementation, this would be: return this.cardDataService.updateCard(id, changes)
            return of(CardsActions.updateCardSuccess({ id, card: optimisticCard }));
          }),
          catchError((error: unknown) => {
            // Revert optimistic update on failure
            this.optimisticUpdates.revertUpdate(id, error);
            return of(CardsActions.updateCardFailure({
              id,
              error: error instanceof Error ? error.message : String(error)
            }));
          }),
          // Emit optimistic action first, then success/failure
          mergeMap((result) => [optimisticAction, result])
        );
      })
    )
  );
}
