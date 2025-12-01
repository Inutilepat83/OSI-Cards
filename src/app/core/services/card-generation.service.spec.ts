import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { CardGenerationService } from './card-generation.service';
import { reducer as cardsReducer } from '../../store/cards/cards.state';
import { CardBuilder, FieldBuilder, SectionBuilder } from '../../testing/test-builders';

describe('CardGenerationService', () => {
  let service: CardGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardGenerationService, provideStore({ cards: cardsReducer })],
    });
    service = TestBed.inject(CardGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCardFromJson', () => {
    it('should generate card from valid JSON', () => {
      const json = JSON.stringify({
        cardTitle: 'Test Card',
        sections: [],
      });

      const result = service.generateCardFromJson(json);

      expect(result).toBeTruthy();
      expect(result?.cardTitle).toBe('Test Card');
      expect(result?.sections).toEqual([]);
    });

    it('should return null for empty JSON', () => {
      const result = service.generateCardFromJson('');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const result = service.generateCardFromJson('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const json = JSON.stringify({ sections: [] });
      const result = service.generateCardFromJson(json);
      expect(result).toBeNull();
    });

    it('should generate card with sections', () => {
      const card = CardBuilder.create()
        .withTitle('Test')
        .withSection(
          SectionBuilder.create()
            .withTitle('Info')
            .withType('info')
            .withField(FieldBuilder.create().withLabel('Test').withValue('Value').build())
            .build()
        )
        .build();

      const json = JSON.stringify(card);
      const result = service.generateCardFromJson(json);

      expect(result).toBeTruthy();
      expect(result?.sections.length).toBe(1);
    });
  });

  describe('mergeCard', () => {
    it('should return new card if no existing card', () => {
      const newCard = CardBuilder.create().withTitle('New').build();
      const result = service.mergeCard(newCard, null);

      expect(result.card).toBe(newCard);
      expect(result.changeType).toBe('structural');
    });

    it('should merge cards when existing card provided', () => {
      const existing = CardBuilder.create().withTitle('Existing').build();
      const newCard = CardBuilder.create().withTitle('New').build();

      const result = service.mergeCard(newCard, existing);

      expect(result.card).toBeTruthy();
      expect(result.changeType).toBeDefined();
    });
  });

  describe('loadTemplate', () => {
    it('should dispatch load template action', () => {
      const dispatchSpy = spyOn(service.store, 'dispatch');

      service.loadTemplate('company', 1);

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('loadFirstCardExample', () => {
    it('should dispatch load first card action', () => {
      const dispatchSpy = spyOn(service.store, 'dispatch');

      service.loadFirstCardExample();

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should dispatch clear error action', () => {
      const dispatchSpy = spyOn(service.store, 'dispatch');

      service.clearError();

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});
