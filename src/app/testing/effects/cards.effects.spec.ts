import { CardTypeGuards, CardUtils } from '../../models/card.model';

describe('Card model utilities', () => {
  it('should validate AICardConfig via CardTypeGuards', () => {
    const validConfig = {
      cardTitle: 'Sample',
      cardType: 'company',
      sections: [],
    };

    const invalidConfig = {
      cardTitle: '',
      cardType: 'unknown',
      sections: [],
    };

    expect(CardTypeGuards.isAICardConfig(validConfig)).toBeTrue();
    expect(CardTypeGuards.isAICardConfig(invalidConfig)).toBeFalse();
  });

  it('should sanitize card configuration', () => {
    const sanitized = CardUtils.sanitizeCardConfig({
      cardTitle: 'Valid Card',
      cardType: 'company',
      sections: [{ title: 'Info', type: 'info' }],
      actions: Array.from({ length: 20 }, (_, index) => ({
        id: `action-${index}`,
        label: `Action ${index}`,
      })),
    });

    expect(sanitized).not.toBeNull();
    expect(sanitized?.actions?.length).toBe(10);
    expect(sanitized?.sections.length).toBe(1);
  });
});
