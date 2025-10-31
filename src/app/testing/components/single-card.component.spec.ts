import { CardUtils } from '../../models/card.model';

describe('CardUtils', () => {
  it('should safely trim strings beyond max length', () => {
    const longValue = 'x'.repeat(10);
    expect(CardUtils.safeString(longValue, 5)).toBe('xxxxx');
  });

  it('should convert numbers and booleans to strings', () => {
    expect(CardUtils.safeString(42)).toBe('42');
    expect(CardUtils.safeString(true)).toBe('true');
  });

  it('should fallback to default value when number parsing fails', () => {
    expect(CardUtils.safeNumber('not-a-number', 7)).toBe(7);
  });

  it('should generate unique identifiers', () => {
    const id1 = CardUtils.generateId('test');
    const id2 = CardUtils.generateId('test');
    expect(id1).not.toEqual(id2);
    expect(id1.startsWith('test_')).toBeTrue();
  });
});
