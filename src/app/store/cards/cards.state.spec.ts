import { reducer, initialState } from './cards.state';
import { generateCardSuccess, loadTemplate, setCardType, clearError } from './cards.state';
import { CardBuilder } from '../../../testing/test-builders';
import { AICardConfig } from '../../../models';

describe('CardsState Reducer', () => {
  it('should return initial state', () => {
    const result = reducer(undefined, { type: 'UNKNOWN' } as any);
    expect(result).toEqual(initialState);
  });

  describe('generateCardSuccess', () => {
    it('should add card to state', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withId('card-1')
        .build();
      
      const action = generateCardSuccess({ card, changeType: 'structural' });
      const result = reducer(initialState, action);
      
      expect(result.ids).toContain('card-1');
      expect(result.entities['card-1']).toBeDefined();
    });

    it('should update existing card', () => {
      const card1 = CardBuilder.create()
        .withTitle('Card 1')
        .withId('card-1')
        .build();
      
      const card2 = CardBuilder.create()
        .withTitle('Card 1 Updated')
        .withId('card-1')
        .build();
      
      const state1 = reducer(initialState, generateCardSuccess({ card: card1, changeType: 'structural' }));
      const state2 = reducer(state1, generateCardSuccess({ card: card2, changeType: 'content' }));
      
      expect(state2.entities['card-1']?.cardTitle).toBe('Card 1 Updated');
    });
  });

  describe('setCardType', () => {
    it('should set card type', () => {
      const action = setCardType({ cardType: 'company' });
      const result = reducer(initialState, action);
      
      expect(result.selectedCardType).toBe('company');
    });
  });

  describe('loadTemplate', () => {
    it('should set loading state', () => {
      const action = loadTemplate({ cardType: 'company', variant: 1 });
      const result = reducer(initialState, action);
      
      expect(result.loading).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const stateWithError = {
        ...initialState,
        error: 'Test error'
      };
      
      const result = reducer(stateWithError, clearError());
      
      expect(result.error).toBeNull();
    });
  });
});















