import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { cold, hot } from 'jasmine-marbles';

import { CardsEffects } from '../../store/cards/cards.effects';
import * as CardsActions from '../../store/cards/cards.state';
import { TestDataFactory } from '../testing-utilities';

// Mock HTTP service for cards
class MockCardsHttpService {
  loadCards() {
    return of(TestDataFactory.createCards(3));
  }

  createCard(card: any) {
    return of({ ...card, id: 'new-card-id' });
  }

  updateCard(id: string, card: any) {
    return of({ ...card, id });
  }

  deleteCard(id: string) {
    return of({ success: true });
  }

  searchCards(query: string) {
    return of(TestDataFactory.createCards(2));
  }
}

describe('CardsEffects', () => {
  let effects: CardsEffects;
  let actions$: Observable<Action>;
  let store: MockStore;
  let httpService: MockCardsHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CardsEffects,
        provideMockStore({}),
        provideMockActions(() => actions$),
        { provide: 'CardsHttpService', useClass: MockCardsHttpService }
      ]
    });

    effects = TestBed.inject(CardsEffects);
    store = TestBed.inject(MockStore);
    httpService = TestBed.inject('CardsHttpService') as MockCardsHttpService;
  });

  describe('loadCards$', () => {
    it('should dispatch loadCardsSuccess on successful load', () => {
      const cards = TestDataFactory.createCards(3);
      spyOn(httpService, 'loadCards').and.returnValue(of(cards));

      const action = CardsActions.loadCards();
      const completion = CardsActions.loadCardsSuccess({ cards });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.loadCards$).toBeObservable(expected);
    });

    it('should dispatch loadCardsFailure on error', () => {
      const error = new Error('Network error');
      spyOn(httpService, 'loadCards').and.returnValue(throwError(error));

      const action = CardsActions.loadCards();
      const completion = CardsActions.loadCardsFailure({ error: error.message });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.loadCards$).toBeObservable(expected);
    });
  });

  describe('createCard$', () => {
    it('should dispatch createCardSuccess on successful creation', () => {
      const cardData = TestDataFactory.createCard();
      const createdCard = { ...cardData, id: 'new-card-id' };
      spyOn(httpService, 'createCard').and.returnValue(of(createdCard));

      const action = CardsActions.createCard({ card: cardData });
      const completion = CardsActions.createCardSuccess({ card: createdCard });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.createCard$).toBeObservable(expected);
    });

    it('should dispatch createCardFailure on error', () => {
      const cardData = TestDataFactory.createCard();
      const error = new Error('Creation failed');
      spyOn(httpService, 'createCard').and.returnValue(throwError(error));

      const action = CardsActions.createCard({ card: cardData });
      const completion = CardsActions.createCardFailure({ error: error.message });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.createCard$).toBeObservable(expected);
    });
  });

  describe('updateCard$', () => {
    it('should dispatch updateCardSuccess on successful update', () => {
      const cardId = 'test-card-1';
      const cardData = TestDataFactory.createCard({ id: cardId });
      const updatedCard = { ...cardData, title: 'Updated Title' };
      spyOn(httpService, 'updateCard').and.returnValue(of(updatedCard));

      const action = CardsActions.updateCard({ id: cardId, changes: { title: 'Updated Title' } });
      const completion = CardsActions.updateCardSuccess({ card: updatedCard });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.updateCard$).toBeObservable(expected);
    });

    it('should dispatch updateCardFailure on error', () => {
      const cardId = 'test-card-1';
      const error = new Error('Update failed');
      spyOn(httpService, 'updateCard').and.returnValue(throwError(error));

      const action = CardsActions.updateCard({ id: cardId, changes: { title: 'Updated Title' } });
      const completion = CardsActions.updateCardFailure({ error: error.message });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.updateCard$).toBeObservable(expected);
    });
  });

  describe('deleteCard$', () => {
    it('should dispatch deleteCardSuccess on successful deletion', () => {
      const cardId = 'test-card-1';
      spyOn(httpService, 'deleteCard').and.returnValue(of({ success: true }));

      const action = CardsActions.deleteCard({ id: cardId });
      const completion = CardsActions.deleteCardSuccess({ id: cardId });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.deleteCard$).toBeObservable(expected);
    });

    it('should dispatch deleteCardFailure on error', () => {
      const cardId = 'test-card-1';
      const error = new Error('Deletion failed');
      spyOn(httpService, 'deleteCard').and.returnValue(throwError(error));

      const action = CardsActions.deleteCard({ id: cardId });
      const completion = CardsActions.deleteCardFailure({ error: error.message });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.deleteCard$).toBeObservable(expected);
    });
  });

  describe('searchCards$', () => {
    it('should dispatch searchCardsSuccess on successful search', () => {
      const query = 'test query';
      const searchResults = TestDataFactory.createCards(2);
      spyOn(httpService, 'searchCards').and.returnValue(of(searchResults));

      const action = CardsActions.searchCards({ query });
      const completion = CardsActions.searchCardsSuccess({ 
        query, 
        results: searchResults 
      });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.searchCards$).toBeObservable(expected);
    });

    it('should dispatch searchCardsFailure on error', () => {
      const query = 'test query';
      const error = new Error('Search failed');
      spyOn(httpService, 'searchCards').and.returnValue(throwError(error));

      const action = CardsActions.searchCards({ query });
      const completion = CardsActions.searchCardsFailure({ 
        query, 
        error: error.message 
      });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.searchCards$).toBeObservable(expected);
    });

    it('should debounce search actions', () => {
      const query1 = 'test';
      const query2 = 'test query';
      const searchResults = TestDataFactory.createCards(2);
      spyOn(httpService, 'searchCards').and.returnValue(of(searchResults));

      const action1 = CardsActions.searchCards({ query: query1 });
      const action2 = CardsActions.searchCards({ query: query2 });
      const completion = CardsActions.searchCardsSuccess({ 
        query: query2, 
        results: searchResults 
      });

      // Actions fired quickly should be debounced
      actions$ = hot('-a-b', { a: action1, b: action2 });
      const expected = cold('---c', { c: completion });

      expect(effects.searchCards$).toBeObservable(expected);
    });
  });

  describe('Performance Testing', () => {
    it('should handle high-frequency actions without memory leaks', () => {
      const cards = TestDataFactory.createCards(100);
      spyOn(httpService, 'loadCards').and.returnValue(of(cards));

      // Simulate rapid-fire load actions
      const actions = Array.from({ length: 50 }, () => CardsActions.loadCards());
      const actionStream = '-' + 'a'.repeat(50);
      const actionMap = actions.reduce((acc, action, index) => {
        acc[String.fromCharCode(97 + (index % 26))] = action;
        return acc;
      }, {} as any);

      actions$ = hot(actionStream, actionMap);

      // Should handle all actions without throwing
      expect(() => {
        effects.loadCards$.subscribe();
      }).not.toThrow();
    });

    it('should complete effects within reasonable time', (done) => {
      const cards = TestDataFactory.createCards(10);
      spyOn(httpService, 'loadCards').and.returnValue(of(cards));

      const action = CardsActions.loadCards();
      actions$ = of(action);

      const startTime = performance.now();
      
      effects.loadCards$.subscribe(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(100); // Should complete within 100ms
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      spyOn(httpService, 'loadCards').and.returnValue(throwError(timeoutError));

      const action = CardsActions.loadCards();
      const completion = CardsActions.loadCardsFailure({ 
        error: 'Request timeout' 
      });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.loadCards$).toBeObservable(expected);
    });

    it('should handle malformed API responses', () => {
      spyOn(httpService, 'loadCards').and.returnValue(of(null as any));

      const action = CardsActions.loadCards();
      const completion = CardsActions.loadCardsFailure({ 
        error: 'Invalid response format' 
      });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });

      expect(effects.loadCards$).toBeObservable(expected);
    });
  });

  describe('Side Effects', () => {
    it('should log successful operations', () => {
      spyOn(console, 'log');
      const cards = TestDataFactory.createCards(3);
      spyOn(httpService, 'loadCards').and.returnValue(of(cards));

      const action = CardsActions.loadCards();
      actions$ = of(action);

      effects.loadCards$.subscribe(() => {
        expect(console.log).toHaveBeenCalledWith(
          jasmine.stringMatching(/Cards loaded successfully/)
        );
      });
    });

    it('should log error operations', () => {
      spyOn(console, 'error');
      const error = new Error('Load failed');
      spyOn(httpService, 'loadCards').and.returnValue(throwError(error));

      const action = CardsActions.loadCards();
      actions$ = of(action);

      effects.loadCards$.subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          jasmine.stringMatching(/Cards load failed/),
          error
        );
      });
    });
  });
});
