import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should truncate text longer than limit', () => {
    const longText = 'This is a very long text that should be truncated';
    const result = pipe.transform(longText, 20);
    expect(result.length).toBe(23); // 20 + '...'
    expect(result).toContain('...');
  });

  it('should not truncate text shorter than limit', () => {
    const shortText = 'Short text';
    const result = pipe.transform(shortText, 20);
    expect(result).toBe(shortText);
    expect(result).not.toContain('...');
  });

  it('should use default limit of 100', () => {
    const text = 'a'.repeat(150);
    const result = pipe.transform(text);
    expect(result.length).toBe(103); // 100 + '...'
  });

  it('should use custom trail', () => {
    const longText = 'This is a very long text';
    const result = pipe.transform(longText, 10, '…');
    expect(result).toContain('…');
    expect(result).not.toContain('...');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle text exactly at limit', () => {
    const text = 'a'.repeat(50);
    const result = pipe.transform(text, 50);
    expect(result).toBe(text);
    expect(result).not.toContain('...');
  });

  it('should handle text one character over limit', () => {
    const text = 'a'.repeat(51);
    const result = pipe.transform(text, 50);
    expect(result.length).toBe(53); // 50 + '...'
    expect(result).toContain('...');
  });

  it('should handle zero limit', () => {
    const text = 'Hello';
    const result = pipe.transform(text, 0);
    expect(result).toBe('...');
  });

  it('should handle very long text', () => {
    const text = 'a'.repeat(1000);
    const result = pipe.transform(text, 100);
    expect(result.length).toBe(103); // 100 + '...'
  });
});

