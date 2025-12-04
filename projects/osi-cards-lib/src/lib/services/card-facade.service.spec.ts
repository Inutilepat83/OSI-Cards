import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CardFacadeService, CreateCardOptions, CardValidationResult } from './card-facade.service';
import { AICardConfig, CardSection } from '../models';

describe('CardFacadeService', () => {
  let service: CardFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardFacadeService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(CardFacadeService);
  });

  afterEach(() => {
    service.stopStreaming();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Card Creation Tests
  // ============================================================================
  describe('createCard', () => {
    it('should create card with title', () => {
      const options: CreateCardOptions = {
        title: 'Test Card',
      };

      const card = service.createCard(options);

      expect(card.cardTitle).toBe('Test Card');
      expect(card.id).toBeDefined();
    });

    it('should create card with sections', () => {
      const options: CreateCardOptions = {
        title: 'Test Card',
        sections: [
          {
            title: 'Info Section',
            type: 'info',
            fields: [{ label: 'Field 1', value: 'Value 1' }],
          },
        ],
      };

      const card = service.createCard(options);

      expect(card.sections.length).toBe(1);
      expect(card.sections[0].title).toBe('Info Section');
    });

    it('should create card with actions', () => {
      const options: CreateCardOptions = {
        title: 'Test Card',
        actions: [{ id: 'action-1', label: 'Action 1' }],
      };

      const card = service.createCard(options);

      expect(card.actions?.length).toBe(1);
      expect(card.actions?.[0].label).toBe('Action 1');
    });

    it('should create card with description', () => {
      const options: CreateCardOptions = {
        title: 'Test Card',
        description: 'Test Description',
      };

      const card = service.createCard(options);

      expect(card.description).toBe('Test Description');
    });

    it('should normalize sections', () => {
      const options: CreateCardOptions = {
        title: 'Test Card',
        sections: [
          {
            title: 'Overview Section',
            type: 'overview',
          },
        ],
      };

      const card = service.createCard(options);

      // Sections should be normalized (priority set, etc.)
      expect(card.sections[0].priority).toBeDefined();
    });
  });

  describe('createEmptyCard', () => {
    it('should create empty card with default title', () => {
      const card = service.createEmptyCard();

      expect(card.cardTitle).toBeDefined();
      expect(card.sections).toEqual([]);
    });

    it('should create empty card with custom title', () => {
      const card = service.createEmptyCard('Custom Title');

      expect(card.cardTitle).toBe('Custom Title');
    });
  });

  describe('createSkeletonCard', () => {
    it('should create skeleton card', () => {
      const card = service.createSkeletonCard();

      expect(card).toBeTruthy();
      expect(card.cardTitle).toBeDefined();
    });
  });

  describe('createErrorCard', () => {
    it('should create error card from Error object', () => {
      const error = new Error('Test error message');
      const card = service.createErrorCard(error);

      expect(card).toBeTruthy();
      expect(card.cardTitle).toBeDefined();
    });

    it('should create error card from string', () => {
      const card = service.createErrorCard('Error message');

      expect(card).toBeTruthy();
    });

    it('should create error card with custom title', () => {
      const card = service.createErrorCard('Error', 'Custom Error Title');

      expect(card.cardTitle).toBe('Custom Error Title');
    });
  });

  // ============================================================================
  // Card Operations Tests
  // ============================================================================
  describe('setCurrentCard', () => {
    it('should set current card', () => {
      const card: AICardConfig = {
        cardTitle: 'Test Card',
        sections: [],
      };

      service.setCurrentCard(card);

      expect(service.getCurrentCard()?.cardTitle).toBe('Test Card');
    });

    it('should set null when passed null', () => {
      service.setCurrentCard(null);

      expect(service.getCurrentCard()).toBeNull();
    });

    it('should normalize sections when setting card', () => {
      const card: AICardConfig = {
        cardTitle: 'Test Card',
        sections: [{ title: 'Overview', type: 'overview' }],
      };

      service.setCurrentCard(card);

      const current = service.getCurrentCard();
      expect(current?.sections[0].priority).toBeDefined();
    });
  });

  describe('getCurrentCard', () => {
    it('should return null initially', () => {
      expect(service.getCurrentCard()).toBeNull();
    });

    it('should return current card after setting', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
      };

      service.setCurrentCard(card);
      expect(service.getCurrentCard()?.cardTitle).toBe('Test');
    });
  });

  describe('mergeCard', () => {
    it('should merge updates into card', () => {
      const original: AICardConfig = {
        cardTitle: 'Original',
        sections: [],
      };

      const merged = service.mergeCard(original, { cardTitle: 'Updated' });

      expect(merged.cardTitle).toBe('Updated');
    });

    it('should preserve original sections if not updated', () => {
      const original: AICardConfig = {
        cardTitle: 'Original',
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const merged = service.mergeCard(original, { cardTitle: 'Updated' });

      expect(merged.sections.length).toBe(1);
    });
  });

  describe('cloneCard', () => {
    it('should create deep copy of card', () => {
      const original: AICardConfig = {
        cardTitle: 'Original',
        sections: [
          {
            title: 'Section 1',
            type: 'info',
            fields: [{ label: 'Field 1', value: 'Value 1' }],
          },
        ],
      };

      const clone = service.cloneCard(original);

      // Modify original
      original.cardTitle = 'Modified';
      original.sections[0].title = 'Modified Section';

      // Clone should be unaffected
      expect(clone.cardTitle).toBe('Original');
      expect(clone.sections[0].title).toBe('Section 1');
    });
  });

  describe('addSection', () => {
    it('should add section to card', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
      };

      const section: CardSection = {
        title: 'New Section',
        type: 'info',
      };

      const updated = service.addSection(card, section);

      expect(updated.sections.length).toBe(1);
      expect(updated.sections[0].title).toBe('New Section');
    });

    it('should normalize added section', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
      };

      const section: CardSection = {
        title: 'Overview',
        type: 'overview',
      };

      const updated = service.addSection(card, section);

      expect(updated.sections[0].priority).toBeDefined();
    });
  });

  describe('removeSection', () => {
    it('should remove section by ID', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [
          { id: 'section-1', title: 'Section 1', type: 'info' },
          { id: 'section-2', title: 'Section 2', type: 'list' },
        ],
      };

      const updated = service.removeSection(card, 'section-1');

      expect(updated.sections.length).toBe(1);
      expect(updated.sections[0].id).toBe('section-2');
    });
  });

  describe('updateSection', () => {
    it('should update section by ID', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [{ id: 'section-1', title: 'Original Title', type: 'info' }],
      };

      const updated = service.updateSection(card, 'section-1', { title: 'Updated Title' });

      expect(updated.sections[0].title).toBe('Updated Title');
    });

    it('should not modify other sections', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [
          { id: 'section-1', title: 'Section 1', type: 'info' },
          { id: 'section-2', title: 'Section 2', type: 'list' },
        ],
      };

      const updated = service.updateSection(card, 'section-1', { title: 'Updated' });

      expect(updated.sections[1].title).toBe('Section 2');
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================
  describe('validate', () => {
    it('should validate card with valid structure', () => {
      const card: Partial<AICardConfig> = {
        cardTitle: 'Valid Card',
        sections: [
          {
            id: 'section-1',
            title: 'Info',
            type: 'info',
            fields: [{ label: 'Test', value: 'Value' }],
          },
        ],
      };

      const result = service.validate(card);

      expect(result.valid).toBe(true);
    });

    it('should add warning for missing description', () => {
      const card: Partial<AICardConfig> = {
        cardTitle: 'Test',
        sections: [],
      };

      const result = service.validate(card);

      expect(result.warnings.some((w) => w.includes('description'))).toBe(true);
    });

    it('should add warning for sections without ID', () => {
      const card: Partial<AICardConfig> = {
        cardTitle: 'Test',
        sections: [{ title: 'No ID', type: 'info' }],
      };

      const result = service.validate(card);

      expect(result.warnings.some((w) => w.includes('ID'))).toBe(true);
    });

    it('should add warning for empty sections', () => {
      const card: Partial<AICardConfig> = {
        cardTitle: 'Test',
        sections: [{ id: 'section-1', title: 'Empty Section', type: 'info' }],
      };

      const result = service.validate(card);

      expect(result.warnings.some((w) => w.includes('no fields or items'))).toBe(true);
    });
  });

  describe('isValidCard', () => {
    it('should return true for valid card', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
      };

      expect(service.isValidCard(card)).toBe(true);
    });

    it('should return false for invalid object', () => {
      expect(service.isValidCard(null)).toBe(false);
      expect(service.isValidCard(undefined)).toBe(false);
      expect(service.isValidCard({})).toBe(false);
      expect(service.isValidCard({ title: 'Missing cardTitle' })).toBe(false);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================
  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [
          {
            title: 'Info',
            type: 'info',
            fields: [
              { label: 'F1', value: '1' },
              { label: 'F2', value: '2' },
            ],
          },
          {
            title: 'List',
            type: 'list',
            items: [{ title: 'Item 1' }, { title: 'Item 2' }, { title: 'Item 3' }],
          },
        ],
        actions: [{ id: 'a1', label: 'Action 1' }],
      };

      const stats = service.getStatistics(card);

      expect(stats.sectionCount).toBe(2);
      expect(stats.totalFieldCount).toBe(2);
      expect(stats.totalItemCount).toBe(3);
      expect(stats.sectionTypes).toContain('info');
      expect(stats.sectionTypes).toContain('list');
      expect(stats.hasActions).toBe(true);
      expect(stats.actionCount).toBe(1);
    });

    it('should handle card without actions', () => {
      const card: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
      };

      const stats = service.getStatistics(card);

      expect(stats.hasActions).toBe(false);
      expect(stats.actionCount).toBe(0);
    });
  });

  // ============================================================================
  // Observable Tests
  // ============================================================================
  describe('currentCard$', () => {
    it('should emit current card changes', (done) => {
      const card: AICardConfig = {
        cardTitle: 'Observable Test',
        sections: [],
      };

      service.currentCard$.subscribe((current) => {
        if (current?.cardTitle === 'Observable Test') {
          expect(current).toBeTruthy();
          done();
        }
      });

      service.setCurrentCard(card);
    });
  });

  // ============================================================================
  // Streaming Tests
  // ============================================================================
  describe('streaming methods', () => {
    it('should check if streaming is active', () => {
      expect(service.isStreaming()).toBe(false);
    });

    it('should get streaming state', () => {
      const state = service.getStreamingState();

      expect(state).toBeDefined();
      expect(state.stage).toBeDefined();
    });

    it('should stop streaming', () => {
      service.stopStreaming();
      expect(service.isStreaming()).toBe(false);
    });
  });
});
