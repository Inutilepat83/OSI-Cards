import { TestBed } from '@angular/core/testing';
import { IconService } from '../../shared/services/icon.service';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFieldIcon', () => {
    it('should return icon name for valid field name', () => {
      const icon = service.getFieldIcon('email');
      expect(icon).toBe('mail');
    });

    it('should return default icon for unknown field', () => {
      const icon = service.getFieldIcon('unknownField');
      expect(icon).toBe('circle');
    });

    it('should handle phone field', () => {
      const icon = service.getFieldIcon('phone');
      expect(icon).toBe('phone');
    });

    it('should handle website field', () => {
      const icon = service.getFieldIcon('website');
      expect(icon).toBe('globe');
    });
  });

  describe('getFieldIconClass', () => {
    it('should return CSS class for field name', () => {
      const className = service.getFieldIconClass('email');
      expect(className).toBeDefined();
    });

    it('should return default class for unknown field', () => {
      const className = service.getFieldIconClass('unknownField');
      expect(className).toBe('text-gray-500');
    });
  });
});

