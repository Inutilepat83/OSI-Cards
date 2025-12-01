import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { AICardConfig } from '../../models';
import { CardDataService } from '../services/card-data/card-data.service';

/**
 * Resolver to preload card data before route activation
 * Ensures card is available in component
 */
export const cardResolver: ResolveFn<AICardConfig | null> = (
  route
): Observable<AICardConfig | null> => {
  const cardDataService = inject(CardDataService);
  const cardId = route.params['id'];

  if (!cardId) {
    return new Observable((observer) => {
      observer.next(null);
      observer.complete();
    });
  }

  return cardDataService.getCardById(cardId);
};
