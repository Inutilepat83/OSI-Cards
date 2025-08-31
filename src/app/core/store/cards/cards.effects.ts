import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { LocalCardConfigurationService } from '../../services/local-card-configuration.service';
import * as CardsActions from '../cards/cards.actions';
import { AICardConfig } from '../../../models/card.model';

@Injectable()
export class CardsEffects {
  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() => {
        // For now, return sample cards - in real app this would come from a service
        const sampleCards: AICardConfig[] = [
          {
            id: '1',
            cardTitle: 'Sample Company Card',
            cardType: 'company',
            sections: [
              {
                id: 'overview',
                title: 'Company Overview',
                type: 'overview',
                fields: [
                  { id: 'revenue', label: 'Revenue', value: '$10M', valueColor: '#10b981' },
                  { id: 'employees', label: 'Employees', value: '150' },
                  { id: 'growth', label: 'Growth', value: '+25%' },
                ],
              },
            ],
          },
        ];
        return of(CardsActions.loadCardsSuccess({ cards: sampleCards }));
      })
    )
  );

  constructor(
    private actions$: Actions,
    private cardService: LocalCardConfigurationService
  ) {}
}
