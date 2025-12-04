import {
  CardTypeGuards,
  CardUtils,
  AICardConfig,
  CardSection,
  CardField,
  CardItem,
  CardAction,
  MailCardAction,
} from './card.model';

describe('CardTypeGuards', () => {
  // ============================================================================
  // isAICardConfig Tests
  // ============================================================================
  describe('isAICardConfig', () => {
    it('should return true for valid card config', () => {
      const card: AICardConfig = {
        cardTitle: 'Test Card',
        sections: [],
      };

      expect(CardTypeGuards.isAICardConfig(card)).toBe(true);
    });

    it('should return true for card with sections', () => {
      const card: AICardConfig = {
        cardTitle: 'Test Card',
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      expect(CardTypeGuards.isAICardConfig(card)).toBe(true);
    });

    it('should return false for null', () => {
      expect(CardTypeGuards.isAICardConfig(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(CardTypeGuards.isAICardConfig(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(CardTypeGuards.isAICardConfig('string')).toBe(false);
      expect(CardTypeGuards.isAICardConfig(123)).toBe(false);
      expect(CardTypeGuards.isAICardConfig(true)).toBe(false);
    });

    it('should return false for object without cardTitle', () => {
      expect(CardTypeGuards.isAICardConfig({ sections: [] })).toBe(false);
    });

    it('should return false for object without sections', () => {
      expect(CardTypeGuards.isAICardConfig({ cardTitle: 'Test' })).toBe(false);
    });

    it('should return false for empty cardTitle', () => {
      expect(CardTypeGuards.isAICardConfig({ cardTitle: '', sections: [] })).toBe(false);
    });

    it('should return false for non-array sections', () => {
      expect(CardTypeGuards.isAICardConfig({ cardTitle: 'Test', sections: 'not array' })).toBe(
        false
      );
    });
  });

  // ============================================================================
  // isCardSection Tests
  // ============================================================================
  describe('isCardSection', () => {
    it('should return true for valid section', () => {
      const section: CardSection = {
        title: 'Test Section',
        type: 'info',
      };

      expect(CardTypeGuards.isCardSection(section)).toBe(true);
    });

    it('should return false for null', () => {
      expect(CardTypeGuards.isCardSection(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(CardTypeGuards.isCardSection(undefined)).toBe(false);
    });

    it('should return false for object without title', () => {
      expect(CardTypeGuards.isCardSection({ type: 'info' })).toBe(false);
    });

    it('should return false for object without type', () => {
      expect(CardTypeGuards.isCardSection({ title: 'Test' })).toBe(false);
    });

    it('should return false for non-string title', () => {
      expect(CardTypeGuards.isCardSection({ title: 123, type: 'info' })).toBe(false);
    });

    it('should return false for non-string type', () => {
      expect(CardTypeGuards.isCardSection({ title: 'Test', type: 123 })).toBe(false);
    });
  });

  // ============================================================================
  // isCardField Tests
  // ============================================================================
  describe('isCardField', () => {
    it('should return true for valid field', () => {
      const field: CardField = {
        label: 'Test Field',
        value: 'Test Value',
      };

      expect(CardTypeGuards.isCardField(field)).toBe(true);
    });

    it('should return true for empty object', () => {
      // CardField can have any properties
      expect(CardTypeGuards.isCardField({})).toBe(true);
    });

    it('should return false for null', () => {
      expect(CardTypeGuards.isCardField(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(CardTypeGuards.isCardField(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(CardTypeGuards.isCardField('string')).toBe(false);
      expect(CardTypeGuards.isCardField(123)).toBe(false);
    });
  });

  // ============================================================================
  // isMailAction Tests
  // ============================================================================
  describe('isMailAction', () => {
    it('should return true for valid mail action', () => {
      const action: MailCardAction = {
        type: 'mail',
        label: 'Send Email',
        email: {
          contact: {
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Manager',
          },
          subject: 'Test Subject',
          body: 'Test Body',
        },
      };

      expect(CardTypeGuards.isMailAction(action)).toBe(true);
    });

    it('should return false for null', () => {
      expect(CardTypeGuards.isMailAction(null)).toBe(false);
    });

    it('should return false for non-mail type', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'website',
          label: 'Visit',
        })
      ).toBe(false);
    });

    it('should return false for missing email property', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'mail',
          label: 'Send',
        })
      ).toBe(false);
    });

    it('should return false for missing contact', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'mail',
          label: 'Send',
          email: {
            subject: 'Test',
            body: 'Test',
          },
        })
      ).toBe(false);
    });

    it('should return false for incomplete contact', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'mail',
          label: 'Send',
          email: {
            contact: { name: 'John' }, // Missing email and role
            subject: 'Test',
            body: 'Test',
          },
        })
      ).toBe(false);
    });

    it('should return false for missing subject', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'mail',
          label: 'Send',
          email: {
            contact: { name: 'John', email: 'john@example.com', role: 'Manager' },
            body: 'Test',
          },
        })
      ).toBe(false);
    });

    it('should return false for missing body', () => {
      expect(
        CardTypeGuards.isMailAction({
          type: 'mail',
          label: 'Send',
          email: {
            contact: { name: 'John', email: 'john@example.com', role: 'Manager' },
            subject: 'Test',
          },
        })
      ).toBe(false);
    });
  });
});

describe('CardUtils', () => {
  // ============================================================================
  // safeString Tests
  // ============================================================================
  describe('safeString', () => {
    it('should return string unchanged', () => {
      expect(CardUtils.safeString('test')).toBe('test');
    });

    it('should convert number to string', () => {
      expect(CardUtils.safeString(123)).toBe('123');
    });

    it('should convert boolean to string', () => {
      expect(CardUtils.safeString(true)).toBe('true');
      expect(CardUtils.safeString(false)).toBe('false');
    });

    it('should return empty string for null', () => {
      expect(CardUtils.safeString(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(CardUtils.safeString(undefined)).toBe('');
    });

    it('should return empty string for object', () => {
      expect(CardUtils.safeString({})).toBe('');
    });

    it('should truncate long strings to maxLength', () => {
      const longString = 'a'.repeat(2000);
      expect(CardUtils.safeString(longString).length).toBe(1000);
    });

    it('should respect custom maxLength', () => {
      const longString = 'a'.repeat(100);
      expect(CardUtils.safeString(longString, 50).length).toBe(50);
    });
  });

  // ============================================================================
  // safeNumber Tests
  // ============================================================================
  describe('safeNumber', () => {
    it('should return number unchanged', () => {
      expect(CardUtils.safeNumber(123)).toBe(123);
      expect(CardUtils.safeNumber(0)).toBe(0);
      expect(CardUtils.safeNumber(-5)).toBe(-5);
    });

    it('should parse string to number', () => {
      expect(CardUtils.safeNumber('123')).toBe(123);
      expect(CardUtils.safeNumber('45.67')).toBe(45.67);
    });

    it('should return default for non-parseable string', () => {
      expect(CardUtils.safeNumber('not a number')).toBe(0);
    });

    it('should return default for null', () => {
      expect(CardUtils.safeNumber(null)).toBe(0);
    });

    it('should return default for undefined', () => {
      expect(CardUtils.safeNumber(undefined)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(CardUtils.safeNumber(null, 100)).toBe(100);
    });
  });

  // ============================================================================
  // generateId Tests
  // ============================================================================
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = CardUtils.generateId();
      const id2 = CardUtils.generateId();

      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = CardUtils.generateId();
      expect(id.startsWith('item_')).toBe(true);
    });

    it('should use custom prefix', () => {
      const id = CardUtils.generateId('custom');
      expect(id.startsWith('custom_')).toBe(true);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = CardUtils.generateId();
      const after = Date.now();

      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  // ============================================================================
  // ensureSectionIds Tests
  // ============================================================================
  describe('ensureSectionIds', () => {
    it('should add IDs to sections without IDs', () => {
      const sections: CardSection[] = [
        { title: 'Section 1', type: 'info' },
        { title: 'Section 2', type: 'list' },
      ];

      const result = CardUtils.ensureSectionIds(sections);

      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBeDefined();
    });

    it('should preserve existing IDs', () => {
      const sections: CardSection[] = [{ id: 'existing-id', title: 'Section 1', type: 'info' }];

      const result = CardUtils.ensureSectionIds(sections);

      expect(result[0].id).toBe('existing-id');
    });

    it('should add IDs to fields', () => {
      const sections: CardSection[] = [
        {
          title: 'Section 1',
          type: 'info',
          fields: [{ label: 'Field 1', value: 'Value 1' }],
        },
      ];

      const result = CardUtils.ensureSectionIds(sections);

      expect(result[0].fields?.[0].id).toBeDefined();
    });

    it('should add IDs to items', () => {
      const sections: CardSection[] = [
        {
          title: 'Section 1',
          type: 'list',
          items: [{ title: 'Item 1' }],
        },
      ];

      const result = CardUtils.ensureSectionIds(sections);

      expect(result[0].items?.[0].id).toBeDefined();
    });
  });

  // ============================================================================
  // sanitizeCardConfig Tests
  // ============================================================================
  describe('sanitizeCardConfig', () => {
    it('should return null for invalid config', () => {
      expect(CardUtils.sanitizeCardConfig(null)).toBeNull();
      expect(CardUtils.sanitizeCardConfig({})).toBeNull();
      expect(CardUtils.sanitizeCardConfig({ title: 'Missing cardTitle' })).toBeNull();
    });

    it('should sanitize valid config', () => {
      const config: AICardConfig = {
        cardTitle: 'Test Card',
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const result = CardUtils.sanitizeCardConfig(config);

      expect(result).not.toBeNull();
      expect(result?.cardTitle).toBe('Test Card');
    });

    it('should truncate long card titles', () => {
      const config: AICardConfig = {
        cardTitle: 'a'.repeat(500),
        sections: [],
      };

      const result = CardUtils.sanitizeCardConfig(config);

      expect(result?.cardTitle.length).toBe(200);
    });

    it('should add IDs to sections', () => {
      const config: AICardConfig = {
        cardTitle: 'Test',
        sections: [{ title: 'Section 1', type: 'info' }],
      };

      const result = CardUtils.sanitizeCardConfig(config);

      expect(result?.sections[0].id).toBeDefined();
    });

    it('should add IDs to actions', () => {
      const config: AICardConfig = {
        cardTitle: 'Test',
        sections: [],
        actions: [{ label: 'Action 1' }],
      };

      const result = CardUtils.sanitizeCardConfig(config);

      expect(result?.actions?.[0].id).toBeDefined();
    });

    it('should filter invalid sections', () => {
      const config = {
        cardTitle: 'Test',
        sections: [
          { title: 'Valid', type: 'info' },
          { invalid: 'section' }, // Invalid - missing title and type
          { title: 'Also Valid', type: 'list' },
        ],
      };

      const result = CardUtils.sanitizeCardConfig(config);

      expect(result?.sections.length).toBe(2);
    });
  });
});
