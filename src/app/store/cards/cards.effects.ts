import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, Observable } from 'rxjs';
import { map, mergeMap, catchError, tap, take, finalize, withLatestFrom } from 'rxjs/operators';
import { Action } from '@ngrx/store';
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
        // Use lazy loading: get specific card by type and variant instead of loading all cards of that type
        // This now uses instant cache-first loading
        return this.cardConfigService.getCardByTypeAndVariant(cardType, variant).pipe(
          map((template) => {
            if (!template) {
              const duration = performance.now() - startTime;
              this.performanceService.recordMetric('loadTemplate', duration, { 
                cardType, 
                variant, 
                error: 'no_cards_found',
                lazyLoaded: true,
                cached: false
              });
              return CardsActions.loadTemplateFailure({ 
                error: `No templates available for card type "${cardType}" variant ${variant}. The JSON file may be missing or invalid.` 
              });
            }

            try {
              const templateStartTime = performance.now();
              const scrubbed = removeAllIds(template);
              const hydrated = ensureCardIds({ ...scrubbed });
              delete hydrated.cardSubtitle;
              delete hydrated.cardType;
              
              const duration = performance.now() - startTime;
              const processingTime = performance.now() - templateStartTime;
              const isCached = duration < 10; // If loaded in < 10ms, it was from cache
              
              this.performanceService.recordMetric('loadTemplate', duration, {
                cardType,
                variant,
                cardSize: JSON.stringify(template).length,
                processingTime,
                lazyLoaded: true,
                cached: isCached
              });

              return CardsActions.loadTemplateSuccess({ template: hydrated });
            } catch (processingError: unknown) {
              const errorMessage = processingError instanceof Error 
                ? processingError.message 
                : 'Failed to process template';
              const duration = performance.now() - startTime;
              this.performanceService.recordMetric('loadTemplate', duration, { 
                cardType, 
                variant, 
                error: 'processing_failed',
                lazyLoaded: true
              });
              return CardsActions.loadTemplateFailure({ 
                error: `Failed to process template: ${errorMessage}` 
              });
            }
          }),
          catchError((error: unknown) => {
            const duration = performance.now() - startTime;
            const errorMessage = error instanceof Error 
              ? error.message 
              : String(error);
            const statusCode = error && typeof error === 'object' && 'status' in error 
              ? (error as any).status 
              : null;
            
            this.performanceService.recordMetric('loadTemplate', duration, { 
              cardType, 
              variant, 
              error: true,
              errorMessage,
              statusCode,
              lazyLoaded: true
            });
            
            // Provide more helpful error messages
            let userFriendlyError = errorMessage;
            if (statusCode === 404) {
              userFriendlyError = `Template file not found for card type "${cardType}" variant ${variant}.`;
            } else if (statusCode === 0 || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
              userFriendlyError = `Network error: Unable to load template. Please check your connection.`;
            } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
              userFriendlyError = `Invalid JSON in template file: ${errorMessage}`;
            }
            
            return of(CardsActions.loadTemplateFailure({ error: userFriendlyError }));
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
        // Use lazy loading: get first card directly from manifest instead of loading all cards
        return this.cardConfigService.getFirstCard().pipe(
          mergeMap((firstCard: AICardConfig | null): Observable<Action> => {
            if (!firstCard) {
              const duration = performance.now() - startTime;
              this.performanceService.recordMetric('loadFirstExample', duration, { error: 'no_cards_available' });
              return of(CardsActions.loadTemplateFailure({ 
                error: 'No cards available. Please check that JSON files exist in the assets/configs directory.' 
              }));
            }
            
            try {
              const cardType = (firstCard.cardType || 'company') as CardType;
              
              // Get manifest entries for the same type to find variant index (without loading full cards)
              const provider = this.cardConfigService.getCurrentProvider();
              if (provider && 'getManifestEntriesByType' in provider && typeof provider.getManifestEntriesByType === 'function') {
                return (provider as any).getManifestEntriesByType(cardType).pipe(
                  map((manifestEntries: any[]): Action[] => {
                    const scrubbed = removeAllIds(firstCard);
                    const hydrated = ensureCardIds({ ...scrubbed });
                    delete hydrated.cardSubtitle;

                    const duration = performance.now() - startTime;
                    this.performanceService.recordMetric('loadFirstExample', duration, {
                      cardType: firstCard.cardType,
                      cardSize: JSON.stringify(firstCard).length,
                      lazyLoaded: true
                    });

                    const typeAction = CardsActions.setCardType({ cardType });
                    // Find variant index from manifest entries (1-based)
                    const variantIndex = Math.max(1, (manifestEntries.findIndex((e: any) => e.id === firstCard.id) + 1) || 1);
                    const variantAction = CardsActions.setCardVariant({ variant: Math.min(Math.max(1, variantIndex), 3) });
                    const successAction = CardsActions.loadTemplateSuccess({ template: hydrated });

                    return [typeAction, variantAction, successAction];
                  }),
                  mergeMap((actions: Action[]) => of(...actions)),
                  catchError((error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return of(CardsActions.loadTemplateFailure({ 
                      error: `Failed to load first card example: ${errorMessage}` 
                    }));
                  })
                );
              }
              
              // Fallback: if provider doesn't support manifest entries, use the old method
              return this.cardConfigService.getCardsByType(cardType).pipe(
                take(1),
                map((cardsByType: AICardConfig[]): Action[] => {
                  const scrubbed = removeAllIds(firstCard);
                  const hydrated = ensureCardIds({ ...scrubbed });
                  delete hydrated.cardSubtitle;

                  const duration = performance.now() - startTime;
                  this.performanceService.recordMetric('loadFirstExample', duration, {
                    cardType: firstCard.cardType,
                    cardSize: JSON.stringify(firstCard).length,
                    lazyLoaded: false
                  });

                  const typeAction = CardsActions.setCardType({ cardType });
                  const variantIndex = Math.max(1, (cardsByType.findIndex((c: AICardConfig) => c.id === firstCard.id) + 1) || 1);
                  const variantAction = CardsActions.setCardVariant({ variant: Math.min(Math.max(1, variantIndex), 3) });
                  const successAction = CardsActions.loadTemplateSuccess({ template: hydrated });

                  return [typeAction, variantAction, successAction];
                }),
                mergeMap((actions: Action[]) => of(...actions)),
                catchError((error: unknown) => {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  return of(CardsActions.loadTemplateFailure({ 
                    error: `Failed to load cards by type: ${errorMessage}` 
                  }));
                })
              );
            } catch (processingError: unknown) {
              const errorMessage = processingError instanceof Error 
                ? processingError.message 
                : 'Failed to process first card';
              return of(CardsActions.loadTemplateFailure({ 
                error: `Failed to process first card: ${errorMessage}` 
              }));
            }
          }),
          catchError((error: unknown): Observable<Action> => {
            const duration = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            const statusCode = error && typeof error === 'object' && 'status' in error 
              ? (error as any).status 
              : null;
            
            this.performanceService.recordMetric('loadFirstExample', duration, { 
              error: true,
              errorMessage,
              statusCode
            });
            
            // Provide more helpful error messages
            let userFriendlyError = errorMessage;
            if (statusCode === 404) {
              userFriendlyError = 'Manifest or card files not found. Please check that JSON files exist in assets/configs.';
            } else if (statusCode === 0 || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
              userFriendlyError = 'Network error: Unable to load cards. Please check your connection.';
            } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
              userFriendlyError = `Invalid JSON in card files: ${errorMessage}`;
            }
            
            return of(CardsActions.loadTemplateFailure({ error: userFriendlyError }));
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
