import { ensureCardIds, removeAllIds } from './card-utils';
import { CardBuilder, SectionBuilder, FieldBuilder } from '../../testing/test-builders';
import { AICardConfig } from '../../models';

describe('CardUtils', () => {
  describe('ensureCardIds', () => {
    it('should add IDs to card without ID', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .build();
      
      // Remove ID to test auto-generation
      delete (card as any).id;
      
      const result = ensureCardIds(card);
      
      expect(result.id).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should preserve existing card ID', () => {
      const card = CardBuilder.create()
        .withId('existing-id')
        .withTitle('Test Card')
        .build();
      
      const result = ensureCardIds(card);
      
      expect(result.id).toBe('existing-id');
    });

    it('should add IDs to sections without IDs', () => {
      const section = SectionBuilder.create().withTitle('Section 1').build();
      delete (section as any).id;
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(section)
        .build();
      
      const result = ensureCardIds(card);
      
      expect(result.sections[0].id).toBeDefined();
      expect(result.sections[0].id).toBeTruthy();
    });

    it('should add IDs to fields without IDs', () => {
      const field = FieldBuilder.create().withLabel('Field 1').build();
      delete (field as any).id;
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withField(field)
            .build()
        )
        .build();
      
      const result = ensureCardIds(card);
      
      expect(result.sections[0].fields?.[0].id).toBeDefined();
      expect(result.sections[0].fields?.[0].id).toBeTruthy();
    });

    it('should handle nested structures', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withLabel('Field 1').build())
            .withItem({ title: 'Item 1', value: 'Value 1' } as any)
            .build()
        )
        .build();
      
      const result = ensureCardIds(card);
      
      expect(result.id).toBeDefined();
      expect(result.sections[0].id).toBeDefined();
      expect(result.sections[0].fields?.[0].id).toBeDefined();
    });
  });

  describe('removeAllIds', () => {
    it('should remove all ID properties from card', () => {
      const card = CardBuilder.create()
        .withId('card-id')
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withId('section-id')
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withId('field-id').withLabel('Field 1').build())
            .build()
        )
        .build();
      
      const result = removeAllIds(card);
      
      expect((result as any).id).toBeUndefined();
      expect((result as any).sections[0].id).toBeUndefined();
      expect((result as any).sections[0].fields?.[0].id).toBeUndefined();
    });

    it('should preserve other properties', () => {
      const card = CardBuilder.create()
        .withId('card-id')
        .withTitle('Test Card')
        .withSubtitle('Test Subtitle')
        .build();
      
      const result = removeAllIds(card);
      
      expect((result as any).id).toBeUndefined();
      expect((result as any).cardTitle).toBe('Test Card');
      expect((result as any).cardSubtitle).toBe('Test Subtitle');
    });

    it('should handle arrays', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withField(FieldBuilder.create().withId('field-1').build())
            .withField(FieldBuilder.create().withId('field-2').build())
            .build()
        )
        .build();
      
      const result = removeAllIds(card);
      
      expect((result as any).sections[0].fields?.[0].id).toBeUndefined();
      expect((result as any).sections[0].fields?.[1].id).toBeUndefined();
    });

    it('should handle null and undefined values', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .build();
      
      const result = removeAllIds(card);
      
      expect(result).toBeDefined();
      expect((result as any).cardTitle).toBe('Test Card');
    });

    it('should handle empty sections array', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSections([])
        .build();
      
      const result = removeAllIds(card);
      expect(result.sections).toEqual([]);
    });

    it('should handle sections with empty fields array', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withFields([])
            .build()
        )
        .build();
      
      const result = removeAllIds(card);
      expect(result.sections[0].fields).toEqual([]);
    });

    it('should handle items without IDs', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withItem({ title: 'Item 1', id: 'item-id' } as any)
            .build()
        )
        .build();
      
      const result = removeAllIds(card);
      expect((result.sections[0].items?.[0] as any).id).toBeUndefined();
    });
  });

  describe('Edge cases for ensureCardIds', () => {
    it('should handle card with null sections', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .build();
      (card as any).sections = null;
      
      const result = ensureCardIds(card);
      expect(result.id).toBeDefined();
    });

    it('should handle card with undefined sections', () => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .build();
      delete (card as any).sections;
      
      const result = ensureCardIds(card);
      expect(result.id).toBeDefined();
    });

    it('should handle section with null fields', () => {
      const section = SectionBuilder.create()
        .withTitle('Section 1')
        .build();
      (section as any).fields = null;
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(section)
        .build();
      
      const result = ensureCardIds(card);
      expect(result.sections[0].id).toBeDefined();
    });

    it('should handle section with null items', () => {
      const section = SectionBuilder.create()
        .withTitle('Section 1')
        .build();
      (section as any).items = null;
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(section)
        .build();
      
      const result = ensureCardIds(card);
      expect(result.sections[0].id).toBeDefined();
    });

    it('should generate unique IDs for multiple cards', () => {
      const card1 = CardBuilder.create().withTitle('Card 1').build();
      delete (card1 as any).id;
      
      const card2 = CardBuilder.create().withTitle('Card 2').build();
      delete (card2 as any).id;
      
      const result1 = ensureCardIds(card1);
      const result2 = ensureCardIds(card2);
      
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const card = CardBuilder.create()
        .withTitle(longTitle)
        .build();
      delete (card as any).id;
      
      const result = ensureCardIds(card);
      expect(result.id).toBeDefined();
    });

    it('should handle special characters in titles', () => {
      const card = CardBuilder.create()
        .withTitle('Card @#$%^&*()')
        .build();
      delete (card as any).id;
      
      const result = ensureCardIds(card);
      expect(result.id).toBeDefined();
    });

    it('should handle card with many sections', () => {
      const sections = Array.from({ length: 100 }, (_, i) =>
        SectionBuilder.create()
          .withTitle(`Section ${i}`)
          .build()
      );
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSections(sections)
        .build();
      
      const result = ensureCardIds(card);
      expect(result.sections.length).toBe(100);
      result.sections.forEach(section => {
        expect(section.id).toBeDefined();
      });
    });

    it('should handle section with many fields', () => {
      const fields = Array.from({ length: 50 }, (_, i) =>
        FieldBuilder.create()
          .withLabel(`Field ${i}`)
          .build()
      );
      
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section 1')
            .withFields(fields)
            .build()
        )
        .build();
      
      const result = ensureCardIds(card);
      expect(result.sections[0].fields?.length).toBe(50);
      result.sections[0].fields?.forEach(field => {
        expect(field.id).toBeDefined();
      });
    });
  });

  describe('Edge cases for removeAllIds', () => {
    it('should handle deeply nested structures', () => {
      const card = CardBuilder.create()
        .withId('card-id')
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withId('section-id')
            .withTitle('Section 1')
            .withField(
              FieldBuilder.create()
                .withId('field-id')
                .withLabel('Field 1')
                .withMeta({ nested: { id: 'nested-id' } } as any)
                .build()
            )
            .build()
        )
        .build();
      
      const result = removeAllIds(card);
      expect((result as any).id).toBeUndefined();
      expect((result as any).sections[0].id).toBeUndefined();
      expect((result as any).sections[0].fields?.[0].id).toBeUndefined();
    });

    it('should not mutate original card', () => {
      const card = CardBuilder.create()
        .withId('card-id')
        .withTitle('Test Card')
        .build();
      
      const originalId = card.id;
      const result = removeAllIds(card);
      
      expect(card.id).toBe(originalId);
      expect((result as any).id).toBeUndefined();
    });

    it('should handle card with actions', () => {
      const card = CardBuilder.create()
        .withId('card-id')
        .withTitle('Test Card')
        .withActions([{ id: 'action-id', label: 'Action', type: 'button' }] as any)
        .build();
      
      const result = removeAllIds(card);
      expect((result as any).id).toBeUndefined();
    });
  });
});

