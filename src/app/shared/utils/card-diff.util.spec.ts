import { CardDiffUtil, CardChangeType } from './card-diff.util';
import { CardBuilder, SectionBuilder, FieldBuilder } from '../../testing/test-builders';
import { AICardConfig } from '../../models';

describe('CardDiffUtil', () => {
  describe('mergeCardUpdates', () => {
    it('should return old card if cards are identical', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section 1').build())
        .build();
      
      const result = CardDiffUtil.mergeCardUpdates(card, { ...card });
      
      expect(result.card).toBe(card); // Same reference
      expect(result.changeType).toBe('content');
    });

    it('should detect structural changes when sections change', () => {
      const oldCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section 1').build())
        .build();
      
      const newCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section 1').build())
        .withSection(SectionBuilder.create().withTitle('Section 2').build())
        .build();
      
      const result = CardDiffUtil.mergeCardUpdates(oldCard, newCard);
      
      expect(result.changeType).toBe('structural');
      expect(result.card.sections.length).toBe(2);
    });

    it('should detect content changes when only field values change', () => {
      const oldCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withLabel('Field 1').withValue('Old Value').build())
            .build()
        )
        .build();
      
      const newCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withLabel('Field 1').withValue('New Value').build())
            .build()
        )
        .build();
      
      const result = CardDiffUtil.mergeCardUpdates(oldCard, newCard);
      
      expect(result.changeType).toBe('content');
      expect(result.card.sections[0].fields?.[0].value).toBe('New Value');
    });

    it('should update only top-level properties when sections unchanged', () => {
      const section = SectionBuilder.create().withTitle('Section 1').build();
      const oldCard = CardBuilder.create()
        .withTitle('Old Title')
        .withSubtitle('Old Subtitle')
        .withSection(section)
        .build();
      
      const newCard = CardBuilder.create()
        .withTitle('New Title')
        .withSubtitle('New Subtitle')
        .withSection(section)
        .build();
      
      const result = CardDiffUtil.mergeCardUpdates(oldCard, newCard);
      
      expect(result.changeType).toBe('content');
      expect(result.card.cardTitle).toBe('New Title');
      expect(result.card.cardSubtitle).toBe('New Subtitle');
      // Sections should be same reference
      expect(result.card.sections).toBe(oldCard.sections);
    });

    it('should merge sections incrementally', () => {
      const oldCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withId('section-1')
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withId('field-1').withLabel('Field 1').withValue('Value 1').build())
            .build()
        )
        .build();
      
      const newCard = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withId('section-1')
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withId('field-1').withLabel('Field 1').withValue('Updated Value').build())
            .build()
        )
        .build();
      
      const result = CardDiffUtil.mergeCardUpdates(oldCard, newCard);
      
      expect(result.card.sections[0].fields?.[0].value).toBe('Updated Value');
    });
  });

  describe('areCardsEqual', () => {
    it('should return true for identical cards', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section 1').build())
        .build();
      
      const result = (CardDiffUtil as any).areCardsEqual(card, { ...card });
      expect(result).toBe(true);
    });

    it('should return false for different cards', () => {
      const card1 = CardBuilder.create().withTitle('Card 1').build();
      const card2 = CardBuilder.create().withTitle('Card 2').build();
      
      const result = (CardDiffUtil as any).areCardsEqual(card1, card2);
      expect(result).toBe(false);
    });
  });
});
