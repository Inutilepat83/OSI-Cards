import { AICardConfig, CardField, CardSection, CardTypeGuards, CardUtils } from './card.model';

describe('CardTypeGuards', () => {
  describe('isAICardConfig', () => {
    it('should return true for valid AICardConfig', () => {
      const validConfig: AICardConfig = {
        cardTitle: 'Test Card',
        cardType: 'company',
        sections: [],
      };

      expect(CardTypeGuards.isAICardConfig(validConfig)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(CardTypeGuards.isAICardConfig(null)).toBe(false);
      expect(CardTypeGuards.isAICardConfig(undefined)).toBe(false);
      expect(CardTypeGuards.isAICardConfig('string')).toBe(false);
      expect(CardTypeGuards.isAICardConfig({})).toBe(false);
      expect(CardTypeGuards.isAICardConfig({ cardTitle: '' })).toBe(false);
    });

    it('should return false for invalid cardType', () => {
      const invalidConfig = {
        cardTitle: 'Test Card',
        cardType: 'invalid',
        sections: [],
      };

      expect(CardTypeGuards.isAICardConfig(invalidConfig)).toBe(false);
    });

    it('should return false for too long cardTitle', () => {
      const invalidConfig = {
        cardTitle: 'x'.repeat(201),
        cardType: 'company',
        sections: [],
      };

      expect(CardTypeGuards.isAICardConfig(invalidConfig)).toBe(false);
    });
  });

  describe('isCardSection', () => {
    it('should return true for valid CardSection', () => {
      const validSection: CardSection = {
        title: 'Test Section',
        type: 'info',
      };

      expect(CardTypeGuards.isCardSection(validSection)).toBe(true);
    });

    it('should return false for invalid sections', () => {
      expect(CardTypeGuards.isCardSection(null)).toBe(false);
      expect(CardTypeGuards.isCardSection({ title: '' })).toBe(false);
      expect(CardTypeGuards.isCardSection({ title: 'x'.repeat(101) })).toBe(false);
    });
  });

  describe('isCardField', () => {
    it('should return true for valid CardField', () => {
      const validField: CardField = {
        label: 'Test Field',
        value: 'Test Value',
      };

      expect(CardTypeGuards.isCardField(validField)).toBe(true);
    });

    it('should return false for invalid fields', () => {
      expect(CardTypeGuards.isCardField(null)).toBe(false);
      expect(CardTypeGuards.isCardField({ label: '' })).toBe(false);
      expect(CardTypeGuards.isCardField({ label: 'x'.repeat(101), value: 'test' })).toBe(false);
    });
  });
});

describe('CardUtils', () => {
  describe('safeString', () => {
    it('should convert values to safe strings', () => {
      expect(CardUtils.safeString('test')).toBe('test');
      expect(CardUtils.safeString(123)).toBe('123');
      expect(CardUtils.safeString(true)).toBe('true');
      expect(CardUtils.safeString(null)).toBe('');
      expect(CardUtils.safeString(undefined)).toBe('');
    });

    it('should respect maxLength', () => {
      const longString = 'x'.repeat(100);
      expect(CardUtils.safeString(longString, 10)).toBe('x'.repeat(10));
    });
  });

  describe('safeNumber', () => {
    it('should convert values to safe numbers', () => {
      expect(CardUtils.safeNumber('123')).toBe(123);
      expect(CardUtils.safeNumber(123)).toBe(123);
      expect(CardUtils.safeNumber('invalid')).toBe(0);
      expect(CardUtils.safeNumber('invalid', 5)).toBe(5);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = CardUtils.generateId();
      const id2 = CardUtils.generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use prefix', () => {
      const id = CardUtils.generateId('test');
      expect(id).toMatch(/^test_/);
    });
  });

  describe('sanitizeCardConfig', () => {
    it('should sanitize valid config', () => {
      const config: AICardConfig = {
        cardTitle: 'Test Card',
        cardType: 'company',
        sections: [
          {
            title: 'Test Section',
            type: 'info',
          },
        ],
      };

      const sanitized = CardUtils.sanitizeCardConfig(config);
      expect(sanitized).toBeTruthy();
      expect(sanitized?.cardTitle).toBe('Test Card');
    });

    it('should return null for invalid config', () => {
      expect(CardUtils.sanitizeCardConfig(null)).toBe(null);
      expect(CardUtils.sanitizeCardConfig('invalid')).toBe(null);
    });

    it('should limit sections and actions', () => {
      const config: AICardConfig = {
        cardTitle: 'Test Card',
        cardType: 'company',
        sections: Array(25).fill({ title: 'Section', type: 'info' }),
        actions: Array(15).fill({ label: 'Action' }),
      };

      const sanitized = CardUtils.sanitizeCardConfig(config);
      expect(sanitized?.sections.length).toBe(20);
      expect(sanitized?.actions?.length).toBe(10);
    });
  });
});
