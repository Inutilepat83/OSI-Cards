import { TestBed } from '@angular/core/testing';
import { JsonValidationService } from './json-validation.service';
import { AICardConfig } from '../../models';

describe('JsonValidationService', () => {
  let service: JsonValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateJsonSyntax', () => {
    it('should return valid for empty string', () => {
      const result = service.validateJsonSyntax('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');
    });

    it('should return valid for valid JSON', () => {
      const validJson = '{"cardTitle": "Test", "sections": []}';
      const result = service.validateJsonSyntax(validJson);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');
    });

    it('should return invalid for malformed JSON', () => {
      const invalidJson = '{"cardTitle": "Test", "sections": [}';
      const result = service.validateJsonSyntax(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should provide suggestions for common errors', () => {
      const invalidJson = '{"cardTitle": "Test" "sections": []}'; // Missing comma
      const result = service.validateJsonSyntax(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.suggestion).toBeTruthy();
    });
  });

  describe('tryParsePartialJson', () => {
    it('should parse complete JSON', () => {
      const json = '{"cardTitle": "Test", "sections": []}';
      const result = service.tryParsePartialJson(json);
      expect(result).toBeTruthy();
      expect(result?.cardTitle).toBe('Test');
    });

    it('should parse incomplete JSON with missing closing brace', () => {
      const incompleteJson = '{"cardTitle": "Test", "sections": [';
      const result = service.tryParsePartialJson(incompleteJson);
      expect(result).toBeTruthy();
    });

    it('should extract cardTitle from incomplete JSON', () => {
      const incompleteJson = '{"cardTitle": "Test"';
      const result = service.tryParsePartialJson(incompleteJson);
      expect(result?.cardTitle).toBe('Test');
    });

    it('should return null for completely invalid JSON', () => {
      const invalidJson = 'not json at all';
      const result = service.tryParsePartialJson(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe('calculateJsonHash', () => {
    it('should return same hash for identical content', () => {
      const json1 = '{"cardTitle": "Test"}';
      const json2 = '{"cardTitle": "Test"}';
      const hash1 = service.calculateJsonHash(json1);
      const hash2 = service.calculateJsonHash(json2);
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different content', () => {
      const json1 = '{"cardTitle": "Test1"}';
      const json2 = '{"cardTitle": "Test2"}';
      const hash1 = service.calculateJsonHash(json1);
      const hash2 = service.calculateJsonHash(json2);
      expect(hash1).not.toBe(hash2);
    });

    it('should ignore whitespace differences', () => {
      const json1 = '{"cardTitle":"Test"}';
      const json2 = '{"cardTitle": "Test"}';
      const hash1 = service.calculateJsonHash(json1);
      const hash2 = service.calculateJsonHash(json2);
      expect(hash1).toBe(hash2);
    });
  });
});






