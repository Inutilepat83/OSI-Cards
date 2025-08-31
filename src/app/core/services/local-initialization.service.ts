import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AICardConfig } from '../../models/card.model';
import { LocalCardConfigurationService } from './local-card-configuration.service';

@Injectable({
  providedIn: 'root',
})
export class LocalInitializationService {
  constructor(private cardConfigService: LocalCardConfigurationService) {}

  initialize(): Observable<{
    success: boolean;
    initialCard: AICardConfig | null;
    warnings: string[];
  }> {
    // Try to load a demo template for initialization
    return this.cardConfigService.getTemplate('company', 1).pipe(
      map(template => ({
        success: true,
        initialCard: template,
        warnings: [],
      })),
      catchError(error => {
        console.warn('Failed to load demo template, using fallback:', error);
        
        // Fallback to hardcoded template if demo loading fails
        const fallbackCard: AICardConfig = {
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
          initialCard: fallbackCard,
          warnings: ['Could not load demo templates, using fallback'],
        });
      })
    );
  }
}
