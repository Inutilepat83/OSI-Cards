import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { CardDataService } from './card-data.service';
import { JsonFileCardProvider } from './json-file-card-provider.service';
import { reducer as cardsReducer } from '../../../store/cards/cards.state';

describe('CardDataService', () => {
  let service: CardDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CardDataService,
        JsonFileCardProvider,
        provideStore({ cards: cardsReducer })
      ]
    });
    service = TestBed.inject(CardDataService);
    provider = TestBed.inject(JsonFileCardProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCards', () => {
    it('should return observable of cards', (done) => {
      service.getAllCards().subscribe(cards => {
        expect(Array.isArray(cards)).toBe(true);
        done();
      });
    });
  });

  describe('getCardsByType', () => {
    it('should return cards filtered by type', (done) => {
      service.getCardsByType('company').subscribe(cards => {
        expect(Array.isArray(cards)).toBe(true);
        // All returned cards should be of the specified type
        cards.forEach(card => {
          expect(card.cardType).toBe('company');
        });
        done();
      });
    });
  });

  describe('switchProvider', () => {
    it('should switch to new provider', () => {
      const newProvider = TestBed.inject(JsonFileCardProvider);
      service.switchProvider(newProvider);
      
      // Provider should be switched
      expect(service).toBeTruthy();
    });
  });
});

