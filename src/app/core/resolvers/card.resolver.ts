import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';
import { EnhancedCardService } from '../services/enhanced-card.service';
import { LoggingService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class CardResolver implements Resolve<AICardConfig | null> {
  constructor(
    private cardService: EnhancedCardService,
    private logger: LoggingService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<AICardConfig | null> {
    const cardId = route.paramMap.get('id');

    if (!cardId) {
      this.logger.warn('No card ID provided in route');
      return of(null);
    }

    return this.cardService.getCardById(cardId).pipe(
      catchError(error => {
        this.logger.error(`Failed to resolve card: ${cardId}`, error);
        return of(null);
      })
    );
  }
}
