import { CardStateEngine, createCardStateEngine, CardData } from './card-state-engine';

describe('CardStateEngine', () => {
  let engine: CardStateEngine;

  const mockCard: CardData = {
    id: 'card-1',
    title: 'Test Card',
    sections: [
      { id: 'section-1', type: 'info', fields: [{ label: 'Name', value: 'Test' }] },
    ],
  };

  beforeEach(() => {
    engine = createCardStateEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('addCard', () => {
    it('should add a card', () => {
      engine.addCard(mockCard);
      expect(engine.getCount()).toBe(1);
      expect(engine.getCard('card-1')).toBeDefined();
    });

    it('should generate ID if not provided', () => {
      const cardWithoutId = { ...mockCard, id: '' };
      engine.addCard(cardWithoutId);
      const cards = engine.getCards();
      expect(cards[0].id).toBeTruthy();
    });

    it('should add timestamps', () => {
      engine.addCard(mockCard);
      const card = engine.getCard('card-1');
      expect(card?.createdAt).toBeDefined();
      expect(card?.updatedAt).toBeDefined();
    });
  });

  describe('updateCard', () => {
    it('should update an existing card', () => {
      engine.addCard(mockCard);
      const result = engine.updateCard('card-1', { title: 'Updated Title' });
      expect(result).toBe(true);
      expect(engine.getCard('card-1')?.title).toBe('Updated Title');
    });

    it('should return false for non-existent card', () => {
      const result = engine.updateCard('non-existent', { title: 'New' });
      expect(result).toBe(false);
    });
  });

  describe('removeCard', () => {
    it('should remove an existing card', () => {
      engine.addCard(mockCard);
      const result = engine.removeCard('card-1');
      expect(result).toBe(true);
      expect(engine.getCount()).toBe(0);
    });

    it('should return false for non-existent card', () => {
      const result = engine.removeCard('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('undo/redo', () => {
    it('should undo last action', () => {
      engine.addCard(mockCard);
      expect(engine.getCount()).toBe(1);

      engine.undo();
      expect(engine.getCount()).toBe(0);
    });

    it('should redo undone action', () => {
      engine.addCard(mockCard);
      engine.undo();
      expect(engine.getCount()).toBe(0);

      engine.redo();
      expect(engine.getCount()).toBe(1);
    });

    it('should track canUndo/canRedo correctly', () => {
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);

      engine.addCard(mockCard);
      expect(engine.canUndo()).toBe(true);
      expect(engine.canRedo()).toBe(false);

      engine.undo();
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(true);
    });
  });

  describe('observables', () => {
    it('should emit cards on change', (done) => {
      engine.cards$.subscribe(cards => {
        if (cards.length === 1) {
          expect(cards[0].id).toBe('card-1');
          done();
        }
      });

      engine.addCard(mockCard);
    });

    it('should emit count on change', (done) => {
      let emitCount = 0;
      engine.count$.subscribe(count => {
        emitCount++;
        if (emitCount === 2) {
          expect(count).toBe(1);
          done();
        }
      });

      engine.addCard(mockCard);
    });
  });

  describe('export/import', () => {
    it('should export to JSON', () => {
      engine.addCard(mockCard);
      const json = engine.export();
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('card-1');
    });

    it('should import from JSON', () => {
      const json = JSON.stringify([mockCard]);
      const result = engine.import(json);
      expect(result).toBe(true);
      expect(engine.getCount()).toBe(1);
    });

    it('should handle invalid JSON', () => {
      const result = engine.import('invalid json');
      expect(result).toBe(false);
    });
  });
});

