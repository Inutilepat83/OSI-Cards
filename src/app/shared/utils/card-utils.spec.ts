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
  });
});

