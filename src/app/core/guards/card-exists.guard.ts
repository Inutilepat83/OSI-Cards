import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CardDataService } from '../services/card-data/card-data.service';

/**
 * Guard to ensure a card exists before navigating to its detail page
 * Redirects to home if card not found
 */
export const cardExistsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): Observable<boolean> => {
  const cardDataService = inject(CardDataService);
  const router = inject(Router);
  const cardId = route.params.id;

  if (!cardId) {
    router.navigate(['/']);
    return of(false);
  }

  return cardDataService.getCardById(cardId).pipe(
    map((card) => {
      if (!card) {
        router.navigate(['/']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    })
  );
};
