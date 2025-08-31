import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';
import { EnhancedCardService } from '../services/enhanced-card.service';
import { LoggingService } from '../interfaces/services.interface';

@Injectable({
  providedIn: 'root',
})
export class CardsListResolver implements Resolve<AICardConfig[]> {
  constructor(
    private cardService: EnhancedCardService,
    private logger: LoggingService
  ) {}

  resolve(): Observable<AICardConfig[]> {
    return this.cardService.getAllCards().pipe(
      catchError(error => {
        this.logger.error('Failed to resolve cards list', error);
        return [];
      })
    );
  }
}
