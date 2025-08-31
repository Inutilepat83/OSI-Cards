import { Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AICardConfig } from '../../models/card.model';
import { DemoCardLoaderService } from './demo-card-loader.service';

@Injectable({
  providedIn: 'root',
})
export class LocalCardConfigurationService {
  private demoMode = true; // when true, load from demo assets

  constructor(private injector: Injector) {}

  /**
   * Retrieve a card template. Variant parameter is optional and used in demo mode.
   */
  getTemplate(cardType: string, variant: number = 1): Observable<AICardConfig> {
    console.log(`[LocalCardConfigurationService] getTemplate called: ${cardType}, variant: ${variant}, demoMode: ${this.demoMode}`);
    
    if (this.demoMode) {
      // Lazy-get the demo loader so unit tests that don't provide HttpClient won't fail
      const demoLoader = this.injector.get(DemoCardLoaderService, null as unknown as DemoCardLoaderService);
      if (demoLoader) {
        // Map cardType to demo asset id
        const cardTypeToId: { [key: string]: string } = {
          'company': 'dsm-company',
          'contact': 'monica-contact',
          'opportunity': 'enterprise-opp',
          'product': 'ics-product',
          'analytics': 'analytics-interest',
          'event': 'qbr-event'
        };
        const id = cardTypeToId[cardType.toLowerCase()] || cardType.toLowerCase().replace(/\s+/g, '-');
        console.log(`[LocalCardConfigurationService] Loading demo card: ${id}.variant${variant}.json`);
        return demoLoader.getCard(id, variant) as Observable<AICardConfig>;
      } else {
        console.warn('[LocalCardConfigurationService] Demo loader not available, falling back to hardcoded template');
      }
      // If no demo loader is available (tests or minimal DI), fall back to inline template
    }

    console.log(`[LocalCardConfigurationService] Using fallback template for: ${cardType}`);
    
    // Fallback sample template
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
              value: 'Sample Value',
            },
          ],
        },
      ],
    };

    return of(templateData);
  }

  saveCardConfiguration(): Observable<boolean> {
    // Save logic would go here
    return of(true);
  }
}
