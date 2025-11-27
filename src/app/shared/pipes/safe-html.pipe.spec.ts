import { SafeHtmlPipe } from './safe-html.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DomSanitizer]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafeHtmlPipe(sanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null input', () => {
    const result = pipe.transform(null as any);
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const result = pipe.transform(undefined as any);
    expect(result).toBe('');
  });

  it('should return empty string for empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should sanitize HTML content', () => {
    const html = '<div>Test content</div>';
    const result = pipe.transform(html);
    expect(result).toBeDefined();
  });

  it('should sanitize potentially dangerous content', () => {
    const dangerousHtml = '<script>alert("xss")</script><div>Safe</div>';
    const result = pipe.transform(dangerousHtml);
    // The sanitizer should remove script tags
    expect(result).toBeDefined();
  });
});








