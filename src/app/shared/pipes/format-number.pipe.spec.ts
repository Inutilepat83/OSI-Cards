import { FormatNumberPipe } from './format-number.pipe';

describe('FormatNumberPipe', () => {
  let pipe: FormatNumberPipe;

  beforeEach(() => {
    pipe = new FormatNumberPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format number with default format', () => {
    const result = pipe.transform(1234.56);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format number as currency', () => {
    const result = pipe.transform(1234.56, 'currency');
    expect(result).toContain('$');
    expect(result).toContain('1,234.56');
  });

  it('should format number as percent', () => {
    const result = pipe.transform(0.85, 'percent');
    expect(result).toContain('%');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(pipe.transform(NaN)).toBe('');
  });

  it('should format with custom locale', () => {
    const result = pipe.transform(1234.56, 'currency', 'de-DE');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should handle zero', () => {
    const result = pipe.transform(0);
    expect(result).toBe('0');
  });

  it('should handle negative numbers', () => {
    const result = pipe.transform(-1234.56, 'currency');
    expect(result).toContain('-');
  });

  it('should handle large numbers', () => {
    const result = pipe.transform(1000000);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should handle decimal numbers', () => {
    const result = pipe.transform(123.456);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});


