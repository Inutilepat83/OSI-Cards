import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AICardConfig } from '../../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class LocalCardConfigurationService {
  
  constructor() { }
  
  getTemplate(cardType: string, variant: number): Observable<AICardConfig> {
    // This would be replaced with actual template data
    const templateData: AICardConfig = {
      cardTitle: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card`,
      cardType: cardType as any,
      sections: [
        {
          title: 'Sample Section',
          type: 'info',
          fields: [
            {
              label: 'Sample Field',
              value: 'Sample Value'
            }
          ]
        }
      ]
    };
    
    return of(templateData);
  }
  
  saveCardConfiguration(config: AICardConfig): Observable<boolean> {
    // Save logic would go here
    return of(true);
  }
}
