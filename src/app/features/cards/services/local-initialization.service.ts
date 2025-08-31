import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AICardConfig } from '../../../models/card.model';

@Injectable({
  providedIn: 'root',
})
export class LocalInitializationService {
  constructor() {}

  initialize(): Observable<{
    success: boolean;
    initialCard: AICardConfig | null;
    warnings: string[];
  }> {
    // This would contain actual initialization logic
    const initialCard: AICardConfig = {
      cardTitle: 'Company Card',
      cardType: 'company',
      sections: [
        {
          title: 'Overview',
          type: 'overview',
          fields: [
            {
              label: 'Company Name',
              value: 'Acme Corporation',
            },
            {
              label: 'Industry',
              value: 'Technology',
            },
          ],
        },
      ],
    };

    return of({
      success: true,
      initialCard: initialCard,
      warnings: [],
    });
  }
}
